"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";

/**
 * Courant de vie : courants de filaments tressés, entourés de spores, qui traversent l'écran en
 * traînées lumineuses et entrent en se déroulant de gauche à droite. Ils s'incurvent vers le pointeur
 * et suivent son sillage. Tracé différent à chaque visite (graine 0). Rendu entièrement GPU (WebGL).
 */

type RGB = { r: number; g: number; b: number };
/** Paramètres d'un courant, envoyés une fois au GPU. */
type Stream = {
  y: number;
  amp: number;
  spread: number;
  seed: number;
  alpha: number;
  thick: number;
  heads: number;
  speed: number;
  tail: number;
  strands: number;
};

const MAX_STREAMS = 6;
const MAX_HEADS = 4;
const SEGMENTS = 128; // points par filament : courbe soyeuse, et au pire 6 × 4 × 10 × 128 × 2 = 61 440 sommets (Uint16)
const INTRO_DELAY = 0.15; // une respiration avant que les courants n'entrent
const STATIC_TIME = 6.5; // instant figé affiché en pause ou en mouvement réduit

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: RGB, b: RGB, t: number): RGB => ({
  r: lerp(a.r, b.r, t),
  g: lerp(a.g, b.g, t),
  b: lerp(a.b, b.b, t),
});

/** Laisse le navigateur normaliser n'importe quelle couleur CSS puis la relit (0–1). */
function parseColor(value: string, fallback: string): RGB {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return { r: 0.28, g: 1, b: 0.65 };
  ctx.fillStyle = fallback;
  ctx.fillStyle = value;
  const s = String(ctx.fillStyle);
  if (s[0] === "#") {
    const n = parseInt(s.slice(1, 7), 16);
    return {
      r: ((n >> 16) & 255) / 255,
      g: ((n >> 8) & 255) / 255,
      b: (n & 255) / 255,
    };
  }
  const m = s.match(/[\d.]+/g);
  if (m && m.length >= 3)
    return { r: +m[0] / 255, g: +m[1] / 255, b: +m[2] / 255 };
  return { r: 0.28, g: 1, b: 0.65 };
}

/** Générateur pseudo-aléatoire reproductible : même graine, mêmes courants. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- GLSL ----------
/** Bruit simplex 3D (Ashima / Gustavson) + colonne vertébrale d'un courant. Partagé par les deux programmes. */
const GLSL_COMMON = /* glsl */ `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_sway;
uniform float u_drift;
uniform vec3 u_pointer;   // x, y (lissés), présence (0–1)
uniform vec2 u_pvel;      // sillage : déplacement récent du pointeur, déjà amorti (px)
uniform vec2 u_pull;      // force, rayon
uniform float u_reveal;   // 0 → 1 pendant l'entrée
uniform float u_exit;     // 0 → 1 pendant la sortie
uniform vec4 u_s0[${MAX_STREAMS}]; // y, amp, spread, seed
uniform vec4 u_s1[${MAX_STREAMS}]; // alpha, thick, heads, speed
uniform vec4 u_s2[${MAX_STREAMS}]; // tail, strands, -, -

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3 ns = 0.142857142857 * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

/** Position de la colonne d'un courant en u ∈ [0, 1], attirée par le pointeur. */
vec2 spine(float u, vec4 s0) {
  float t = u_time * u_drift;
  float x = -0.08 * u_res.x + u * u_res.x * 1.16 + 26.0 * snoise(vec3(u * 2.0, s0.w + 11.0, t * 0.1));
  float base = s0.x + 0.09 * u_sway * snoise(vec3(s0.w * 1.7, t * 0.03, 3.0)); // le courant migre lentement
  float y = u_res.y * (base + s0.y * u_sway * snoise(vec3(u * 1.4, s0.w * 3.7, t * 0.05)))
          + u_res.y * 0.06 * u_sway * snoise(vec3(u * 3.4, s0.w * 9.1, t * 0.08));
  if (u_pointer.z > 0.001) {
    vec2 d = u_pointer.xy - vec2(x, y);
    // Influence gaussienne en 2D : aucune cassure, elle s'éteint en douceur dans toutes les directions.
    float g = exp(-dot(d, d) / (2.0 * u_pull.y * u_pull.y)) * u_pointer.z;
    // Attraction : le courant s'incurve vers le pointeur sans jamais s'y coller.
    y += d.y * g * u_pull.x * 0.7;
    // Sillage : le geste entraîne le courant, comme une main qui traverse l'eau.
    x += u_pvel.x * g * 0.5;
    y += u_pvel.y * g;
  }
  return vec2(x, y);
}

float hash(float n) { return fract(sin(n) * 43758.5453123); }

/** Intensité des traînées au point u (0–1).
    Aucune boucle visible : la vitesse de chaque traînée est modulée par du bruit (elle accélère,
    ralentit), et chaque passage tire au sort son silence, sa longueur et son éclat. */
float trailAt(float u, vec4 s0, vec4 s1, float tail) {
  float tr = 0.0;
  for (int h = 0; h < ${MAX_HEADS}; h++) {
    float k = float(h);
    if (k >= s1.z) break;
    float pace = s1.w * (0.7 + 0.6 * hash(k * 78.233 + s0.w * 12.9898));
    float ph = u_time * pace + hash(k * 39.425 + s0.w * 4.1414)
             + 0.45 * snoise(vec3(u_time * 0.04, k * 3.3, s0.w));
    float pass = floor(ph);
    float r1 = hash(pass * 1.731 + k * 9.17 + s0.w);
    float r2 = hash(pass * 4.177 + k * 2.71 + s0.w * 3.0);
    float hu = fract(ph) * mix(1.4, 2.8, r1) - 0.25;   // silence variable entre deux passages
    float db = hu - u;
    float e = db >= 0.0 ? exp(-db * tail * mix(0.6, 1.7, r2)) : exp(db * 60.0);
    tr = max(tr, e * mix(0.6, 1.0, r1));
  }
  return tr;
}

/** Entrée : les courants se déroulent de gauche à droite, avec un front doux.
    Sortie : ils s'en vont dans le même sens, la queue s'effaçant depuis la gauche. */
float revealAt(float u) {
  float front = u_reveal * 1.35;
  float back = u_exit * 1.35;
  return (1.0 - smoothstep(front - 0.35, front, u)) * smoothstep(back - 0.35, back, u);
}

vec4 toClip(vec2 p) {
  vec2 c = p / u_res * 2.0 - 1.0;
  return vec4(c.x, -c.y, 0.0, 1.0);
}
`;

/** Filaments : chaque sommet sait où il est (u, côté, brin, fil) ; tout le reste se calcule ici. */
const STRAND_VS = /* glsl */ `${GLSL_COMMON}
attribute vec4 a_data;    // u, côté (-1/1), brin, fil (0 principal, 1 secondaire, ≥ 2 fibres de voile)
attribute float a_stream;
uniform float u_pass;     // 0 : lueur large · 1 : cœur fin
uniform float u_alpha;
uniform float u_glow;
uniform vec3 u_primary;
uniform vec3 u_secondary;
uniform vec3 u_core;
varying vec3 v_col;
varying float v_across;

const float TAU = 6.28318530718;
const float TILT = 0.42; // même inclinaison d'hélice que le curseur : des boucles, pas une sinusoïde
const float DU = 1.0 / ${SEGMENTS - 1}.0;

/** Profil d'un fil : x = rayon, y = décalage de phase, z = ondulation propre. */
vec3 threadShape(float thread) {
  if (thread > 1.5) {
    // Fibres : un voile de soie autour du brin, chacune à sa distance et son retard.
    float f = thread - 2.0;
    return vec3(0.7 + 0.6 * fract(f * 0.618), 0.16 + f * 0.09, 0.22);
  }
  return thread > 0.5 ? vec3(1.45, 0.75, 0.6) : vec3(1.0, 0.0, 0.0);
}

/** Décalage d'un filament autour de la colonne : x = normale, y = tangente, z = profondeur (cos). */
vec3 strandOffset(float s, float rad, float k, float thread, float strands, float seed, float ts) {
  vec3 shape = threadShape(thread);
  float base = k * TAU / strands + 0.35 * sin(k * 2.1) + seed;
  float R = rad * (1.0 + 0.22 * sin(ts * 0.9 + (k + thread * 3.0) * 1.7 + s * 0.018)) * shape.x;
  // Pas de rotation continue : les filaments ondulent et se croisent, ils ne tourbillonnent pas.
  // Croisements pilotés par du bruit : ils se font et se défont sans jamais revenir au même motif.
  float ph = base + 0.9 * snoise(vec3(s * 0.0022, k * 1.9 + seed, ts * 0.09))
           + shape.y + shape.z * sin(s * 0.045 - ts * 2.1 + k + thread);
  float on = R * sin(ph) + rad * 0.28 * sin(s * 0.017 - ts * 1.1);
  return vec3(on, R * cos(ph) * TILT, cos(ph));
}

void main() {
  int i = int(a_stream + 0.5);
  vec4 s0 = u_s0[i];
  vec4 s1 = u_s1[i];
  vec4 s2 = u_s2[i];
  float u = a_data.x;
  float side = a_data.y;
  float k = a_data.z;
  float thread = a_data.w;
  float seed = s0.w;
  float ts = u_time + seed * 10.0;

  vec2 Pa = spine(max(0.0, u - DU), s0);
  vec2 P  = spine(u, s0);
  vec2 Pb = spine(min(1.0, u + DU), s0);
  vec2 T = normalize(Pb - Pa + 1e-5);
  vec2 N = vec2(-T.y, T.x);

  // Traînées : la tête file, la queue s'éteint derrière elle.
  float trail = trailAt(u, s0, s1, s2.x);
  float taper = pow(max(sin(3.14159265 * u), 0.0), 0.35);
  float t = u_time * u_drift;
  float breath = 0.45 + 0.55 * (0.5 + 0.5 * snoise(vec3(u * 2.5, seed + 20.0, t * 0.12)));
  float wisp = 0.45 + 0.55 * max(0.0, 0.5 + 0.7 * snoise(vec3(u * 2.6, seed + 40.0, t * 0.14)));
  // Pendant l'entrée, le front du déroulé brille comme la pointe d'un pinceau de lumière.
  float frontGlow = (1.0 - u_reveal) * exp(-pow((u - u_reveal * 1.35 + 0.12) * 9.0, 2.0));
  // À la sortie, la queue qui s'efface brille à son tour : le courant part en traînée.
  float exitGlow = sin(3.14159265 * u_exit) * exp(-pow((u - u_exit * 1.35 + 0.05) * 9.0, 2.0));
  trail = max(trail, max(frontGlow, exitGlow));
  // Sous le pointeur, les filaments s'ouvrent et s'illuminent : le courant réagit à la présence.
  vec2 dp = u_pointer.xy - P;
  float near = exp(-dot(dp, dp) / (2.0 * 1.4 * u_pull.y * u_pull.y)) * u_pointer.z * min(1.0, u_pull.x * 1.6);
  float rad = s0.z * taper * breath * (0.35 + 0.65 * trail) * (1.0 + 0.45 * near);
  float fade = taper * wisp * revealAt(u) * (0.1 + 0.9 * trail);

  float span = u_res.x * 1.16;
  float s = u * span;
  float ds = DU * span;
  vec3 o  = strandOffset(s, rad, k, thread, s2.y, seed, ts);
  vec3 oa = strandOffset(s - ds, rad, k, thread, s2.y, seed, ts);
  vec3 ob = strandOffset(s + ds, rad, k, thread, s2.y, seed, ts);
  vec2 F  = P  + N * o.x  + T * o.y;
  vec2 Fa = Pa + N * oa.x + T * oa.y;
  vec2 Fb = Pb + N * ob.x + T * ob.y;
  vec2 D = normalize(Fb - Fa + 1e-5);
  vec2 Nf = vec2(-D.y, D.x);

  // Contraste avant/arrière marqué : c'est ce qui rend les croisements lisibles.
  float d = pow((o.z + 1.0) * 0.5, 1.6);
  float fiber = step(1.5, thread);
  float thin = fiber > 0.5 ? 0.4 : (thread > 0.5 ? 0.55 : 1.0);
  float weight = fiber > 0.5 ? 0.24 : (thread > 0.5 ? 0.38 : 1.0);
  // Près de la tête, la traînée s'embrase : effet comète.
  float ember = (1.0 + 1.4 * trail * trail * trail) * (1.0 + 1.1 * near);
  float half_ = u_pass < 0.5
    ? (3.0 + d * 5.0) * thin * s1.y * (1.0 + u_glow * 1.1)
    : (0.45 + d * 1.8) * thin * s1.y * 0.5 + 0.75;
  float level = u_pass < 0.5
    ? (0.06 + 0.26 * d) * (0.5 + u_glow * 0.45) * mix(1.0, 0.45, fiber)
    : (0.25 + 0.85 * d);
  vec3 col = mix(mix(u_primary, u_secondary, 0.3), u_core, d * 0.6);
  float valid = step(k, s2.y - 0.5);
  v_col = col * level * ember * fade * weight * s1.x * u_alpha * valid;
  v_across = side;
  gl_Position = toClip(F + Nf * side * half_);
}
`;

const STRAND_FS = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float u_pass;
varying vec3 v_col;
varying float v_across;
void main() {
  // Profil gaussien à travers le filament : bords doux, aucun crénelage.
  float a = exp(-v_across * v_across * (u_pass < 0.5 ? 2.2 : 3.2));
  gl_FragColor = vec4(v_col * a, 1.0);
}
`;

/** Spores : de petites lueurs qui dérivent autour des courants, naissent et s'éteignent chacune à son rythme. */
const SPORE_VS = /* glsl */ `${GLSL_COMMON}
attribute vec4 a_spore;   // courant, position initiale, côté (-1..1), graine
uniform float u_alpha;
uniform float u_glow;
uniform float u_dpr;
varying float v_vis;
varying float v_tint;

void main() {
  int i = int(a_spore.x + 0.5);
  vec4 s0 = u_s0[i];
  float sd = a_spore.w;
  float t = u_time * u_drift;
  vec4 s1 = u_s1[i];
  vec4 s2 = u_s2[i];
  // Portées par le flux, de gauche à droite, à peu près à la vitesse des traînées (avec du jeu).
  float u = fract(a_spore.y + u_time * s1.w * (0.55 + 0.6 * hash(sd * 3.1))
                 + 0.08 * snoise(vec3(sd, u_time * 0.05, 2.0)));
  vec2 P = spine(u, s0);
  vec2 Pb = spine(min(1.0, u + 0.01), s0);
  vec2 T = normalize(Pb - P + 1e-5);
  vec2 N = vec2(-T.y, T.x);
  float off = a_spore.z * s0.z * (0.9 + 1.4 * hash(sd * 5.7)) + 14.0 * snoise(vec3(sd, t * 0.2, 7.0));
  vec2 pos = P + N * off + T * 10.0 * snoise(vec3(sd + 4.0, t * 0.17, 1.0));
  // Naissance → éclat → extinction, puis renaissance ailleurs.
  float life = sin(3.14159265 * fract(u_time * (0.06 + 0.08 * hash(sd * 9.3)) + hash(sd)));
  float twinkle = 0.65 + 0.35 * sin(u_time * (2.0 + 4.0 * hash(sd * 2.3)) + sd * 13.0);
  float edge = pow(max(sin(3.14159265 * u), 0.0), 0.6);
  // Elles s'embrasent quand une traînée passe, et restent à peine visibles entre deux.
  float lit = 0.25 + 0.75 * trailAt(u, s0, s1, s2.x);
  v_vis = life * life * twinkle * edge * lit * revealAt(u) * u_alpha;
  v_tint = step(0.7, hash(sd * 7.7));
  gl_PointSize = (3.0 + 6.0 * hash(sd * 11.0)) * (1.5 + u_glow * 0.6) * u_dpr;
  gl_Position = toClip(pos);
}
`;

const SPORE_FS = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec3 u_primary;
uniform vec3 u_secondary;
uniform vec3 u_core;
varying float v_vis;
varying float v_tint;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d2 = dot(q, q);
  if (d2 > 1.0 || v_vis < 0.003) discard;
  // Même sprite que les spores du curseur : cœur blanc, teinte, halo qui s'efface.
  vec3 tint = mix(u_primary, u_secondary, v_tint);
  vec3 c = vec3(1.0) * exp(-d2 * 60.0) + u_core * exp(-d2 * 16.0) * 0.75 + tint * exp(-d2 * 3.5) * 0.55;
  gl_FragColor = vec4(c * v_vis, 1.0);
}
`;

/** Tous les uniformes possibles : chaque programme ignore ceux qu'il ne déclare pas (location nulle). */
const UNIFORMS = [
  "u_res",
  "u_time",
  "u_sway",
  "u_drift",
  "u_pointer",
  "u_pvel",
  "u_pull",
  "u_reveal",
  "u_exit",
  "u_s0",
  "u_s1",
  "u_s2",
  "u_pass",
  "u_alpha",
  "u_glow",
  "u_primary",
  "u_secondary",
  "u_core",
  "u_dpr",
];

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("[Lifestream] shader :", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(gl: WebGLRenderingContext, vs: string, fs: string) {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn("[Lifestream] programme :", gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

export type LifestreamBackgroundProps = {
  color?: string;
  secondaryColor?: string;
  background?: string;
  /** Mode écran : fond transparent, les lueurs s'ajoutent au calque situé dessous. */
  overlay?: boolean;
  glow?: number;
  /** Intensité des lueurs (au-delà de 1, elles saturent). */
  intensity?: number;
  count?: number;
  strands?: number;
  fibers?: number;
  /** Amplitude des tresses (px). */
  width?: number;
  spread?: number;
  particles?: number;
  /** 0 : un tracé neuf à chaque visite. Sinon : toujours la même composition. */
  seed?: number;
  tempo?: number;
  speed?: number;
  trails?: number;
  trailLength?: number;
  flow?: number;
  intro?: boolean;
  introDuration?: number;
  /**
   * Pilote le déroulé à la place de l'intro : 0 → 1, lu à chaque image (aucun re-rendu React).
   * Le front lumineux suit alors la progression d'un bord à l'autre, comme une barre de chargement.
   */
  progress?: RefObject<number>;
  /** Sortie 0 → 1, lue à chaque image : les courants s'en vont de gauche à droite. */
  exit?: RefObject<number>;
  attraction?: number;
  wake?: number;
  /** Rayon d'influence du pointeur (px). */
  radius?: number;
  maxFps?: number;
  resolution?: number;
  /** Plein écran par défaut ; utiliser absolute dans une section positionnée. */
  position?: "fixed" | "absolute";
  /** Affiche une composition figée, sans boucle d'animation. */
  paused?: boolean;
  /** -1 place le fond derrière le contenu dans un parent avec isolation: isolate. */
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
};

export default function LifestreamBackground({
  color = "#48ffa5",
  secondaryColor = "#00bfa5",
  background = "#010302",
  overlay = false,
  glow = 1.2,
  intensity = 1,
  count = 4,
  strands = 3,
  fibers = 5,
  width = 34,
  spread = 1,
  particles = 70,
  seed = 0,
  tempo = 0.6,
  speed = 1,
  trails = 2,
  trailLength = 1,
  flow = 1,
  intro = true,
  introDuration = 2.4,
  progress,
  exit,
  attraction = 0.55,
  wake = 0.6,
  radius = 170,
  maxFps = 60,
  resolution = 1.5,
  position = "fixed",
  paused = false,
  zIndex = -1,
  className,
  style,
}: LifestreamBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const rootElement = rootRef.current;
    const canvasElement = canvasRef.current;
    if (!rootElement || !canvasElement) return;
    const root = rootElement;
    const canvas = canvasElement;
    const doc = canvas.ownerDocument;
    const view = doc.defaultView ?? window;
    const glCtx = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    });
    if (!glCtx) return; // pas de WebGL : le fond CSS reste, sans courant
    const gl = glCtx;

    // ---------- Réglages normalisés ----------
    const streamCount = Math.round(clamp(count, 1, MAX_STREAMS));
    const strandCount = Math.round(clamp(strands, 1, 4));
    const threadCount = 2 + Math.round(clamp(fibers, 0, 8));
    const amplitude = clamp(width, 8, 80);
    const pace = clamp(speed, 0.1, 3);
    const headCount = Math.round(clamp(trails, 1, MAX_HEADS));
    const tailK = 1 / clamp(trailLength, 0.3, 2.5);
    const introLen = clamp(introDuration, 0.5, 6);
    const fpsCap = clamp(maxFps, 24, 120);
    const maxRatio = clamp(resolution, 0.75, 2);
    const reach = clamp(radius, 40, 400);
    const wakeK = clamp(wake, 0, 1.5);
    const primary = parseColor(color, "#48ffa5");
    const secondary = parseColor(secondaryColor, "#00bfa5");
    const bg = overlay
      ? { r: 0, g: 0, b: 0 }
      : parseColor(background, "#010302"); // en mode écran, le noir est neutre
    const core = mix(primary, { r: 1, g: 1, b: 1 }, 0.7);
    const reducedMotion = view.matchMedia("(prefers-reduced-motion: reduce)");

    // ---------- Courants : répartis sur la hauteur, chacun sa personnalité ----------
    const random = mulberry32(
      seed > 0
        ? Math.round(seed) * 9301 + 49297
        : Math.floor(Math.random() * 4294967296),
    );
    const streams: Stream[] = Array.from({ length: streamCount }, (_, i) => {
      const t = streamCount === 1 ? 0.5 : i / (streamCount - 1);
      const main = clamp(1 - Math.abs(t - 0.5) * 1.6, 0, 1); // les courants centraux dominent
      return {
        y: lerp(0.3, 0.72, t) + (random() - 0.5) * 0.06,
        amp: 0.1 + random() * 0.11,
        spread: amplitude * (0.5 + 0.6 * main + random() * 0.25),
        seed: random() * 10,
        alpha: 0.5 + 0.5 * main,
        thick: 0.9 + 0.4 * main,
        heads: Math.max(1, headCount - (main < 0.4 ? 1 : 0)),
        speed: (0.08 + random() * 0.06) * pace,
        tail: (2.2 + random()) * tailK,
        strands: Math.max(1, strandCount - (main < 0.4 ? 1 : 0)),
      };
    });

    // ---------- Programmes ----------
    const strandProg = link(gl, STRAND_VS, STRAND_FS);
    const sporeProg = link(gl, SPORE_VS, SPORE_FS);
    if (!strandProg || !sporeProg) return;

    // ---------- Géométrie statique : générée une fois, jamais retouchée ----------
    // Filaments : pour chaque (courant, brin, fil), un ruban de SEGMENTS × 2 sommets.
    const data: number[] = [];
    const streamIdx: number[] = [];
    const indices: number[] = [];
    let vtx = 0;
    streams.forEach((S, si) => {
      for (let k = 0; k < S.strands; k++) {
        for (let th = 0; th < threadCount; th++) {
          for (let j = 0; j < SEGMENTS; j++) {
            const u = j / (SEGMENTS - 1);
            data.push(u, -1, k, th, u, 1, k, th);
            streamIdx.push(si, si);
            if (j < SEGMENTS - 1) {
              const a = vtx + j * 2;
              indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
            }
          }
          vtx += SEGMENTS * 2;
        }
      }
    });
    const strandData = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, strandData);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    const strandStream = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, strandStream);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(streamIdx), gl.STATIC_DRAW);
    const strandIndex = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, strandIndex);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW,
    );
    const strandIndexCount = indices.length;

    // Spores : réparties sur les courants, plus nombreuses sur les plus présents.
    const sporeTotal = Math.round(clamp(particles, 0, 240));
    const sporeData = new Float32Array(sporeTotal * 4);
    const weightSum = streams.reduce((a, S) => a + S.alpha, 0);
    for (let n = 0; n < sporeTotal; n++) {
      let pick = random() * weightSum;
      let si = 0;
      while (si < streams.length - 1 && (pick -= streams[si].alpha) > 0) si++;
      sporeData.set(
        [si, random(), (random() - 0.5) * 2, random() * 100],
        n * 4,
      );
    }
    const sporeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sporeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, sporeData, gl.STATIC_DRAW);

    // ---------- Uniformes fixes ----------
    const s0 = new Float32Array(MAX_STREAMS * 4);
    const s1 = new Float32Array(MAX_STREAMS * 4);
    const s2 = new Float32Array(MAX_STREAMS * 4);
    streams.forEach((S, i) => {
      s0.set([S.y, S.amp, S.spread, S.seed], i * 4);
      s1.set([S.alpha, S.thick, S.heads, S.speed], i * 4);
      s2.set([S.tail, S.strands, 0, 0], i * 4);
    });
    const locsOf = (p: WebGLProgram) =>
      Object.fromEntries(
        UNIFORMS.map((n) => [n, gl.getUniformLocation(p, n)]),
      ) as Record<string, WebGLUniformLocation | null>;
    const L = locsOf(strandProg);
    const LS = locsOf(sporeProg);
    for (const [prog, locs] of [
      [strandProg, L],
      [sporeProg, LS],
    ] as const) {
      gl.useProgram(prog);
      gl.uniform4fv(locs.u_s0, s0);
      gl.uniform4fv(locs.u_s1, s1);
      gl.uniform4fv(locs.u_s2, s2);
      gl.uniform1f(locs.u_sway, clamp(spread, 0, 2));
      gl.uniform1f(locs.u_drift, clamp(flow, 0, 3));
      gl.uniform2f(locs.u_pull, clamp(attraction, 0, 1), reach);
      gl.uniform1f(locs.u_alpha, clamp(intensity, 0, 1.5));
      gl.uniform1f(locs.u_glow, clamp(glow, 0, 3));
      gl.uniform3f(locs.u_primary, primary.r, primary.g, primary.b);
      gl.uniform3f(locs.u_secondary, secondary.r, secondary.g, secondary.b);
      gl.uniform3f(locs.u_core, core.r, core.g, core.b);
    }
    const aData = gl.getAttribLocation(strandProg, "a_data");
    const aStream = gl.getAttribLocation(strandProg, "a_stream");
    const aSpore = gl.getAttribLocation(sporeProg, "a_spore");

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // lumière additive : les croisements s'illuminent
    gl.clearColor(bg.r, bg.g, bg.b, 1);

    // ---------- État ----------
    let w = 1;
    let h = 1;
    let frame = 0;
    let previousTime = 0;
    let startTime = -1;
    let visible = true;
    let rect = { left: 0, top: 0 };
    // Pointeur : cible brute, position lissée, sillage amorti et présence en fondu.
    // La position n'est jamais téléportée : quand il sort, il garde sa place pendant que sa présence s'éteint.
    const pointer = {
      tx: 0,
      ty: 0,
      x: 0,
      y: 0,
      wx: 0,
      wy: 0,
      k: 0,
      inside: false,
      seeded: false,
    };

    function resize() {
      const box = root.getBoundingClientRect();
      rect = { left: box.left, top: box.top };
      w = Math.max(1, box.width);
      h = Math.max(1, box.height);
      const ratio = Math.min(view.devicePixelRatio || 1, maxRatio);
      canvas.width = Math.max(1, Math.round(w * ratio));
      canvas.height = Math.max(1, Math.round(h * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(sporeProg);
      gl.uniform1f(LS.u_dpr, ratio);
    }

    function render(ts: number, reveal: number, leave = 0) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (reveal <= 0 || leave >= 1) return;

      // Filaments : lueur large puis cœur fin, deux appels pour toute la scène.
      gl.useProgram(strandProg);
      gl.uniform2f(L.u_res, w, h);
      gl.uniform1f(L.u_time, ts);
      gl.uniform1f(L.u_reveal, reveal);
      gl.uniform1f(L.u_exit, leave);
      gl.uniform3f(L.u_pointer, pointer.x, pointer.y, pointer.k);
      gl.uniform2f(L.u_pvel, pointer.wx, pointer.wy);
      gl.bindBuffer(gl.ARRAY_BUFFER, strandData);
      gl.enableVertexAttribArray(aData);
      gl.vertexAttribPointer(aData, 4, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, strandStream);
      gl.enableVertexAttribArray(aStream);
      gl.vertexAttribPointer(aStream, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, strandIndex);
      for (const pass of [0, 1]) {
        gl.uniform1f(L.u_pass, pass);
        gl.drawElements(gl.TRIANGLES, strandIndexCount, gl.UNSIGNED_SHORT, 0);
      }
      gl.disableVertexAttribArray(aData);
      gl.disableVertexAttribArray(aStream);

      // Spores : un seul appel pour toutes.
      if (sporeTotal > 0) {
        gl.useProgram(sporeProg);
        gl.uniform2f(LS.u_res, w, h);
        gl.uniform1f(LS.u_time, ts);
        gl.uniform1f(LS.u_reveal, reveal);
        gl.uniform1f(LS.u_exit, leave);
        gl.uniform3f(LS.u_pointer, pointer.x, pointer.y, pointer.k);
        gl.uniform2f(LS.u_pvel, pointer.wx, pointer.wy);
        gl.bindBuffer(gl.ARRAY_BUFFER, sporeBuf);
        gl.enableVertexAttribArray(aSpore);
        gl.vertexAttribPointer(aSpore, 4, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, sporeTotal);
        gl.disableVertexAttribArray(aSpore);
      }
    }

    /** Entrée : les courants se déroulent de gauche à droite (ease-out expo, comme un trait qui se pose). */
    function revealAt(elapsed: number) {
      if (progress) {
        // Le front (milieu du fondu) est à x ≈ 0 pour un déroulé de 0,18, et au-delà du bord droit à 1.
        return 0.18 + 0.82 * clamp(progress.current, 0, 1);
      }
      if (!intro) return 1;
      const p = clamp((elapsed - INTRO_DELAY) / introLen, 0, 1);
      return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
    }

    function dispose() {
      gl.deleteBuffer(strandData);
      gl.deleteBuffer(strandStream);
      gl.deleteBuffer(strandIndex);
      gl.deleteBuffer(sporeBuf);
      gl.deleteProgram(strandProg);
      gl.deleteProgram(sporeProg);
    }

    // ---------- Composition figée : pause ou mouvement réduit ----------
    if (paused || reducedMotion.matches) {
      const paint = () => {
        resize();
        render(STATIC_TIME, 1);
      };
      paint();
      const observer = new ResizeObserver(paint);
      observer.observe(root);
      return () => {
        observer.disconnect();
        dispose();
      };
    }

    // ---------- Boucle d'animation ----------
    const minGap = 1000 / fpsCap - 2;
    // Horloge de l'animation : avance à `tempo` × le temps réel. Accumulée, donc changer la vitesse
    // ne fait jamais sauter les courants ; l'entrée, elle, garde le temps réel.
    const tempoK = clamp(tempo, 0.05, 2);
    let clock = 0;
    function tick(time: number) {
      frame = 0;
      if (!visible || doc.hidden) {
        previousTime = 0;
        return;
      }
      if (previousTime && time - previousTime < minGap) {
        frame = view.requestAnimationFrame(tick);
        return;
      }
      const dt = previousTime
        ? Math.min(0.05, (time - previousTime) / 1000)
        : 1 / 60;
      previousTime = time;
      const ts = time / 1000;
      if (startTime < 0) startTime = ts;
      updatePointer(dt);
      clock += dt * tempoK;
      render(
        clock,
        revealAt(ts - startTime),
        exit ? clamp(exit.current, 0, 1) : 0,
      );
      frame = view.requestAnimationFrame(tick);
    }
    function kick() {
      if (!frame && visible && !doc.hidden)
        frame = view.requestAnimationFrame(tick);
    }

    /** Ressort amorti : le courant suit le geste avec un léger retard, jamais par à-coups. */
    function updatePointer(dt: number) {
      const ox = pointer.x;
      const oy = pointer.y;
      if (pointer.inside) {
        const k = 1 - Math.exp(-dt * 7);
        pointer.x += (pointer.tx - pointer.x) * k;
        pointer.y += (pointer.ty - pointer.y) * k;
      }
      // Sillage = vitesse lissée × durée courte, plafonné pour rester élégant même sur un geste brusque.
      const vx = (pointer.x - ox) / dt;
      const vy = (pointer.y - oy) / dt;
      const kv = 1 - Math.exp(-dt * 5);
      const tx = clamp(vx * 0.05 * wakeK, -60, 60);
      const ty = clamp(vy * 0.05 * wakeK, -60, 60);
      pointer.wx += (tx - pointer.wx) * kv;
      pointer.wy += (ty - pointer.wy) * kv;
      // Présence : apparaît vite, s'efface lentement.
      pointer.k +=
        ((pointer.inside ? 1 : 0) - pointer.k) *
        (1 - Math.exp(-dt * (pointer.inside ? 3.5 : 1.6)));
    }

    // ---------- Événements ----------
    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      pointer.inside =
        x > -reach && y > -reach && x < w + reach && y < h + reach;
      pointer.tx = x;
      pointer.ty = y;
      // Première entrée (ou retour après effacement complet) : on se place directement, sans balayage.
      if (!pointer.seeded || pointer.k < 0.02) {
        pointer.x = x;
        pointer.y = y;
        pointer.wx = pointer.wy = 0;
        pointer.seeded = true;
      }
    }
    function onLeave() {
      pointer.inside = false;
    }
    function onScroll() {
      const box = root.getBoundingClientRect();
      rect = { left: box.left, top: box.top };
    }
    function onVisibility() {
      if (doc.hidden) {
        view.cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
      } else kick();
    }
    function onLost(event: Event) {
      event.preventDefault();
      view.cancelAnimationFrame(frame);
      frame = 0;
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    // Hors écran, le GPU se repose.
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) kick();
      },
      { rootMargin: "100px" },
    );
    io.observe(root);
    // Le pointeur est suivi sur toute la fenêtre : le calque lui-même ne capte aucun événement.
    view.addEventListener("pointermove", onMove, { passive: true });
    doc.documentElement.addEventListener("pointerleave", onLeave);
    view.addEventListener("blur", onLeave);
    view.addEventListener("scroll", onScroll, { passive: true, capture: true });
    doc.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("webglcontextlost", onLost);
    kick();

    return () => {
      view.cancelAnimationFrame(frame);
      frame = 0;
      resizeObserver.disconnect();
      io.disconnect();
      view.removeEventListener("pointermove", onMove);
      doc.documentElement.removeEventListener("pointerleave", onLeave);
      view.removeEventListener("blur", onLeave);
      view.removeEventListener("scroll", onScroll, true);
      doc.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      dispose();
    };
  }, [
    color,
    secondaryColor,
    background,
    overlay,
    glow,
    intensity,
    count,
    strands,
    fibers,
    width,
    spread,
    particles,
    seed,
    tempo,
    speed,
    trails,
    trailLength,
    flow,
    intro,
    introDuration,
    progress,
    exit,
    attraction,
    wake,
    radius,
    maxFps,
    resolution,
    paused,
  ]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={className}
      data-lifestream-background=""
      style={{
        position,
        inset: 0,
        zIndex,
        backgroundColor: overlay ? "transparent" : background,
        overflow: "hidden",
        // Le mode écran s'applique à tout le calque, pour se mélanger au fond situé dessous.
        mixBlendMode: overlay ? "screen" : "normal",
        ...style,
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          display: "block",
        }}
      />
    </div>
  );
}
