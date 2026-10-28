export type JourneyItem = {
  /** Période affichée telle quelle : « 2023 — Aujourd'hui », « 2019 — 2021 »… */
  period: string;
  /** Poste ou formation. */
  title: string;
  /** Entreprise ou école. */
  organization: string;
  description: string;
};

export type JourneyTab = {
  /** Identifiant unique (sert aux attributs d'accessibilité). */
  id: string;
  label: string;
  items: JourneyItem[];
};

/** Un onglet par entrée ; le premier est affiché par défaut. L'ordre des items est l'ordre d'affichage. */
export const JOURNEY_TABS: JourneyTab[] = [
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
];
