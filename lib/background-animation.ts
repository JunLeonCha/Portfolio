type Listener = (paused: boolean) => void;

const listeners = new Set<Listener>();
let pauses = 0;

function notify() {
  for (const listener of listeners) listener(pauses > 0);
}

/** Suspend le fond sans détruire son rendu ; renvoie la reprise correspondante. */
export function pauseBackgroundAnimation() {
  pauses += 1;
  if (pauses === 1) notify();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    pauses -= 1;
    if (pauses === 0) notify();
  };
}

export function subscribeToBackgroundPause(listener: Listener) {
  listeners.add(listener);
  listener(pauses > 0);
  return () => {
    listeners.delete(listener);
  };
}
