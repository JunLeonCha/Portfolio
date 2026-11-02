export const LOCALES = ["fr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

/** Cookie qui mémorise le choix de langue du visiteur (lu par le proxy). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const hasLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/** Valeurs `hreflang` / `og:locale` de chaque langue. */
export const OG_LOCALES: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
};

/** Locale `Intl` utilisée pour l'heure locale du footer (24 h dans les deux cas). */
export const INTL_LOCALES: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
};

/** Remplace les `{variable}` d'un texte du dictionnaire. */
export function format(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Chemin d'une page dans une langue : `localePath("en", "/projets")` → `/en/projets`. */
export function localePath(lang: Locale, path = "") {
  const suffix = path === "/" ? "" : path;
  return `/${lang}${suffix}`;
}
