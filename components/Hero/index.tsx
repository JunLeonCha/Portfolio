"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { onPreloaderLanded } from "@/components/Preloader";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import {
  NAME_ACCENT_CLASS,
  NAME_CLASS,
  NAME_GRADIENT_CLASS,
} from "./name-style";

gsap.registerPlugin(useGSAP, ScrollTrigger);

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-4 ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Point lumineux qui respire, comme celui de l'heure locale du footer. */
function LiveDot() {
  return (
    <span aria-hidden="true" className="relative flex size-2">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex size-2 rounded-full bg-primary" />
    </span>
  );
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useScrollReveal(root, (tl) => {
    // Pas de tween sur le titre : c'est le nom du loader qui vient s'y poser (travelling arrière).
    tl.from("[data-hero='badge']", { y: 20, autoAlpha: 0 })
      .from("[data-hero='text']", { y: 20, autoAlpha: 0 }, "<0.2")
      .from("[data-hero='cta']", { y: 20, autoAlpha: 0, stagger: 0.1 }, "<0.15")
      .from(
        "[data-hero='photo']",
        {
          // Rideau qui monte, arrondis conservés (rounded-4xl = 2rem).
          clipPath: "inset(100% 0% 0% 0% round 2rem)",
          scale: 1.08,
          duration: 1.3,
          ease: "power4.out",
        },
        0.15,
      );
  });

  // Le titre a son propre scroll reveal, branché seulement une fois le nom du loader posé
  // (avant, il appartient au travelling arrière). Il part de son état visible :
  // rembobiné quand on quitte le Hero, rejoué quand on y revient.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let trigger: ScrollTrigger | undefined;
        const stopWaiting = onPreloaderLanded(() => {
          const reveal = gsap
            .fromTo(
              "[data-hero='name']",
              { yPercent: 40, autoAlpha: 0, filter: "blur(10px)" },
              {
                yPercent: 0,
                autoAlpha: 1,
                filter: "blur(0px)",
                duration: 1.1,
                ease: "power3.out",
                paused: true,
                immediateRender: false,
              },
            )
            .progress(1);
          trigger = ScrollTrigger.create({
            trigger: root.current,
            start: "top 80%",
            end: "bottom 20%",
            animation: reveal,
            // Entrée initiale : rien (le titre est déjà là) · sortie : rembobine · retour : rejoue.
            toggleActions: "none reverse restart reverse",
          });
        });
        // Créé hors du contexte (après le loader) : il faut le détruire à la main.
        return () => {
          stopWaiting();
          trigger?.kill();
        };
      });
    },
    { scope: root },
  );

  return (
    // Hauteur minimale, jamais fixe : sur un écran peu haut, la section s'allonge
    // au lieu de déborder sur la suivante.
    <section
      ref={root}
      id="accueil"
      aria-labelledby="hero-title"
      className="grid min-h-svh items-end gap-12 pt-32 pb-16 xl:grid-cols-12 xl:gap-8 xl:pb-24"
    >
      <div className="xl:col-span-7">
        <p
          data-hero="badge"
          className="inline-flex items-center gap-3 rounded-full border border-border/50 bg-surface/30 px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-xl"
        >
          <LiveDot />
          Développeur Fullstack · Nantes
        </p>

        <h1 id="hero-title" data-hero="name" className={`mt-8 ${NAME_CLASS}`}>
          Léon{" "}
          <span className={`${NAME_ACCENT_CLASS} ${NAME_GRADIENT_CLASS}`}>
            Cha
          </span>
        </h1>

        <p
          data-hero="text"
          className="mt-6 max-w-xl leading-relaxed text-muted-foreground xl:text-lg"
        >
          De l&apos;interface à la logique métier, je construis des applications
          web où les choix techniques servent avant tout le produit et ceux qui
          l&apos;utilisent.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#projets"
            data-hero="cta"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-4 text-primary-foreground shadow-[0_0_16px] shadow-primary/25 transition-[background-color,box-shadow] duration-300 hover:bg-primary-hover hover:shadow-[0_0_30px] hover:shadow-primary/50 focus-visible:shadow-[0_0_30px] focus-visible:shadow-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
          >
            Voir mes réalisations
            <ArrowIcon className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" />
          </a>
          <a
            href="#contact"
            data-hero="cta"
            className="inline-flex items-center rounded-full border border-primary/50 bg-secondary px-6 py-4 text-secondary-foreground shadow-[0_0_16px] shadow-primary/15 transition-[background-color,box-shadow] duration-300 hover:bg-secondary-hover hover:shadow-[0_0_30px] hover:shadow-primary/35 focus-visible:shadow-[0_0_30px] focus-visible:shadow-primary/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
          >
            Me contacter
          </a>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[30rem] xl:col-span-5 xl:mr-0">
        <div
          data-hero="photo"
          className="relative aspect-3/4 overflow-hidden rounded-4xl border border-border/60"
        >
          <Image
            src="/mon-profil.jpg"
            alt="Portrait de Léon Cha"
            fill
            preload
            sizes="(min-width: 1280px) 30rem, 90vw"
            className="object-cover"
          />
          {/* Fond fondu vers le bas : la légende reste lisible sur la photo. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background/80 to-transparent"
          />
        </div>
        {/* Légende de verre posée sur la photo, comme la navbar. */}
      </div>
    </section>
  );
}
