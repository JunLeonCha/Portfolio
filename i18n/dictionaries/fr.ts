/**
 * Dictionnaire français : la référence. `en.ts` doit avoir exactement la même forme
 * (le compilateur le vérifie via le type `Dictionary`).
 *
 * Balisage léger dans les textes riches (section À propos) :
 *   **texte**  → mis en valeur (champagne)
 *   ++texte++  → mis en valeur (lavande)
 * Variables : `{nom}` est remplacé par `format()`.
 */

export type ProjectText = {
  /** Nature du projet : « Application SaaS », « Site vitrine »… */
  type: string;
  description: string;
  highlights?: string[];
  noImageLabel?: string;
  /** Légendes de la galerie, dans l'ordre de `gallery` dans projects.ts. */
  gallery?: string[];
};

export type JourneyText = {
  id: string;
  label: string;
  items: {
    period: string;
    title: string;
    organization: string;
    description: string;
  }[];
};

export type ServiceText = {
  title: string;
  description: string;
};

export const fr = {
  meta: {
    siteName: "Léon CHA",
    title: "Léon CHA | Développeur Fullstack",
    description:
      "Développeur Fullstack, passionné par le développement web et la création d'expériences interactives.",
    ogAlt: "Léon Cha, développeur Fullstack",
    jobTitle: "Développeur Fullstack",
    projectsTitle: "Projets | Léon CHA",
    projectsDescription:
      "Tous les projets de Léon Cha, développeur Fullstack : applications web, SaaS, mobile et prototypes.",
    projectTitle: "{title} | Léon CHA",
  },

  nav: {
    home: "Accueil",
    services: "Services",
    projects: "Projets",
    about: "À propos",
    contact: "Contact",
    homeLabel: "Léon Cha, retour à l'accueil",
    mainNav: "Navigation principale",
    mobileNav: "Menu mobile",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    languageLabel: "Langue du site",
    languages: { fr: "Français", en: "English" },
  },

  preloader: {
    loading: "Chargement du portfolio…",
  },

  hero: {
    badge: "Développeur Fullstack · Nantes",
    intro:
      "De l'interface à la logique métier, je construis des applications web où les choix techniques servent avant tout le produit et ceux qui l'utilisent.",
    ctaProjects: "Voir mes projets",
    ctaContact: "Me contacter",
    portraitAlt: "Portrait de Léon Cha",
  },

  services: {
    titleStart: "Services &",
    titleAccent: "expertises",
    subtitle: "Le souci du détail, de l'interface jusqu'au code.",
    tagsLabel: "Technologies : {title}",
    /** Libellés de technologies qui changent d'une langue à l'autre (les autres sont des noms propres). */
    tagLabels: {} as Record<string, string>,
    items: {
      frontend: {
        title: "Frontend & interfaces",
        description:
          "Des interfaces soignées, accessibles et rapides, de la maquette jusqu'aux composants réutilisables d'un design system.",
      },
      backend: {
        title: "Backend & bases de données",
        description:
          "Les API, les données et les règles qui font tourner le produit, jusqu'à sa mise en production.",
      },
      performance: {
        title: "Performance, SEO & refonte",
        description:
          "Audit et modernisation d'applications existantes : Core Web Vitals, accessibilité et SEO technique.",
      },
      interactive: {
        title: "Expériences interactives",
        description:
          "Animations et rendus WebGL qui donnent du caractère à un produit",
      },
      ai: {
        title: "Agents IA & automatisation",
        description:
          "Conception d'agents IA et automatisation de tâches : LLM enrichis par les données du projet grâce au RAG, outils connectés via MCP et skills adaptés aux besoins.",
      },
    } as Record<string, ServiceText>,
  },

  projects: {
    titleStart: "Mes",
    titleAccent: "projets",
    viewAll: "Voir tous les projets",
    viewProject: "Voir le projet",
    techFor: "Technologies utilisées pour {title}",
    imageAlt: "Capture du projet {title}",
    comingSoon: "Aperçu à venir",
    loadMore: "Voir plus de projets",
    loadedStatus: "{shown} projets affichés sur {total}",
    /** Libellés de technologies qui changent d'une langue à l'autre (les autres sont des noms propres). */
    tagLabels: {} as Record<string, string>,
    items: {
      aria: {
        type: "Visual Builder",
        description:
          "Un outil pour créer et gérer des sites web, sans dépendre d'une solution toute faite. Il fonctionne comme un éditeur visuel : on construit les pages avec des blocs réutilisables et on peut leur ajouter des animations. Il est aussi prévu pour être mis en ligne sur des serveurs, avec le stockage des images et des fichiers.",
      },
      webhookinbox: {
        type: "Capture de webhooks avec assistant IA",
        description:
          "Un outil pour les développeurs qui reçoivent des messages automatiques d'autres services (des webhooks). Il les enregistre pour qu'on puisse les consulter, les transférer vers une autre adresse et renvoyer ceux qui ont échoué. Un assistant IA lit l'historique pour expliquer pourquoi un envoi n'a pas fonctionné.",
        highlights: [
          "Chaque boîte de réception a sa propre adresse secrète",
          "Les informations sensibles sont masquées automatiquement",
          "Un message en échec peut être renvoyé, après confirmation",
          "L'assistant IA explique les erreurs à partir de l'historique réel",
          "L'assistant peut lire l'historique, mais ne peut rien envoyer ni modifier",
        ],
        gallery: [
          "Premier événement reçu",
          "Transferts et replay",
          "Diagnostic d'une livraison",
          "Réglages de l'espace",
        ],
      },
      moodspace: {
        type: "Studio de moodboards",
        description:
          "Un outil pour composer des moodboards : on rassemble des images, des textes et des couleurs sur une même planche, puis on la partage pour présenter une direction artistique. Les éléments s'alignent facilement quand on les déplace. Il existe en deux versions : une démo qui fonctionne directement dans le navigateur, sans compte, et une version complète avec comptes et partage entre utilisateurs.",
        highlights: [
          "Les éléments s'accrochent et s'alignent entre eux quand on les déplace",
          "Une démo sans compte, et une version complète avec comptes",
          "Plusieurs projets, chacun avec ses planches d'inspiration",
          "Export de la planche en image",
          "Lien de présentation à partager, et invitation d'autres membres",
        ],
        gallery: [
          "Galerie de projets",
          "Inspecteur des propriétés d'un objet",
          "Repères magnétiques pendant un déplacement",
          "Présentation publique d'un board",
          "Démo locale avec stockage dans le navigateur",
        ],
      },
      burnnote: {
        type: "Partage de notes à lecture unique",
        description:
          "Une application pour envoyer un secret (mot de passe, code d'accès...) qui ne peut être lu qu'une seule fois. On écrit la note, on reçoit un lien, et dès que le destinataire l'a lue, elle est effacée. On peut ajouter un mot de passe de protection, ou chiffrer la note dans le navigateur pour que même le serveur ne puisse pas la lire.",
        highlights: [
          "La note est effacée dès la première lecture",
          "Un aperçu du lien dans une messagerie ne la détruit pas par erreur",
          "Avec un mot de passe, la note est détruite après trois erreurs",
          "Option pour chiffrer la note : le serveur ne voit jamais son contenu",
          "Un compte facultatif permet de retrouver l'historique et d'annuler un lien",
        ],
        gallery: [
          "Création d'une note",
          "Note révélée une seule fois",
          "Passphrase requise",
          "Historique des notes du compte",
        ],
      },
      blastradius: {
        type: "Simulateur d'impact de panne",
        description:
          "Un outil pour comprendre ce qui se passe quand une partie d'une application tombe en panne. On dessine les éléments de l'application (site, serveur, base de données...) et on indique lesquels dépendent des autres. En simulant la panne de l'un d'eux, on voit tout de suite quels autres seraient touchés, et par quel chemin.",
        highlights: [
          "Le schéma se construit à la souris, ou entièrement au clavier",
          "Les dépendances qui tournent en boucle sont refusées avec un message clair",
          "Chaque simulation indique les éléments touchés et à combien d'étapes",
          "L'historique garde chaque simulation",
          "Chaque espace de travail est privé",
        ],
        gallery: [
          "Éditeur de composants",
          "Refus d'une dépendance cyclique",
          "Tableau de bord de l'espace",
        ],
      },
      "mots-mines": {
        type: "Jeu de mots multijoueur",
        description:
          "Un jeu de mots à jouer entre amis, de 2 à 10 joueurs, sans créer de compte. À chaque tour, il faut trouver un mot qui contient un bout de mot imposé, puis passer la bombe au suivant. Attention : certains mots sont piégés en secret et font exploser la bombe. Le dernier joueur en vie gagne.",
        highlights: [
          "On joue directement avec un lien, sans inscription",
          "Les parties se jouent en direct, de 2 à 10 joueurs",
          "Pas de triche possible : les mots piégés ne sont jamais envoyés aux joueurs",
          "Le dictionnaire français est intégré au jeu",
          "Tout tient sur un seul écran, sur ordinateur comme sur téléphone",
        ],
        gallery: [
          "Accueil : pseudo, avatar et salon",
          "Salon avec invitation et joueurs prêts",
          "Arène à dix joueurs",
        ],
      },
      approveflow: {
        type: "Workflows de validation internes",
        description:
          "Une application pour valider les demandes d'achat d'une équipe, sans passer par des messages éparpillés. Quelqu'un fait une demande, la personne désignée l'accepte ou la refuse en expliquant pourquoi, et tout est gardé dans un historique. Les administrateurs gèrent les membres et peuvent inviter de nouvelles personnes avec un lien.",
        highlights: [
          "Trois rôles : demandeur, approbateur et administrateur",
          "Un refus doit toujours être justifié",
          "Les invitations passent par un lien à usage unique, qui expire",
          "L'historique se filtre et s'exporte en fichier CSV",
          "Formulaires pensés pour être accessibles, y compris au clavier",
        ],
        gallery: [
          "Fiche d'une demande",
          "Boîte « À approuver »",
          "Membres et invitations",
          "Journal d'audit",
        ],
      },
      csvclinic: {
        type: "SaaS de nettoyage de CSV",
        description:
          "Un outil pour nettoyer un fichier CSV (un tableau de données). On l'importe, on choisit quelques règles comme supprimer les doublons ou les espaces en trop, et on récupère un fichier corrigé avec un rapport qui montre ce qui a changé. Les règles préférées peuvent être sauvegardées pour les réutiliser.",
        highlights: [
          "Un aperçu du fichier avant de lancer le nettoyage",
          "Le traitement se fait en arrière-plan, avec une progression en direct",
          "Un rapport avant/après : lignes supprimées, cellules corrigées",
          "Les règles se sauvegardent dans des profils réutilisables",
          "Les fichiers sont supprimés automatiquement après un délai",
        ],
        gallery: ["Import d'un fichier", "Historique des fichiers"],
      },
      assetflow: {
        type: "Gestion de prêts de matériel",
        description:
          "Une application pour suivre le matériel d'une petite équipe : qui a emprunté quoi, et quand il doit être rendu. On enregistre chaque objet, on le prête à un collègue avec une date de retour, et l'historique des prêts est conservé. On peut aussi réserver du matériel à l'avance et imprimer des étiquettes avec un QR code.",
        highlights: [
          "Chaque objet a un code d'inventaire unique",
          "Les retards sont signalés dans la liste et sur la fiche",
          "Un objet ne peut pas être prêté deux fois en même temps",
          "Deux réservations ne peuvent pas se chevaucher",
          "Étiquettes à imprimer, avec un QR code qui ouvre la fiche de l'objet",
        ],
      },
      exano: {
        type: "Alternance · Plateforme SaaS",
        description:
          "Plateforme en ligne qui aide les entreprises à améliorer la qualité de leurs données et à les enrichir. Interface développée avec Angular, avec des données mises à jour en temps réel, et montée de version d'Angular 16 vers 18. Des tests automatiques ont aussi été mis en place et lancés pour vérifier que tout continue de fonctionner.",
        highlights: [
          "Développement de l'interface (front-end) en Angular",
          "Données affichées en temps réel",
          "Montée de version d'Angular 16 vers 18",
          "Tests automatiques : unitaires, de composants et de bout en bout avec Cypress",
        ],
        noImageLabel:
          "Projet réalisé en alternance : pas de capture disponible",
      },
      "saint-gobain": {
        type: "Alternance · Qualité des données",
        description:
          "Application de gestion de la qualité des données, qui sert à les enrichir et à corriger automatiquement les erreurs. Le travail a consisté à la maintenir et à la faire évoluer.",
        highlights: [
          "Maintenance et nouvelles fonctionnalités sur une application existante",
          "Enrichissement des données",
          "Correction automatique des erreurs dans les données",
        ],
        noImageLabel:
          "Projet réalisé en alternance : pas de capture disponible",
      },
      cepac: {
        type: "Alternance · Applications bancaires",
        description:
          "Maintenance et évolution d'applications du système d'information d'une banque. Le travail a consisté à corriger et faire évoluer l'existant, puis à nettoyer et optimiser le code pour qu'il soit plus simple à maintenir.",
        highlights: [
          "Maintenance et nouvelles fonctionnalités sur des applications bancaires",
          "Réécriture du code existant pour le rendre plus clair (refactoring)",
          "Optimisation du code",
        ],
        noImageLabel:
          "Projet réalisé en alternance : pas de capture disponible",
      },
      argus: {
        type: "Alternance · Publication automobile",
        description:
          "Maintenance et évolution d'une application de publication dans le domaine de l'automobile.",
        noImageLabel:
          "Projet réalisé en alternance : pas de capture disponible",
      },
      "monster-triad": {
        type: "Jeu de cartes web",
        description:
          "Un jeu de cartes en ligne, créé pour le plaisir, inspiré de Triple Triad et de l'univers Monster Hunter. On s'affronte sur un plateau de 3 × 3, contre l'ordinateur ou contre un ami en direct. On peut collectionner des cartes, composer son paquet et en fabriquer de nouvelles avec des matériaux. Une page d'administration sert à gérer les cartes et les adversaires.",
      },
      "dog-stories-k9": {
        type: "Site vitrine",
        description:
          "Site vitrine réalisé pour un éducateur canin indépendant qui se lançait à Cholet. L'objectif : lui donner une présence en ligne claire et professionnelle, pour présenter ses services et permettre à de nouveaux clients de le contacter facilement.",
      },
      "studio-golri": {
        type: "Application IceBreaker",
        description:
          "Projet de cours : nous avons simulé la création d'une startup. L'idée était une application pour les entreprises, avec des jeux en ligne pour créer des liens et de la bonne ambiance dans les équipes. En plus du développement, nous avons fait une étude de marché, imaginé le modèle économique, préparé un budget et un plan de lancement. L'application proposait par exemple « La Taupe », un jeu inspiré du Loup-Garou.",
      },
      "slam-dunk-allstars": {
        type: "Application mobile",
        description:
          "Projet de cours pour découvrir le développement d'applications mobiles avec Flutter. L'application s'adresse aux fans de basket : on y consulte les informations et les statistiques des joueurs, récupérées depuis un service extérieur. Ce projet m'a permis de m'entraîner à concevoir des écrans pour mobile et à utiliser Supabase pour stocker des données.",
      },
      "outing-booker": {
        type: "Application de réservation",
        description:
          "Projet de groupe réalisé pendant ma formation : une application pour réserver des sorties (concerts, loisirs...) au même endroit. Elle propose aussi de quoi s'y rendre et se loger. Pour cela, elle réunit les informations de plusieurs services comme Ticketmaster, BlaBlaCar, SNCF et Airbnb, afin de faciliter l'organisation d'une sortie.",
      },
      plume: {
        type: "Prototype Android",
        description:
          "Projet personnel : un clavier pour téléphone Android, créé avec Kotlin. À terme, l'idée est d'en faire un clavier qui aide à écrire sans rien envoyer sur Internet. Pour l'instant, c'est un premier prototype : un clavier AZERTY simple, un écran pour l'activer et un champ pour le tester.",
      },
    } as Record<string, ProjectText>,
  },

  projectPage: {
    allProjects: "Tous les projets",
    about: "Le projet",
    technologies: "Technologies",
    highlightsStart: "Points",
    highlightsAccent: "clés",
    otherProjects: "Autres projets",
    previous: "Projet précédent",
    next: "Projet suivant",
    galleryStart: "En",
    galleryAccent: "images",
    gallery: {
      roleDescription: "carrousel",
      slideRoleDescription: "diapositive",
      label: "Captures de {title}",
      list: "Liste des captures",
      slideOf: "{current} sur {total}",
      goTo: "Aller à une capture",
      shot: "Capture {n}",
      previous: "Capture précédente",
      next: "Capture suivante",
    },
  },

  journey: {
    titleStart: "Mon",
    titleAccent: "parcours",
    tabsLabel: "Afficher l'expérience ou la formation",
    tabs: [
      {
        id: "experience",
        label: "Expérience",
        items: [
          {
            period: "2023 — 2025",
            title: "Développeur Fullstack – Alternance",
            organization: "Digglerz Factory",
            description:
              "Développement et maintenance d'applications web et SaaS pour des clients tels qu'Exano, CEPAC, Argus et Saint-Gobain. Conception de nouvelles fonctionnalités, maintenance évolutive et corrective, migrations Angular, développement d'API et d'interfaces utilisateur en Python, Angular, .NET, PHP et Next.js. Mise en place de tests automatisés avec Cypress, intégration de solutions Docker, participation aux revues de code, optimisation des performances et collaboration au sein d'équipes Agile.",
          },
          {
            period: "2021 — 2022",
            title: "Développeur Web – Stage",
            organization: "Anjou Web",
            description:
              "Développement d'un espace membre sécurisé en PHP/MySQL et d'un tableau de bord administrateur avec opérations CRUD complètes. Conception d'un mini-jeu en JavaScript/jQuery avec persistance des scores via AJAX, permettant une première approche des APIs. Participation à la conception et à l'optimisation du schéma de la base de données afin d'améliorer les performances et la maintenabilité.",
          },
          {
            period: "2020",
            title: "Usineur / Opérateur de production",
            organization: "K-Line",
            description:
              "Pilotage d'équipements industriels automatisés dédiés à la fabrication de menuiseries. Réalisation d'opérations d'usinage, de découpe et d'assemblage en respectant les standards de qualité et les procédures de production. Contrôle des pièces fabriquées, identification des anomalies et ajustements nécessaires sur les équipements. Travail en environnement industriel exigeant nécessitant rigueur, précision, autonomie et respect des délais.",
          },
          {
            period: "2019",
            title: "Opérateur de production",
            organization: "Pichard Balme",
            description:
              "Contrôle qualité de bijoux et d'accessoires, avec vérification de la conformité des produits selon les exigences de fabrication. Inspection visuelle des finitions, détection des défauts et validation des pièces avant expédition, dans le respect des standards de qualité.",
          },
          {
            period: "2017 — 2018",
            title: "Tourneur / Fraiseur en commande numérique",
            organization: "S.A.U.M",
            description:
              "Réalisation d'opérations d'usinage sur machines à commande numérique. Préparation et réglage des équipements, lecture de plans techniques, contrôle dimensionnel des pièces et interventions de maintenance préventive et curative.",
          },
          {
            period: "2015 — 2016",
            title: "Opérateur de production",
            organization: "Greystal (ex-Euramax)",
            description:
              "Participation à la fabrication de structures aluminium et baies vitrées pour véhicules spécialisés. Réalisation d'opérations d'usinage, montage et assemblage de baies vitrées, contrôle qualité des pièces produites et application de finitions peinture sur aluminium. Intervention sur différentes étapes du processus industriel en respectant les exigences de précision, qualité et sécurité.",
          },
          {
            period: "2014",
            title: "Technicien / Opérateur",
            organization: "Schneider Electric",
            description:
              "Participation aux activités de production et d'assemblage d'équipements électriques industriels. Réalisation d'opérations de montage, câblage et contrôle des équipements dans le respect des exigences qualité et sécurité. Travail en équipe dans un environnement industriel normé.",
          },
        ],
      },
      {
        id: "formation",
        label: "Formation",
        items: [
          {
            period: "2023 — 2025",
            title: "Master Fullstack",
            organization:
              "My Digital School (Nantes) · Alternance chez Digglerz Factory",
            description:
              "Master réalisé en alternance chez Digglerz Factory. Développement et maintenance d'applications web principalement en Python et Angular, participation à des projets SaaS et SI pour des clients tels qu'Exano, CEPAC, Argus et Saint-Gobain. Réalisation de migrations Angular, développement de nouvelles fonctionnalités, maintenance évolutive, tests automatisés avec Cypress et collaboration sur des projets en environnement Agile.",
          },
          {
            period: "2022 — 2023",
            title: "Bachelor 3 Développeur Web",
            organization:
              "My Digital School (Angers) · Alternance chez Digglerz Factory",
            description:
              "Alternance réalisée chez Digglerz Factory sur un projet SI bancaire pour CEPAC. Maintenance corrective et évolutive d'applications métiers développées en .NET 7/8 et Knockout.js, avec refactoring, optimisation du code existant et amélioration de la qualité applicative.",
          },
          {
            period: "2020 — 2021",
            title: "Reconversion Développeur Web",
            organization: "GRETA (Titre RNCP)",
            description:
              "Formation intensive en développement web avec réalisation de projets concrets. Développement d'une application PHP/MySQL avec espace membre sécurisé et interface d'administration (CRUD), création d'un mini-jeu en JavaScript/jQuery avec persistance des scores via AJAX et optimisation d'un schéma de base de données. Acquisition des fondamentaux du développement web, des algorithmes et de la programmation orientée base de données.",
          },
          {
            period: "2013",
            title: "Bac Pro Électrotechnique",
            organization: "Formation initiale",
            description:
              "Formation aux fondamentaux de l'électrotechnique, des installations électriques et des systèmes automatisés. Apprentissage du câblage, du diagnostic de pannes, de la lecture de schémas électriques et des principes de maintenance industrielle.",
          },
        ],
      },
    ] as JourneyText[],
  },

  about: {
    titleStart: "À propos",
    titleAccent: "de moi",
    intro:
      "Développeur Full Stack diplômé d'un MBA à MyDigitalSchool Nantes, j'aime concevoir des applications qui répondent à de vrais besoins et qui restent agréables à faire évoluer.",
    paragraphs: [
      "Ce qui me motive avant tout, c'est résoudre des problèmes concrets, créer des outils utiles et continuer à apprendre. J'apprécie autant comprendre un besoin utilisateur que réfléchir à la meilleure façon de l'implémenter. Pour moi, une fonctionnalité ne se résume pas à « ça fonctionne » : elle doit être claire, performante et simple à maintenir.",
      "Chez ++Digglerz Factory++, j'ai développé et fait évoluer des applications en **Angular, Python, C# et SQL**. J'accorde une attention particulière à la qualité du code, aux performances et à la conception d'architectures capables d'évoluer dans le temps.",
      "J'aime construire des solutions utiles, penser sur le long terme et développer des applications qui restent fiables, aussi bien pour leurs utilisateurs que pour les équipes qui les feront évoluer.",
    ],
    statsLabel: "Chiffres clés",
    /** Légendes des chiffres clés, dans l'ordre de STATS (about.ts). */
    stats: ["Expériences", "MyDigitalSchool Nantes"],
  },

  contact: {
    titleStart: "Travaillons",
    titleAccent: "ensemble",
    text: "Transformer vos idées en applications simples, fiables et durables.",
    copy: "Copier mon e-mail",
    copied: "E-mail copié",
    copiedAnnouncement: "Adresse e-mail copiée dans le presse-papiers",
    writeTo: "Écrire à {email}",
    linksLabel: "Réseaux et CV",
    newTab: "(nouvel onglet)",
    links: {
      linkedin: "LinkedIn",
      github: "GitHub",
      cv: "Télécharger mon CV",
    },
  },

  footer: {
    leadStart: "Un projet,",
    leadAccent: "une idée",
    // Espace insécable avant « ? » : il ne part jamais seul à la ligne.
    leadEnd: " ?",
    siteMap: "Plan du site",
    navigation: "Navigation",
    elsewhere: "Ailleurs",
    localTime: "Heure locale",
    backToTop: "Retour en haut",
    legal: "Mentions légales",
  },

  legal: {
    metaTitle: "Mentions légales | Léon CHA",
    metaDescription:
      "Mentions légales du portfolio de Léon Cha : éditeur, hébergeur, propriété intellectuelle et données personnelles.",
    titleStart: "Mentions",
    titleAccent: "légales",
    updated: "Mise à jour : novembre 2026",
    publisher: {
      title: "Éditeur",
      name: "Nom",
      email: "E-mail",
      location: "Localisation",
      locationValue: "Nantes, France",
      siret: "SIRET",
    },
    host: {
      title: "Hébergement",
      name: "Hébergeur",
      address: "Adresse",
      contact: "Contact",
    },
    sections: [
      {
        title: "Propriété intellectuelle",
        body: [
          "Les contenus de ce site (textes, visuels, identité graphique) sont la propriété de Léon Cha, sauf mention contraire. Toute reproduction ou réutilisation sans autorisation préalable est interdite.",
          "Les captures et noms des projets réalisés pour des clients ou des employeurs restent la propriété de leurs titulaires respectifs.",
        ],
      },
      {
        title: "Données personnelles",
        body: [
          "Ce site ne collecte aucune donnée personnelle : il n'utilise ni formulaire, ni outil de mesure d'audience, ni publicité. Les e-mails que vous m'envoyez servent uniquement à vous répondre et ne sont transmis à personne.",
          "L'hébergeur peut conserver des journaux techniques (adresse IP, navigateur) nécessaires au fonctionnement et à la sécurité du site.",
          "Conformément au RGPD, vous pouvez demander l'accès à vos données ou leur suppression en m'écrivant à {email}. Vous pouvez aussi adresser une réclamation à la CNIL (cnil.fr).",
        ],
      },
      {
        title: "Cookies",
        body: [
          "Ce site utilise un seul cookie, uniquement pour retenir la langue que vous avez choisie. Il ne sert à aucun suivi.",
        ],
      },
    ],
  },
};

export type Dictionary = typeof fr;
