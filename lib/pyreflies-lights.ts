/**
 * Positions des lumières Pyreflies, publiées par le fond et lues par qui veut s'en servir
 * (le nom du footer s'illumine à leur passage).
 * Le fond ne prépare et ne publie leurs positions que tant que quelqu'un écoute.
 */

export type PyrefliesLight = {
  /** Position dans la fenêtre (px), comme clientX / clientY. */
  x: number;
  y: number;
  /** Rayon du cœur lumineux (px). */
  radius: number;
  /** Intensité 0 → 1 (la lumière apparaît et s'efface aux bords de sa traversée). */
  intensity: number;
};

type Listener = (lights: PyrefliesLight[]) => void;

const listeners = new Set<Listener>();
let last: PyrefliesLight[] = [];

/** Reçoit les lumières à 20 Hz (et tout de suite la dernière connue). Renvoie le désabonnement. */
export function subscribeToLights(listener: Listener) {
  listeners.add(listener);
  listener(last);
  return () => {
    listeners.delete(listener);
  };
}

export function hasLightListeners() {
  return listeners.size > 0;
}

export function publishLights(lights: PyrefliesLight[]) {
  last = lights;
  for (const listener of listeners) listener(lights);
}
