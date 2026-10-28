"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import LifestreamBackground from "@/components/lifestream-background";
import {
  NAME_ACCENT_CLASS,
  NAME_CLASS,
  NAME_GRADIENT_CLASS,
} from "@/components/Hero/name-style";

gsap.registerPlugin(useGSAP);

const DONE_EVENT = "preloader:done";
const LANDED_EVENT = "preloader:landed";
const MIN_DURATION = 1200; // ms : même sur une connexion rapide, le loader ne clignote pas
const LIGHT_EDGE = 120; // px (à l'écran) : douceur du front de lumière qui révèle le nom
const POSTER_WIDTH = 0.21; // taille du nom « affiche », en part de la largeur d'écran…
const POSTER_HEIGHT = 0.4; // … sans dépasser cette part de la hauteur
const SEAM = 0.62; // ligne du courant, en part de la hauteur (cf. h-[62%] / top-[62%] du rendu)
const POSTER_GAP = 48; // px entre le bas du nom et la ligne du courant

/**
 * Appelle `callback` quand le loader se lève, ou tout de suite s'il est déjà levé
 * ou absent de la page (le loader est rendu côté serveur : il est dans le DOM dès le départ). Renvoie le désabonnement.
 */
export function onPreloaderDone(callback: () => void) {
  if (
    document.documentElement.dataset.preloaded === "true" ||
    !document.querySelector("[data-preloader]")
  ) {
    callback();
    return () => {};
  }
  window.addEventListener(DONE_EVENT, callback, { once: true });
  return () => window.removeEventListener(DONE_EVENT, callback);
}

/**
 * Appelle `callback` quand le nom du loader s'est posé sur le titre du Hero (le titre est alors
 * visible et libre d'être animé), ou tout de suite si c'est déjà fait ou s'il n'y a pas de loader.
 */
export function onPreloaderLanded(callback: () => void) {
  if (
    document.documentElement.dataset.landed === "true" ||
    !document.querySelector("[data-preloader]")
  ) {
    callback();
    return () => {};
  }
  window.addEventListener(LANDED_EVENT, callback, { once: true });
  return () => window.removeEventListener(LANDED_EVENT, callback);
}

function markDone() {
  document.documentElement.dataset.preloaded = "true";
  window.dispatchEvent(new Event(DONE_EVENT));
}

function markLanded() {
  document.documentElement.dataset.landed = "true";
  window.dispatchEvent(new Event(LANDED_EVENT));
}

/** Page chargée (images, CSS), polices prêtes, et durée minimale écoulée. */
function whenReady() {
  const loaded =
    document.readyState === "complete"
      ? Promise.resolve()
      : new Promise<void>((resolve) =>
          window.addEventListener("load", () => resolve(), { once: true }),
        );
  const minimum = new Promise((resolve) => setTimeout(resolve, MIN_DURATION));
  return Promise.all([loaded, document.fonts.ready, minimum]);
}

/**
 * Abscisse (px, dans la fenêtre) du front lumineux du courant pour une progression 0 → 1.
 * Reprend les calculs de lifestream-background : déroulé = 0,18 + 0,82 × progression,
 * milieu du fondu en u = déroulé × 1,35 − 0,175, colonne en x = (−0,08 + 1,16 u) × largeur.
 */
function streamFront(progress: number, width: number) {
  const reveal = 0.18 + 0.82 * progress;
  const u = reveal * 1.35 - 0.175;
  return (-0.08 + 1.16 * u) * width;
}

/** Contenu du nom, identique au titre du Hero (même typographie, même découpe). */
function NameContent({ lit }: { lit: boolean }) {
  return (
    <>
      Léon{" "}
      <span
        className={`${NAME_ACCENT_CLASS} ${lit ? NAME_GRADIENT_CLASS : ""}`}
      >
        Cha
      </span>
    </>
  );
}

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLDivElement>(null);
  const nameBase = useRef<HTMLSpanElement>(null);
  const nameLit = useRef<HTMLSpanElement>(null);
  // Progression 0 → 1 lue à chaque image par le courant : c'est lui, la barre de chargement.
  const streamProgress = useRef(0);
  const streamExit = useRef(0);
  const [done, setDone] = useState(false);

  useGSAP(
    (_, contextSafe) => {
      const html = document.documentElement;
      html.style.overflow = "hidden";
      let cancelled = false;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      // Le titre du Hero reste caché : c'est le nom du loader qui viendra s'y poser.
      const heroName =
        document.querySelector<HTMLElement>("[data-hero='name']");
      if (heroName && !reduced) gsap.set(heroName, { autoAlpha: 0 });

      /**
       * Le nom est écrit à la taille exacte du titre du Hero, puis agrandi en « affiche »,
       * centré au-dessus du courant. À l'arrivée il revient à l'échelle 1 : même rendu que le
       * titre, au pixel près, d'où un relais invisible.
       */
      const layoutPoster = () => {
        const el = name.current;
        if (!el) return;
        const W = window.innerWidth;
        const H = window.innerHeight;
        const fontSize = parseFloat(getComputedStyle(el).fontSize);
        const scale = Math.min(W * POSTER_WIDTH, H * POSTER_HEIGHT) / fontSize;
        gsap.set(el, {
          transformOrigin: "0 0",
          scale,
          x: (W - el.offsetWidth * scale) / 2 - el.offsetLeft,
          y: H * SEAM - POSTER_GAP - el.offsetHeight * scale - el.offsetTop,
          autoAlpha: 1,
        });
      };
      layoutPoster();

      const progress = { value: 0 };
      /** Le front du courant allume le nom : la version finale à gauche, la version pâle à droite. */
      const render = () => {
        const p = progress.value / 100;
        streamProgress.current = p;
        const lit = nameLit.current;
        const box = lit?.getBoundingClientRect();
        if (!lit || !box) return;
        // Le masque se mesure dans le repère du nom, avant agrandissement.
        const scale = box.width / (lit.offsetWidth || 1);
        const front = (streamFront(p, window.innerWidth) - box.left) / scale;
        const edge = LIGHT_EDGE / scale;
        const litMask = `linear-gradient(90deg, #000 ${front - edge}px, transparent ${front}px)`;
        const dimMask = `linear-gradient(90deg, transparent ${front - edge}px, #000 ${front}px)`;
        for (const [el, mask] of [
          [nameLit.current, litMask],
          [nameBase.current, dimMask],
        ] as const) {
          el?.style.setProperty("mask-image", mask);
          el?.style.setProperty("-webkit-mask-image", mask);
        }
      };
      render();

      // Fenêtre redimensionnée pendant le chargement : l'affiche se recentre.
      const onResize = () => {
        layoutPoster();
        render();
      };
      window.addEventListener("resize", onResize);

      const release = () => {
        html.style.overflow = "";
        setDone(true);
      };

      // Le courant avance vite puis ralentit vers 90 % ; les 10 derniers attendent le vrai chargement.
      const crawl = reduced
        ? null
        : gsap.to(progress, {
            value: 90,
            duration: 2.4,
            ease: "power2.out",
            onUpdate: render,
          });

      const finish = contextSafe!(() => {
        if (cancelled) return;
        crawl?.kill();
        window.removeEventListener("resize", onResize);
        if (reduced) {
          markDone();
          gsap.to(root.current, {
            autoAlpha: 0,
            duration: 0.3,
            onComplete: () => {
              markLanded();
              release();
            },
          });
          return;
        }

        // Arrivée : l'emplacement du titre, à l'échelle 1 (position mesurée hors transformation).
        const el = name.current;
        const to = heroName?.getBoundingClientRect();
        const landing =
          el && to
            ? { x: to.left - el.offsetLeft, y: to.top - el.offsetTop, scale: 1 }
            : null;

        gsap
          .timeline({
            onComplete: () => {
              // Le nom est posé exactement sur le titre : on passe le relais, sans saut.
              if (heroName) gsap.set(heroName, { autoAlpha: 1 });
              markLanded();
              release();
            },
          })
          // 1. Le courant finit sa course : le nom est entièrement éclairé.
          .to(progress, {
            value: 100,
            duration: 0.5,
            ease: "power1.inOut",
            onUpdate: render,
          })
          .addLabel("exit", "+=0.15")
          // Le courant s'en va vers la droite, sa queue s'effaçant depuis la gauche.
          .to(
            streamExit,
            { current: 1, duration: 1.2, ease: "power2.inOut" },
            "exit",
          )
          // 2. L'écran s'ouvre le long de la ligne du courant, comme une paupière,
          // pendant que la « caméra » recule : le nom rétrécit et se pose sur le titre du Hero.
          .addLabel("open", "exit+=0.6")
          .to(
            "[data-preloader='top']",
            { yPercent: -100, duration: 1.2, ease: "power4.inOut" },
            "open",
          )
          .to(
            "[data-preloader='bottom']",
            { yPercent: 100, duration: 1.2, ease: "power4.inOut" },
            "open",
          )
          .to(
            name.current,
            landing
              ? { ...landing, duration: 1.4, ease: "expo.inOut" }
              : { autoAlpha: 0, duration: 0.4, ease: "power2.out" },
            "open",
          )
          // Le Hero, la navbar et le fond commencent à apparaître pendant l'ouverture.
          .call(markDone, [], "open+=0.35");
      });

      whenReady().then(finish);

      return () => {
        cancelled = true;
        html.style.overflow = "";
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <>
      <div ref={root} data-preloader="" className="fixed inset-0 z-100">
        {/* Sans JavaScript, le loader ne se lèverait jamais : on ne l'affiche pas. */}
        <noscript>
          <style>{"[data-preloader]{display:none}"}</style>
        </noscript>
        <span className="sr-only" role="status">
          Chargement du portfolio…
        </span>

        {/* Deux panneaux qui se rejoignent sur la ligne du courant (62 % de la hauteur) :
          à la fin, le haut monte et le bas descend. */}
        <div
          data-preloader="top"
          className="absolute inset-x-0 top-0 h-[62%] bg-background"
        />
        <div
          data-preloader="bottom"
          className="absolute inset-x-0 bottom-0 h-[38%] bg-background"
        />

        {/* Le nom, à la taille exacte du titre du Hero : GSAP le place et l'agrandit en affiche.
          Invisible tant qu'il n'est pas positionné (sinon il apparaîtrait un instant en haut à gauche). */}
        <div
          ref={name}
          aria-hidden="true"
          className={`invisible absolute top-0 left-0 ${NAME_CLASS}`}
        >
          {/* Version pâle, là où la lumière n'est pas encore passée. */}
          <span ref={nameBase} className="block text-foreground/10">
            <NameContent lit={false} />
          </span>
          {/* Version finale (celle du Hero), révélée par le front du courant.
            Masquée d'office pour ne pas apparaître avant que le JS ne prenne la main. */}
          <span
            ref={nameLit}
            className="absolute inset-0 block mask-[linear-gradient(transparent,transparent)]"
          >
            <NameContent lit />
          </span>
        </div>
      </div>

      <div
        aria-hidden="true"
        data-preloader="stream"
        className="pointer-events-none fixed inset-x-0 top-[62%] z-100 h-40 -translate-y-1/2 mix-blend-screen"
      >
        <LifestreamBackground
          overlay
          position="absolute"
          zIndex={0}
          progress={streamProgress}
          exit={streamExit}
          count={3}
          width={20}
          particles={40}
          radius={120}
        />
      </div>
    </>
  );
}
