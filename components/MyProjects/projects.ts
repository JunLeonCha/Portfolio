import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/** Données neutres d'un projet (indépendantes de la langue) : les textes sont dans les dictionnaires. */
type ProjectBase = {
  /** Identifiant d'URL : la page du projet est /<langue>/projets/<slug>. */
  slug: string;
  title: string;
  /** Facultative : sans année, seul le type s'affiche au-dessus du titre. */
  year?: string;
  /** Capture au format 16:10, dans /public (ex. "/images/projects/mon-projet.png"). Sans image : emplacement réservé. */
  image?: string;
  /**
   * Cadrage de la capture quand elle n'est pas en 16:10 (elle est recadrée pour remplir) :
   * partie à garder visible, en valeur CSS object-position ("left", "right top", "30% 50%"…). Défaut : centre.
   */
  imagePosition?: string;
  /** Captures supplémentaires, affichées sur la page du projet (la couverture n'y est pas répétée). Légendes : `gallery` du dictionnaire. */
  gallery?: string[];
  tags?: string[];
};

export type ProjectShot = {
  src: string;
  alt: string;
};

/** Un projet dans une langue donnée, prêt à être affiché. */
export type Project = Omit<ProjectBase, "gallery"> & {
  /** Nature du projet : « Application SaaS », « Site vitrine », « Prototype »… */
  type: string;
  description: string;
  /** Points forts, affichés sur la page du projet. */
  highlights?: string[];
  /** Texte de l'emplacement quand il n'y a pas de capture (par défaut : « Aperçu à venir »). */
  noImageLabel?: string;
  gallery?: ProjectShot[];
};

/**
 * Le premier projet est mis en avant (grande carte, texte à côté de la capture),
 * les deux suivants s'affichent en grille (les plus valorisants en tête). La page /projets présente la liste complète.
 */
export const PROJECT_BASES: ProjectBase[] = [
  {
    slug: "aria",
    title: "Aria",
    tags: [
      "React",
      "Motion",
      "Tailwind CSS",
      "Framer Motion",
      "PostgreSQL",
      "AdonisJS",
      "SeaweedFS",
      "Dokploy",
      "Docker",
      "Agent IA",
    ],
    image: "/images/projects/Aria.png",
    // Capture très large : calée à gauche, elle garde la barre latérale et les trois aperçus.
    imagePosition: "left",
  },
  {
    slug: "webhookinbox",
    title: "WebhookInbox",
    tags: [
      "JavaScript",
      "Fastify",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Agent IA",
      "Docker",
    ],
    image: "/images/projects/webhookinbox/historique.png",
    gallery: [
      "/images/projects/webhookinbox/evenement.png",
      "/images/projects/webhookinbox/replay.png",
      "/images/projects/webhookinbox/diagnostic.png",
      "/images/projects/webhookinbox/reglages.png",
    ],
  },
  {
    slug: "moodspace",
    title: "MoodSpace",
    tags: [
      "Angular 21",
      "Fabric.js",
      "Elixir",
      "Phoenix",
      "PostgreSQL",
      "SeaweedFS",
      "Docker",
    ],
    image: "/images/projects/moodspace/editeur.png",
    gallery: [
      "/images/projects/moodspace/projets.png",
      "/images/projects/moodspace/inspecteur.png",
      "/images/projects/moodspace/reperes.png",
      "/images/projects/moodspace/presentation.png",
      "/images/projects/moodspace/demo-locale.png",
    ],
  },
  {
    slug: "burnnote",
    title: "BurnNote",
    tags: [
      "Rust",
      "Axum",
      "SQLx",
      "PostgreSQL",
      "React",
      "Vite",
      "WebCrypto",
      "Docker",
    ],
    image: "/images/projects/burnnote/lien.png",
    gallery: [
      "/images/projects/burnnote/creation.png",
      "/images/projects/burnnote/note-revelee.png",
      "/images/projects/burnnote/passphrase.png",
      "/images/projects/burnnote/historique.png",
    ],
  },
  {
    slug: "blastradius",
    title: "BlastRadius",
    tags: [
      "Angular 21",
      "NestJS",
      "TypeScript",
      "PostgreSQL",
      "Nginx",
      "Docker",
    ],
    image: "/images/projects/blastradius/simulation.png",
    imagePosition: "top",
    gallery: [
      "/images/projects/blastradius/editeur.png",
      "/images/projects/blastradius/cycle.png",
      "/images/projects/blastradius/tableau-de-bord.png",
    ],
  },
  {
    slug: "mots-mines",
    title: "Mots Minés",
    tags: [
      "Angular 21",
      "Colyseus",
      "TypeScript",
      "WebSocket",
      "Playwright",
      "Docker",
    ],
    image: "/images/projects/mots-mines/arene.png",
    gallery: [
      "/images/projects/mots-mines/accueil.png",
      "/images/projects/mots-mines/salon.png",
      "/images/projects/mots-mines/dix-joueurs.png",
    ],
  },
  {
    slug: "approveflow",
    title: "ApproveFlow",
    tags: ["Java", "Spring Boot", "PostgreSQL", "React", "Docker"],
    image: "/images/projects/approveflow/tableau-de-bord.png",
    gallery: [
      "/images/projects/approveflow/demande.png",
      "/images/projects/approveflow/a-approuver.png",
      "/images/projects/approveflow/membres.png",
      "/images/projects/approveflow/audit.png",
    ],
  },
  {
    slug: "csvclinic",
    title: "CSVClinic",
    tags: [
      "Python",
      "FastAPI",
      "Pandas",
      "SQLAlchemy",
      "PostgreSQL",
      "React",
      "Docker",
    ],
    image: "/images/projects/csvclinic/rapport.png",
    imagePosition: "top",
    gallery: [
      "/images/projects/csvclinic/importer.png",
      "/images/projects/csvclinic/historique.png",
    ],
  },
  {
    slug: "assetflow",
    title: "AssetFlow",
    tags: [
      "C#",
      "ASP.NET Core",
      "EF Core",
      "PostgreSQL",
      "React",
      "Tailwind CSS",
      "Docker",
    ],
  },
  {
    slug: "exano",
    title: "Exano",
    tags: ["Angular", "RxJS", "Cypress"],
  },
  {
    slug: "saint-gobain",
    title: "Saint-Gobain",
    tags: ["Angular", "Django"],
  },
  {
    slug: "cepac",
    title: "CEPAC",
    tags: [".NET 7-8", "Knockout.js"],
  },
  {
    slug: "argus",
    title: "Argus",
  },
  {
    slug: "monster-triad",
    title: "Monster Triad",
    tags: [
      "Next.js",
      "TypeScript",
      "PostgreSQL",
      "Drizzle ORM",
      "Better Auth",
      "Socket.IO",
      "GSAP",
    ],
    image: "/images/projects/Monster-Triad.png",
  },
  {
    slug: "dog-stories-k9",
    title: "Dog Stories K9",
    tags: ["SolidJS", "Tailwind CSS", "GSAP"],
    image: "/images/projects/dog-stories.png",
  },
  {
    slug: "studio-golri",
    title: "Studio Golri",
    tags: ["Next.js", "Tailwind CSS", "Supabase", "Stripe"],
    image: "/images/projects/StudioGolri.png",
  },
  {
    slug: "slam-dunk-allstars",
    title: "Slam Dunk AllStars",
    tags: ["Flutter", "Supabase"],
    image: "/images/projects/SlamDunkAllstars.png",
  },
  {
    slug: "outing-booker",
    title: "Outing Booker",
    tags: ["React", "Supabase", "Node.js"],
    image: "/images/projects/OutingBooker.png",
  },
  {
    slug: "plume",
    title: "Plume",
    tags: ["Kotlin", "Android SDK", "Gradle"],
  },
];

/** Nombre de projets mis en avant sur l'accueil (défini ici : importé côté serveur, il ne doit pas venir d'un composant client). */
export const FEATURED_COUNT = 3;

/** Tous les slugs, pour `generateStaticParams`. */
export const PROJECT_SLUGS = PROJECT_BASES.map(({ slug }) => slug);

/** Les projets dans la langue du dictionnaire, dans l'ordre d'affichage. */
export function getProjects(dict: Dictionary["projects"]): Project[] {
  return PROJECT_BASES.map(({ gallery, tags, ...base }) => {
    const text = dict.items[base.slug];
    return {
      ...base,
      type: text.type,
      description: text.description,
      highlights: text.highlights,
      noImageLabel: text.noImageLabel,
      tags: tags?.map((tag) => dict.tagLabels[tag] ?? tag),
      gallery: gallery?.map((src, i) => ({
        src,
        alt: text.gallery?.[i] ?? base.title,
      })),
    };
  });
}

export const projectHref = (lang: Locale, project: Pick<Project, "slug">) =>
  localePath(lang, `/projets/${project.slug}`);
