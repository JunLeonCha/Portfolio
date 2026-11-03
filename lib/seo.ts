import type { Metadata } from "next";
import {
  DEFAULT_LOCALE,
  LOCALES,
  OG_LOCALES,
  localePath,
  type Locale,
} from "@/i18n/config";

export const OG_IMAGE = {
  url: "/og-image-v2.png",
  width: 1200,
  height: 630,
};

/**
 * Métadonnées complètes d'une page dans une langue : titre, description, canonique, alternates
 * `hreflang` vers chaque traduction (+ `x-default`), Open Graph et Twitter.
 * `path` est le chemin sans préfixe de langue (« », « /projets », « /projets/aria »).
 * Un `openGraph` de page remplace celui du layout (pas de fusion profonde) : tout est donc posé ici.
 */
export function pageMetadata({
  lang,
  path,
  title,
  description,
  siteName,
  image = OG_IMAGE,
  imageAlt,
}: {
  lang: Locale;
  path: string;
  title: string;
  description: string;
  siteName: string;
  image?: { url: string; width?: number; height?: number };
  imageAlt: string;
}): Metadata {
  const images = [{ ...image, alt: imageAlt }];
  return {
    title,
    description,
    alternates: {
      canonical: localePath(lang, path),
      languages: {
        ...Object.fromEntries(
          LOCALES.map((locale) => [locale, localePath(locale, path)]),
        ),
        "x-default": localePath(DEFAULT_LOCALE, path),
      },
    },
    openGraph: {
      type: "website",
      url: localePath(lang, path),
      siteName,
      title,
      description,
      locale: OG_LOCALES[lang],
      alternateLocale: LOCALES.filter((locale) => locale !== lang).map(
        (locale) => OG_LOCALES[locale],
      ),
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
