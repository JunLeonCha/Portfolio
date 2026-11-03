"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hasLocale } from "@/i18n/config";

gsap.registerPlugin(ScrollTrigger);

/** Chemin sans préfixe de langue : « /fr/projets » et « /en/projets » sont la même page. */
function withoutLocale(pathname: string) {
  const [, first = "", ...rest] = pathname.split("/");
  return hasLocale(first) ? `/${rest.join("/")}` : pathname;
}

/**
 * Remet la page en haut à chaque changement de page. Par défaut, Next garde la position tant que
 * la nouvelle page est visible à cette hauteur : on y arriverait au milieu, animations d'entrée ratées.
 * La position est conservée dans trois cas :
 * - lien vers une ancre (`/fr#contact`) : Next défile jusqu'à la section ;
 * - Retour / Suivant : le navigateur restaure la position ;
 * - changement de langue : même page, traduite (le sélecteur navigue en `scroll: false`).
 * Monté dans le layout racine, avant la page : la page crée ses ScrollTrigger une fois en haut.
 */
export default function ScrollReset() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  // Chemin visé par le dernier Retour / Suivant : seule cette navigation-là garde sa position.
  const historyTarget = useRef<string | null>(null);

  useEffect(() => {
    const onPopState = () => {
      historyTarget.current = window.location.pathname;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Avant l'affichage : aucune frame à l'ancienne position. L'URL est déjà à jour à ce stade.
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = pathname;
    const fromHistory = historyTarget.current === pathname;
    historyTarget.current = null;
    if (before === pathname || fromHistory || window.location.hash) return;
    if (withoutLocale(before) === withoutLocale(pathname)) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Une fois la page montée (images, polices), les déclencheurs recalculent leurs positions.
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
