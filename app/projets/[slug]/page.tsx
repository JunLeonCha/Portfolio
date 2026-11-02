import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProjectGallery from "@/components/MyProjects/project-gallery";
import {
  PROJECTS,
  getProject,
  projectHref,
} from "@/components/MyProjects/projects";

export function generateStaticParams() {
  return PROJECTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  const title = `${project.title} | Léon CHA`;
  return {
    title,
    description: project.description,
    alternates: { canonical: projectHref(project) },
    openGraph: {
      title,
      description: project.description,
      url: projectHref(project),
      ...(project.image && { images: [{ url: project.image }] }),
    },
  };
}

const LABEL =
  "font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground";

const NEIGHBOUR =
  "group flex flex-col gap-2 rounded-2xl border border-border/70 p-5 transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none";

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-4 ${flip ? "rotate-180" : ""}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Shot({
  src,
  alt,
  position,
  eager = false,
}: {
  src: string;
  alt: string;
  position?: string;
  eager?: boolean;
}) {
  return (
    <div className="relative aspect-16/10 overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated/40">
      <Image
        src={src}
        alt={alt}
        fill
        loading={eager ? "eager" : "lazy"}
        sizes="(min-width: 1280px) 1000px, (min-width: 768px) 55vw, 90vw"
        style={{ objectPosition: position }}
        className="object-cover"
      />
    </div>
  );
}

export default function ProjectPage({ params }: PageProps<"/projets/[slug]">) {
  // `params` est une donnée de requête : son accès reste sous Suspense pour garder une coquille instantanée.
  return (
    <main className="px-8 pt-36 pb-24 md:pt-44 xl:px-24">
      <Suspense fallback={<ProjectSkeleton />}>
        {params.then(({ slug }) => (
          <ProjectContent slug={slug} />
        ))}
      </Suspense>
    </main>
  );
}

function ProjectSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-5 w-36 rounded-full bg-surface-elevated/60" />
      <div className="mt-10 h-16 w-2/3 rounded-2xl bg-surface-elevated/60" />
      <div className="mt-12 aspect-16/10 max-w-4xl rounded-2xl bg-surface-elevated/40" />
    </div>
  );
}

function ProjectContent({ slug }: { slug: string }) {
  const project = getProject(slug);
  if (!project) notFound();

  const index = PROJECTS.indexOf(project);
  const previous = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  const { gallery = [], highlights = [], tags = [] } = project;

  return (
    <>
      <Link
        href="/projets"
        className="inline-flex items-center gap-2 rounded-full text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring motion-reduce:transition-none"
      >
        <Arrow flip />
        Tous les projets
      </Link>

      <header className="mt-10 max-w-4xl">
        <p className={LABEL}>
          {project.year ? `${project.year} · ${project.type}` : project.type}
        </p>
        <h1 className="mt-4 text-[3rem] leading-none tracking-tight md:text-[4.5rem] xl:text-[5rem]">
          {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
          <span className="bg-linear-to-r from-primary to-accent bg-clip-text pr-2 font-serif font-normal italic text-transparent">
            {project.title}
          </span>
        </h1>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start xl:gap-16">
        {project.image ? (
          <Shot
            src={project.image}
            alt={`Capture du projet ${project.title}`}
            position={project.imagePosition}
            eager
          />
        ) : (
          <div className="grid aspect-16/10 place-items-center rounded-2xl border border-border/60 bg-surface-elevated/40 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground/60">
            Aperçu à venir
          </div>
        )}

        <aside className="flex flex-col gap-8">
          <section aria-labelledby="about-title">
            <h2 id="about-title" className={LABEL}>
              Le projet
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>
          </section>

          {tags.length > 0 && (
            <section aria-labelledby="stack-title">
              <h2 id="stack-title" className={LABEL}>
                Technologies
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-xs text-primary"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      {highlights.length > 0 && (
        <section aria-labelledby="highlights-title" className="mt-20">
          <h2
            id="highlights-title"
            className="text-2xl tracking-tight md:text-3xl"
          >
            Points <span className="font-serif italic text-primary">clés</span>
          </h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {highlights.map((highlight) => (
              <li
                key={highlight}
                className="rounded-2xl border border-border/70 bg-surface/50 p-5 text-sm leading-relaxed text-muted-foreground"
              >
                {highlight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gallery.length > 0 && (
        <ProjectGallery shots={gallery} title={project.title} />
      )}

      <nav
        aria-label="Autres projets"
        className="mt-24 grid gap-4 border-t border-border/70 pt-10 sm:grid-cols-2"
      >
        <Link href={projectHref(previous)} className={NEIGHBOUR}>
          <span className={`inline-flex items-center gap-2 ${LABEL}`}>
            <Arrow flip />
            Projet précédent
          </span>
          <span className="text-xl tracking-tight group-hover:text-primary">
            {previous.title}
          </span>
        </Link>
        <Link
          href={projectHref(next)}
          className={`${NEIGHBOUR} sm:items-end sm:text-right`}
        >
          <span className={`inline-flex items-center gap-2 ${LABEL}`}>
            Projet suivant
            <Arrow />
          </span>
          <span className="text-xl tracking-tight group-hover:text-primary">
            {next.title}
          </span>
        </Link>
      </nav>
    </>
  );
}
