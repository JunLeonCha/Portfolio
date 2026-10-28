/**
 * Typographie du nom « Léon Cha », partagée par le titre du Hero et le loader.
 * Tout y est proportionnel à la taille (interligne, espacement en em) : le loader affiche
 * le nom en grand puis le réduit jusqu'au titre, les deux coïncident à l'échelle près.
 */
export const NAME_TYPE_CLASS =
  "leading-[0.95] tracking-tight whitespace-nowrap";

/** Taille du titre du Hero. */
export const NAME_CLASS = `text-[clamp(4rem,11vw,10rem)] ${NAME_TYPE_CLASS}`;

/** « Cha » en serif italique ; pr-2 évite que la dernière lettre soit rognée par bg-clip-text. */
export const NAME_ACCENT_CLASS = "font-serif italic font-normal pr-2";

/** Dégradé champagne → lavande de « Cha ». */
export const NAME_GRADIENT_CLASS =
  "bg-linear-to-r from-primary to-accent bg-clip-text text-transparent";
