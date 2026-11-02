import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * Liens de navigation, partagés par la navbar et le footer.
 * Ancrés sur l'accueil de la langue courante pour fonctionner aussi depuis les pages projet.
 */
export function getNavLinks(lang: Locale, nav: Dictionary["nav"]) {
  return [
    { label: nav.home, href: localePath(lang) },
    { label: nav.services, href: `${localePath(lang)}#services` },
    { label: nav.projects, href: `${localePath(lang)}#projets` },
    { label: nav.about, href: `${localePath(lang)}#a-propos` },
    { label: nav.contact, href: `${localePath(lang)}#contact` },
  ];
}
