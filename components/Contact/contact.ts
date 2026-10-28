export const EMAIL = "junleon.cha@gmail.com";

export type ContactLink = {
  label: string;
  /** Lien externe (https://…, ouvert dans un nouvel onglet) ou fichier de /public. */
  href: string;
  /** Télécharge le fichier au lieu de l'ouvrir (ex. le CV). */
  download?: boolean;
};

/** Liens affichés sous le bouton, dans l'ordre. */
export const CONTACT_LINKS: ContactLink[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/leon-cha-02a039144/",
  },
  { label: "GitHub", href: "https://github.com/JunLeonCha" },
  {
    label: "Télécharger mon CV",
    // Fichier de /public ; l'espace du nom de fichier est encodé (%20) pour un lien valide.
    href: "/CV%20Leon-CHA-Developpeur-FullStack-3.pdf",
    download: true,
  },
];
