"use client";

import { useEffect } from "react";
import { onPreloaderLanded } from "@/components/Preloader";
import { localePath, type Locale } from "@/i18n/config";

/** Sections de l'accueil, dans l'ordre de la page. L'accueil (Hero) n'a pas d'ancre : l'URL redevient « /fr » (ou « /en »). */
const SECTION_IDS = [
  "accueil",
  "services",
  "projets",
  "parcours",
  "a-propos",
  "contact",
];

/** Ligne de lecture : la section qui la traverse est « la section courante » (35 % depuis le haut). */
const READING_LINE = "-35% 0px -64% 0px";

/**
 * Garde l'URL de l'accueil synchronisée avec la section affichée (/#services, /#a-propos…).
 * - `replaceState` : l'URL change sans défiler la page et sans ajouter d'entrées à l'historique
 *   (le bouton Retour ne passe pas par chaque section).
 * - Démarre une fois le loader terminé : jusque-là la page est maintenue en haut. Si l'URL d'arrivée
 *   porte déjà une ancre (lien partagé), on y défile à ce moment-là au lieu de l'effacer.
 * - Ne touche à rien hors de l'accueil de la langue (« /fr », « /en » ; pas les pages projet).
 */
export default function ScrollSpy({ lang }: { lang: Locale }) {
  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    let timer: number | undefined;

    const sync = (id: string) => {
      const home = localePath(lang);
      if (window.location.pathname !== home) return;
      const hash = id === "accueil" ? "" : `#${id}`;
      if (window.location.hash === hash) return;
      // history.state conservé : le routeur de Next y range son propre état.
      window.history.replaceState(window.history.state, "", `${home}${hash}`);
    };

    const start = () => {
      const sections = SECTION_IDS.flatMap((id) => {
        const el = document.getElementById(id);
        return el ? [el] : [];
      });
      const crossing = new Set<string>();
      observer = new IntersectionObserver(
        (entries) => {
          for (const { target, isIntersecting } of entries) {
            if (isIntersecting) crossing.add(target.id);
            else crossing.delete(target.id);
          }
          // Les sections sont contiguës : une seule traverse la ligne. Entre deux (pied de page),
          // on garde la dernière ancre.
          const current = [...crossing].pop();
          if (current) sync(current);
        },
        { rootMargin: READING_LINE },
      );
      for (const section of sections) observer.observe(section);
    };

    // Lien d'arrivée avec ancre : le loader a maintenu la page en haut, on rejoint la section ensuite
    // (le temps que le verrou de défilement du loader soit levé), puis seulement on suit le scroll.
    const stopWaiting = onPreloaderLanded(() => {
      timer = window.setTimeout(() => {
        const target = window.location.hash.slice(1);
        if (target) {
          document.getElementById(target)?.scrollIntoView({ block: "start" });
        }
        start();
      }, 60);
    });

    return () => {
      stopWaiting();
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [lang]);

  return null;
}
