import type { Dictionary } from "./fr";

export const en: Dictionary = {
  meta: {
    siteName: "Léon CHA",
    title: "Léon CHA | Full-Stack Developer in Nantes, France",
    description:
      "Full-stack developer based in Nantes, France, passionate about web development and building interactive experiences.",
    ogAlt: "Léon Cha, full-stack developer in Nantes, France",
    jobTitle: "Full-Stack Developer",
    projectsTitle: "Projects | Léon CHA",
    projectsDescription:
      "All of Léon Cha's projects, full-stack developer: web apps, SaaS, mobile and prototypes.",
    projectTitle: "{title} | Léon CHA",
  },

  nav: {
    home: "Home",
    services: "Services",
    projects: "Projects",
    about: "About",
    contact: "Contact",
    homeLabel: "Léon Cha, back to home",
    mainNav: "Main navigation",
    mobileNav: "Mobile menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    languageLabel: "Site language",
    languages: { fr: "Français", en: "English" },
  },

  preloader: {
    loading: "Loading the portfolio…",
  },

  hero: {
    badge: "Full-Stack Developer · Nantes",
    intro:
      "From the interface to the business logic, I build web applications where technical choices serve the product first, and the people who use it.",
    ctaProjects: "See my projects",
    ctaContact: "Get in touch",
    portraitAlt: "Portrait of Léon Cha",
  },

  services: {
    titleStart: "Services &",
    titleAccent: "expertise",
    subtitle: "An eye for detail, from the interface down to the code.",
    tagsLabel: "Technologies: {title}",
    tagLabels: {
      "SEO technique": "Technical SEO",
      Accessibilité: "Accessibility",
      "API OpenAI": "OpenAI API",
      "API Anthropic": "Anthropic API",
    },
    items: {
      frontend: {
        title: "Frontend & interfaces",
        description:
          "Polished, accessible and fast interfaces, from the mockup to the reusable components of a design system.",
      },
      backend: {
        title: "Backend & databases",
        description:
          "The APIs, data and rules that keep the product running, all the way to production.",
      },
      performance: {
        title: "Performance, SEO & redesign",
        description:
          "Audit and modernisation of existing applications: Core Web Vitals, accessibility and technical SEO.",
      },
      interactive: {
        title: "Interactive experiences",
        description:
          "Animations and WebGL rendering that give a product its character",
      },
      ai: {
        title: "AI agents & automation",
        description:
          "Design of AI agents and task automation: LLMs enriched with project data through RAG, tools connected via MCP and skills tailored to your needs.",
      },
    },
  },

  projects: {
    titleStart: "My",
    titleAccent: "projects",
    viewAll: "See all projects",
    viewProject: "View project",
    techFor: "Technologies used for {title}",
    imageAlt: "Screenshot of the {title} project",
    comingSoon: "Preview coming soon",
    loadMore: "Show more projects",
    loadedStatus: "{shown} of {total} projects shown",
    tagLabels: { "Agent IA": "AI agent" },
    items: {
      aria: {
        type: "Visual Builder",
        description:
          "A tool to create and manage websites without relying on an off-the-shelf solution. It works as a visual editor: pages are built from reusable blocks, and animations can be added to them. It is also designed to be deployed on servers, with storage for images and files.",
      },
      webhookinbox: {
        type: "Webhook capture with an AI assistant",
        description:
          "A tool for developers who receive automatic messages from other services (webhooks). It records them so you can browse them, forward them to another address and resend the ones that failed. An AI assistant reads the history to explain why a delivery didn't work.",
        highlights: [
          "Each inbox has its own secret address",
          "Sensitive information is masked automatically",
          "A failed message can be resent, after confirmation",
          "The AI assistant explains errors from the real history",
          "The assistant can read the history, but can't send or change anything",
        ],
        gallery: [
          "First event received",
          "Forwarding and replay",
          "Diagnosing a delivery",
          "Workspace settings",
        ],
      },
      moodspace: {
        type: "Moodboard studio",
        description:
          "A tool to compose moodboards: you gather images, text and colours on a single board, then share it to present an art direction. Elements snap into alignment as you move them. It comes in two versions: a demo that runs directly in the browser with no account, and a full version with accounts and sharing between users.",
        highlights: [
          "Elements snap and align with each other as you move them",
          "A demo with no account, and a full version with accounts",
          "Several projects, each with its own inspiration boards",
          "Export the board as an image",
          "A presentation link to share, and invitations for other members",
        ],
        gallery: [
          "Project gallery",
          "Object properties inspector",
          "Magnetic guides while moving an item",
          "Public presentation of a board",
          "Local demo with browser storage",
        ],
      },
      burnnote: {
        type: "Read-once note sharing",
        description:
          "An application to send a secret (password, access code...) that can only be read once. You write the note, get a link, and as soon as the recipient has read it, it is erased. You can add a protection password, or encrypt the note in the browser so that even the server can't read it.",
        highlights: [
          "The note is erased on the first read",
          "A link preview in a messaging app doesn't destroy it by mistake",
          "With a password, the note is destroyed after three wrong attempts",
          "Option to encrypt the note: the server never sees its content",
          "An optional account lets you find your history and cancel a link",
        ],
        gallery: [
          "Creating a note",
          "Note revealed only once",
          "Passphrase required",
          "Account note history",
        ],
      },
      blastradius: {
        type: "Outage impact simulator",
        description:
          "A tool to understand what happens when part of an application goes down. You draw the application's components (website, server, database...) and say which ones depend on the others. By simulating the failure of one of them, you immediately see which others would be affected, and through which path.",
        highlights: [
          "The diagram can be built with the mouse, or entirely with the keyboard",
          "Circular dependencies are rejected with a clear message",
          "Each simulation shows the affected components and how many steps away they are",
          "The history keeps every simulation",
          "Each workspace is private",
        ],
        gallery: [
          "Component editor",
          "A circular dependency being rejected",
          "Workspace dashboard",
        ],
      },
      "mots-mines": {
        type: "Multiplayer word game",
        description:
          "A word game to play with friends, from 2 to 10 players, with no account needed. Each turn, you have to find a word containing a given fragment, then pass the bomb to the next player. Beware: some words are secretly booby-trapped and make the bomb explode. The last player alive wins.",
        highlights: [
          "Play straight from a link, no sign-up",
          "Games are played live, from 2 to 10 players",
          "No cheating possible: the trapped words are never sent to players",
          "The French dictionary is built into the game",
          "Everything fits on a single screen, on desktop and on phone",
        ],
        gallery: [
          "Home: nickname, avatar and lobby",
          "Lobby with invitation and ready players",
          "Arena with ten players",
        ],
      },
      approveflow: {
        type: "Internal approval workflows",
        description:
          "An application to approve a team's purchase requests, without scattered messages. Someone submits a request, the designated person accepts or rejects it with an explanation, and everything is kept in a history. Administrators manage members and can invite new people with a link.",
        highlights: [
          "Three roles: requester, approver and administrator",
          "A rejection must always be justified",
          "Invitations use a single-use link that expires",
          "The history can be filtered and exported as a CSV file",
          "Forms designed to be accessible, including by keyboard",
        ],
        gallery: [
          "Request details",
          "“To approve” inbox",
          "Members and invitations",
          "Audit log",
        ],
      },
      csvclinic: {
        type: "CSV cleaning SaaS",
        description:
          "A tool to clean up a CSV file (a data table). You import it, pick a few rules such as removing duplicates or extra spaces, and get back a corrected file with a report showing what changed. Favourite rules can be saved for reuse.",
        highlights: [
          "A preview of the file before the cleaning starts",
          "Processing runs in the background, with live progress",
          "A before/after report: rows removed, cells fixed",
          "Rules are saved in reusable profiles",
          "Files are automatically deleted after a delay",
        ],
        gallery: ["Importing a file", "File history"],
      },
      assetflow: {
        type: "Equipment loan management",
        description:
          "An application to keep track of a small team's equipment: who borrowed what, and when it is due back. You register each item, lend it to a colleague with a return date, and the loan history is kept. You can also book equipment in advance and print labels with a QR code.",
        highlights: [
          "Each item has a unique inventory code",
          "Overdue items are flagged in the list and on the item page",
          "An item can't be lent twice at the same time",
          "Two bookings can't overlap",
          "Printable labels, with a QR code that opens the item's page",
        ],
      },
      exano: {
        type: "Work-study · SaaS platform",
        description:
          "An online platform that helps companies improve the quality of their data and enrich it. Interface built with Angular, with data updated in real time, and an upgrade from Angular 16 to 18. Automated tests were also set up and run to check that everything keeps working.",
        highlights: [
          "Front-end interface development in Angular",
          "Data displayed in real time",
          "Upgrade from Angular 16 to 18",
          "Automated tests: unit, component and end-to-end with Cypress",
        ],
        noImageLabel: "Work-study project: no screenshot available",
      },
      "saint-gobain": {
        type: "Work-study · Data quality",
        description:
          "A data quality management application, used to enrich data and automatically fix errors. The work consisted of maintaining it and evolving it.",
        highlights: [
          "Maintenance and new features on an existing application",
          "Data enrichment",
          "Automatic correction of errors in the data",
        ],
        noImageLabel: "Work-study project: no screenshot available",
      },
      cepac: {
        type: "Work-study · Banking applications",
        description:
          "Maintenance and evolution of a bank's information system applications. The work consisted of fixing and evolving the existing code, then cleaning up and optimising it to make it easier to maintain.",
        highlights: [
          "Maintenance and new features on banking applications",
          "Rewriting existing code to make it clearer (refactoring)",
          "Code optimisation",
        ],
        noImageLabel: "Work-study project: no screenshot available",
      },
      argus: {
        type: "Work-study · Automotive publishing",
        description:
          "Maintenance and evolution of a publishing application in the automotive field.",
        noImageLabel: "Work-study project: no screenshot available",
      },
      "monster-triad": {
        type: "Web card game",
        description:
          "An online card game, made for fun, inspired by Triple Triad and the Monster Hunter universe. You battle on a 3 × 3 board, against the computer or against a friend live. You can collect cards, build your deck and craft new cards from materials. An admin page is used to manage the cards and the opponents.",
      },
      "dog-stories-k9": {
        type: "Showcase website",
        description:
          "Showcase website built for an independent dog trainer who was starting out in Cholet, France. The goal: give them a clear, professional online presence to present their services and let new clients get in touch easily.",
      },
      "studio-golri": {
        type: "IceBreaker application",
        description:
          "Course project: we simulated the creation of a startup. The idea was an application for companies, with online games to build bonds and a good atmosphere within teams. On top of development, we did a market study, devised the business model, and prepared a budget and a launch plan. The application offered, for example, “La Taupe” (The Mole), a game inspired by Werewolf.",
      },
      "slam-dunk-allstars": {
        type: "Mobile application",
        description:
          "Course project to discover mobile app development with Flutter. The app is aimed at basketball fans: you can browse player information and statistics, fetched from an external service. This project let me practise designing mobile screens and using Supabase to store data.",
      },
      "outing-booker": {
        type: "Booking application",
        description:
          "Group project carried out during my studies: an application to book outings (concerts, leisure...) in one place. It also suggests how to get there and where to stay. To do so, it gathers information from several services such as Ticketmaster, BlaBlaCar, SNCF and Airbnb, to make planning an outing easier.",
      },
      plume: {
        type: "Android prototype",
        description:
          "Personal project: a keyboard for Android phones, built with Kotlin. Eventually, the idea is to make a keyboard that helps you write without sending anything over the Internet. For now, it's a first prototype: a simple AZERTY keyboard, a screen to enable it and a field to test it.",
      },
    },
  },

  projectPage: {
    allProjects: "All projects",
    about: "The project",
    technologies: "Technologies",
    highlightsStart: "Key",
    highlightsAccent: "points",
    otherProjects: "Other projects",
    previous: "Previous project",
    next: "Next project",
    galleryStart: "In",
    galleryAccent: "pictures",
    gallery: {
      roleDescription: "carousel",
      slideRoleDescription: "slide",
      label: "Screenshots of {title}",
      list: "Screenshot list",
      slideOf: "{current} of {total}",
      goTo: "Go to a screenshot",
      shot: "Screenshot {n}",
      previous: "Previous screenshot",
      next: "Next screenshot",
    },
  },

  journey: {
    titleStart: "My",
    titleAccent: "journey",
    tabsLabel: "Show experience or education",
    tabs: [
      {
        id: "experience",
        label: "Experience",
        items: [
          {
            period: "2023 — 2025",
            title: "Full-Stack Developer – Work-study",
            organization: "Digglerz Factory",
            description:
              "Development and maintenance of web and SaaS applications for clients such as Exano, CEPAC, Argus and Saint-Gobain. Design of new features, evolutive and corrective maintenance, Angular migrations, development of APIs and user interfaces in Python, Angular, .NET, PHP and Next.js. Setup of automated tests with Cypress, integration of Docker solutions, participation in code reviews, performance optimisation and collaboration within Agile teams.",
          },
          {
            period: "2021 — 2022",
            title: "Web Developer – Internship",
            organization: "Anjou Web",
            description:
              "Development of a secure member area in PHP/MySQL and an admin dashboard with full CRUD operations. Design of a JavaScript/jQuery mini-game with score persistence via AJAX, giving a first approach to APIs. Contribution to the design and optimisation of the database schema to improve performance and maintainability.",
          },
          {
            period: "2020",
            title: "Machinist / Production Operator",
            organization: "K-Line",
            description:
              "Operation of automated industrial equipment dedicated to manufacturing window and door frames. Machining, cutting and assembly operations in line with quality standards and production procedures. Inspection of manufactured parts, identification of defects and necessary adjustments to the equipment. Work in a demanding industrial environment requiring rigour, precision, autonomy and respect for deadlines.",
          },
          {
            period: "2019",
            title: "Production Operator",
            organization: "Pichard Balme",
            description:
              "Quality control of jewellery and accessories, checking that products comply with manufacturing requirements. Visual inspection of finishes, detection of defects and approval of parts before shipping, in line with quality standards.",
          },
          {
            period: "2017 — 2018",
            title: "CNC Turner / Milling Machinist",
            organization: "S.A.U.M",
            description:
              "Machining operations on CNC machines. Preparation and setup of equipment, reading of technical drawings, dimensional inspection of parts and preventive and corrective maintenance work.",
          },
          {
            period: "2015 — 2016",
            title: "Production Operator",
            organization: "Greystal (formerly Euramax)",
            description:
              "Contribution to the manufacture of aluminium structures and glazed bays for specialist vehicles. Machining, fitting and assembly of glazed bays, quality control of the parts produced and paint finishing on aluminium. Work on several stages of the industrial process while meeting precision, quality and safety requirements.",
          },
          {
            period: "2014",
            title: "Technician / Operator",
            organization: "Schneider Electric",
            description:
              "Contribution to the production and assembly of industrial electrical equipment. Assembly, wiring and testing of equipment in line with quality and safety requirements. Teamwork in a regulated industrial environment.",
          },
        ],
      },
      {
        id: "formation",
        label: "Education",
        items: [
          {
            period: "2023 — 2025",
            title: "Master's in Full-Stack Development",
            organization:
              "My Digital School (Nantes) · Work-study at Digglerz Factory",
            description:
              "Master's completed as a work-study programme at Digglerz Factory. Development and maintenance of web applications mainly in Python and Angular, contribution to SaaS and information-system projects for clients such as Exano, CEPAC, Argus and Saint-Gobain. Angular migrations, development of new features, evolutive maintenance, automated tests with Cypress and collaboration on projects in an Agile environment.",
          },
          {
            period: "2022 — 2023",
            title: "Bachelor's Year 3 – Web Developer",
            organization:
              "My Digital School (Angers) · Work-study at Digglerz Factory",
            description:
              "Work-study placement at Digglerz Factory on a banking information-system project for CEPAC. Corrective and evolutive maintenance of business applications built with .NET 7/8 and Knockout.js, with refactoring, optimisation of existing code and improved application quality.",
          },
          {
            period: "2020 — 2021",
            title: "Career change – Web Developer",
            organization: "GRETA (RNCP certification)",
            description:
              "Intensive web development training with hands-on projects. Development of a PHP/MySQL application with a secure member area and an admin interface (CRUD), creation of a JavaScript/jQuery mini-game with score persistence via AJAX and optimisation of a database schema. Grounding in web development fundamentals, algorithms and database-oriented programming.",
          },
          {
            period: "2013",
            title: "Vocational Baccalaureate in Electrical Engineering",
            organization: "Initial training",
            description:
              "Training in the fundamentals of electrical engineering, electrical installations and automated systems. Learning wiring, fault diagnosis, reading electrical diagrams and the principles of industrial maintenance.",
          },
        ],
      },
    ],
  },

  about: {
    titleStart: "About",
    titleAccent: "me",
    intro:
      "A full-stack developer with an MBA from MyDigitalSchool Nantes, I enjoy designing applications that meet real needs and stay pleasant to evolve.",
    paragraphs: [
      "What motivates me most is solving concrete problems, creating useful tools and continuing to learn. I enjoy understanding a user's need as much as figuring out the best way to implement it. To me, a feature is more than “it works”: it should be clear, fast and easy to maintain.",
      "At ++Digglerz Factory++, I developed and evolved applications in **Angular, Python, C# and SQL**. I pay particular attention to code quality, performance and designing architectures that can evolve over time.",
      "I like building useful solutions, thinking long term and developing applications that stay reliable, both for their users and for the teams who will evolve them.",
    ],
    statsLabel: "Key figures",
    stats: ["Experiences", "MyDigitalSchool Nantes"],
  },

  contact: {
    titleStart: "Let's work",
    titleAccent: "together",
    text: "Turning your ideas into simple, reliable and lasting applications.",
    copy: "Copy my email",
    copied: "Email copied",
    copiedAnnouncement: "Email address copied to the clipboard",
    writeTo: "Write to {email}",
    linksLabel: "Social links and résumé",
    newTab: "(new tab)",
    links: {
      linkedin: "LinkedIn",
      github: "GitHub",
      cv: "Download my résumé (FR)",
    },
  },

  footer: {
    leadStart: "A project, a role,",
    leadAccent: "an idea",
    leadEnd: "?",
    siteMap: "Site map",
    navigation: "Navigation",
    elsewhere: "Elsewhere",
    localTime: "Local time",
    backToTop: "Back to top",
    legal: "Legal notice",
  },

  legal: {
    metaTitle: "Legal notice | Léon CHA",
    metaDescription:
      "Legal notice for Léon Cha's portfolio: publisher, host, intellectual property and personal data.",
    titleStart: "Legal",
    titleAccent: "notice",
    updated: "Last updated: November 2026",
    publisher: {
      title: "Publisher",
      name: "Name",
      email: "Email",
      location: "Location",
      locationValue: "Nantes, France",
      siret: "SIRET",
    },
    host: {
      title: "Hosting",
      name: "Host",
      address: "Address",
      contact: "Contact",
    },
    sections: [
      {
        title: "Intellectual property",
        body: [
          "The content of this website (text, visuals, visual identity) belongs to Léon Cha unless stated otherwise. Any reproduction or reuse without prior permission is prohibited.",
          "Screenshots and names of projects built for clients or employers remain the property of their respective owners.",
        ],
      },
      {
        title: "Personal data",
        body: [
          "This website collects no personal data: it uses no forms, no analytics and no advertising. Emails you send me are only used to reply to you and are never shared.",
          "The host may keep technical logs (IP address, browser) needed to run and secure the website.",
          "Under the GDPR, you can ask to access or delete your data by writing to {email}. You can also lodge a complaint with the CNIL, the French data protection authority (cnil.fr).",
        ],
      },
      {
        title: "Cookies",
        body: [
          "This website uses a single cookie, only to remember the language you chose. It is not used for tracking.",
        ],
      },
    ],
  },
};
