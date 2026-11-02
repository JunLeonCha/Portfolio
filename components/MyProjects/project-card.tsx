import Image from "next/image";
import Link from "next/link";
import { projectHref, type Project } from "./projects";

export function ProjectMedia({
  project,
  sizes,
  eager = false,
}: {
  project: Project;
  sizes: string;
  /** Capture visible dès l'arrivée sur la page : chargée tout de suite plutôt que paresseusement. */
  eager?: boolean;
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
          loading={eager ? "eager" : "lazy"}
          sizes={sizes}
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

export function ProjectCard({
  project,
  featured = false,
  inGrid = false,
  eager = false,
}: {
  project: Project;
  featured?: boolean;
  /** Carte visible dès l'arrivée sur la page : sa capture est chargée tout de suite. */
  eager?: boolean;
  /** Grille à deux colonnes (page /projets) : n'influence que la taille d'image demandée. */
  inGrid?: boolean;
}) {
  return (
    <article
      data-projects="card"
      className={`group relative grid gap-6 rounded-3xl border border-border/70 p-2 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-ring motion-reduce:transition-none bg-surface/50 backdrop-blur-sm transition-[border-color,box-shadow] duration-500 hover:border-border hover:shadow-[0_0_40px] hover:shadow-primary/5 ${featured ? "lg:grid-cols-2 lg:items-center" : ""}`}
    >
      <ProjectMedia
        project={project}
        eager={eager}
        sizes={
          inGrid
            ? "(min-width: 1152px) 530px, (min-width: 768px) 46vw, 90vw"
            : "(min-width: 1024px) 50vw, 100vw"
        }
      />

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

        <Link
          href={projectHref(project)}
          // Lien étiré : toute la carte est cliquable, sans imbriquer de liens.
          className={`inline-flex items-center gap-1.5 text-sm text-primary transition-colors duration-300 group-hover:text-primary-hover focus-visible:outline-none after:absolute after:inset-0 after:rounded-3xl motion-reduce:transition-none ${featured ? "mt-8" : "mt-5"}`}
        >
          Voir le projet
          <span className="sr-only">{project.title}</span>
        </Link>
      </div>
    </article>
  );
}
