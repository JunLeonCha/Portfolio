"use client";

import { useRef } from "react";
import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { ProjectCard } from "./project-card";
import { FEATURED_COUNT, type Project } from "./projects";

export default function MyProjects({
  projects,
  total,
  lang,
  dict,
}: {
  /** Les projets mis en avant (les premiers de la liste). */
  projects: Project[];
  /** Nombre total de projets du portfolio. */
  total: number;
  lang: Locale;
  dict: Dictionary["projects"];
}) {
  const root = useRef<HTMLElement>(null);
  const [featured, ...others] = projects;

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
        {dict.titleStart}{" "}
        {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
        <span className="font-serif italic font-normal pr-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
          {dict.titleAccent}
        </span>
      </h2>

      <div className="mt-12 flex flex-col gap-4">
        <ProjectCard
          project={featured}
          lang={lang}
          dict={dict}
          featured
          eager
        />
        {others.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {others.map((project, i) => (
              <ProjectCard
                key={`${project.title}-${i}`}
                project={project}
                lang={lang}
                dict={dict}
              />
            ))}
          </div>
        )}
      </div>
      {total > FEATURED_COUNT && (
        <div className="mt-10 flex justify-center">
          <Link
            href={localePath(lang, "/projets")}
            className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
          >
            {dict.viewAll}
          </Link>
        </div>
      )}
    </section>
  );
}
