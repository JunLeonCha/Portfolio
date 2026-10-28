"use client";

import { useEffect } from "react";

/**
 * Curseur — Courant de vie : une particule lumineuse remplace le pointeur, suivie d'un courant de
 * filaments tressés. Sa forme et sa nuance suivent la valeur CSS `cursor` de l'élément survolé
 * (lien, saisie, attente, interdit…) ; `data-cursor="…"` force un état. Souris uniquement :
 * au tactile, rien n'est dessiné et le pointeur natif reste.
 */

type RGB = { r: number; g: number; b: number; a: number };
/** Point de la colonne vertébrale de la traînée : âge, angle d'orbite à l'émission, vitesse. */
type Sample = { x: number; y: number; age: number; a: number; v: number };
type HistoryPoint = { x: number; y: number; t: number; a: number; v: number };
type Spine = {
  pts: Sample[];
  cum: number[];
  total: number;
  hx: number;
  hy: number;
  tx: Float32Array;
  ty: Float32Array;
  nx: Float32Array;
  ny: Float32Array;
};
type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  duration: number;
  size: number;
  tint: 0 | 1;
  seed: number;
  cat: Cat; // catégorie de curseur au moment où la spore est née : elle garde sa nuance
};
type Ripple = { x: number; y: number; life: number };

const TAU = Math.PI * 2;
const TILT = 0.42; // inclinaison de l'hélice : fait apparaître des boucles, pas une simple sinusoïde
const BLOOM = 0.25; // le halo est peint à 1/4 de résolution puis agrandi : flou doux et peu coûteux
const CHUNK = 4;
const RIPPLE_DURATION = 0.6;
const MAX_MOTES = 90;
const WHITE: RGB = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: RGB = { r: 0, g: 0, b: 0, a: 1 };
const INTERACTIVE =
  'a[href],button,summary,label,select,[role="button"],[role="link"],[role="tab"],[data-cursor="hover"]';
const TEXT_FIELD =
  'textarea,[contenteditable="true"],input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="color"]):not([type="file"])';

// ---------- États de curseur ----------
/** Chaque mot-clé CSS `cursor` standard tombe dans l'un de ces états. */
type Kind =
  | "default"
  | "pointer"
  | "text"
  | "vtext"
  | "notAllowed"
  | "wait"
  | "progress"
  | "help"
  | "crosshair"
  | "cell"
  | "move"
  | "grab"
  | "grabbing"
  | "ew"
  | "ns"
  | "nesw"
  | "nwse"
  | "col"
  | "row"
  | "zoomIn"
  | "zoomOut"
  | "copy"
  | "alias"
  | "context"
  | "none";

/**
 * Comportement de la particule par état :
 * orb = taille de la particule · ring = rayon d'orbite des étincelles (et départ des filaments)
 * sat = visibilité des étincelles · spin = multiplicateur de rotation · extra = rotation ajoutée (rad/s)
 * tilt = inclinaison de l'orbite (1 = cercle vu de face) · trail = visibilité des filaments
 */
type KindStyle = {
  orb: number;
  ring: number;
  sat: number;
  spin: number;
  extra: number;
  tilt: number;
  trail: number;
};
const kindStyle = (
  orb: number,
  ring: number,
  sat: number,
  spin = 1,
  extra = 0,
  tilt = TILT,
  trail = 1,
): KindStyle => ({ orb, ring, sat, spin, extra, tilt, trail });
// La forme prend le relais : la particule se réduit à un point chaud, les étincelles s'effacent.
const SHAPE = kindStyle(0.4, 0.6, 0);
// Un petit badge accompagne la particule, qui reste entière.
const BADGE = kindStyle(1, 1, 1);
const KIND_STYLE: Record<Kind, KindStyle> = {
  default: kindStyle(1, 1, 1),
  pointer: kindStyle(1.45, 1.45, 1, 2),
  text: kindStyle(0.35, 0.5, 0),
  vtext: kindStyle(0.35, 0.5, 0),
  notAllowed: kindStyle(0.5, 1.15, 0.3, 0.3),
  wait: kindStyle(0.65, 1.75, 1, 1, 9, 1), // les étincelles deviennent un anneau de chargement
  progress: kindStyle(1, 1, 1, 1.6),
  help: BADGE,
  copy: BADGE,
  alias: BADGE,
  context: BADGE,
  crosshair: kindStyle(0.3, 0.6, 0),
  cell: kindStyle(0.3, 0.6, 0),
  move: SHAPE,
  ew: SHAPE,
  ns: SHAPE,
  nesw: SHAPE,
  nwse: SHAPE,
  col: SHAPE,
  row: SHAPE,
  zoomIn: kindStyle(0.3, 0.6, 0),
  zoomOut: kindStyle(0.3, 0.6, 0),
  grab: kindStyle(1.05, 1.75, 1, 0.5, 0, 1), // main ouverte : les étincelles s'écartent et ralentissent
  grabbing: kindStyle(0.8, 0.7, 1, 2.6, 0, 1), // main fermée : elles se resserrent et s'emballent
  none: kindStyle(0, 0.6, 0, 1, 0, TILT, 0), // le site masque le curseur : tout s'efface
};
const KINDS = Object.keys(KIND_STYLE) as Kind[];

/** Catégories de couleur : une nuance par famille d'états, pas une par curseur. */
type Cat = 0 | 1 | 2 | 3 | 4;
const CAT_NAV: Cat = 0; // défaut, lien, aide, menu → couleur principale
const CAT_INPUT: Cat = 1; // texte, viseur, cellule
const CAT_DRAG: Cat = 2; // déplacer, prendre, redimensionner, zoom, copier, raccourci
const CAT_WAIT: Cat = 3; // attente, chargement
const CAT_BLOCKED: Cat = 4; // interdit
const CATS: Cat[] = [CAT_NAV, CAT_INPUT, CAT_DRAG, CAT_WAIT, CAT_BLOCKED];
const KIND_CAT: Record<Kind, Cat> = {
  default: CAT_NAV,
  pointer: CAT_NAV,
  help: CAT_NAV,
  context: CAT_NAV,
  none: CAT_NAV,
  text: CAT_INPUT,
  vtext: CAT_INPUT,
  crosshair: CAT_INPUT,
  cell: CAT_INPUT,
  move: CAT_DRAG,
  grab: CAT_DRAG,
  grabbing: CAT_DRAG,
  ew: CAT_DRAG,
  ns: CAT_DRAG,
  nesw: CAT_DRAG,
  nwse: CAT_DRAG,
  col: CAT_DRAG,
  row: CAT_DRAG,
  zoomIn: CAT_DRAG,
  zoomOut: CAT_DRAG,
  copy: CAT_DRAG,
  alias: CAT_DRAG,
  wait: CAT_WAIT,
  progress: CAT_WAIT,
  notAllowed: CAT_BLOCKED,
};

/** Mot-clé CSS `cursor` → état. Variantes -webkit- et directions simples regroupées. */
const CURSOR_MAP = new Map<string, Kind>([
  ["default", "default"],
  ["pointer", "pointer"],
  ["hand", "pointer"],
  ["text", "text"],
  ["vertical-text", "vtext"],
  ["not-allowed", "notAllowed"],
  ["no-drop", "notAllowed"],
  ["wait", "wait"],
  ["progress", "progress"],
  ["help", "help"],
  ["crosshair", "crosshair"],
  ["cell", "cell"],
  ["move", "move"],
  ["all-scroll", "move"],
  ["grab", "grab"],
  ["-webkit-grab", "grab"],
  ["grabbing", "grabbing"],
  ["-webkit-grabbing", "grabbing"],
  ["ew-resize", "ew"],
  ["e-resize", "ew"],
  ["w-resize", "ew"],
  ["col-resize", "col"],
  ["ns-resize", "ns"],
  ["n-resize", "ns"],
  ["s-resize", "ns"],
  ["row-resize", "row"],
  ["nesw-resize", "nesw"],
  ["ne-resize", "nesw"],
  ["sw-resize", "nesw"],
  ["nwse-resize", "nwse"],
  ["nw-resize", "nwse"],
  ["se-resize", "nwse"],
  ["zoom-in", "zoomIn"],
  ["-webkit-zoom-in", "zoomIn"],
  ["zoom-out", "zoomOut"],
  ["-webkit-zoom-out", "zoomOut"],
  ["copy", "copy"],
  ["alias", "alias"],
  ["context-menu", "context"],
  ["none", "none"],
]);

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const rgba = (c: RGB, a: number) =>
  `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${clamp(a * c.a, 0, 1)})`;
const mix = (a: RGB, b: RGB, t: number): RGB => ({
  r: lerp(a.r, b.r, t),
  g: lerp(a.g, b.g, t),
  b: lerp(a.b, b.b, t),
  a: lerp(a.a, b.a, t),
});
const lerpSample = (a: Sample, b: Sample, t: number): Sample => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  age: lerp(a.age, b.age, t),
  a: lerp(a.a, b.a, t),
  v: lerp(a.v, b.v, t),
});

function toHsl(c: RGB) {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hue = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    hue =
      max === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    hue /= 6;
  }
  return { h: hue, s, l };
}

function fromHsl(hue: number, s: number, l: number, a: number): RGB {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255, a };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const ch = (t: number) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: ch(hue + 1 / 3) * 255,
    g: ch(hue) * 255,
    b: ch(hue - 1 / 3) * 255,
    a,
  };
}

/** Mélange par la roue des teintes : vert → rouge passe par l'orange, pas par un gris boueux. */
function mixHue(a: RGB, b: RGB, t: number): RGB {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const A = toHsl(a);
  const Z = toHsl(b);
  let dh = Z.h - A.h;
  if (dh > 0.5) dh -= 1;
  if (dh < -0.5) dh += 1;
  return fromHsl(
    A.h + dh * t,
    lerp(A.s, Z.s, t),
    lerp(A.l, Z.l, t),
    lerp(a.a, b.a, t),
  );
}

/** Laisse le navigateur normaliser n'importe quelle couleur CSS puis la relit. */
function parseColor(
  ctx: CanvasRenderingContext2D,
  value: string,
  fallback: string,
): RGB {
  ctx.fillStyle = fallback;
  ctx.fillStyle = value;
  const s = String(ctx.fillStyle);
  if (s[0] === "#") {
    const n = parseInt(s.slice(1, 7), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  const m = s.match(/[\d.]+/g);
  if (m && m.length >= 3)
    return { r: +m[0], g: +m[1], b: +m[2], a: m[3] !== undefined ? +m[3] : 1 };
  return { r: 72, g: 255, b: 165, a: 1 };
}

/** Subdivision Catmull-Rom : la trajectoire brute devient une courbe soyeuse. */
function smoothPath(src: Sample[]): Sample[] {
  if (src.length < 2) return src.slice();
  const out: Sample[] = [];
  const last = src.length - 1;
  for (let i = 0; i < last; i++) {
    const p0 = src[Math.max(0, i - 1)];
    const p1 = src[i];
    const p2 = src[i + 1];
    const p3 = src[Math.min(last, i + 2)];
    const steps = clamp(
      Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 3.5),
      1,
      12,
    );
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const q = lerpSample(p1, p2, t);
      q.x =
        0.5 *
        (2 * p1.x +
          (p2.x - p0.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (3 * p1.x - p0.x - 3 * p2.x + p3.x) * t3);
      q.y =
        0.5 *
        (2 * p1.y +
          (p2.y - p0.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (3 * p1.y - p0.y - 3 * p2.y + p3.y) * t3);
      out.push(q);
    }
  }
  out.push(src[last]);
  return out;
}

/** Coupe la courbe à une longueur exacte pour que la queue ne saute jamais. */
function limitLength(pts: Sample[], maxLength: number): Sample[] {
  if (pts.length < 2) return pts;
  const out: Sample[] = [pts[0]];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (total + seg >= maxLength) {
      out.push(
        lerpSample(pts[i - 1], pts[i], seg > 0 ? (maxLength - total) / seg : 0),
      );
      break;
    }
    total += seg;
    out.push(pts[i]);
  }
  return out;
}

export type LifestreamCursorProps = {
  color?: string;
  secondaryColor?: string;
  opacity?: number;
  length?: number;
  duration?: number;
  ribbons?: number;
  width?: number;
  twist?: number;
  flow?: number;
  glow?: number;
  smoothing?: number;
  cursorSize?: number;
  showCursor?: boolean;
  hideNativeCursor?: boolean;
  sparkles?: boolean;
  additive?: boolean;
  stateColors?: boolean;
  tintStrength?: number;
  inputColor?: string;
  dragColor?: string;
  waitColor?: string;
  blockedColor?: string;
};

export default function LifestreamCursor({
  color = "#48ffa5",
  secondaryColor = "#00bfa5",
  opacity = 0.9,
  length = 320,
  duration = 1.5,
  ribbons = 2,
  width = 8,
  twist = 0.4,
  flow = 1,
  glow = 1.2,
  smoothing = 0.3,
  cursorSize = 10,
  showCursor = true,
  hideNativeCursor = true,
  sparkles = true,
  additive = true,
  stateColors = true,
  tintStrength = 1,
  inputColor = "#5ce1ff",
  dragColor = "#c6ff6b",
  waitColor = "#ffd36b",
  blockedColor = "#ff6b81",
}: LifestreamCursorProps) {
  useEffect(() => {
    const doc = document;
    const view = window;
    const canvas = doc.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const c = ctx;

    // ---------- Réglages normalisés ----------
    const alpha = clamp(opacity, 0, 1);
    const maxLength = clamp(length, 40, 600);
    const life = clamp(duration, 0.2, 2);
    const strandCount = Math.round(clamp(ribbons, 1, 5));
    const spread = clamp(width, 4, 60);
    const twistK = (clamp(twist, 0, 2) * TAU) / 100;
    const flowK = clamp(flow, 0, 3);
    const spin = flowK * 3.2; // vitesse d'orbite des étincelles (rad/s)
    const swirl = flowK * 1.4; // les filaments continuent de tourner après leur émission
    const light = clamp(glow, 0, 3);
    const inertia = clamp(smoothing, 0, 0.9);
    const size = clamp(cursorSize, 4, 24);
    const primary = parseColor(c, color, "#48ffa5");
    const secondary = parseColor(c, secondaryColor, "#00bfa5");
    const core = mix(primary, WHITE, 0.7);
    const blend: GlobalCompositeOperation = additive
      ? "lighter"
      : "source-over";
    const finePointer = view.matchMedia("(any-pointer: fine)");
    const reducedMotion = view.matchMedia("(prefers-reduced-motion: reduce)");
    const strandBase = Array.from(
      { length: strandCount },
      (_, k) => (k * TAU) / strandCount + 0.35 * Math.sin(k * 2.1),
    );

    // Nuances par catégorie : la couleur principale glisse vers la nuance choisie, sur la roue des teintes.
    const tintK = stateColors ? clamp(tintStrength, 0, 1) : 0;
    const catInput = [
      primary,
      parseColor(c, inputColor, "#5ce1ff"),
      parseColor(c, dragColor, "#c6ff6b"),
      parseColor(c, waitColor, "#ffd36b"),
      parseColor(c, blockedColor, "#ff6b81"),
    ];
    const catPrimary = catInput.map((col, i) =>
      i === CAT_NAV ? primary : mixHue(primary, col, tintK),
    );

    const bloomCanvas = doc.createElement("canvas");
    const B = light > 0 ? bloomCanvas.getContext("2d") : null;

    // Sprites pré-rendus : un drawImage par particule au lieu d'un gradient.
    const makeSprite = (tint: RGB) => {
      const sprite = doc.createElement("canvas");
      sprite.width = sprite.height = 64;
      const s = sprite.getContext("2d");
      if (s) {
        const g = s.createRadialGradient(32, 32, 0, 32, 32, 32);
        g.addColorStop(0, rgba(WHITE, 1));
        g.addColorStop(0.12, rgba(mix(tint, WHITE, 0.7), 1));
        g.addColorStop(0.3, rgba(tint, 0.6));
        g.addColorStop(0.62, rgba(tint, 0.12));
        g.addColorStop(1, rgba(tint, 0));
        s.fillStyle = g;
        s.fillRect(0, 0, 64, 64);
      }
      return sprite;
    };
    const catSprites = catPrimary.map(makeSprite);
    const secondarySprite = makeSprite(secondary);

    // ---------- État ----------
    let w = 0;
    let h = 0;
    let ratio = 1;
    let frame = 0;
    let previousTime = 0;
    let lastMove = -1e9;
    let active = false;
    let seeded = false;
    let travel = 0;
    let shed = 0;
    let speed = 0;
    let spinAngle = 0;
    let spinBoost = 1;
    let history: HistoryPoint[] = []; // plus récent en premier
    let motes: Mote[] = [];
    let ripples: Ripple[] = [];
    let pressed = false;
    let appear = 0;
    let orbScale = 1;
    // État de curseur courant, et paramètres qui y tendent en douceur.
    let kind: Kind = "default";
    let probeTarget: Element | null = null;
    let probeDirty = false;
    let lastProbe = 0;
    const weights = Object.fromEntries(
      KINDS.map((k) => [k, k === "default" ? 1 : 0]),
    ) as Record<Kind, number>;
    const catWeights = CATS.map((k) => (k === CAT_NAV ? 1 : 0));
    let tint: RGB = primary; // couleur courante du curseur (fondu entre catégories)
    let tintCore: RGB = core;
    let glyphCore: RGB = core;
    let ringMul = 1;
    let satVis = 1;
    let orbitTilt = TILT;
    let extraSpin = 0;
    let trailVis = 1;
    let shake = 0; // « non » de la tête quand on clique sur un élément interdit
    const pointer = { x: -100, y: -100 };
    const center = { x: -100, y: -100 }; // position dessinée : pointeur + secousse éventuelle
    const head = { x: 0, y: 0 };
    const dir = { x: 1, y: 0 };

    function refreshTint() {
      let sum = 0;
      let r = 0;
      let g = 0;
      let b = 0;
      for (const k of CATS) {
        const wk = catWeights[k];
        sum += wk;
        r += catPrimary[k].r * wk;
        g += catPrimary[k].g * wk;
        b += catPrimary[k].b * wk;
      }
      sum = sum || 1;
      tint = { r: r / sum, g: g / sum, b: b / sum, a: 1 };
      tintCore = mix(tint, WHITE, 0.7);
      // Sur fond clair (mode non additif), un cœur pâle disparaîtrait : on l'assombrit.
      glyphCore = additive ? tintCore : mix(tint, BLACK, 0.35);
    }

    // Calque plein écran ajouté directement au body : au-dessus de tout, sans capter aucun événement.
    canvas.setAttribute("aria-hidden", "true");
    canvas.setAttribute("data-lifestream-cursor", "");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "2147483646",
    });
    doc.body.appendChild(canvas);

    // Une classe par instance pour restaurer exactement le pointeur natif au nettoyage.
    const cursorClass =
      "lifestream-cursor-" + Math.random().toString(36).slice(2);
    const cursorStyle = doc.createElement("style");
    const cursorScope = "html." + cursorClass;
    // Le fond natif du dialogue doit aussi masquer le pointeur système.
    cursorStyle.textContent = `
      ${cursorScope},
      ${cursorScope} *,
      ${cursorScope} dialog:modal,
      ${cursorScope} dialog:modal *,
      ${cursorScope} dialog:modal::backdrop {
        cursor: none !important;
      }
    `;
    if (hideNativeCursor) doc.head.appendChild(cursorStyle);

    // ---------- Zone repeinte : on n'efface et ne compose que ce qui a bougé ----------
    const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    let prevBox: { x0: number; y0: number; x1: number; y1: number } | null =
      null;

    function include(x: number, y: number, m: number) {
      if (x - m < box.x0) box.x0 = x - m;
      if (y - m < box.y0) box.y0 = y - m;
      if (x + m > box.x1) box.x1 = x + m;
      if (y + m > box.y1) box.y1 = y + m;
    }

    function beginFrame() {
      if (prevBox) {
        const bw = prevBox.x1 - prevBox.x0;
        const bh = prevBox.y1 - prevBox.y0;
        c.clearRect(prevBox.x0, prevBox.y0, bw, bh);
        if (B) B.clearRect(prevBox.x0, prevBox.y0, bw, bh);
      }
      box.x0 = box.y0 = Infinity;
      box.x1 = box.y1 = -Infinity;
      c.globalCompositeOperation = blend;
      c.globalAlpha = 1;
      c.lineCap = "butt";
      c.lineJoin = "round";
      if (B) {
        B.globalCompositeOperation = "lighter";
        B.globalAlpha = 1;
        B.lineCap = "butt";
        B.lineJoin = "round";
      }
    }

    function endFrame() {
      if (box.x1 < box.x0) {
        prevBox = null;
        return;
      }
      // Aligné sur la grille du halo (4 px) pour des effacements nets.
      const x0 = Math.max(0, Math.floor(box.x0 / 4) * 4);
      const y0 = Math.max(0, Math.floor(box.y0 / 4) * 4);
      const x1 = Math.min(Math.ceil(w / 4) * 4, Math.ceil(box.x1 / 4) * 4);
      const y1 = Math.min(Math.ceil(h / 4) * 4, Math.ceil(box.y1 / 4) * 4);
      if (x1 <= x0 || y1 <= y0) {
        prevBox = null;
        return;
      }
      if (B) {
        c.save();
        // En mode non additif, le halo passe derrière les filaments.
        c.globalCompositeOperation = additive ? "lighter" : "destination-over";
        c.globalAlpha = Math.min(1, 0.35 + light * 0.3);
        c.drawImage(
          bloomCanvas,
          x0 * BLOOM,
          y0 * BLOOM,
          (x1 - x0) * BLOOM,
          (y1 - y0) * BLOOM,
          x0,
          y0,
          x1 - x0,
          y1 - y0,
        );
        c.restore();
      }
      prevBox = { x0, y0, x1, y1 };
    }

    // ---------- Géométrie ----------
    const headRadius = () => size * 0.75 * ringMul;
    // L'orbite peut se redresser (anneau de chargement, prise) ; les filaments la rejoignent près de la tête.
    const tiltAt = (s: number) => lerp(orbitTilt, TILT, smoothstep(0, 24, s));
    const wobble = (k: number, s: number, ts: number) =>
      1 + 0.22 * Math.sin(ts * 0.9 + k * 1.7 + s * 0.018);
    const phaseNoise = (k: number, s: number, ts: number) =>
      0.45 * Math.sin(s * 0.011 + ts * 0.7 + k * 2.3);

    function buildSpine(raw: Sample[], cap: number): Spine | null {
      const clean: Sample[] = [raw[0]];
      for (let i = 1; i < raw.length; i++) {
        const p = clean[clean.length - 1];
        if (Math.hypot(raw[i].x - p.x, raw[i].y - p.y) > 0.5)
          clean.push(raw[i]);
      }
      const pts = limitLength(smoothPath(clean), cap);
      const n = pts.length;
      if (n < 2) return null;
      const cum = [0];
      for (let i = 1; i < n; i++)
        cum.push(
          cum[i - 1] +
            Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y),
        );
      const total = cum[n - 1];
      if (total < 2) return null;
      let j = 1;
      while (j < n - 1 && cum[j] < 20) j++;
      const dx = pts[0].x - pts[j].x;
      const dy = pts[0].y - pts[j].y;
      const dl = Math.hypot(dx, dy);
      return {
        pts,
        cum,
        total,
        hx: dl > 0.5 ? dx / dl : dir.x,
        hy: dl > 0.5 ? dy / dl : dir.y,
        tx: new Float32Array(0),
        ty: new Float32Array(0),
        nx: new Float32Array(0),
        ny: new Float32Array(0),
      };
    }

    /** Repères locaux de la colonne ; près de la tête ils rejoignent l'orbite des étincelles. */
    function orient(sp: Spine) {
      const { pts, cum } = sp;
      const n = pts.length;
      sp.tx = new Float32Array(n);
      sp.ty = new Float32Array(n);
      sp.nx = new Float32Array(n);
      sp.ny = new Float32Array(n);
      let lx = dir.x;
      let ly = dir.y;
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)];
        const b = pts[Math.min(n - 1, i + 1)];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.001) {
          lx = dx / d;
          ly = dy / d;
        }
        const k = smoothstep(0, 24, cum[i]);
        let fx = lerp(dir.x, lx, k);
        let fy = lerp(dir.y, ly, k);
        const fl = Math.hypot(fx, fy) || 1;
        fx /= fl;
        fy /= fl;
        sp.tx[i] = fx;
        sp.ty[i] = fy;
        sp.nx[i] = -fy;
        sp.ny[i] = fx;
      }
    }

    // ---------- Dessin ----------
    function drawStrands(sp: Spine, ts: number) {
      const A = alpha * trailVis; // le site peut masquer le curseur : les filaments s'éteignent aussi
      if (A < 0.005) return;
      const { pts, cum, total, tx, ty, nx, ny } = sp;
      const n = pts.length;
      const grow = Math.min(1, total / (spread * 2.5));
      const R0 = headRadius();
      const fade = new Float32Array(n);
      const rad = new Float32Array(n);
      const margin = spread * 2.4 + 34; // couvre l'hélice, le fil secondaire et le halo
      // Hors navigation, la tête du courant prend la nuance de l'état puis rejoint les couleurs de base.
      const tintReach = 1 - catWeights[CAT_NAV];

      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const u = cum[i] / total;
        const fresh = clamp(1 - p.age / life, 0, 1);
        const speedF = 0.6 + 0.4 * clamp(p.v / 1100, 0, 1);
        fade[i] = Math.pow(1 - u, 0.9) * Math.sqrt(fresh);
        // Les filaments partent de l'orbite des étincelles, s'ouvrent, puis se resserrent en queue.
        rad[i] =
          lerp(R0, spread * speedF * grow, smoothstep(0, 0.22, u)) *
          (1 - 0.55 * smoothstep(0.55, 1, u)) *
          (0.35 + 0.65 * fresh);
        include(p.x, p.y, margin);
      }

      // Brume : l'enveloppe diffuse du courant, uniquement dans le halo.
      if (B) {
        for (let i0 = 0; i0 < n - 1; i0 += CHUNK) {
          const i1 = Math.min(n - 1, i0 + CHUNK);
          const mid = (i0 + i1) >> 1;
          if (fade[mid] < 0.01) continue;
          B.beginPath();
          B.moveTo(pts[i0].x, pts[i0].y);
          for (let j = i0 + 1; j <= i1; j++) B.lineTo(pts[j].x, pts[j].y);
          B.lineWidth = rad[mid] * 1.8 + 6;
          B.strokeStyle = rgba(secondary, A * fade[mid] * 0.12);
          B.stroke();
        }
      }

      const xs = new Float32Array(n);
      const ys = new Float32Array(n);
      const dp = new Float32Array(n);
      // Chaque filament = un brin principal + un fil plus fin qui l'enlace (aspect fibreux, organique).
      const threads = [
        { offset: 0, radius: 1, wave: 0, weight: 1, thin: 1, bloom: true },
        {
          offset: 0.75,
          radius: 1.45,
          wave: 1,
          weight: 0.38,
          thin: 0.55,
          bloom: false,
        },
      ];
      for (let k = 0; k < strandCount; k++) {
        for (const th of threads) {
          for (let i = 0; i < n; i++) {
            const p = pts[i];
            const s = cum[i];
            const u = s / total;
            // Le fil secondaire part collé au brin puis s'en détache et ondule à son propre rythme.
            const spreadOut = th.wave ? smoothstep(0.04, 0.35, u) : 0;
            const R =
              rad[i] *
              wobble(k + th.wave * 3, s, ts) *
              lerp(1, th.radius, spreadOut);
            // Angle = orbite de l'étincelle au passage + rotation continue + torsion le long du courant.
            const ph =
              strandBase[k] -
              p.a +
              swirl * p.age +
              twistK * s +
              phaseNoise(k, s, ts) +
              th.offset * spreadOut +
              th.wave * 0.6 * Math.sin(s * 0.045 - ts * 2.1 + k);
            const sn = Math.sin(ph);
            const cs = Math.cos(ph);
            const sway = spread * 0.28 * u * Math.sin(s * 0.017 - ts * 1.1);
            const on = R * sn + sway;
            const ot = R * cs * tiltAt(s);
            xs[i] = p.x + nx[i] * on + tx[i] * ot;
            ys[i] = p.y + ny[i] * on + ty[i] * ot;
            dp[i] = cs; // profondeur : > 0 devant, < 0 derrière
          }

          for (let i0 = 0; i0 < n - 1; i0 += CHUNK) {
            const i1 = Math.min(n - 1, i0 + CHUNK);
            const mid = (i0 + i1) >> 1;
            const f = fade[mid] * th.weight;
            if (f < 0.01) continue;
            // Contraste avant/arrière marqué : c'est ce qui rend les croisements lisibles.
            const d = Math.pow((dp[mid] + 1) * 0.5, 1.6);
            const u = cum[mid] / total;
            let col = mix(
              mix(primary, secondary, smoothstep(0, 0.8, u)),
              core,
              d * 0.6,
            );
            if (tintReach > 0.001)
              col = mix(
                col,
                mix(tint, tintCore, d * 0.6),
                tintReach * Math.pow(1 - u, 1.6) * 0.85,
              );
            const path = new Path2D();
            path.moveTo(xs[i0], ys[i0]);
            for (let j = i0 + 1; j <= i1; j++) path.lineTo(xs[j], ys[j]);

            c.lineWidth = (2.5 + d * 4) * th.thin;
            c.strokeStyle = rgba(col, A * f * (0.04 + 0.12 * d));
            c.stroke(path);
            c.lineWidth = (0.45 + d * 1.8) * th.thin;
            c.strokeStyle = rgba(col, A * f * (0.22 + 0.78 * d));
            c.stroke(path);
            if (B && th.bloom) {
              B.lineWidth = (2 + d * 6) * (0.4 + light * 0.4);
              B.strokeStyle = rgba(col, A * f * (0.12 + 0.5 * d));
              B.stroke(path);
            }
          }
        }
      }
    }

    function drawSatellites(front: boolean, ts: number) {
      const vis = appear * satVis;
      if (vis < 0.01) return;
      const R0 = headRadius();
      const nX = -dir.y;
      const nY = dir.x;
      for (let k = 0; k < strandCount; k++) {
        // Même équation que les filaments à leur origine : chaque filament est le sillage d'une étincelle.
        const ph = strandBase[k] - spinAngle + phaseNoise(k, 0, ts);
        const cs = Math.cos(ph);
        if (cs >= 0 !== front) continue;
        const R = R0 * wobble(k, 0, ts);
        const sn = Math.sin(ph);
        const x = center.x + nX * R * sn + dir.x * R * cs * orbitTilt;
        const y = center.y + nY * R * sn + dir.y * R * cs * orbitTilt;
        const d = (cs + 1) * 0.5;
        const r = (1.4 + d * 1.6) * (1.4 + light * 0.5);
        // Fondu entre les nuances quand on change de catégorie.
        for (const cat of CATS) {
          const wk = catWeights[cat];
          if (wk < 0.01) continue;
          c.globalAlpha = vis * (0.45 + 0.55 * d) * wk;
          c.drawImage(catSprites[cat], x - r, y - r, r * 2, r * 2);
        }
      }
      c.globalAlpha = 1;
    }

    function drawOrb(ts: number, animate: boolean) {
      const x = center.x;
      const y = center.y;
      include(x, y, size * 4 + 40); // couvre aussi les formes et badges de curseur
      const pulse = animate
        ? 1 + 0.07 * Math.sin(ts * 2.6) + 0.035 * Math.sin(ts * 6.3 + 1.2)
        : 1;
      const r = size * 0.5 * orbScale * pulse;
      if (r < 0.3) return;
      // Halo peint à pleine résolution (et non dans le calque de bloom à 1/4) : aucun pixel visible.
      if (light > 0) {
        const haloR = r * 5 + 10;
        const halo = c.createRadialGradient(x, y, 0, x, y, haloR);
        const haloA = (0.3 + light * 0.12) * appear;
        halo.addColorStop(0, rgba(tint, haloA));
        halo.addColorStop(0.35, rgba(tint, haloA * 0.45));
        halo.addColorStop(1, rgba(tint, 0));
        c.fillStyle = halo;
        c.beginPath();
        c.arc(x, y, haloR, 0, TAU);
        c.fill();
      }
      const g = c.createRadialGradient(x, y, 0, x, y, r * 2.6);
      g.addColorStop(0, rgba(WHITE, appear));
      g.addColorStop(0.16, rgba(tintCore, appear));
      g.addColorStop(0.4, rgba(tint, 0.5 * appear));
      g.addColorStop(1, rgba(tint, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r * 2.6, 0, TAU);
      c.fill();
    }

    // ---------- Formes de curseur ----------
    // Chaque état est tracé en lumière, comme les filaments : halo large, cœur fin et clair, lueur dans le halo flou.
    function neon(p: Path2D, lineW: number, a: number) {
      if (a < 0.01) return;
      c.lineWidth = lineW * 3.4;
      c.strokeStyle = rgba(tint, a * 0.22);
      c.stroke(p);
      c.lineWidth = lineW;
      c.strokeStyle = rgba(glyphCore, a);
      c.stroke(p);
      if (B) {
        B.lineWidth = lineW * 3 + 3;
        B.strokeStyle = rgba(tint, a * 0.5);
        B.stroke(p);
      }
    }

    /** Pointe de flèche dont le sommet est (x, y), orientée selon `ang`. */
    function chevron(p: Path2D, x: number, y: number, ang: number, s: number) {
      const a1 = ang + Math.PI - 0.7;
      const a2 = ang + Math.PI + 0.7;
      p.moveTo(x + Math.cos(a1) * s, y + Math.sin(a1) * s);
      p.lineTo(x, y);
      p.lineTo(x + Math.cos(a2) * s, y + Math.sin(a2) * s);
    }

    /** Double flèche centrée, avec un vide au milieu pour laisser voir le point de clic. */
    function doubleArrow(
      p: Path2D,
      x: number,
      y: number,
      ang: number,
      L: number,
      gap: number,
      headS: number,
    ) {
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);
      for (const sg of [1, -1]) {
        p.moveTo(x + dx * gap * sg, y + dy * gap * sg);
        p.lineTo(x + dx * L * sg, y + dy * L * sg);
        chevron(
          p,
          x + dx * L * sg,
          y + dy * L * sg,
          sg > 0 ? ang : ang + Math.PI,
          headS,
        );
      }
    }

    function drawGlyph(k: Kind, a: number, ts: number) {
      const x = center.x;
      const y = center.y;
      const s = size * (0.7 + 0.3 * a); // en apparaissant, la forme se déploie depuis la particule
      const p = new Path2D();
      let lineW = 1.6;
      let strength = a;
      switch (k) {
        case "text":
        case "vtext": {
          // Barre de saisie avec ses deux empattements.
          const ang = k === "text" ? Math.PI / 2 : 0;
          const ux = Math.cos(ang);
          const uy = Math.sin(ang);
          const half = s * 1.35;
          const cap = s * 0.4;
          p.moveTo(x - ux * half, y - uy * half);
          p.lineTo(x + ux * half, y + uy * half);
          for (const sg of [1, -1]) {
            p.moveTo(
              x + ux * half * sg + uy * cap,
              y + uy * half * sg - ux * cap,
            );
            p.lineTo(
              x + ux * half * sg - uy * cap,
              y + uy * half * sg + ux * cap,
            );
          }
          lineW = 1.5;
          break;
        }
        case "notAllowed": {
          const r = s * 1.25;
          const d = r * Math.SQRT1_2;
          p.arc(x, y, r, 0, TAU);
          p.moveTo(x - d, y - d);
          p.lineTo(x + d, y + d);
          break;
        }
        case "wait":
        case "grab":
        case "grabbing":
          // Trace de l'orbite : les étincelles y tournent comme sur une piste.
          p.arc(x, y, headRadius(), 0, TAU);
          lineW = 1;
          strength = a * (k === "wait" ? 0.3 : k === "grab" ? 0.22 : 0.45);
          break;
        case "progress": {
          // La particule reste utilisable ; un petit arc tourne à côté.
          const start = ts * 7;
          p.arc(x + s * 1.5, y - s * 1.5, s * 0.5, start, start + 4.4);
          lineW = 1.4;
          break;
        }
        case "help": {
          const bx = x + s * 1.55;
          const by = y - s * 1.5;
          const q = s * 0.95;
          p.arc(bx, by - q * 0.28, q * 0.34, Math.PI * 1.05, Math.PI * 2.35);
          p.lineTo(bx, by + q * 0.2);
          p.lineTo(bx, by + q * 0.3);
          p.moveTo(bx, by + q * 0.58);
          p.lineTo(bx, by + q * 0.6);
          lineW = 1.4;
          break;
        }
        case "crosshair":
          for (let q = 0; q < 4; q++) {
            const ang = (q * Math.PI) / 2;
            p.moveTo(x + Math.cos(ang) * s * 0.5, y + Math.sin(ang) * s * 0.5);
            p.lineTo(x + Math.cos(ang) * s * 1.6, y + Math.sin(ang) * s * 1.6);
          }
          lineW = 1.3;
          break;
        case "cell": {
          const r = s * 1.1;
          p.moveTo(x - r, y);
          p.lineTo(x + r, y);
          p.moveTo(x, y - r);
          p.lineTo(x, y + r);
          lineW = 2.6;
          break;
        }
        case "move":
          doubleArrow(p, x, y, 0, s * 1.75, s * 0.55, s * 0.5);
          doubleArrow(p, x, y, Math.PI / 2, s * 1.75, s * 0.55, s * 0.5);
          break;
        case "ew":
          doubleArrow(p, x, y, 0, s * 1.7, s * 0.45, s * 0.55);
          break;
        case "ns":
          doubleArrow(p, x, y, Math.PI / 2, s * 1.7, s * 0.45, s * 0.55);
          break;
        case "nesw":
          doubleArrow(p, x, y, -Math.PI / 4, s * 1.7, s * 0.45, s * 0.55);
          break;
        case "nwse":
          doubleArrow(p, x, y, Math.PI / 4, s * 1.7, s * 0.45, s * 0.55);
          break;
        case "col":
        case "row": {
          // Deux traits parallèles (la bordure saisie) et les flèches qui s'en écartent.
          const ang = k === "col" ? 0 : Math.PI / 2;
          const ux = Math.cos(ang);
          const uy = Math.sin(ang);
          const b = s * 0.28;
          const hb = s * 0.75;
          for (const sg of [1, -1]) {
            p.moveTo(x + ux * b * sg - uy * hb, y + uy * b * sg + ux * hb);
            p.lineTo(x + ux * b * sg + uy * hb, y + uy * b * sg - ux * hb);
          }
          doubleArrow(p, x, y, ang, s * 1.8, s * 0.55, s * 0.5);
          break;
        }
        case "zoomIn":
        case "zoomOut": {
          // Loupe : le point de clic est au centre de la lentille.
          const r = s * 1.05;
          const d = r * Math.SQRT1_2;
          const m = s * 0.45;
          p.arc(x, y, r, 0, TAU);
          p.moveTo(x + d, y + d);
          p.lineTo(x + d + s * 0.75, y + d + s * 0.75);
          p.moveTo(x - m, y);
          p.lineTo(x + m, y);
          if (k === "zoomIn") {
            p.moveTo(x, y - m);
            p.lineTo(x, y + m);
          }
          break;
        }
        case "copy": {
          const bx = x + s * 1.5;
          const by = y + s * 1.5;
          const m = s * 0.42;
          p.moveTo(bx - m, by);
          p.lineTo(bx + m, by);
          p.moveTo(bx, by - m);
          p.lineTo(bx, by + m);
          lineW = 1.5;
          break;
        }
        case "alias": {
          // Flèche en crochet : « raccourci vers ».
          const bx = x + s * 1.5;
          const by = y + s * 1.5;
          p.moveTo(bx - s * 0.4, by + s * 0.35);
          p.quadraticCurveTo(
            bx - s * 0.4,
            by - s * 0.25,
            bx + s * 0.35,
            by - s * 0.25,
          );
          chevron(p, bx + s * 0.35, by - s * 0.25, 0, s * 0.3);
          lineW = 1.4;
          break;
        }
        case "context": {
          // Trois lignes de menu.
          const bx = x + s * 1.35;
          const by = y + s * 0.9;
          for (let q = 0; q < 3; q++) {
            p.moveTo(bx, by + q * s * 0.36);
            p.lineTo(bx + s * 0.8, by + q * s * 0.36);
          }
          lineW = 1.3;
          break;
        }
        default:
          return; // default, pointer, none : la particule seule suffit
      }
      neon(p, lineW, strength);
    }

    function drawGlyphs(ts: number) {
      // Pointeur natif visible : il dessine déjà sa propre forme, on ne la double pas.
      if (!hideNativeCursor) return;
      c.lineCap = "round";
      if (B) B.lineCap = "round";
      for (const k of KINDS) {
        const wk = weights[k] * appear;
        if (wk > 0.01) drawGlyph(k, wk, ts);
      }
      c.lineCap = "butt";
      if (B) B.lineCap = "butt";
    }

    function drawTip() {
      c.save();
      c.globalCompositeOperation = "source-over";
      c.fillStyle = rgba(tint, 1);
      c.beginPath();
      c.arc(pointer.x, pointer.y, 2.5, 0, TAU);
      c.fill();
      c.restore();
      include(pointer.x, pointer.y, 8);
    }

    function drawMotes(ts: number) {
      const base = Math.max(alpha, 0.4);
      for (const m of motes) {
        const env = Math.sin(Math.PI * clamp(m.life / m.duration, 0, 1));
        const twinkle = 0.65 + 0.35 * Math.sin(ts * 9 + m.seed * 13);
        const r = m.size * (2.4 + light * 1.4);
        c.globalAlpha = base * env * twinkle;
        c.drawImage(
          m.tint ? secondarySprite : catSprites[m.cat],
          m.x - r,
          m.y - r,
          r * 2,
          r * 2,
        );
        include(m.x, m.y, r + 6);
      }
      c.globalAlpha = 1;
    }

    function drawRipples() {
      for (const rp of ripples) {
        const p = rp.life / RIPPLE_DURATION;
        const e = 1 - Math.pow(1 - p, 3);
        const R = size * 0.8 + size * 3.5 * e;
        c.lineWidth = 1.2;
        c.strokeStyle = rgba(tintCore, 0.5 * (1 - p));
        c.beginPath();
        c.arc(rp.x, rp.y, R, 0, TAU);
        c.stroke();
        if (B) {
          B.lineWidth = 5;
          B.strokeStyle = rgba(tint, 0.5 * (1 - p));
          B.beginPath();
          B.arc(rp.x, rp.y, R, 0, TAU);
          B.stroke();
        }
        include(rp.x, rp.y, R + 14);
      }
    }

    function spawnMote(x: number, y: number, vx: number, vy: number) {
      if (motes.length >= MAX_MOTES) return;
      motes.push({
        x,
        y,
        vx,
        vy,
        life: 0,
        duration: 0.9 + Math.random() * 1.1,
        size: 0.6 + Math.random() * 1.2,
        tint: Math.random() < 0.7 ? 0 : 1,
        seed: Math.random() * 100,
        cat: KIND_CAT[kind],
      });
    }

    // ---------- Lecture de l'état demandé par le site ----------
    function readCursor(el: Element) {
      const root = doc.documentElement;
      const hidden = root.classList.contains(cursorClass);
      // Le masquage force `cursor: none` partout : on le lève le temps de lire la valeur voulue par le site.
      // Rien n'est peint entre les deux lignes, donc aucun clignotement.
      if (hidden) root.classList.remove(cursorClass);
      const value = view.getComputedStyle(el).cursor || "auto";
      if (hidden) root.classList.add(cursorClass);
      return value;
    }

    function resolveKind(el: Element | null): Kind {
      if (!el || el.nodeType !== 1) return "default";
      try {
        const forced = el
          .closest("[data-cursor]")
          ?.getAttribute("data-cursor")
          ?.trim()
          .toLowerCase();
        if (forced) {
          if (forced === "hover") return "pointer";
          const fk = CURSOR_MAP.get(forced);
          if (fk) return fk;
        }
        // `url(…) 4 4, pointer` : seul le mot-clé de repli nous intéresse.
        const parts = readCursor(el).split(",");
        const keyword = parts[parts.length - 1].trim().toLowerCase();
        const mapped =
          keyword === "auto" || keyword === "default"
            ? undefined
            : CURSOR_MAP.get(keyword);
        if (mapped) return mapped;
        // `auto` / `default` : ce que ferait le navigateur, avec un retour visuel sur ce qui est cliquable.
        if (el.closest(':disabled,[aria-disabled="true"]')) return "default";
        if (el.closest(TEXT_FIELD)) return "text";
        if (el.closest(INTERACTIVE)) return "pointer";
      } catch {
        // sélecteur ou élément exotique : on garde la particule par défaut
      }
      return "default";
    }

    function resize() {
      w = view.innerWidth;
      h = view.innerHeight;
      ratio = Math.min(view.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * ratio));
      canvas.height = Math.max(1, Math.round(h * ratio));
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      // Redimensionner le canvas réinitialise son état : le halo agrandi doit être lissé au mieux.
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = "high";
      bloomCanvas.width = Math.max(1, Math.ceil(w * BLOOM));
      bloomCanvas.height = Math.max(1, Math.ceil(h * BLOOM));
      if (B) B.setTransform(BLOOM, 0, 0, BLOOM, 0, 0);
      prevBox = null;
      kick();
    }

    // ---------- Boucle d'animation ----------
    function kick() {
      if (active && !frame) frame = view.requestAnimationFrame(tick);
    }

    function stop() {
      active = false;
      seeded = false;
      travel = 0;
      shed = 0;
      speed = 0;
      history = [];
      motes = [];
      ripples = [];
      pressed = false;
      shake = 0;
      probeTarget = null;
      view.cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      prevBox = null;
      doc.documentElement.classList.remove(cursorClass);
      c.clearRect(0, 0, w, h);
      if (B) B.clearRect(0, 0, w, h);
    }

    function tick(time: number) {
      frame = 0;
      if (!active) return;
      const idleFor = time - lastMove;
      // 60 fps max ; 30 fps quand seule la particule respire.
      const minGap = idleFor > 1500 && history.length === 0 ? 32 : 15;
      if (previousTime && time - previousTime < minGap) {
        frame = view.requestAnimationFrame(tick);
        return;
      }
      const dt = previousTime
        ? Math.min(0.05, (time - previousTime) / 1000)
        : 1 / 60;
      previousTime = time;
      const ts = time / 1000;
      const motionOn = !reducedMotion.matches;
      const effects = motionOn && alpha > 0;
      const ease = (rate: number) => (motionOn ? 1 - Math.exp(-dt * rate) : 1);

      // État de curseur : relu quand l'élément survolé change, après un clic (le site a pu passer
      // en grabbing), et deux fois par seconde pendant le mouvement (états changés par le JS du site).
      if (probeDirty || (idleFor < 400 && time - lastProbe > 500)) {
        kind = resolveKind(probeTarget);
        probeDirty = false;
        lastProbe = time;
      }
      const st = KIND_STYLE[kind];
      const cat = KIND_CAT[kind];

      // Tête du courant : inertie réglable, indépendante de la fréquence des événements.
      const ox = head.x;
      const oy = head.y;
      const kHead = ease(60 - inertia * 55);
      head.x += (pointer.x - head.x) * kHead;
      head.y += (pointer.y - head.y) * kHead;
      const moved = Math.hypot(head.x - ox, head.y - oy);
      speed += (moved / dt - speed) * ease(8);

      spinBoost += (st.spin - spinBoost) * ease(6);
      extraSpin += (st.extra - extraSpin) * ease(4);
      if (motionOn) spinAngle += (spin * spinBoost + extraSpin) * dt;

      if (effects) {
        const newest = history[0];
        if (!newest || Math.hypot(head.x - newest.x, head.y - newest.y) > 2) {
          history.unshift({
            x: head.x,
            y: head.y,
            t: time,
            a: spinAngle,
            v: speed,
          });
          if (history.length > 400) history.length = 400;
        }
      } else {
        history = [];
      }
      const cutoff = time - life * 1000;
      while (history.length && history[history.length - 1].t < cutoff)
        history.pop();

      // Particule, étincelles et couleur glissent vers l'état ; les formes se fondent l'une dans l'autre.
      const orbTarget = st.orb * (pressed ? 0.72 : 1);
      const ringTarget = st.ring * (pressed ? 0.85 : 1);
      orbScale += (orbTarget - orbScale) * ease(14);
      ringMul += (ringTarget - ringMul) * ease(10);
      satVis += (st.sat - satVis) * ease(12);
      orbitTilt += (st.tilt - orbitTilt) * ease(8);
      trailVis += (st.trail - trailVis) * ease(8);
      appear += (1 - appear) * ease(8);
      let settled = true;
      for (const k of KINDS) {
        const target = k === kind ? 1 : 0;
        weights[k] += (target - weights[k]) * ease(16);
        if (Math.abs(weights[k] - target) > 0.01) settled = false;
      }
      for (const k of CATS) {
        const target = k === cat ? 1 : 0;
        catWeights[k] += (target - catWeights[k]) * ease(10);
        if (Math.abs(catWeights[k] - target) > 0.01) settled = false;
      }
      refreshTint();
      shake *= Math.exp(-dt * 6);
      if (shake < 0.01) shake = 0;
      center.x =
        pointer.x + (motionOn ? Math.sin(ts * 48) * shake * size * 0.45 : 0);
      center.y = pointer.y;

      // Spores : semées par le mouvement, puis portées par un champ de courants lents.
      if (sparkles && effects && trailVis > 0.5) {
        if (moved > 0.01) {
          travel = Math.min(travel + moved, 90);
          const nX = -dir.y;
          const nY = dir.x;
          while (travel >= 24) {
            travel -= 24;
            const side = (Math.random() - 0.5) * 2;
            const back = 15 + Math.random() * 35;
            spawnMote(
              head.x + nX * side * spread * 0.9,
              head.y + nY * side * spread * 0.9,
              -dir.x * back + nX * side * 20,
              -dir.y * back + nY * side * 20 - 10,
            );
          }
        }
        if (idleFor > 250 && idleFor < 6000 && showCursor && satVis > 0.5) {
          shed += dt;
          if (shed > 0.32) {
            shed = 0;
            const ang = Math.random() * TAU;
            const r = size * orbScale;
            spawnMote(
              pointer.x + Math.cos(ang) * r,
              pointer.y + Math.sin(ang) * r,
              Math.cos(ang) * 18,
              Math.sin(ang) * 18 - 12,
            );
          }
        }
      }
      motes = motes.filter((m) => {
        m.life += dt;
        const fx = Math.sin(m.y * 0.021 + ts * 1.3 + m.seed) * 26;
        const fy = Math.cos(m.x * 0.019 + ts * 1.1 + m.seed) * 26 - 16;
        const k = 1 - Math.exp(-1.6 * dt);
        m.vx += (fx - m.vx) * k;
        m.vy += (fy - m.vy) * k;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        return m.life < m.duration;
      });
      ripples = ripples.filter((rp) => (rp.life += dt) < RIPPLE_DURATION);

      // ---- Rendu ----
      beginFrame();
      let spine: Spine | null = null;
      if (history.length) {
        const raw: Sample[] = [
          { x: pointer.x, y: pointer.y, age: 0, a: spinAngle, v: speed },
        ];
        for (const p of history)
          raw.push({
            x: p.x,
            y: p.y,
            age: (time - p.t) / 1000,
            a: p.a,
            v: p.v,
          });
        spine = buildSpine(raw, maxLength);
      }
      if (spine) {
        const k = ease(12);
        dir.x += (spine.hx - dir.x) * k;
        dir.y += (spine.hy - dir.y) * k;
      } else if (moved > 0.5) {
        dir.x = (head.x - ox) / moved;
        dir.y = (head.y - oy) / moved;
      }
      const dl = Math.hypot(dir.x, dir.y) || 1;
      dir.x /= dl;
      dir.y /= dl;

      if (spine) {
        orient(spine);
        drawStrands(spine, ts);
      }
      if (showCursor) {
        drawSatellites(false, ts);
        drawOrb(ts, motionOn);
        drawSatellites(true, ts);
        drawGlyphs(ts);
      } else if (hideNativeCursor) {
        drawTip();
      }
      drawMotes(ts);
      drawRipples();
      endFrame();

      // Après quelques secondes d'immobilité, plus rien ne tourne : la boucle s'arrête.
      // Sauf pour l'attente et le chargement, qui sont animés par nature.
      settled =
        settled &&
        shake === 0 &&
        Math.abs(orbScale - orbTarget) < 0.005 &&
        Math.abs(ringMul - ringTarget) < 0.005 &&
        Math.abs(satVis - st.sat) < 0.01 &&
        Math.abs(orbitTilt - st.tilt) < 0.005 &&
        Math.abs(trailVis - st.trail) < 0.01;
      const animatedKind = kind === "wait" || kind === "progress";
      const resting = motionOn
        ? idleFor > 6000 &&
          !animatedKind &&
          history.length === 0 &&
          motes.length === 0 &&
          ripples.length === 0 &&
          settled
        : settled && appear > 0.99;
      if (resting) previousTime = 0;
      else frame = view.requestAnimationFrame(tick);
    }

    // ---------- Événements ----------
    function onMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !finePointer.matches) {
        if (active) stop();
        return;
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      lastMove = view.performance.now();
      // composedPath()[0] : l'élément réel, même à l'intérieur d'un shadow DOM.
      const path = event.composedPath?.();
      const target = ((path && path[0]) || event.target) as Element | null;
      if (target !== probeTarget) {
        probeTarget = target;
        probeDirty = true;
      }
      if (!seeded) {
        head.x = pointer.x;
        head.y = pointer.y;
        history = [];
        appear = 0;
        seeded = true;
      }
      active = true;
      if (
        hideNativeCursor &&
        !doc.documentElement.classList.contains(cursorClass)
      ) {
        doc.documentElement.classList.add(cursorClass);
      }
      kick();
    }

    function onDown(event: PointerEvent) {
      if (event.pointerType !== "mouse" || !active) return;
      pressed = true;
      probeDirty = true;
      lastMove = view.performance.now();
      if (kind === "notAllowed") {
        // Clic refusé : la particule fait « non » de la tête, sans onde ni gerbe.
        if (!reducedMotion.matches) shake = 1;
      } else if (!reducedMotion.matches) {
        if (showCursor && ripples.length < 4)
          ripples.push({ x: pointer.x, y: pointer.y, life: 0 });
        // Gerbe de spores en spirale autour du point de clic.
        if (sparkles && alpha > 0) {
          for (let j = 0; j < 12; j++) {
            const ang = (j / 12) * TAU + Math.random() * 0.3;
            const sp = 70 + Math.random() * 90;
            spawnMote(
              pointer.x,
              pointer.y,
              Math.cos(ang) * sp - Math.sin(ang) * sp * 0.5,
              Math.sin(ang) * sp + Math.cos(ang) * sp * 0.5,
            );
          }
        }
      }
      kick();
    }
    function onUp() {
      if (!pressed) return;
      pressed = false;
      probeDirty = true;
      kick();
    }
    function onOut(event: PointerEvent) {
      if (!event.relatedTarget) stop();
    }
    function onVisibility() {
      if (doc.hidden) stop();
    }
    function onPreference() {
      if (!finePointer.matches) stop();
      else kick();
    }

    resize();
    view.addEventListener("pointermove", onMove, {
      passive: true,
      capture: true,
    });
    view.addEventListener("pointerdown", onDown, {
      passive: true,
      capture: true,
    });
    view.addEventListener("pointerup", onUp, { passive: true, capture: true });
    view.addEventListener("pointerout", onOut);
    view.addEventListener("blur", stop);
    view.addEventListener("resize", resize);
    doc.addEventListener("visibilitychange", onVisibility);
    finePointer.addEventListener("change", onPreference);
    reducedMotion.addEventListener("change", onPreference);

    return () => {
      stop();
      view.removeEventListener("pointermove", onMove, true);
      view.removeEventListener("pointerdown", onDown, true);
      view.removeEventListener("pointerup", onUp, true);
      view.removeEventListener("pointerout", onOut);
      view.removeEventListener("blur", stop);
      view.removeEventListener("resize", resize);
      doc.removeEventListener("visibilitychange", onVisibility);
      finePointer.removeEventListener("change", onPreference);
      reducedMotion.removeEventListener("change", onPreference);
      cursorStyle.remove();
      canvas.remove();
    };
  }, [
    color,
    secondaryColor,
    opacity,
    length,
    duration,
    ribbons,
    width,
    twist,
    flow,
    glow,
    smoothing,
    cursorSize,
    showCursor,
    hideNativeCursor,
    sparkles,
    additive,
    stateColors,
    tintStrength,
    inputColor,
    dragColor,
    waitColor,
    blockedColor,
  ]);

  // Tout est dessiné dans un calque ajouté au body : le composant lui-même ne rend rien.
  return null;
}
