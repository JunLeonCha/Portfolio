export type Project = {
  title: string;
  /** Facultative : sans année, seul le type s'affiche au-dessus du titre. */
  year?: string;
  /** Nature du projet : « Application SaaS », « Site vitrine », « Prototype »… */
  type: string;
  description: string;
  /** Capture au format 16:10, dans /public (ex. "/images/projects/mon-projet.png"). Sans image : emplacement réservé. */
  image?: string;
  /**
   * Cadrage de la capture quand elle n'est pas en 16:10 (elle est recadrée pour remplir) :
   * partie à garder visible, en valeur CSS object-position ("left", "right top", "30% 50%"…). Défaut : centre.
   */
  imagePosition?: string;
  tags?: string[];
  /** Lien vers le projet : externe (https://…) ou interne (/projets/…). Sans lien : pas de bouton. */
  href?: string;
};

/**
 * Le premier projet est mis en avant (grande carte, texte à côté de la capture),
 * les deux suivants s'affichent en grille. La modale présente la liste complète.
 */
export const PROJECTS: Project[] = [
  {
    title: "Aria",
    type: "Visual Builder",
    description:
      "Développement d'un CMS moderne permettant de construire et administrer des sites web sans dépendre d'une solution existante. L'application repose sur un frontend React/TailwindCSS, un backend en Adonis 7 et PostgreSQL. Elle inclut un système de gestion de contenu modulaire, des composants réutilisables, des animations configurables avec Framer Motion. L'application est également conçue pour être déployée sur un cluster Kubernetes avec Dokploy et SeaweedFS, offrant ainsi une solution complète pour la création et la gestion de sites web.",
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
    title: "Monster Triad",
    type: "Jeu de cartes web",
    description:
      "Projet personnel de jeu de cartes stratégique inspiré de Triple Triad et de l'univers Monster Hunter. L'application propose des affrontements sur un plateau 3 × 3, un mode solo contre l'IA, une collection de cartes, la création de decks et un système de fabrication à partir de matériaux. Des duels privés en temps réel via Socket.IO complètent l'expérience. Un dashboard d'administration permet de gérer le catalogue et les adversaires IA.",
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
    title: "Dog Stories K9",
    type: "Site vitrine",
    description:
      "Dog Stories K9 est un site vitrine développé pour un éducateur canin indépendant lors du lancement de son activité à Cholet. Le projet avait pour objectif de créer une présence digitale claire et professionnelle afin d'améliorer sa visibilité, présenter ses prestations et faciliter la prise de contact avec de nouveaux clients.",
    tags: ["SolidJS", "Tailwind CSS", "GSAP"],
    image: "/images/projects/dog-stories.png",
  },
  {
    title: "Studio Golri",
    type: "Application IceBreaker",
    description:
      "Projet réalisé dans le cadre de notre cursus, sous la forme d'une simulation de création de startup. L'objectif était de concevoir un SaaS destiné aux entreprises pour favoriser les échanges, la cohésion d'équipe et les moments de convivialité grâce à des jeux numériques interactifs. Au-delà du développement, le projet comprenait une étude de marché, la définition d'un business model, la gestion d'un budget prévisionnel ainsi que la préparation d'une stratégie de lancement. L'application proposait notamment « La Taupe », un jeu inspiré du Loup-Garou.",
    tags: ["Next.js", "Tailwind CSS", "Supabase", "Stripe"],
    image: "/images/projects/StudioGolri.png",
  },
  {
    title: "Slam Dunk AllStars",
    type: "Application mobile",
    description:
      "Projet réalisé dans le cadre de mon cursus afin de découvrir le développement mobile avec Flutter. Création d'une application destinée aux passionnés de basketball permettant de consulter des informations et statistiques sur les joueurs grâce à la consommation d'une API externe. Le projet m'a permis d'expérimenter la conception d'interfaces mobiles, la récupération de données en temps réel et l'intégration d'un service backend avec Supabase.",
    tags: ["Flutter", "Supabase"],
    image: "/images/projects/SlamDunkAllstars.png",
  },
  {
    title: "Outing Booker",
    type: "Application de réservation",
    description:
      "Projet réalisé en groupe dans le cadre de mon cursus autour de la conception d'une application de réservation d'activités et d'événements. L'objectif était de centraliser la recherche d'expériences (concerts, loisirs, sorties) en proposant également des solutions complémentaires comme le transport et l'hébergement. L'application s'appuie sur l'intégration de plusieurs APIs externes telles que Ticketmaster, BlaBlaCar, SNCF et Airbnb afin d'enrichir l'expérience utilisateur et faciliter l'organisation d'une sortie.",
    tags: ["React", "Supabase", "Node.js"],
    image: "/images/projects/OutingBooker.png",
  },
  {
    title: "Plume",
    type: "Prototype Android",
    description:
      "Projet personnel de clavier Android natif en Kotlin, conçu pour évoluer vers une assistance à l'écriture entièrement locale. Le premier prototype implémente un clavier AZERTY minimal, un écran d'activation et un champ de test, sans accès Internet. La correction et la reformulation à l'aide d'un modèle d'IA embarqué sont prévues pour les prochaines étapes.",
    tags: ["Kotlin", "Android SDK", "Gradle"],
  },
];
