export const EMAIL = "junleon.cha@gmail.com";

export type ContactLinkId = "linkedin" | "github" | "cv";

export type ContactLink = {
  id: ContactLinkId;
  /** Lien externe (https://…, ouvert dans un nouvel onglet) ou fichier de /public. */
  href: string;
  /** Télécharge le fichier au lieu de l'ouvrir (ex. le CV). */
  download?: boolean;
};

/** Liens affichés sous le bouton, dans l'ordre. Les libellés sont dans le dictionnaire (`contact.links`). */
export const CONTACT_LINKS: ContactLink[] = [
  {
    id: "linkedin",
    href: "https://www.linkedin.com/in/leon-cha-02a039144/",
  },
  { id: "github", href: "https://github.com/JunLeonCha" },
  {
    id: "cv",
    // Fichier de /public ; l'espace du nom de fichier est encodé (%20) pour un lien valide.
    href: "/CV%20Leon-CHA-Developpeur-FullStack-3.pdf",
    download: true,
  },
];
