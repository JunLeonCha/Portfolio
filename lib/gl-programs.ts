/**
 * Compilation WebGL sans bloquer le thread principal.
 *
 * `linkProgram` suivi de `getProgramParameter(LINK_STATUS)` fait attendre le thread jusqu'à la fin de la
 * compilation par le pilote : sur mobile, plusieurs secondes d'une seule tâche. Avec l'extension
 * KHR_parallel_shader_compile, on lance toutes les compilations d'un coup, on laisse le GPU les mener
 * en parallèle, puis on ne lit leur statut qu'une fois `COMPLETION_STATUS_KHR` vrai : le thread reste libre.
 */

type Pending = {
  program: WebGLProgram;
  vertex: WebGLShader;
  fragment: WebGLShader;
};

const warmed = new WeakMap<WebGLRenderingContext, Map<string, Pending>>();

const keyOf = (vs: string, fs: string) => `${vs}\u0000${fs}`;

/** Lance la compilation de tous les programmes, et se résout quand le pilote a terminé (ou tout de suite sans l'extension). */
export function warmPrograms(
  gl: WebGLRenderingContext,
  sources: ReadonlyArray<readonly [string, string]>,
): Promise<void> {
  const pending = new Map<string, Pending>();
  warmed.set(gl, pending);
  for (const [vs, fs] of sources) {
    const vertex = gl.createShader(gl.VERTEX_SHADER);
    const fragment = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) continue;
    gl.shaderSource(vertex, vs);
    gl.compileShader(vertex);
    gl.shaderSource(fragment, fs);
    gl.compileShader(fragment);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    pending.set(keyOf(vs, fs), { program, vertex, fragment });
  }

  const ext = gl.getExtension("KHR_parallel_shader_compile");
  if (!ext) return Promise.resolve();
  return new Promise((resolve) => {
    // Chaque lecture est un aller-retour avec le processus GPU, déjà occupé à compiler : on espace les
    // sondages (50 ms) et on ne revérifie que les programmes pas encore prêts.
    const waiting = [...pending.values()].map(({ program }) => program);
    const poll = () => {
      if (gl.isContextLost()) return resolve();
      while (
        waiting.length &&
        gl.getProgramParameter(
          waiting[waiting.length - 1],
          ext.COMPLETION_STATUS_KHR,
        )
      ) {
        waiting.pop();
      }
      if (waiting.length) setTimeout(poll, 50);
      else resolve();
    };
    poll();
  });
}

/**
 * Programme déjà compilé par `warmPrograms` (consommé : un seul retrait par paire).
 * `undefined` : rien de préparé, l'appelant compile comme avant. `null` : la compilation a échoué.
 */
export function takeWarmedProgram(
  gl: WebGLRenderingContext,
  vs: string,
  fs: string,
  label: string,
): WebGLProgram | null | undefined {
  const pending = warmed.get(gl);
  const key = keyOf(vs, fs);
  const entry = pending?.get(key);
  if (!pending || !entry) return undefined;
  pending.delete(key);
  const { program, vertex, fragment } = entry;
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(`[${label}] programme :`, gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}
