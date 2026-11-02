"use client";

import { useRef } from "react";
import Link from "next/link";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { ProjectCard } from "./project-card";
import { PROJECTS } from "./projects";

export default function MyProjects() {
  const root = useRef<HTMLElement>(null);
  const [featured, ...others] = PROJECTS.slice(0, 3);

  useScrollReveal(root, (tl) => {
    tl.from("[data-projects='title']", { y: 30, autoAlpha: 0 })
      .from(
        "[data-projects='card']",
        { y: 60, autoAlpha: 0, duration: 1, stagger: 0.15 },
        "<0.2",
      )
      .from(
        "[data-projects='media']",
        {
          // Rideau qui monte sur chaque capture, arrondis conservés (rounded-2xl = 1rem).
          clipPath: "inset(100% 0% 0% 0% round 1rem)",
          duration: 1.2,
          ease: "power4.out",
          stagger: 0.15,
        },
        "<0.1",
      );
  });

  if (!featured) return null;

  return (
    <section
      ref={root}
      id="projets"
      aria-labelledby="projets-title"
      className="scroll-mt-24 py-24"
    >
      <h2
        id="projets-title"
        data-projects="title"
        className="text-[3.5rem] xl:text-[5rem] leading-none tracking-tight"
      >
        Mes{" "}
        {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
        <span className="font-serif italic font-normal pr-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
          réalisations
        </span>
      </h2>

      <div className="mt-12 flex flex-col gap-4">
        <ProjectCard project={featured} featured eager />
        {others.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((project, i) => (
              <ProjectCard key={`${project.title}-${i}`} project={project} />
            ))}
          </div>
        )}
      </div>
      {PROJECTS.length > 3 && (
        <div className="mt-10 flex justify-center">
          <Link
            href="/projets"
            className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
          >
            Voir tous les projets
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs">
              {PROJECTS.length}
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
