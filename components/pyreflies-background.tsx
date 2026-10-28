"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { onPreloaderDone } from "@/components/Preloader";
import { subscribeToBackgroundPause } from "@/lib/background-animation";
import {
  hasLightListeners,
  publishLights,
  type PyrefliesLight,
} from "@/lib/pyreflies-lights";

type RGB = { r: number; g: number; b: number };
/** Disposition d'un tampon de sommets : quels attributs, à quel décalage, sur quelle largeur. */
type Layout = {
  buffer: WebGLBuffer;
  stride: number;
  attrs: { loc: number; size: number; offset: number }[];
};
/** Un maillage prêt à dessiner : programme, sommets, indices. */
type Mesh = {
  prog: WebGLProgram;
  layout: Layout;
  index: WebGLBuffer | null;
  count: number;
  mode: number;
  locs: Record<string, WebGLUniformLocation | null>;
};
/** Géométrie en cours de construction : sommets, indices, nombre de sommets déjà posés. */
type Builder = { data: number[]; indices: number[]; vertices: number };

const NOISE_SIZE = 256;
const LIGHT_FPS = 20;
const LIGHT_SAMPLES = LIGHT_FPS + 1; // Une seconde de trajectoire par lecture GPU.
const ORB_PAD = 2.6; // le quad d'une sphère déborde de son cœur : place pour sa lueur
const ENVELOPE_SEG = 84; // segments de l'enveloppe…
const ENVELOPE_CAP = 14; // …dont ceux du dôme qui enrobe l'avant de la lumière
const MEMBRANE_SEG = 64;
const WAKE_SEG = 48;
const CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];
/** Tous les uniformes possibles : chaque programme ignore ceux qu'il ne déclare pas (location nulle). */
const UNIFORMS = [
  // vertex
  "u_res",
  "u_time",
  "u_intro",
  "u_life",
  "u_turb",
  "u_hue",
  "u_dpr",
  "u_elen",
  "u_esize",
  "u_eflare",
  "u_eripple",
  "u_mlen",
  "u_mwidth",
  "u_twist",
  "u_wave",
  // fragment
  "u_t",
  "u_tint",
  "u_tintK",
  "u_irid",
  "u_noise",
  "u_glow",
  "u_eK",
  "u_mK",
  "u_mistK",
  "u_trail",
  "u_texel",
  "u_bloom",
  "u_exposure",
  "u_bg",
];

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Laisse le navigateur normaliser n'importe quelle couleur CSS puis la relit (0–1). */
function parseColor(value: string, fallback: string): RGB {
  const swatch = document.createElement("canvas");
  swatch.width = swatch.height = 1;
  const ctx = swatch.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { r: 0.28, g: 1, b: 0.65 };
  ctx.fillStyle = fallback;
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

/** Générateur pseudo-aléatoire reproductible : même graine, même composition. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const builder = (): Builder => ({ data: [], indices: [], vertices: 0 });

/** Ajoute un ruban de `seg` segments : deux sommets (côtés −1 et 1) par point, suivis de `attrs`. */
function addStrip(b: Builder, seg: number, attrs: number[]) {
  for (let j = 0; j <= seg; j++) {
    const u = j / seg;
    b.data.push(u, -1, ...attrs, u, 1, ...attrs);
  }
  for (let j = 0; j < seg; j++) {
    const a = b.vertices + j * 2;
    b.indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  b.vertices += (seg + 1) * 2;
}

/** Ajoute un quad (coins −1..1) suivi de `attrs`. */
function addQuad(b: Builder, attrs: number[]) {
  for (const [cx, cy] of CORNERS) b.data.push(cx, cy, ...attrs);
  const a = b.vertices;
  b.indices.push(a, a + 1, a + 2, a, a + 2, a + 3);
  b.vertices += 4;
}

// ---------- GLSL ----------
const PRECISION = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

/** Bruit simplex 3D (Ashima / Gustavson) : méandres des trajectoires et bouillonnement de la brume. */
const SNOISE = /* glsl */ `
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
`;

/** Commun aux vertex shaders : trajectoire des sphères et entrée. */
const COMMON_VS = /* glsl */ `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_intro;     // instant de l'entrée (horloge), durée
${SNOISE}
float hash(float n) { return fract(sin(n) * 43758.5453123); }
vec2 rot2(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}
vec4 toClip(vec2 p) {
  vec2 c = p / u_res * 2.0 - 1.0;
  return vec4(c.x, -c.y, 0.0, 1.0);
}

/** Trajectoire d'une sphère : une traversée de bord à bord par cycle. Chaque cycle tire au sort
    son sens, ses hauteurs de départ et d'arrivée et ses méandres : jamais deux fois le même vol.
    o = graine, durée d'une traversée, phase, rayon. */
vec2 orbPath(vec4 o, float t) {
  float seed = o.x;
  float cyc = t / o.y + o.z;
  float c = floor(cyc);
  float s = fract(cyc);
  float u = hash(c * 3.17 + seed * 1.3) > 0.5 ? s : 1.0 - s;
  float y0 = mix(0.2, 0.8, hash(c * 1.71 + seed * 2.9));
  float y1 = mix(0.2, 0.8, hash(c * 2.37 + seed * 5.1));
  float x = mix(-0.25, 1.25, u) * u_res.x; // changement de cycle hors champ
  float y = mix(y0, y1, smoothstep(0.0, 1.0, u)) * u_res.y
          + u_res.y * 0.12 * snoise(vec3(u * 2.1, seed + c * 1.37, 0.0))
          + u_res.y * 0.035 * snoise(vec3(u * 5.3, seed * 2.0 + c, 1.0));
  return vec2(x, y);
}
/** Fondu aux deux bouts d'une traversée (hors champ) : rien ne relie jamais deux vols différents. */
float orbSpan(vec4 o, float t) {
  float s = fract(t / o.y + o.z);
  return smoothstep(0.0, 0.025, s) * (1.0 - smoothstep(0.975, 1.0, s));
}
/** Direction de vol à l'instant t. */
vec2 orbDir(vec4 o, float t) {
  return normalize(orbPath(o, t + 0.06) - orbPath(o, t - 0.06) + 1e-4);
}
/** Entrée : chaque sphère apparaît à son tour ; ce qu'elle a laissé avant reste invisible. */
float orbVisible(vec4 o, float t) {
  float delay = hash(o.x * 7.7) * u_intro.y * 0.5;
  return smoothstep(u_intro.x + delay, u_intro.x + delay + u_intro.y * 0.5, t);
}
`;

/** Commun aux fragment shaders : bruit, film mince, arc-en-ciel teinté. */
const COMMON_FS = /* glsl */ `${PRECISION}
uniform float u_t;
uniform vec3 u_tint;
uniform float u_tintK;
uniform float u_irid;
uniform sampler2D u_noise;
vec3 rainbow(float h) {
  vec3 c = 0.5 + 0.5 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67)));
  c = mix(vec3(dot(c, vec3(0.333))), c, u_irid);
  return mix(c, u_tint, u_tintK);
}
vec2 rotf(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}
/** Bruit de valeur sur texture, interpolation lissée. */
float vnoise(vec2 p) {
  p *= 3.0;
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return texture2D(u_noise, (i + f + 0.5) / ${NOISE_SIZE}.0).r;
}
/** Interférence en film mince : la couleur d'une membrane dépend de son épaisseur (nm) et de l'angle. */
vec3 thinFilm(float thick, float cosI) {
  float sin2 = 1.0 - cosI * cosI;
  float cosT = sqrt(max(1.0 - sin2 / 1.769, 0.0));
  float opd = 2.0 * 1.33 * thick * cosT;
  vec3 c = 0.5 - 0.5 * cos(6.2832 * opd / vec3(650.0, 532.0, 450.0));
  c = pow(c, vec3(1.4)) * 1.35;
  c = mix(vec3(dot(c, vec3(0.333))), c, u_irid);
  return mix(c, u_tint * (0.35 + dot(c, vec3(0.5))), u_tintK);
}
`;

// --- L'enveloppe : une membrane translucide en goutte, qui enrobe la lumière et s'étire en traînée ---
const ENVELOPE_VS = /* glsl */ `${COMMON_VS}
attribute vec2 a_r;       // le long (0 = pointe avant → 1 = bout), côté (-1/1)
attribute vec4 a_o;       // la sphère
uniform float u_elen;     // longueur du corps, en secondes de trajet
uniform float u_esize;    // rayon autour de la lumière, en rayons de sphère
uniform float u_eflare;   // évasement vers l'arrière
uniform float u_eripple;  // ondulation des flancs
varying float v_v;
varying float v_k;
varying float v_seed;
varying float v_alpha;
const float CAP = ${(ENVELOPE_CAP / ENVELOPE_SEG).toFixed(6)};
void main() {
  float u = a_r.x;
  float side = a_r.y;
  float r = a_o.w;
  float seed = a_o.x;
  float R0 = r * u_esize;
  float k;
  float te;
  float hw;
  vec2 C;
  vec2 N;
  if (u < CAP) {
    // Le dôme : il passe devant la lumière et l'enrobe.
    float x = 1.0 - u / CAP;
    te = u_time;
    vec2 T = orbDir(a_o, te);
    N = vec2(-T.y, T.x);
    C = orbPath(a_o, te) + T * R0 * x * 0.8;
    hw = R0 * sqrt(max(1.0 - x * x, 0.0));
    k = -x;
  } else {
    // Le corps suit le chemin passé de la lumière, s'évase et ondule, chaque flanc à son rythme.
    k = (u - CAP) / (1.0 - CAP);
    te = u_time - k * u_elen;
    vec2 T = orbDir(a_o, te);
    N = vec2(-T.y, T.x);
    float wave = 0.6 * sin(k * 7.0 - u_time * 2.4 + seed + side * 1.3)
               + 0.4 * sin(k * 3.3 - u_time * 1.3 + seed * 2.0 - side);
    C = orbPath(a_o, te) + N * r * 0.35 * u_eripple * k * sin(k * 4.0 - u_time * 1.7 + seed);
    // Évasement en goutte : il commence dès la lumière (pas de goulot), puis s'adoucit.
    float open = mix(smoothstep(0.0, 0.55, k), (1.0 - exp(-k * 1.5)) / (1.0 - exp(-1.5)), 0.6);
    hw = R0 * (1.0 + u_eflare * open) * (1.0 + 0.14 * u_eripple * wave * smoothstep(0.1, 0.45, k));
  }
  v_v = side;
  v_k = k;
  v_seed = seed;
  v_alpha = orbVisible(a_o, te) * orbSpan(a_o, te);
  gl_Position = toClip(C + N * side * hw);
}
`;

const ENVELOPE_FS = /* glsl */ `${COMMON_FS}
uniform float u_eK;
varying float v_v;
varying float v_k;
varying float v_seed;
varying float v_alpha;
void main() {
  if (v_alpha < 0.002) discard;
  float av = min(abs(v_v), 1.0);
  float x = max(-v_k, 0.0); // dans le dôme : 1 à la pointe, 0 au niveau de la lumière
  float k = max(v_k, 0.0);  // dans le corps : 0 à la lumière, 1 au bout
  // Orientation de la membrane : de face au milieu, de biais vers la silhouette (dôme puis tube).
  float cosN = sqrt(max(1.0 - av * av, 0.0)) * sqrt(max(1.0 - x * x, 0.0));
  float rho = sqrt(max(1.0 - cosN * cosN, 0.0)); // 0 au milieu → 1 sur la silhouette
  float outer = 1.0 - smoothstep(0.88, 1.0, rho);  // la silhouette s'éteint en douceur : aucun trait dur
  // Vue de biais, une membrane paraît plus dense : voile laiteux au milieu, bord plus clair, liseré fin.
  float sheet = 0.045 / (cosN + 0.1);
  float rim = exp(-pow((rho - 0.92) / 0.045, 2.0));
  float rimVar = 0.45 + 0.55 * vnoise(vec2(k * 2.5 + x - u_t * 0.3 + v_seed, v_v * 0.5)); // un bord vivant, jamais égal
  rim *= rimVar * mix(1.0, 0.25, smoothstep(0.0, 0.7, k));
  // Plis : quelques lignes douces qui serpentent dans la longueur.
  float n = vnoise(vec2(k * 1.6 - u_t * 0.12 + v_seed, v_v * 1.3));
  float folds = pow(1.0 - abs(n * 2.0 - 1.0), 10.0) * smoothstep(0.02, 0.2, k) * 0.16;
  // Reflet irisé, discret, sur un voile presque blanc.
  float thick = 320.0 + 420.0 * vnoise(vec2(k * 1.2 - x + v_seed, v_v * 0.7 - u_t * 0.05)) + 120.0 * v_v;
  vec3 film = mix(vec3(0.86, 0.9, 0.96), thinFilm(thick, max(cosN, 0.15)), 0.4);
  // Éclairée de l'intérieur par la lumière : plus claire près d'elle.
  float lit = 0.5 + 1.3 * exp(-k * 4.0);
  float fade = 1.0 - smoothstep(0.25, 0.9, k);
  vec3 col = film * (sheet * outer + rim * 0.4 + folds) * lit;
  gl_FragColor = vec4(col * fade * v_alpha * u_eK, 1.0);
}
`;

// --- Les voiles : ils naissent dans la lumière, s'ouvrent et ondulent derrière elle ---
const MEMBRANE_VS = /* glsl */ `${COMMON_VS}
attribute vec2 a_r;       // le long (0 = lumière → 1 = bout), côté (-1/1)
attribute vec4 a_o;       // la sphère
attribute vec4 a_m;       // écart latéral (-1..1), largeur, phase, longueur relative
uniform float u_mlen;     // longueur d'un voile, en secondes de trajet
uniform float u_mwidth;
uniform float u_twist;
uniform float u_wave;
varying float v_u;
varying float v_v;
varying float v_face;
varying float v_seed;
varying float v_alpha;
varying float v_hue;
void main() {
  float u = a_r.x;
  float te = u_time - u * u_mlen * a_m.w; // ce point du voile suit le chemin passé de la sphère
  vec2 O = orbPath(a_o, te);
  vec2 T = orbDir(a_o, te);
  vec2 N = vec2(-T.y, T.x);
  float r = a_o.w;
  float ph = a_m.z * 6.2832;
  float grow = smoothstep(0.0, 0.35, u); // tout part de la lumière, puis s'ouvre
  // Une vague parcourt le voile de la lumière vers le bout, comme une méduse qui nage.
  float wave = sin(u * 7.0 - u_time * 1.8 + ph) * 0.9 + sin(u * 3.1 - u_time * 0.9 + ph * 0.5) * 0.5;
  float lat = (a_m.x * (1.0 - 0.3 * u) * grow + wave * u * 0.8 * u_wave) * r * 1.25;
  vec2 C = O + N * lat;
  // Le voile tourne sur lui-même : de face il est large et pâle, de profil fin et lumineux.
  float th = ph + u * u_twist * 6.0 - u_time * 1.1 + 0.8 * sin(u * 4.0 - u_time * 1.5 + ph);
  float c = cos(th);
  float W = r * a_m.y * u_mwidth * (0.1 + 1.6 * grow) * (1.0 - 0.55 * u);
  float hw = (c >= 0.0 ? 1.0 : -1.0) * max(abs(W * c), 1.0);
  v_u = u;
  v_v = a_r.y;
  v_face = abs(c);
  v_seed = a_m.z * 10.0;
  v_hue = te * 0.12 + a_o.x * 0.2 + a_m.z;
  v_alpha = smoothstep(0.0, 0.03, u) * pow(1.0 - u, 1.2) * orbVisible(a_o, te) * orbSpan(a_o, te);
  gl_Position = toClip(C + N * a_r.y * hw);
}
`;

const MEMBRANE_FS = /* glsl */ `${COMMON_FS}
uniform float u_mK;
varying float v_u;
varying float v_v;
varying float v_face;
varying float v_seed;
varying float v_alpha;
varying float v_hue;
void main() {
  if (v_alpha < 0.002) discard;
  float av = abs(v_v);
  // La lisière : un bord frangé, plus lumineux, et une marge qui s'éteint (aucune arête dure).
  float frill = (vnoise(vec2(v_u * 9.0 - u_t * 0.5, v_seed)) - 0.5) * 0.12;
  float rim = exp(-pow((av - 0.8 - frill) / 0.1, 2.0));
  float fade = 1.0 - smoothstep(0.9, 1.0, av);
  // Fibres dans la longueur.
  float f = vnoise(vec2(v_v * 2.2 + v_seed, v_u * 0.9 - u_t * 0.12));
  float fibers = pow(1.0 - abs(f * 2.0 - 1.0), 6.0);
  // Vue de profil, une membrane concentre la lumière : ses plis brillent.
  float sheet = 1.0 / (v_face * 2.5 + 0.4);
  float thick = 320.0 + 420.0 * vnoise(vec2(v_u * 2.0 - u_t * 0.08, v_v * 0.8 + v_seed)) + 120.0 * v_v;
  vec3 film = mix(thinFilm(thick, mix(0.25, 1.0, v_face)), rainbow(v_hue), 0.3);
  // Le tissu lui-même est visible (voile translucide), ses fibres et sa lisière un peu plus.
  float body = 0.16 + 0.08 * vnoise(vec2(v_u * 3.0 - u_t * 0.1, v_v * 1.5 + v_seed * 2.0));
  vec3 col = film * (body + 0.28 * fibers + 0.55 * rim) * sheet + vec3(1.0) * rim * 0.08 * sheet;
  gl_FragColor = vec4(col * fade * v_alpha * u_mK, 1.0);
}
`;

// --- Le sillage : le flot dense qui sort de la lumière et nourrit la brume ---
const WAKE_VS = /* glsl */ `${COMMON_VS}
attribute vec2 a_r;       // le long (0 = lumière → 1 = bout), côté (-1/1)
attribute vec4 a_o;
uniform float u_life;
uniform float u_hue;
varying float v_u;
varying float v_v;
varying float v_hue;
varying float v_seed;
varying float v_alpha;
void main() {
  float u = a_r.x;
  float te = u_time - u * u_life * 0.7;
  vec2 O = orbPath(a_o, te);
  vec2 T = orbDir(a_o, te);
  vec2 N = vec2(-T.y, T.x);
  float r = a_o.w;
  float hw = r * (0.55 + 1.3 * u) * (1.0 + 0.15 * sin(u * 9.0 - u_time * 2.0 + a_o.x));
  v_u = u;
  v_v = a_r.y;
  v_hue = te * u_hue + a_o.x * 0.17;
  v_seed = a_o.x;
  v_alpha = orbVisible(a_o, te) * orbSpan(a_o, te);
  gl_Position = toClip(O + N * a_r.y * hw);
}
`;

const WAKE_FS = /* glsl */ `${COMMON_FS}
uniform float u_mistK;
varying float v_u;
varying float v_v;
varying float v_hue;
varying float v_seed;
varying float v_alpha;
void main() {
  if (v_alpha < 0.002) discard;
  float across = exp(-v_v * v_v * 3.0) * (1.0 - smoothstep(0.85, 1.0, abs(v_v)));
  // Stries de gaz dans le sens du flot.
  float n = vnoise(vec2(v_u * 3.0 - u_t * 0.25 + v_seed, v_v * 1.3));
  float n2 = vnoise(vec2(v_u * 7.0 - u_t * 0.4, v_v * 2.6 + v_seed * 2.0));
  float gas = 0.45 + 0.55 * smoothstep(0.25, 0.85, n * 0.65 + n2 * 0.35);
  float along = exp(-v_u * 3.2) * (1.0 - smoothstep(0.75, 1.0, v_u));
  // Blanc en sortant de la lumière, puis la couleur.
  vec3 col = mix(vec3(1.0), pow(rainbow(v_hue), vec3(1.3)) * 1.25, smoothstep(0.0, 0.12, v_u));
  gl_FragColor = vec4(col * across * gas * along * v_alpha * u_mistK * 0.55, 1.0);
}
`;

// --- La brume : des volutes émises en continu par la lumière, qui s'écartent, bouillonnent et s'éteignent ---
const MIST_VS = /* glsl */ `${COMMON_VS}
attribute vec2 a_corner;  // -1..1
attribute vec4 a_o;       // la sphère émettrice
attribute vec4 a_p;       // phase d'émission, durée de vie relative, côté (0–1), graine
uniform float u_life;
uniform float u_turb;
uniform float u_hue;
varying vec2 v_q;
varying float v_k;
varying float v_hue;
varying float v_seed;
varying float v_alpha;
void main() {
  float life = u_life * mix(0.7, 1.3, a_p.y);
  float age = fract(u_time / life + a_p.x) * life;
  float te = u_time - age;              // l'instant où elle a quitté la lumière
  float k = age / life;
  vec2 O = orbPath(a_o, te);
  vec2 T = orbDir(a_o, te);
  vec2 N = vec2(-T.y, T.x);
  float r = a_o.w;
  float sd = a_p.w;
  float side = a_p.z * 2.0 - 1.0;
  vec2 p = O + N * side * r * (0.2 + 1.5 * k);
  vec2 tb = vec2(snoise(vec3(O * 0.0035, te * 0.25 + sd)), snoise(vec3(O * 0.0035 + 7.3, te * 0.25 + sd + 3.1)));
  p += tb * u_turb * r * 1.6 * k;
  p.y -= 8.0 * age; // elle monte un peu, comme une fumée tiède
  float size = r * mix(0.6, 1.1, fract(sd * 7.13)) * (0.6 + 2.4 * k);
  // Visible dès sa sortie de la lumière : la traînée ne commence jamais plus loin.
  v_alpha = smoothstep(0.0, 0.015, k) * pow(1.0 - k, 1.2) * orbVisible(a_o, te) * orbSpan(a_o, te);
  v_k = k;
  // Une teinte par tronçon (des bandes franches), avec un léger dégradé d'un bord à l'autre.
  v_hue = te * u_hue + a_o.x * 0.17 + sd * 0.035 + side * 0.12;
  v_seed = sd;
  v_q = a_corner;
  vec2 corner = T * a_corner.x * size * mix(1.6, 2.4, fract(sd * 3.7)) + N * a_corner.y * size;
  gl_Position = toClip(p + corner * step(0.001, v_alpha));
}
`;

const MIST_FS = /* glsl */ `${COMMON_FS}
uniform float u_mistK;
varying vec2 v_q;
varying float v_k;
varying float v_hue;
varying float v_seed;
varying float v_alpha;
float fbm3(vec2 p) {
  float s = vnoise(p) * 0.5;
  s += vnoise(p * 2.03 + 1.7) * 0.25;
  s += vnoise(p * 4.07 + 4.1) * 0.125;
  return s / 0.875;
}
void main() {
  float d2 = dot(v_q, v_q);
  if (d2 > 1.0 || v_alpha < 0.002) discard;
  float base = 1.0 - d2;
  base *= base;
  vec2 q = rotf(v_q, (fract(v_seed * 1.31) - 0.5) * 0.6);
  float n = fbm3(q * vec2(0.55, 1.1) + vec2(v_seed * 3.7, v_k * 0.9));
  float shape = base * smoothstep(0.3, 0.8, n * 0.8 + base * 0.35);
  // Blanche en sortant de la lumière, puis elle prend sa couleur.
  vec3 col = mix(vec3(1.0), pow(rainbow(v_hue), vec3(1.35)) * 1.3, smoothstep(0.0, 0.12, v_k));
  float weight = mix(0.45, 1.0, fract(v_seed * 5.31));
  gl_FragColor = vec4(col * shape * v_alpha * weight * u_mistK * 0.14, 1.0);
}
`;

/** Composition : fond + brume (agrandie) + halo, avec une tonalité douce. */
const FULLSCREEN_VS = /* glsl */ `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const COMPOSITE_FS = /* glsl */ `${PRECISION}
uniform sampler2D u_trail;
uniform vec2 u_texel;
uniform float u_bloom;
uniform float u_exposure;
uniform vec3 u_bg;
varying vec2 v_uv;
void main() {
  vec3 c = texture2D(u_trail, v_uv).rgb;
  vec3 b = vec3(0.0);
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.785398 + 0.39;
    vec2 d = vec2(cos(a), sin(a));
    b += texture2D(u_trail, v_uv + d * u_texel * 5.0).rgb * 0.6;
    b += texture2D(u_trail, v_uv + d * u_texel * 13.0).rgb * 0.4;
  }
  vec3 light = c + b / 8.0 * u_bloom * 0.45;
  light = 1.0 - exp(-light * u_exposure * 1.6); // les hautes lumières fondent vers le blanc au lieu de clipper
  gl_FragColor = vec4(u_bg + light, 1.0);
}
`;

// --- La lumière ---
const ORB_VS = /* glsl */ `${COMMON_VS}
attribute vec2 a_corner;
attribute vec4 a_o;
varying vec2 v_q;
varying float v_vis;
varying float v_seed;
void main() {
  vec2 P = orbPath(a_o, u_time);
  v_vis = orbVisible(a_o, u_time);
  v_q = a_corner * ${ORB_PAD.toFixed(1)};
  v_seed = a_o.x;
  gl_Position = toClip(P + a_corner * a_o.w * ${ORB_PAD.toFixed(1)});
}
`;

const ORB_FS = /* glsl */ `${COMMON_FS}
uniform float u_glow;
varying vec2 v_q;
varying float v_vis;
varying float v_seed;
void main() {
  if (v_vis < 0.002) discard;
  float r2 = dot(v_q, v_q);
  // Une lumière chauffée à blanc, large et douce, qui sature au centre ; elle respire à peine.
  float breath = 0.94 + 0.06 * sin(u_t * 2.2 + v_seed * 3.0);
  float core = (exp(-r2 * 3.2) * 1.5 + exp(-sqrt(r2) * 1.7) * 0.55 * u_glow) * breath;
  vec3 coreCol = mix(vec3(1.0, 0.97, 0.95), u_tint, u_tintK * 0.5);
  // Fenêtre ronde : tout s'éteint bien avant le bord du quad (pas de cadre visible).
  float frame = 1.0 - smoothstep(0.78, 0.98, sqrt(r2) / ${ORB_PAD.toFixed(1)});
  gl_FragColor = vec4(coreCol * core * v_vis * frame, 1.0);
}
`;

// --- Sonde : une seconde de positions par lumière, relue en une seule fois côté JS ---
// Calculée par le même orbPath que le rendu : le JS ne pourrait pas le reproduire à l'identique
// (hash en fract(sin) : la moindre différence de précision CPU/GPU change le tirage).
const PROBE_VS = /* glsl */ `${COMMON_VS}
attribute vec4 a_o;
attribute float a_i;      // position normalisée du pixel dans la rangée
attribute float a_offset; // instant de l'échantillon, relatif à u_time
varying vec2 v_p;
void main() {
  v_p = orbPath(a_o, u_time + a_offset) / u_res;
  gl_Position = vec4(a_i * 2.0 - 1.0, 0.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;

const PROBE_FS = /* glsl */ `${PRECISION}
varying vec2 v_p;
/** Une coordonnée (−0,5 → 1,5 de l'écran) sur deux octets : précision bien inférieure au pixel. */
vec2 pack(float v) {
  float s = clamp((v + 0.5) * 0.5, 0.0, 0.99999) * 255.0;
  return vec2(floor(s) / 255.0, fract(s));
}
void main() {
  gl_FragColor = vec4(pack(v_p.x), pack(v_p.y));
}
`;

// --- Étincelles : quelques grains de lumière éjectés vers l'arrière ---
const SPARK_VS = /* glsl */ `${COMMON_VS}
attribute vec4 a_o;
attribute vec4 a_s;       // phase d'émission, durée de vie relative, angle d'éjection, graine
uniform float u_dpr;
varying float v_vis;
varying float v_hue;
void main() {
  float life = 1.6 * mix(0.6, 1.4, a_s.y);
  float age = fract(u_time / life + a_s.x) * life;
  float te = u_time - age;
  float k = age / life;
  vec2 O = orbPath(a_o, te);
  vec2 T = orbDir(a_o, te);
  vec2 v = rot2(-T, (a_s.z - 0.5) * 2.6) * mix(20.0, 70.0, fract(a_s.w * 3.3));
  vec2 p = O + v * age + vec2(snoise(vec3(O * 0.01, te + a_s.w)), snoise(vec3(O * 0.01 + 5.0, te + a_s.w))) * 14.0 * k;
  p.y -= 6.0 * age;
  float tw = 0.6 + 0.4 * sin(u_time * 12.0 + a_s.w * 20.0);
  v_vis = pow(1.0 - k, 1.2) * smoothstep(0.0, 0.05, k) * orbVisible(a_o, te) * orbSpan(a_o, te) * tw;
  v_hue = te * 0.3 + a_s.w;
  gl_PointSize = mix(2.5, 6.0, fract(a_s.w * 9.1)) * u_dpr;
  gl_Position = toClip(p);
}
`;

const SPARK_FS = /* glsl */ `${COMMON_FS}
varying float v_vis;
varying float v_hue;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float d2 = dot(q, q);
  if (d2 > 1.0 || v_vis < 0.003) discard;
  vec3 col = vec3(1.0) * exp(-d2 * 30.0) + rainbow(v_hue) * exp(-d2 * 4.0) * 0.6;
  gl_FragColor = vec4(col * v_vis, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("[Pyreflies] shader :", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function link(gl: WebGLRenderingContext, vs: string, fs: string) {
  const v = compile(gl, gl.VERTEX_SHADER, vs);
  const f = compile(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) {
    if (v) gl.deleteShader(v);
    if (f) gl.deleteShader(f);
    return null;
  }
  const p = gl.createProgram();
  if (!p) {
    gl.deleteShader(v);
    gl.deleteShader(f);
    return null;
  }
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn("[Pyreflies] programme :", gl.getProgramInfoLog(p));
    gl.deleteProgram(p);
    return null;
  }
  return p;
}

export type PyrefliesBackgroundProps = {
  tint?: string;
  tintStrength?: number;
  iridescence?: number;
  exposure?: number;
  glow?: number;
  background?: string;
  overlay?: boolean;
  orbs?: number;
  orbSize?: number;
  crossing?: number;
  envelope?: number;
  envelopeSize?: number;
  envelopeLength?: number;
  flare?: number;
  ripple?: number;
  membranes?: number;
  membraneLength?: number;
  membraneWidth?: number;
  twist?: number;
  wave?: number;
  membraneIntensity?: number;
  mist?: number;
  mistDensity?: number;
  mistLength?: number;
  turbulence?: number;
  bands?: number;
  sparks?: number;
  tempo?: number;
  seed?: number;
  intro?: boolean;
  introDuration?: number;
  maxFps?: number;
  resolution?: number;
  quality?: number;
  /** Plein écran par défaut ; utiliser absolute dans une section positionnée. */
  position?: "fixed" | "absolute";
  /** Opacité des lueurs uniquement : le fond garde sa couleur. */
  opacity?: number;
  /** Affiche une composition figée, sans boucle d'animation. */
  paused?: boolean;
  /** -1 place le fond derrière le contenu dans un parent avec isolation: isolate. */
  zIndex?: number;
  className?: string;
  style?: CSSProperties;
};

export default function PyrefliesBackground({
  tint = "#48ffa5",
  tintStrength = 0.15,
  iridescence = 1,
  exposure = 1,
  glow = 0.85,
  background = "#010302",
  overlay = false,
  orbs = 14,
  orbSize = 22,
  crossing = 28,
  envelope = 0.2,
  envelopeSize = 0.1,
  envelopeLength = 2.6,
  flare = 1.1,
  ripple = 1,
  membranes = 7,
  membraneLength = 4.5,
  membraneWidth = 1,
  twist = 0.3,
  wave = 0.5,
  membraneIntensity = 0.35,
  mist = 0.85,
  mistDensity = 90,
  mistLength = 4.5,
  turbulence = 1,
  bands = 0.5,
  sparks = 12,
  tempo = 0.55,
  seed = 0,
  intro = true,
  introDuration = 2,
  maxFps = 60,
  resolution = 2,
  quality = 1,
  position = "fixed",
  opacity = 0.8,
  paused = false,
  zIndex = -1,
  className,
  style,
}: PyrefliesBackgroundProps) {
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
    function initializeRenderer() {
      const glCtx = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      });
      if (!glCtx) return; // pas de WebGL : le fond CSS reste
      const gl = glCtx;

      // ---------- Réglages normalisés ----------
      const orbCount = Math.round(clamp(orbs, 1, 8));
      const orbR = clamp(orbSize, 10, 100);
      const crossT = clamp(crossing, 6, 60);
      const membraneCount = Math.round(clamp(membranes, 0, 8));
      const mistPerOrb = Math.round(clamp(mistDensity, 0, 400));
      const sparksPerOrb = Math.round(clamp(sparks, 0, 100));
      const tempoK = clamp(tempo, 0.05, 2);
      const introLen = clamp(introDuration, 0.5, 6);
      const fpsCap = clamp(maxFps, 24, 120);
      const maxRatio = clamp(resolution, 0.75, 2);
      const mistQ = clamp(quality, 0.25, 1);
      const tintRGB = parseColor(tint, "#48ffa5");
      const bg = overlay
        ? { r: 0, g: 0, b: 0 }
        : parseColor(background, "#010302"); // en mode écran, le noir est neutre
      const reducedMotion = view.matchMedia("(prefers-reduced-motion: reduce)");

      // Graine 0 : une composition neuve à chaque montage.
      const random = mulberry32(
        seed > 0
          ? Math.round(seed) * 9301 + 49297
          : Math.floor(Math.random() * 4294967296),
      );

      // ---------- Population ----------
      const orbGeo = builder();
      const envelopeGeo = builder();
      const membraneGeo = builder();
      const wakeGeo = builder();
      const mistGeo = builder();
      const sparkData: number[] = [];
      const orbParams: number[][] = []; // graine, durée d'une traversée, phase, rayon
      for (let k = 0; k < orbCount; k++) {
        // Phases réparties : les sphères ne traversent pas toutes en même temps.
        const o = [
          random() * 10,
          crossT * lerp(0.8, 1.25, random()),
          (k + random() * 0.6) / orbCount,
          orbR * lerp(0.75, 1.3, random()),
        ];
        addQuad(orbGeo, o);
        orbParams.push(o);
        addStrip(envelopeGeo, ENVELOPE_SEG, o);
        addStrip(wakeGeo, WAKE_SEG, o);
        // Voiles : répartis autour de la lumière, chacun son écart, sa largeur, sa phase, sa longueur.
        for (let i = 0; i < membraneCount; i++) {
          const side =
            membraneCount === 1 ? 0 : (i / (membraneCount - 1)) * 2 - 1;
          addStrip(membraneGeo, MEMBRANE_SEG, [
            ...o,
            side * lerp(0.6, 1, random()),
            lerp(0.8, 1.4, random()),
            random(),
            lerp(0.7, 1.15, random()),
          ]);
        }
        for (let i = 0; i < mistPerOrb; i++)
          addQuad(mistGeo, [
            ...o,
            (i + random() * 0.5) / mistPerOrb,
            random(),
            random(),
            random() * 10,
          ]);
        for (let i = 0; i < sparksPerOrb; i++)
          sparkData.push(...o, random(), random(), random(), random() * 10);
      }

      // ---------- Maillages ----------
      const meshes: Mesh[] = [];
      function deleteMeshes() {
        for (const m of meshes) {
          gl.deleteBuffer(m.layout.buffer);
          if (m.index) gl.deleteBuffer(m.index);
          gl.deleteProgram(m.prog);
        }
      }
      function createMesh(
        vs: string,
        fs: string,
        data: number[],
        spec: [string, number][],
        indices: number[] | null,
        mode: number,
      ): Mesh | null {
        const stride = spec.reduce((s, [, n]) => s + n, 0);
        const count = indices ? indices.length : data.length / stride;
        if (!count) return null;
        const prog = link(gl, vs, fs);
        if (!prog) return null;
        const buffer = gl.createBuffer();
        if (!buffer) {
          gl.deleteProgram(prog);
          return null;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        let index: WebGLBuffer | null = null;
        if (indices) {
          index = gl.createBuffer();
          if (!index) {
            gl.deleteBuffer(buffer);
            gl.deleteProgram(prog);
            return null;
          }
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
          gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            gl.STATIC_DRAW,
          );
        }
        let offset = 0;
        const attrs = spec.map(([name, size]) => {
          const a = {
            loc: gl.getAttribLocation(prog, name),
            size,
            offset: offset * 4,
          };
          offset += size;
          return a;
        });
        const locs = Object.fromEntries(
          UNIFORMS.map((n) => [n, gl.getUniformLocation(prog, n)]),
        );
        const mesh: Mesh = {
          prog,
          layout: { buffer, stride: stride * 4, attrs },
          index,
          count,
          mode,
          locs,
        };
        meshes.push(mesh);
        return mesh;
      }
      const strip: [string, number][] = [
        ["a_r", 2],
        ["a_o", 4],
      ];
      const mistMesh = createMesh(
        MIST_VS,
        MIST_FS,
        mistGeo.data,
        [
          ["a_corner", 2],
          ["a_o", 4],
          ["a_p", 4],
        ],
        mistGeo.indices,
        gl.TRIANGLES,
      );
      const wakeMesh = createMesh(
        WAKE_VS,
        WAKE_FS,
        wakeGeo.data,
        strip,
        wakeGeo.indices,
        gl.TRIANGLES,
      );
      const composite = createMesh(
        FULLSCREEN_VS,
        COMPOSITE_FS,
        [-1, -1, 3, -1, -1, 3],
        [["a_pos", 2]],
        null,
        gl.TRIANGLES,
      );
      const envelopeMesh = createMesh(
        ENVELOPE_VS,
        ENVELOPE_FS,
        envelopeGeo.data,
        strip,
        envelopeGeo.indices,
        gl.TRIANGLES,
      );
      const membraneMesh = createMesh(
        MEMBRANE_VS,
        MEMBRANE_FS,
        membraneGeo.data,
        [...strip, ["a_m", 4]],
        membraneGeo.indices,
        gl.TRIANGLES,
      );
      const sparkMesh = createMesh(
        SPARK_VS,
        SPARK_FS,
        sparkData,
        [
          ["a_o", 4],
          ["a_s", 4],
        ],
        null,
        gl.POINTS,
      );
      const orbMesh = createMesh(
        ORB_VS,
        ORB_FS,
        orbGeo.data,
        [
          ["a_corner", 2],
          ["a_o", 4],
        ],
        orbGeo.indices,
        gl.TRIANGLES,
      );
      const lightSampleStep = tempoK / LIGHT_FPS;
      const lightProbeDuration = lightSampleStep * (LIGHT_SAMPLES - 1);
      const probeWidth = orbCount * LIGHT_SAMPLES;
      const probeMesh = createMesh(
        PROBE_VS,
        PROBE_FS,
        orbParams.flatMap((o, i) =>
          Array.from({ length: LIGHT_SAMPLES }, (_, sample) => [
            ...o,
            (i * LIGHT_SAMPLES + sample + 0.5) / probeWidth,
            sample * lightSampleStep,
          ]).flat(),
        ),
        [
          ["a_o", 4],
          ["a_i", 1],
          ["a_offset", 1],
        ],
        null,
        gl.POINTS,
      );
      if (!composite || !orbMesh) {
        deleteMeshes();
        return;
      }

      // Texture de bruit : la matière des membranes et des volutes, générée une fois (unité 1).
      const noiseTex = gl.createTexture();
      if (!noiseTex) {
        deleteMeshes();
        return;
      }
      const noiseData = new Uint8Array(NOISE_SIZE * NOISE_SIZE * 4);
      for (let i = 0; i < noiseData.length; i++)
        noiseData[i] = Math.floor(random() * 256);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, noiseTex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        NOISE_SIZE,
        NOISE_SIZE,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        noiseData,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

      // Tampon de la brume, à résolution réduite (unité 0) : elle est douce par nature, l'agrandir est gratuit.
      const mistTex = gl.createTexture();
      const mistFbo = gl.createFramebuffer();
      if (!mistTex || !mistFbo) {
        deleteMeshes();
        gl.deleteTexture(noiseTex);
        gl.deleteTexture(mistTex);
        gl.deleteFramebuffer(mistFbo);
        return;
      }
      let mistW = 1;
      let mistH = 1;

      // Sonde : positions présentes et futures, calculées avec le même shader que le fond.
      const probeTex = gl.createTexture();
      const probeFbo = gl.createFramebuffer();
      const probePixels = new Uint8Array(probeWidth * 4);
      let probeReady = false;
      if (probeMesh && probeTex && probeFbo) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, probeTex);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          probeWidth,
          1,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, probeFbo);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          probeTex,
          0,
        );
        probeReady =
          gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE0);
      }

      // ---------- Uniformes fixes ----------
      for (const m of meshes) {
        gl.useProgram(m.prog);
        const L = m.locs;
        gl.uniform1i(L.u_noise, 1);
        gl.uniform1i(L.u_trail, 0);
        gl.uniform1f(L.u_life, clamp(mistLength, 1, 8));
        gl.uniform1f(L.u_turb, clamp(turbulence, 0, 3));
        gl.uniform1f(L.u_hue, clamp(bands, 0, 2));
        gl.uniform1f(L.u_elen, clamp(envelopeLength, 0.5, 6));
        gl.uniform1f(L.u_esize, clamp(envelopeSize, 1.1, 3));
        gl.uniform1f(L.u_eflare, clamp(flare, 0, 2));
        gl.uniform1f(L.u_eripple, clamp(ripple, 0, 2.5));
        gl.uniform1f(L.u_mlen, clamp(membraneLength, 1, 10));
        gl.uniform1f(L.u_mwidth, clamp(membraneWidth, 0.2, 3));
        gl.uniform1f(L.u_twist, clamp(twist, 0, 2));
        gl.uniform1f(L.u_wave, clamp(wave, 0, 2.5));
        gl.uniform3f(L.u_tint, tintRGB.r, tintRGB.g, tintRGB.b);
        gl.uniform1f(L.u_tintK, clamp(tintStrength, 0, 1));
        gl.uniform1f(L.u_irid, clamp(iridescence, 0, 1));
        gl.uniform1f(L.u_glow, clamp(glow, 0, 2.5));
        gl.uniform1f(L.u_eK, clamp(envelope, 0, 2.5));
        gl.uniform1f(L.u_mK, clamp(membraneIntensity, 0, 2));
        gl.uniform1f(L.u_mistK, clamp(mist, 0, 2));
        gl.uniform1f(L.u_bloom, clamp(glow, 0, 2.5));
        gl.uniform1f(L.u_exposure, clamp(exposure, 0.3, 3));
        gl.uniform3f(L.u_bg, bg.r, bg.g, bg.b);
        // Entrée, exprimée sur l'horloge de l'animation (qui démarre à 0).
        gl.uniform2f(
          L.u_intro,
          intro ? 0 : -1e6,
          intro ? introLen * tempoK : 1e-3,
        );
      }
      gl.disable(gl.DEPTH_TEST);

      // ---------- État ----------
      let w = 1;
      let h = 1;
      let frame = 0;
      let previousTime = 0;
      let clock = paused || reducedMotion.matches ? 37 : 0;
      let probeStart = -Infinity;
      let lastLightTime = -Infinity;
      let visible = true;
      let suspended = false;
      // Sous le loader, l'horloge reste à 0 : l'entrée en fondu se joue quand il se lève, pas derrière lui.
      let waiting = true;
      const textureLimit = Math.min(
        gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
        gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number,
      );

      function resize() {
        probeStart = -Infinity;
        lastLightTime = -Infinity;
        const box = root!.getBoundingClientRect();
        w = Math.max(1, box.width);
        h = Math.max(1, box.height);
        const ratio = Math.min(
          view.devicePixelRatio || 1,
          maxRatio,
          textureLimit / w,
          textureLimit / h,
        );
        canvas!.width = Math.max(1, Math.round(w * ratio));
        canvas!.height = Math.max(1, Math.round(h * ratio));
        mistW = Math.max(1, Math.round(canvas!.width * mistQ));
        mistH = Math.max(1, Math.round(canvas!.height * mistQ));
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, mistTex);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          mistW,
          mistH,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, mistFbo);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          mistTex,
          0,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        for (const m of meshes) {
          gl.useProgram(m.prog);
          gl.uniform1f(m.locs.u_dpr, ratio);
        }
      }

      function draw(m: Mesh, t: number) {
        gl.useProgram(m.prog);
        const L = m.locs;
        gl.uniform2f(L.u_res, w, h);
        gl.uniform1f(L.u_time, t);
        gl.uniform1f(L.u_t, t);
        gl.uniform2f(L.u_texel, 1 / mistW, 1 / mistH);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.layout.buffer);
        for (const a of m.layout.attrs) {
          if (a.loc < 0) continue;
          gl.enableVertexAttribArray(a.loc);
          gl.vertexAttribPointer(
            a.loc,
            a.size,
            gl.FLOAT,
            false,
            m.layout.stride,
            a.offset,
          );
        }
        if (m.index) {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.index);
          gl.drawElements(m.mode, m.count, gl.UNSIGNED_SHORT, 0);
        } else {
          gl.drawArrays(m.mode, 0, m.count);
        }
        for (const a of m.layout.attrs)
          if (a.loc >= 0) gl.disableVertexAttribArray(a.loc);
      }

      /**
       * Une lecture GPU par seconde, seulement si quelqu'un écoute.
       * Les positions intermédiaires sont interpolées ; le masque du footer suit à 20 Hz.
       */
      function probeLights(t: number) {
        if (!probeReady || !probeMesh || !hasLightListeners()) {
          lastLightTime = -Infinity;
          return;
        }
        if (t - lastLightTime < lightSampleStep) return;
        lastLightTime = t;

        if (t < probeStart || t >= probeStart + lightProbeDuration) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, probeFbo);
          gl.viewport(0, 0, probeWidth, 1);
          gl.disable(gl.BLEND);
          draw(probeMesh, t);
          gl.readPixels(
            0,
            0,
            probeWidth,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            probePixels,
          );
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          probeStart = t;
        }

        const box = root!.getBoundingClientRect();
        const sample = (t - probeStart) / lightSampleStep;
        const sampleIndex = Math.min(Math.floor(sample), LIGHT_SAMPLES - 2);
        const fraction = sample - sampleIndex;
        const unpack = (hi: number, lo: number) =>
          ((hi + lo / 255) / 255) * 2 - 0.5;
        const smooth = (e0: number, e1: number, x: number) => {
          const k = clamp((x - e0) / (e1 - e0), 0, 1);
          return k * k * (3 - 2 * k);
        };
        // Intensité : même fondu que orbSpan (bords de traversée) et que l'entrée du fond.
        const entry = intro ? clamp(t / (introLen * tempoK), 0, 1) : 1;
        const lights: PyrefliesLight[] = orbParams.map(
          ([, period, phase, radius], i) => {
            const offset = (i * LIGHT_SAMPLES + sampleIndex) * 4;
            const coordinate = (axis: number) =>
              lerp(
                unpack(probePixels[offset + axis], probePixels[offset + axis + 1]),
                unpack(probePixels[offset + axis + 4], probePixels[offset + axis + 5]),
                fraction,
              );
            const s = (((t / period + phase) % 1) + 1) % 1;
            const span = smooth(0, 0.025, s) * (1 - smooth(0.975, 1, s));
            return {
              x: box.left + coordinate(0) * w,
              y: box.top + coordinate(2) * h,
              radius,
              intensity: span * entry,
            };
          },
        );
        publishLights(lights);
      }

      function render(t: number) {
        probeLights(t);
        // 1. La brume et son sillage, dans le tampon réduit, en lumière additive.
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, null); // le tampon ne doit pas être lu pendant qu'on y écrit
        gl.bindFramebuffer(gl.FRAMEBUFFER, mistFbo);
        gl.viewport(0, 0, mistW, mistH);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        if (wakeMesh) draw(wakeMesh, t);
        if (mistMesh) draw(mistMesh, t);
        // 2. Composition à pleine résolution : fond, brume agrandie, halo.
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas!.width, canvas!.height);
        gl.disable(gl.BLEND);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, mistTex);
        draw(composite!, t);
        // 3. Enveloppe, voiles, étincelles, puis la lumière, nets, en lumière additive.
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        if (envelopeMesh) draw(envelopeMesh, t);
        if (membraneMesh) draw(membraneMesh, t);
        if (sparkMesh) draw(sparkMesh, t);
        draw(orbMesh!, t);
      }

      // ---------- Boucle d'animation ----------
      const minGap = 1000 / fpsCap - 0.5;
      function tick(time: number) {
        frame = 0;
        if (!visible || doc.hidden || suspended || paused || reducedMotion.matches) {
          previousTime = 0;
          return;
        }
        if (previousTime && time - previousTime < minGap) {
          frame = view.requestAnimationFrame(tick);
          return;
        }
        const dt = previousTime
          ? Math.min(0.1, (time - previousTime) / 1000)
          : 1 / fpsCap;
        previousTime = time;
        clock += dt * tempoK;
        render(clock);
        frame = view.requestAnimationFrame(tick);
      }
      function kick() {
        if (waiting || !visible || doc.hidden || suspended) return;
        if (paused || reducedMotion.matches) {
          render(clock);
        } else if (!frame) {
          frame = view.requestAnimationFrame(tick);
        }
      }
      function stop() {
        view.cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
      }

      // ---------- Événements ----------
      function onVisibility() {
        if (doc.hidden) stop();
        else kick();
      }
      function onMotionChange() {
        stop();
        kick();
      }
      function onResize() {
        resize();
        if (suspended) render(clock);
        else kick();
      }

      resize();
      const resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(root);
      view.addEventListener("resize", onResize);
      // Hors écran, le GPU se repose.
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) kick();
          else stop();
        },
        { rootMargin: "100px" },
      );
      io.observe(root);
      doc.addEventListener("visibilitychange", onVisibility);
      reducedMotion.addEventListener("change", onMotionChange);
      const stopObservingPause = subscribeToBackgroundPause((isPaused) => {
        suspended = isPaused;
        if (suspended) stop();
        else kick();
      });
      const stopWaiting = onPreloaderDone(() => {
        waiting = false;
        kick();
      });

      return () => {
        stopObservingPause();
        stopWaiting();
        stop();
        resizeObserver.disconnect();
        io.disconnect();
        view.removeEventListener("resize", onResize);
        doc.removeEventListener("visibilitychange", onVisibility);
        reducedMotion.removeEventListener("change", onMotionChange);
        deleteMeshes();
        gl.deleteTexture(noiseTex);
        gl.deleteTexture(mistTex);
        gl.deleteFramebuffer(mistFbo);
        gl.deleteTexture(probeTex);
        gl.deleteFramebuffer(probeFbo);
        publishLights([]); // plus de fond : plus de lumières
      };
    }

    // Une restauration WebGL invalide les anciens programmes, textures et tampons.
    let disposeRenderer = initializeRenderer();
    function onLost(event: Event) {
      event.preventDefault();
      disposeRenderer?.();
      disposeRenderer = undefined;
    }
    function onRestored() {
      disposeRenderer = initializeRenderer();
    }
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      disposeRenderer?.();
    };
  }, [
    tint,
    tintStrength,
    iridescence,
    exposure,
    glow,
    background,
    overlay,
    orbs,
    orbSize,
    crossing,
    envelope,
    envelopeSize,
    envelopeLength,
    flare,
    ripple,
    membranes,
    membraneLength,
    membraneWidth,
    twist,
    wave,
    membraneIntensity,
    mist,
    mistDensity,
    mistLength,
    turbulence,
    bands,
    sparks,
    tempo,
    seed,
    intro,
    introDuration,
    maxFps,
    resolution,
    quality,
    paused,
  ]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={className}
      data-pyreflies-background=""
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
          opacity: clamp(opacity, 0, 1),
        }}
      />
    </div>
  );
}
