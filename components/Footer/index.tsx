"use client";

import { useEffect, useRef } from "react";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { CONTACT_LINKS, EMAIL } from "@/components/Contact/contact";
import { NAV_LINKS } from "@/components/Navbar/links";
import { subscribeToLights, type PyrefliesLight } from "@/lib/pyreflies-lights";

const CITY = "Nantes, FR";
const TIME_ZONE = "Europe/Paris";

/** Soulignement qui se trace de gauche à droite au survol. */
const UNDERLINE =
  "bg-[linear-gradient(currentColor,currentColor)] bg-size-[0%_1px] bg-left-bottom bg-no-repeat transition-[background-size,color] duration-500 ease-out hover:bg-size-[100%_1px] focus-visible:bg-size-[100%_1px] focus-visible:outline-none motion-reduce:transition-none";

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-4 ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Masque vide : la couche qu'il couvre est entièrement cachée. */
const NO_LIGHT = "linear-gradient(transparent, transparent)";

/** Halo d'une lumière Pyreflies, en px : bien plus large que son cœur, comme sa lueur à l'écran. */
const haloRadius = (light: PyrefliesLight) => Math.max(160, light.radius * 9);

/**
 * Le nom en très grand. Le dégradé ne s'allume que sous une lumière : le pointeur, comme une lampe,
 * et les sphères Pyreflies quand elles passent devant.
 */
function Wordmark() {
  const zone = useRef<HTMLDivElement>(null);
  const lit = useRef<HTMLSpanElement>(null);
  const pointerLight = useRef<HTMLSpanElement>(null);

  // Lumières Pyreflies : un halo radial par sphère, actualisé à 20 Hz.
  // Abonné seulement quand le nom est à l'écran : ailleurs, le fond ne relit rien sur le GPU.
  useEffect(() => {
    const target = zone.current;
    const layer = lit.current;
    if (!target || !layer) return;
    const maskProperty = CSS.supports("mask-image", NO_LIGHT)
      ? "mask-image"
      : "-webkit-mask-image";
    let previousMask = "";
    const setMask = (value: string) => {
      if (value === previousMask) return;
      previousMask = value;
      layer.style.setProperty(maskProperty, value);
    };
    const paint = (lights: PyrefliesLight[]) => {
      const box = layer.getBoundingClientRect();
      const halos: string[] = [];
      for (const light of lights) {
        const r = haloRadius(light);
        const x = light.x - box.left;
        const y = light.y - box.top;
        // Trop loin ou éteinte : elle n'éclaire pas le nom.
        if (light.intensity < 0.01) continue;
        if (x < -r || y < -r || x > box.width + r || y > box.height + r)
          continue;
        const k = light.intensity;
        halos.push(
          `radial-gradient(circle ${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px, rgb(0 0 0 / ${k.toFixed(3)}), rgb(0 0 0 / ${(k * 0.35).toFixed(3)}) 40%, transparent 72%)`,
        );
      }
      setMask(halos.length ? halos.join(", ") : NO_LIGHT);
    };

    let unsubscribe: (() => void) | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        unsubscribe ??= subscribeToLights(paint);
      } else {
        unsubscribe?.();
        unsubscribe = null;
        setMask(NO_LIGHT);
      }
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
      unsubscribe?.();
    };
  }, []);

  // Le halo de survol a son propre rythme ; le curseur animé reste indépendant.
  useEffect(() => {
    const target = zone.current;
    const layer = pointerLight.current;
    if (!target || !layer) return;
    let frame = 0;
    let lastPaint = -Infinity;
    let box: DOMRect | null = null;
    let x = 0;
    let y = 0;

    const invalidateBox = () => {
      box = null;
    };
    const paint = (time: number) => {
      if (time - lastPaint < 1000 / 30) {
        frame = requestAnimationFrame(paint);
        return;
      }
      frame = 0;
      lastPaint = time;
      box ??= target.getBoundingClientRect();
      // Variables sur ce calque uniquement : les autres textes ne sont pas invalidés.
      layer.style.setProperty("--x", `${(x - box.left).toFixed(1)}px`);
      layer.style.setProperty("--y", `${(y - box.top).toFixed(1)}px`);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      box = null;
    };
    const resizeObserver = new ResizeObserver(invalidateBox);
    resizeObserver.observe(target);
    target.addEventListener("pointerenter", invalidateBox);
    target.addEventListener("pointermove", onMove, { passive: true });
    target.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", invalidateBox, { passive: true });
    window.addEventListener("resize", invalidateBox);
    return () => {
      onLeave();
      resizeObserver.disconnect();
      target.removeEventListener("pointerenter", invalidateBox);
      target.removeEventListener("pointermove", onMove);
      target.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", invalidateBox);
      window.removeEventListener("resize", invalidateBox);
    };
  }, []);

  const text = (
    <>
      Léon <span className="font-serif italic pr-[0.08em]">Cha</span>
    </>
  );
  const shape =
    // Interligne > 1 : la boîte contient les lettres entières (accents compris),
    // sans quoi l'overflow-hidden de l'animation d'entrée les rognerait.
    "block whitespace-nowrap text-center leading-[1.15] tracking-[-0.04em] bg-clip-text text-transparent";

  return (
    <div
      ref={zone}
      aria-hidden="true"
      data-cursor="default"
      // Pleine largeur (marges du footer annulées) : le nom peut grossir sur mobile sans être rogné.
      className="group relative -mx-8 mt-16 select-none overflow-hidden text-[22vw] md:mt-20 md:text-[19vw] xl:-mx-24"
    >
      <span data-footer="wordmark" className="relative block">
        {/* Couche de base : à peine visible, s'efface vers le bas. */}
        <span
          className={`${shape} bg-linear-to-b from-foreground/15 to-foreground/3`}
        >
          {text}
        </span>
        {/* Couche éclairée par les sphères Pyreflies : masque piloté en JS (voir plus haut). */}
        <span
          ref={lit}
          className={`${shape} absolute inset-0 bg-linear-to-r from-primary to-accent mask-[linear-gradient(transparent,transparent)]`}
        >
          {text}
        </span>
        {/* Couche lumineuse : révélée par un masque radial centré sur le pointeur. */}
        <span
          ref={pointerLight}
          className={`${shape} absolute inset-0 bg-linear-to-r from-primary to-accent opacity-0 transition-opacity duration-500 [--x:50%] [--y:50%] mask-[radial-gradient(18rem_circle_at_var(--x)_var(--y),#000,transparent_70%)] group-hover:opacity-100 motion-reduce:transition-none`}
        >
          {text}
        </span>
      </span>
    </div>
  );
}

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const clock = useRef<HTMLTimeElement>(null);
  const year = useRef<HTMLSpanElement>(null);

  useScrollReveal(root, (tl) => {
    tl.from("[data-footer='lead']", { y: 30, autoAlpha: 0 })
      .from(
        "[data-footer='column']",
        { y: 20, autoAlpha: 0, stagger: 0.08 },
        "<0.15",
      )
      .from("[data-footer='bar']", { autoAlpha: 0 }, "<0.2")
      // Le nom monte depuis le bas du footer, comme sorti de la ligne d'horizon.
      .from(
        "[data-footer='wordmark']",
        { yPercent: 100, duration: 1.4, ease: "power4.out" },
        "<",
      );
  });

  // Heure locale et année : calculées côté navigateur, après l'hydratation
  // (rendues au serveur, elles seraient figées au moment du build).
  useEffect(() => {
    const format = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIME_ZONE,
    });
    const tick = () => {
      const now = new Date();
      if (clock.current) {
        clock.current.textContent = format.format(now);
        clock.current.dateTime = now.toISOString();
      }
    };
    tick();
    if (year.current) year.current.textContent = `${new Date().getFullYear()} `;
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
  }, []);

  function backToTop() {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    <footer
      ref={root}
      className="relative mt-24 overflow-hidden px-8 pt-16 md:pt-20 xl:px-24"
    >
      {/* Filet lumineux en guise de séparation, plus intense au centre. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(50%_100%_at_50%_0%,var(--color-primary),transparent)] opacity-[0.07]"
      />

      {/* Mobile : l'accroche, puis Navigation et Ailleurs côte à côte, puis l'heure.
          Desktop : tout sur une ligne de 12 colonnes. */}
      <div className="relative grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12">
        <div data-footer="lead" className="col-span-2 md:col-span-6">
          <p className="max-w-md text-2xl leading-tight tracking-tight sm:text-3xl xl:text-4xl">
            Un projet, un poste,{" "}
            {/* Espace insécable avant « ? » : il ne part jamais seul à la ligne. */}
            <span className="font-serif italic">une idée</span>
            {" ?"}
          </p>
          <a
            href={`mailto:${EMAIL}`}
            aria-label={`Écrire à ${EMAIL}`}
            className={`group mt-6 inline-flex items-center gap-2 text-primary hover:text-primary-hover ${UNDERLINE}`}
          >
            {EMAIL}
            <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
          </a>
        </div>

        <nav
          data-footer="column"
          aria-label="Plan du site"
          className="md:col-span-2"
        >
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            Navigation
          </h2>
          <ul className="mt-5 flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={`text-sm text-foreground/80 hover:text-foreground ${UNDERLINE}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div data-footer="column" className="md:col-span-2">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            Ailleurs
          </h2>
          <ul className="mt-5 flex flex-col gap-3">
            {CONTACT_LINKS.map((link) => {
              const external = link.href.startsWith("http");
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    {...(external && { target: "_blank", rel: "noreferrer" })}
                    {...(link.download && { download: "" })}
                    className={`text-sm text-foreground/80 hover:text-foreground ${UNDERLINE}`}
                  >
                    {link.label}
                    {external && (
                      <span className="sr-only"> (nouvel onglet)</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div data-footer="column" className="col-span-2 md:col-span-2">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            Heure locale
          </h2>
          {/* Une seule ligne sur mobile (ville · heure), empilée dans la colonne étroite du desktop. */}
          <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm md:flex-col md:items-start">
            <span className="text-foreground/80">{CITY}</span>
            <span className="flex items-center gap-2 font-mono">
              {/* Point qui respire : le site est « en direct ». */}
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <time ref={clock}>--:--</time>
            </span>
          </p>
        </div>
      </div>

      <Wordmark />
      {/* Une seule ligne à toutes les tailles : le © à gauche, le bouton rond à droite. */}
      <div
        data-footer="bar"
        className="relative flex items-center justify-between gap-6 border-t border-border/60 py-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground"
      >
        <p>
          © <span ref={year} />
          Léon Cha
        </p>
        <button
          type="button"
          onClick={backToTop}
          aria-label="Retour en haut"
          className="group grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-secondary text-foreground transition-[background-color,border-color] duration-300 hover:border-primary/50 hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none"
        >
          <ArrowIcon className="-rotate-90 transition-transform duration-300 group-hover:-translate-y-0.5 motion-reduce:transition-none" />
        </button>
      </div>
    </footer>
  );
}
