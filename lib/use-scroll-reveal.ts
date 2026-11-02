"use client";

import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { onPreloaderDone } from "@/components/Preloader";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Scroll reveal partagé par les sections. `build` remplit la timeline ; ses sélecteurs
 * ne ciblent que l'intérieur de `scope`.
 * La section se révèle une seule fois, à sa première entrée à l'écran (en descendant, ou en
 * remontant si on l'avait sautée). Ensuite elle reste affichée : en remontant depuis le bas de la
 * page, rien ne disparaît ni ne se rejoue.
 * Attend que le loader se lève ; en mouvement réduit, rien n'est animé.
 */
export function useScrollReveal(
  scope: RefObject<HTMLElement | null>,
  build: (tl: gsap.core.Timeline) => void,
) {
  useGSAP(
    () => {
      // Racine absente (rendu interrompu, sous-arbre masqué) : rien à animer.
      if (!scope.current) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // En pause : les éléments restent cachés sous le loader, le ScrollTrigger arrive quand il se lève.
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.out", duration: 0.9 },
        });
        build(tl);
        let trigger: ScrollTrigger | undefined;
        const stopWaiting = onPreloaderDone(() => {
          // Le haut de la section franchit 85 % de l'écran en descendant, ou son bas repasse
          // sous le haut de l'écran en remontant (section sautée) : la timeline se joue, une fois.
          trigger = ScrollTrigger.create({
            trigger: scope.current,
            start: "top 85%",
            end: "bottom top",
            onEnter: () => tl.play(),
            onEnterBack: () => tl.play(),
          });
        });
        // Créé hors du contexte (après le loader) : il faut le détruire à la main.
        return () => {
          stopWaiting();
          trigger?.kill();
        };
      });
    },
    { scope },
  );
}
