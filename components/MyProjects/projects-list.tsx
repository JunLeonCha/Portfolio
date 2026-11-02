"use client";

import { useRef } from "react";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { ProjectCard } from "./project-card";
import { PROJECTS } from "./projects";

export default function ProjectsList() {
  const root = useRef<HTMLElement>(null);

  useScrollReveal(root, (tl) => {
    tl.from("[data-projects='title']", { y: 30, autoAlpha: 0 })
      .from("[data-projects='intro']", { y: 20, autoAlpha: 0 }, "<0.15")
      .from(
        "[data-projects='card']",
        { y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.06 },
        "<0.2",
      );
  });

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
        Tous les{" "}
        {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
        <span className="font-serif italic font-normal pr-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
          projets
        </span>
      </h1>
      <p data-projects="intro" className="mt-6 max-w-2xl text-muted-foreground">
        {PROJECTS.length} projets : sites, applications web et mobiles, produits
        SaaS et prototypes. Chaque fiche détaille les choix techniques et
        présente des captures de l&apos;application.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {PROJECTS.map((project, i) => (
          <ProjectCard
            key={project.slug}
            project={project}
            inGrid
            // Première rangée (deux colonnes) : visible sans défiler.
            eager={i < 2}
          />
        ))}
      </div>
    </section>
  );
}
