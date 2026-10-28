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
 * Entrée : rejoue · sortie : rembobine · retour : rejoue · sortie par le haut : rembobine.
 * Attend que le loader se lève ; en mouvement réduit, rien n'est animé.
 */
export function useScrollReveal(
  scope: RefObject<HTMLElement | null>,
  build: (tl: gsap.core.Timeline) => void,
) {
  useGSAP(
    () => {
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
          trigger = ScrollTrigger.create({
            trigger: scope.current,
            start: "top 80%",
            end: "bottom 20%",
            animation: tl,
            toggleActions: "restart reverse restart reverse",
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
