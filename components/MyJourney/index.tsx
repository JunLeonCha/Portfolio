"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { JOURNEY_TABS } from "./journey";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function MyJourney() {
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const firstRender = useRef(true);
  const current = JOURNEY_TABS[active];

  useScrollReveal(root, (tl) => {
    tl.from("[data-journey='title']", { y: 30, autoAlpha: 0 })
      .from("[data-journey='tabs']", { y: 20, autoAlpha: 0 }, "<0.15")
      .from("[data-journey='panel']", { y: 40, autoAlpha: 0 }, "<0.15");
  });

  // Changement d'onglet : les lignes du nouvel onglet arrivent en cascade.
  // (au premier rendu, c'est le scroll reveal qui s'en charge)
  useGSAP(
    () => {
      if (firstRender.current) {
        firstRender.current = false;
        return;
      }
      // Les onglets n'ont pas la même hauteur : les sections en dessous (À propos…) se décalent,
      // il faut recalculer les positions des ScrollTrigger, sinon leur reveal part trop tard.
      ScrollTrigger.refresh();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from("[data-journey='row']", {
        y: 16,
        autoAlpha: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.06,
      });
    },
    { scope: root, dependencies: [active] },
  );

  /** Flèches, Début et Fin : déplacent la sélection et le focus (motif ARIA des onglets). */
  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = JOURNEY_TABS.length - 1;
    const next =
      event.key === "ArrowRight"
        ? active === last
          ? 0
          : active + 1
        : event.key === "ArrowLeft"
          ? active === 0
            ? last
            : active - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section
      ref={root}
      id="parcours"
      aria-labelledby="parcours-title"
      className="scroll-mt-24 py-24"
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <h2
          id="parcours-title"
          data-journey="title"
          className="text-[3.5rem] xl:text-[5rem] leading-none tracking-tight"
        >
          Mon{" "}
          {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
          <span className="font-serif italic font-normal pr-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            parcours
          </span>
        </h2>

        {/* Onglets de même largeur : la pastille glisse d'un cran par onglet, sans mesure en JS. */}
        <div
          data-journey="tabs"
          role="tablist"
          aria-label="Afficher l'expérience ou la formation"
          className="relative grid auto-cols-fr grid-flow-col self-start rounded-full border border-border/50 bg-surface/30 p-1 backdrop-blur-xl md:self-auto"
        >
          <span
            aria-hidden="true"
            style={{
              width: `calc((100% - 0.5rem) / ${JOURNEY_TABS.length})`,
              transform: `translateX(${active * 100}%)`,
            }}
            className="absolute inset-y-1 left-1 rounded-full border border-border bg-surface-elevated transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none"
          />
          {JOURNEY_TABS.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`journey-tab-${tab.id}`}
              aria-selected={i === active}
              aria-controls="journey-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onTabKeyDown}
              className="relative cursor-pointer rounded-full px-6 py-2.5 text-sm text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring aria-selected:text-foreground motion-reduce:transition-none"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        data-journey="panel"
        id="journey-panel"
        role="tabpanel"
        aria-labelledby={`journey-tab-${current.id}`}
        className="mt-12"
      >
        <ol className="border-t border-border/60">
          {current.items.map((item, i) => (
            <li
              key={`${current.id}-${i}`}
              data-journey="row"
              className="grid gap-3 border-b border-border/60 py-8 md:grid-cols-12 md:gap-8"
            >
              <p className="font-mono text-sm uppercase tracking-[0.15em] text-primary md:col-span-3 md:pt-2">
                {item.period}
              </p>
              <div className="md:col-span-4">
                <h3 className="text-2xl tracking-tight">{item.title}</h3>
                <p className="mt-1 text-sm text-primary">{item.organization}</p>
              </div>
              <p className="text-sm text-muted-foreground md:col-span-5 md:pt-2">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
