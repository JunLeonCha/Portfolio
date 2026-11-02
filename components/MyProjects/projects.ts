export type ProjectShot = {
  src: string;
  alt: string;
};

export type Project = {
  /** Identifiant d'URL : la page du projet est /projets/<slug>. */
  slug: string;
  title: string;
  /** Facultative : sans année, seul le type s'affiche au-dessus du titre. */
  year?: string;
  /** Nature du projet : « Application SaaS », « Site vitrine », « Prototype »… */
  type: string;
  description: string;
  /** Points forts, affichés sur la page du projet. */
  highlights?: string[];
  /** Capture au format 16:10, dans /public (ex. "/images/projects/mon-projet.png"). Sans image : emplacement réservé. */
  image?: string;
  /**
   * Cadrage de la capture quand elle n'est pas en 16:10 (elle est recadrée pour remplir) :
   * partie à garder visible, en valeur CSS object-position ("left", "right top", "30% 50%"…). Défaut : centre.
   */
  imagePosition?: string;
  /** Captures supplémentaires, affichées sur la page du projet (la couverture n'y est pas répétée). */
  gallery?: ProjectShot[];
  tags?: string[];
};

/**
 * Le premier projet est mis en avant (grande carte, texte à côté de la capture),
 * les deux suivants s'affichent en grille (les plus valorisants en tête). La page /projets présente la liste complète.
 */
export const PROJECTS: Project[] = [
  {
    slug: "aria",
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
    slug: "webhookinbox",
    title: "WebhookInbox",
    type: "Capture de webhooks avec assistant IA",
    description:
      "Outil pour capturer des webhooks, les inspecter, les transférer vers un service vérifié et rejouer les échecs après confirmation. Un assistant IA consulte l'historique en lecture seule pour expliquer pourquoi une livraison a échoué, en citant les identifiants réels. Le transfert est protégé contre le SSRF : la destination doit être prouvée par un enregistrement DNS ou un fichier de confirmation.",
    highlights: [
      "URL de réception secrète par inbox, en-têtes sensibles masqués",
      "Transferts vers une destination vérifiée, avec code HTTP, latence et erreur conservés",
      "Replay des échecs après confirmation explicite, sans modifier l'événement d'origine",
      "Assistant de diagnostic compatible OpenAI, Anthropic, Ollama et LM Studio",
      "Architecture en couches, SQL explicite et workers avec FOR UPDATE SKIP LOCKED",
    ],
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
      {
        src: "/images/projects/webhookinbox/evenement.png",
        alt: "Premier événement reçu",
      },
      {
        src: "/images/projects/webhookinbox/replay.png",
        alt: "Transferts et replay",
      },
      {
        src: "/images/projects/webhookinbox/diagnostic.png",
        alt: "Diagnostic d'une livraison",
      },
      {
        src: "/images/projects/webhookinbox/reglages.png",
        alt: "Réglages de l'espace",
      },
    ],
  },
  {
    slug: "moodspace",
    title: "MoodSpace",
    type: "Studio de moodboards",
    description:
      "Studio visuel pour rassembler des images, des mots et des couleurs, composer un moodboard et partager une direction artistique. L'éditeur Angular et Fabric.js propose des repères magnétiques (alignement, distances en pixels, espacements égaux), un historique et un export PNG. L'application existe en deux versions : une démo autonome qui stocke tout dans le navigateur, et une version Elixir/Phoenix avec comptes, stockage des images sur SeaweedFS et collaboration à distance.",
    highlights: [
      "Éditeur de composition avec repères magnétiques X/Y, objets tournés et sélections multiples",
      "Deux architectures derrière un même port Backend : LocalBackend (localStorage) ou HttpBackend (API Phoenix)",
      "Projets, boards, bibliothèque d'images, historique et export PNG",
      "Liens de présentation publics et invitations de membres",
      "Démo statique sans compte, ni base de données, ni API",
    ],
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
      {
        src: "/images/projects/moodspace/projets.png",
        alt: "Galerie de projets",
      },
      {
        src: "/images/projects/moodspace/inspecteur.png",
        alt: "Inspecteur des propriétés d'un objet",
      },
      {
        src: "/images/projects/moodspace/reperes.png",
        alt: "Repères magnétiques pendant un déplacement",
      },
      {
        src: "/images/projects/moodspace/presentation.png",
        alt: "Présentation publique d'un board",
      },
      {
        src: "/images/projects/moodspace/demo-locale.png",
        alt: "Démo locale avec stockage dans le navigateur",
      },
    ],
  },
  {
    slug: "burnnote",
    title: "BurnNote",
    type: "Partage de notes à lecture unique",
    description:
      "Application de partage de secrets : on écrit une note, on obtient un lien aléatoire, et le destinataire ne peut la lire qu'une seule fois avant sa suppression définitive. La version 2 ajoute une passphrase (trois erreurs et la note est détruite), un chiffrement de bout en bout dans le navigateur avec WebCrypto, ainsi que des comptes avec historique et révocation. L'API Rust chiffre les notes avec XChaCha20-Poly1305.",
    highlights: [
      "Page de réception neutre : les aperçus de liens ne peuvent pas « brûler » la note",
      "Token de 256 bits placé dans le fragment de l'URL, jamais envoyé au serveur",
      "Chiffrement côté client facultatif (AES-256-GCM) : le serveur ne stocke qu'un blob illisible",
      "Réponse générique identique pour une note lue, expirée ou inventée",
      "Comptes avec Argon2id, historique des notes et révocation",
    ],
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
      {
        src: "/images/projects/burnnote/creation.png",
        alt: "Création d'une note",
      },
      {
        src: "/images/projects/burnnote/note-revelee.png",
        alt: "Note révélée une seule fois",
      },
      {
        src: "/images/projects/burnnote/passphrase.png",
        alt: "Passphrase requise",
      },
      {
        src: "/images/projects/burnnote/historique.png",
        alt: "Historique des notes du compte",
      },
    ],
  },
  {
    slug: "blastradius",
    title: "BlastRadius",
    type: "Simulateur d'impact de panne",
    description:
      "Outil pour dessiner l'architecture d'une application (frontend, API, base de données, worker, file de messages, service externe), déclarer qui dépend de qui, puis simuler la panne d'un composant. Un parcours inverse du graphe calcule les composants potentiellement exposés, leur distance et leur chemin de propagation. Chaque simulation est figée dans un historique, et un résultat périmé est signalé plutôt que recalculé en silence.",
    highlights: [
      "Éditeur graphique avec glisser-déposer et alternative complète au clavier",
      "Refus des auto-dépendances, des doublons et des cycles avec un message explicite",
      "Simulation par parcours en largeur : statut, nombre de sauts et chemin de propagation",
      "Historique des simulations et tableau de bord des composants les plus exposés",
      "Espaces de travail strictement privés, session serveur en cookie HttpOnly",
    ],
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
      {
        src: "/images/projects/blastradius/editeur.png",
        alt: "Éditeur de composants",
      },
      {
        src: "/images/projects/blastradius/cycle.png",
        alt: "Refus d'une dépendance cyclique",
      },
      {
        src: "/images/projects/blastradius/tableau-de-bord.png",
        alt: "Tableau de bord de l'espace",
      },
    ],
  },
  {
    slug: "mots-mines",
    title: "Mots Minés",
    type: "Jeu de mots multijoueur",
    description:
      "Jeu de mots en français pour 2 à 10 joueurs, sans inscription. Il faut trouver un mot contenant le fragment imposé pour passer la bombe, mais huit mots secrets sont piégés à chaque tour : un piège ou le temps écoulé fait perdre une vie. Le serveur Colyseus garde la main sur le chrono, les pièges et la validation des mots grâce à un lexique local, et ne révèle jamais les mots piégés au navigateur.",
    highlights: [
      "Parties temps réel de 2 à 10 joueurs, sans compte ni base de données",
      "Serveur autoritaire : chrono, pièges et validation des mots restent côté serveur",
      "Lexique français compilé en local, aucun appel externe pendant la partie",
      "Arène circulaire adaptée de 320 px de large jusqu'au bureau, sur une seule hauteur d'écran",
      "Domaine indépendant des frameworks, parcours testés avec Playwright",
    ],
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
      {
        src: "/images/projects/mots-mines/accueil.png",
        alt: "Accueil : pseudo, avatar et salon",
      },
      {
        src: "/images/projects/mots-mines/salon.png",
        alt: "Salon avec invitation et joueurs prêts",
      },
      {
        src: "/images/projects/mots-mines/dix-joueurs.png",
        alt: "Arène à dix joueurs",
      },
    ],
  },
  {
    slug: "approveflow",
    title: "ApproveFlow",
    type: "Workflows de validation internes",
    description:
      "Application de demandes d'achat et d'approbations pour les petites équipes, avec un historique d'audit exploitable. Un demandeur crée et soumet une demande, l'approbateur l'accepte ou la rejette avec un motif, et l'administrateur gère les membres, les catégories et le journal d'audit exportable en CSV. Les invitations fonctionnent par consentement : un lien à usage unique, renouvelable ou révocable.",
    highlights: [
      "Trois rôles : demandeur, approbateur et administrateur, avec plusieurs espaces d'équipe",
      "Brouillon, soumission, approbation, rejet motivé et annulation avant décision",
      "Invitations à usage unique avec expiration, renouvellement et révocation",
      "Journal d'audit filtrable, export CSV de 5 000 lignes au plus",
      "Formulaires accessibles : erreurs liées aux champs, sélection d'une personne au clavier",
    ],
    tags: ["Java", "Spring Boot", "PostgreSQL", "React", "Docker"],
    image: "/images/projects/approveflow/tableau-de-bord.png",
    gallery: [
      {
        src: "/images/projects/approveflow/demande.png",
        alt: "Fiche d'une demande",
      },
      {
        src: "/images/projects/approveflow/a-approuver.png",
        alt: "Boîte « À approuver »",
      },
      {
        src: "/images/projects/approveflow/membres.png",
        alt: "Membres et invitations",
      },
      { src: "/images/projects/approveflow/audit.png", alt: "Journal d'audit" },
    ],
  },
  {
    slug: "csvclinic",
    title: "CSVClinic",
    type: "SaaS de nettoyage de CSV",
    description:
      "Application pour importer un fichier CSV, choisir des règles de nettoyage (espaces, valeurs vides, doublons) et récupérer un fichier corrigé avec un rapport avant/après reproductible. Le traitement est asynchrone grâce à un worker et un ordonnanceur, avec suivi en direct. Les règles peuvent être enregistrées comme profils versionnés, et les formules de tableur sont neutralisées dans l'export.",
    highlights: [
      "Aperçu et détection de l'en-tête avant traitement, limites de taille annoncées dès l'import",
      "Traitement asynchrone avec file d'attente, worker et progression en direct",
      "Rapport détaillé : lignes entrantes et sortantes, doublons, cellules modifiées, formules neutralisées",
      "Profils de règles versionnés, avec historique des changements",
      "Purge automatique des fichiers à expiration",
    ],
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
      {
        src: "/images/projects/csvclinic/importer.png",
        alt: "Import d'un fichier",
      },
      {
        src: "/images/projects/csvclinic/historique.png",
        alt: "Historique des fichiers",
      },
    ],
  },
  {
    slug: "assetflow",
    title: "AssetFlow",
    type: "Gestion de prêts de matériel",
    description:
      "Application de suivi du matériel pour les petites structures : qui utilise quel équipement, et quand doit-il être restitué. Elle gère un catalogue d'actifs identifiés individuellement, les prêts avec échéance, les retards et l'historique complet. La V2 ajoute les réservations, les étiquettes QR imprimables et un centre de notifications. Un actif ne peut avoir qu'un prêt en cours, même sous requêtes simultanées.",
    highlights: [
      "Catalogue avec code d'inventaire unique par espace et numéro de série",
      "Prêts, retours et retards calculés à la lecture, historique consultable",
      "Réservations sans chevauchement possible, même sous requêtes simultanées",
      "Étiquettes QR imprimables qui renvoient vers la fiche de l'actif",
      "Trois rôles vérifiés côté API : collaborateur, gestionnaire, administrateur",
    ],
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
    slug: "monster-triad",
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
    slug: "dog-stories-k9",
    title: "Dog Stories K9",
    type: "Site vitrine",
    description:
      "Dog Stories K9 est un site vitrine développé pour un éducateur canin indépendant lors du lancement de son activité à Cholet. Le projet avait pour objectif de créer une présence digitale claire et professionnelle afin d'améliorer sa visibilité, présenter ses prestations et faciliter la prise de contact avec de nouveaux clients.",
    tags: ["SolidJS", "Tailwind CSS", "GSAP"],
    image: "/images/projects/dog-stories.png",
  },
  {
    slug: "studio-golri",
    title: "Studio Golri",
    type: "Application IceBreaker",
    description:
      "Projet réalisé dans le cadre de notre cursus, sous la forme d'une simulation de création de startup. L'objectif était de concevoir un SaaS destiné aux entreprises pour favoriser les échanges, la cohésion d'équipe et les moments de convivialité grâce à des jeux numériques interactifs. Au-delà du développement, le projet comprenait une étude de marché, la définition d'un business model, la gestion d'un budget prévisionnel ainsi que la préparation d'une stratégie de lancement. L'application proposait notamment « La Taupe », un jeu inspiré du Loup-Garou.",
    tags: ["Next.js", "Tailwind CSS", "Supabase", "Stripe"],
    image: "/images/projects/StudioGolri.png",
  },
  {
    slug: "slam-dunk-allstars",
    title: "Slam Dunk AllStars",
    type: "Application mobile",
    description:
      "Projet réalisé dans le cadre de mon cursus afin de découvrir le développement mobile avec Flutter. Création d'une application destinée aux passionnés de basketball permettant de consulter des informations et statistiques sur les joueurs grâce à la consommation d'une API externe. Le projet m'a permis d'expérimenter la conception d'interfaces mobiles, la récupération de données en temps réel et l'intégration d'un service backend avec Supabase.",
    tags: ["Flutter", "Supabase"],
    image: "/images/projects/SlamDunkAllstars.png",
  },
  {
    slug: "outing-booker",
    title: "Outing Booker",
    type: "Application de réservation",
    description:
      "Projet réalisé en groupe dans le cadre de mon cursus autour de la conception d'une application de réservation d'activités et d'événements. L'objectif était de centraliser la recherche d'expériences (concerts, loisirs, sorties) en proposant également des solutions complémentaires comme le transport et l'hébergement. L'application s'appuie sur l'intégration de plusieurs APIs externes telles que Ticketmaster, BlaBlaCar, SNCF et Airbnb afin d'enrichir l'expérience utilisateur et faciliter l'organisation d'une sortie.",
    tags: ["React", "Supabase", "Node.js"],
    image: "/images/projects/OutingBooker.png",
  },
  {
    slug: "plume",
    title: "Plume",
    type: "Prototype Android",
    description:
      "Projet personnel de clavier Android natif en Kotlin, conçu pour évoluer vers une assistance à l'écriture entièrement locale. Le premier prototype implémente un clavier AZERTY minimal, un écran d'activation et un champ de test, sans accès Internet.",
    tags: ["Kotlin", "Android SDK", "Gradle"],
  },
];

export const projectHref = (project: Project) => `/projets/${project.slug}`;

export const getProject = (slug: string) =>
  PROJECTS.find((project) => project.slug === slug);
