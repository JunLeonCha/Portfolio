"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { format, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { ProjectCard } from "./project-card";
import type { Project } from "./projects";

/** Nombre de projets affichés au départ, puis ajoutés à chaque palier. */
const PAGE_SIZE = 10;

export default function ProjectsList({
  projects,
  lang,
  dict,
}: {
  projects: Project[];
  lang: Locale;
  dict: Dictionary["projects"];
}) {
  const root = useRef<HTMLElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState(PAGE_SIZE);
  const shown = Math.min(count, projects.length);
  const done = shown >= projects.length;
  // Première valeur de `shown` : les cartes déjà là sont animées par useScrollReveal.
  const previous = useRef(shown);

  useScrollReveal(root, (tl) => {
    tl.from("[data-projects='title']", { y: 30, autoAlpha: 0 }).from(
      "[data-projects='card']",
      { y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.06 },
      "<0.2",
    );
  });

  // Charge le palier suivant quand le bouton approche de l'écran (défilement infini).
  // Le bouton reste cliquable : clavier, lecteur d'écran, ou IntersectionObserver indisponible.
  useEffect(() => {
    const el = more.current;
    if (!el || done || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setCount((c) => c + PAGE_SIZE);
      },
      { rootMargin: "0px 0px 600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // `shown` relance l'observation : si le bouton est encore visible après l'ajout, on enchaîne.
  }, [done, shown]);

  // Les cartes ajoutées après coup apparaissent en fondu (rien en mouvement réduit).
  useEffect(() => {
    const from = previous.current;
    previous.current = shown;
    if (shown === from || !root.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const added = Array.from(
      root.current.querySelectorAll("[data-projects='card']"),
    ).slice(from);
    gsap.from(added, {
      y: 30,
      autoAlpha: 0,
      duration: 0.7,
      ease: "power3.out",
      stagger: 0.05,
      clearProps: "transform,opacity,visibility",
    });
  }, [shown]);

  return (
    <section
      ref={root}
      aria-labelledby="projets-title"
      className="pt-36 pb-24 md:pt-44"
    >
      <h1
        id="projets-title"
        data-projects="title"
        className="text-[3.5rem] xl:text-[5rem] leading-none tracking-tight"
      >
        {dict.titleStart}{" "}
        {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
        <span className="font-serif italic font-normal pr-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
          {dict.titleAccent}
        </span>
      </h1>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {projects.slice(0, shown).map((project, i) => (
          <ProjectCard
            key={project.slug}
            project={project}
            lang={lang}
            dict={dict}
            inGrid
            // Première rangée (deux colonnes) : visible sans défiler.
            eager={i < 2}
          />
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {format(dict.loadedStatus, { shown, total: projects.length })}
      </p>

      {!done && (
        <div className="mt-12 flex justify-center">
          <button
            ref={more}
            type="button"
            onClick={() => setCount((c) => c + PAGE_SIZE)}
            className="rounded-full border border-border px-6 py-3 text-sm text-muted-foreground transition-colors duration-300 hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
          >
            {dict.loadMore}
          </button>
        </div>
      )}
    </section>
  );
}
