import type { MetadataRoute } from "next";
import { PROJECT_SLUGS } from "@/components/MyProjects/projects";
import { DEFAULT_LOCALE, LOCALES, localePath } from "@/i18n/config";
import { getSiteUrl } from "@/lib/site";

/** Chaque page existe dans chaque langue ; `alternates` relie les traductions entre elles (hreflang). */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const paths = ["", "/projets", ...PROJECT_SLUGS.map((s) => `/projets/${s}`)];

  return paths.flatMap((path) => {
    const languages = {
      ...Object.fromEntries(
        LOCALES.map((lang) => [lang, `${site}${localePath(lang, path)}`]),
      ),
      "x-default": `${site}${localePath(DEFAULT_LOCALE, path)}`,
    };
    return LOCALES.map((lang) => ({
      url: `${site}${localePath(lang, path)}`,
      alternates: { languages },
    }));
  });
}
