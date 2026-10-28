"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { pauseBackgroundAnimation } from "@/lib/background-animation";
import { PROJECTS, type Project } from "./projects";

function ProjectMedia({
  project,
  inGallery,
}: {
  project: Project;
  inGallery: boolean;
}) {
  return (
    <div
      data-projects="media"
      className="relative aspect-16/10 overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated/40"
    >
      {project.image ? (
        <Image
          src={project.image}
          alt={`Capture du projet ${project.title}`}
          fill
          sizes={
            inGallery
              ? "(min-width: 1152px) 530px, (min-width: 768px) 46vw, 90vw"
              : "(min-width: 1024px) 50vw, 100vw"
          }
          style={{ objectPosition: project.imagePosition }}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
        />
      ) : (
        <div className="grid h-full place-items-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/60">
          Aperçu à venir
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  featured = false,
  inGallery = false,
}: {
  project: Project;
  featured?: boolean;
  inGallery?: boolean;
}) {
  const external = project.href?.startsWith("http");
  return (
    <article
      data-projects="card"
      className={`group relative grid gap-6 rounded-3xl border border-border/70 p-2 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-ring motion-reduce:transition-none ${inGallery ? "bg-surface-elevated/30 transition-colors duration-300 hover:border-primary/30" : "bg-surface/50 backdrop-blur-sm transition-[border-color,box-shadow] duration-500 hover:border-border hover:shadow-[0_0_40px] hover:shadow-primary/5"} ${featured ? "lg:grid-cols-2 lg:items-center" : ""}`}
    >
      <ProjectMedia project={project} inGallery={inGallery} />

      <div className={featured ? "px-4 pb-6 lg:px-6 lg:py-6" : "px-4 pb-4"}>
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
          {project.year ? `${project.year} · ${project.type}` : project.type}
        </p>
        <h3
          className={`mt-3 tracking-tight ${featured ? "text-3xl" : "text-2xl"}`}
        >
          {project.title}
        </h3>
        <p className="mt-3 w-full text-sm text-muted-foreground">
          {project.description}
        </p>

        {project.tags && project.tags.length > 0 && (
          <ul
            aria-label={`Technologies utilisées pour ${project.title}`}
            className="mt-5 flex flex-wrap gap-2"
          >
            {project.tags.map((tag, i) => (
              <li
                key={`${tag}-${i}`}
                className="rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {project.href && (
          <a
            href={project.href}
            {...(external && { target: "_blank", rel: "noreferrer" })}
            // Lien étiré : toute la carte est cliquable, sans imbriquer de liens.
            className={`inline-flex items-center gap-1.5 text-sm text-primary transition-colors duration-300 group-hover:text-primary-hover focus-visible:outline-none after:absolute after:inset-0 after:rounded-3xl motion-reduce:transition-none ${featured ? "mt-8" : "mt-5"}`}
          >
            Voir le projet
            <span className="sr-only">
              {project.title}
              {external && " (nouvel onglet)"}
            </span>
          </a>
        )}
      </div>
    </article>
  );
}

function ProjectsDialog({
  onClose,
  triggerRef,
}: {
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;

    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    const trigger = triggerRef.current;
    const cursor = document.querySelector<HTMLCanvasElement>(
      "canvas[data-lifestream-cursor]",
    );
    const cursorParent = cursor?.parentNode;
    const resumeBackground = pauseBackgroundAnimation();

    // Le dialogue natif contient le focus, gère Échap et rend la page inerte.
    modal.showModal();
    // Le canvas rejoint le calque supérieur du dialogue, au-dessus des cartes.
    if (cursor) modal.appendChild(cursor);
    html.style.overflow = "hidden";
    title.current?.focus({ preventScroll: true });

    return () => {
      if (cursor?.parentNode === modal && cursorParent) {
        cursorParent.appendChild(cursor);
      }
      modal.close();
      resumeBackground();
      html.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [triggerRef]);

  return (
    <dialog
      ref={dialog}
      id="all-projects-dialog"
      aria-labelledby="all-projects-title"
      aria-describedby="all-projects-description"
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-6xl flex-col overflow-hidden rounded-3xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-background/90 open:flex"
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border/70 px-5 py-5 sm:px-8 sm:py-6">
        <div>
          <h2
            ref={title}
            id="all-projects-title"
            tabIndex={-1}
            className="text-2xl tracking-tight outline-none sm:text-3xl"
          >
            Tous les{" "}
            <span className="font-serif italic text-primary">projets</span>
          </h2>
          <p
            id="all-projects-description"
            className="mt-2 text-sm text-muted-foreground"
          >
            {PROJECTS.length} projets, du web au mobile.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer tous les projets"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
            className="size-5"
          >
            <path d="m6 6 12 12M6 18 18 6" />
          </svg>
        </button>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.title} project={project} inGallery />
          ))}
        </div>
      </div>
    </dialog>
  );
}

export default function MyProjects() {
  const root = useRef<HTMLElement>(null);
  const galleryTrigger = useRef<HTMLButtonElement>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
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
    <>
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
          <ProjectCard project={featured} featured />
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
            <button
              ref={galleryTrigger}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={galleryOpen}
              aria-controls="all-projects-dialog"
              onClick={() => setGalleryOpen(true)}
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-primary/40 bg-primary/5 px-6 py-3 text-sm font-medium text-primary transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
            >
              Voir tous les projets
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-xs">
                {PROJECTS.length}
              </span>
            </button>
          </div>
        )}
      </section>
      {galleryOpen && (
        <ProjectsDialog
          onClose={() => setGalleryOpen(false)}
          triggerRef={galleryTrigger}
        />
      )}
    </>
  );
}
