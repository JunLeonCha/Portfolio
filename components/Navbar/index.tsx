"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { onPreloaderDone } from "@/components/Preloader";
import { NAV_LINKS as LINKS } from "./links";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const WAVE_STEP = 22; // ms de décalage entre deux lettres
const WAVE_EASE = "ease-[cubic-bezier(.7,0,.2,1)]";

/**
 * Lien du menu desktop, en « vague de lumière » au survol : chaque lettre grise s'en va vers le haut
 * pendant que la même remonte d'en dessous, en dégradé champagne → lavande, l'une après l'autre.
 * Les deux versions d'une lettre ne se superposent jamais (elles se suivent dans une fenêtre
 * qui les rogne) ; une aura douce s'allume derrière le mot. Tout en CSS : rien à désynchroniser.
 */
function WaveLink({ href, label }: { href: string; label: string }) {
  const letters = Array.from(label);
  const last = Math.max(1, letters.length - 1);
  return (
    <a
      href={href}
      className="group relative block rounded-full px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
    >
      {/* Aura : une lueur ronde et diffuse, comme celle d'une sphère Pyreflies. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-75 rounded-full bg-[radial-gradient(closest-side,var(--color-primary),transparent)] opacity-0 transition-[scale,opacity] duration-500 ease-out group-hover:scale-100 group-hover:opacity-15 group-focus-visible:scale-100 group-focus-visible:opacity-15 motion-reduce:transition-none"
      />
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="relative flex overflow-hidden">
        {letters.map((letter, i) => {
          const delay = { transitionDelay: `${i * WAVE_STEP}ms` };
          return (
            <span key={i} className="relative block whitespace-pre">
              <span
                style={delay}
                className={`block text-muted-foreground transition-transform duration-500 ${WAVE_EASE} group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transition-none`}
              >
                {letter}
              </span>
              <span
                style={{
                  ...delay,
                  // Chaque lettre prend sa teinte entre champagne et lavande : un dégradé sans texte superposé.
                  color: `color-mix(in oklab, var(--color-primary), var(--color-accent) ${(i / last) * 100}%)`,
                }}
                className={`absolute inset-0 block translate-y-full transition-transform duration-500 ${WAVE_EASE} group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:transition-none`}
              >
                {letter}
              </span>
            </span>
          );
        })}
      </span>
    </a>
  );
}

export default function Navbar() {
  const header = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);

  useGSAP(
    () => {
      // Fond plus dense dès qu'on a quitté le haut de page (lu par les classes data-[scrolled=true]).
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          nav.current?.setAttribute(
            "data-scrolled",
            String(self.scroll() > 24),
          );
        },
      });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let ready = false;
        let hidden = false;

        // Entrée : la barre descend quand le loader se lève.
        gsap.set(header.current, { yPercent: -130, autoAlpha: 0 });
        const stopWaiting = onPreloaderDone(() => {
          gsap.to(header.current, {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.9,
            delay: 0.25,
            ease: "power3.out",
            onComplete: () => {
              ready = true;
            },
          });
        });

        // Elle s'efface quand on descend, revient dès qu'on remonte.
        const smart = ScrollTrigger.create({
          start: 0,
          end: "max",
          onUpdate: (self) => {
            if (!ready) return;
            const hide =
              self.direction === 1 && self.scroll() > 160 && !openRef.current;
            if (hide === hidden) return;
            hidden = hide;
            gsap.to(header.current, {
              yPercent: hide ? -130 : 0,
              duration: hide ? 0.35 : 0.5,
              ease: hide ? "power2.in" : "power3.out",
              overwrite: "auto",
            });
          },
        });

        // Créés après coup ou hors du contexte : nettoyés à la main.
        return () => {
          stopWaiting();
          smart.kill();
          gsap.killTweensOf(header.current);
        };
      });
    },
    { scope: header },
  );

  // Menu mobile ouvert : scroll bloqué, Échap ferme, passage en desktop aussi.
  useEffect(() => {
    openRef.current = open;
    if (!open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const desktop = window.matchMedia("(min-width: 48rem)");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      html.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  return (
    <>
      {/* Menu mobile : se déploie en cercle depuis le bouton, liens en cascade.
          Hors du header : GSAP le transforme, ce qui ferait de lui le repère de ce `fixed`
          (le menu ne couvrirait que la hauteur de la barre). */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 bg-background/95 px-6 pt-32 pb-12 backdrop-blur-xl transition-[clip-path,visibility] duration-700 ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none md:hidden ${
          open
            ? "visible [clip-path:circle(150%_at_calc(100%-2.4rem)_2.4rem)]"
            : "invisible [clip-path:circle(0%_at_calc(100%-2.4rem)_2.4rem)]"
        }`}
      >
        <nav aria-label="Menu mobile">
          <ul className="flex flex-col">
            {LINKS.map((link, i) => {
              const delay = {
                transitionDelay: open ? `${200 + i * 60}ms` : "0ms",
              };
              return (
                <li key={link.label} className="relative">
                  <div
                    style={delay}
                    className={`transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
                  >
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block py-4 text-[2.5rem] leading-none tracking-tight transition-colors duration-300 hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none"
                    >
                      {link.label}
                    </a>
                  </div>
                  {/* Séparateur : se trace de gauche à droite, dans la même cascade que les liens. */}
                  {i < LINKS.length - 1 && (
                    <span
                      aria-hidden="true"
                      style={delay}
                      className={`absolute inset-x-0 bottom-0 h-px origin-left bg-border transition-transform duration-700 ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none ${open ? "scale-x-100" : "scale-x-0"}`}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <header
        ref={header}
        className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-24 md:pt-6"
      >
        <nav
          ref={nav}
          aria-label="Navigation principale"
          data-scrolled="false"
          className="relative z-10 flex items-center justify-between gap-4 rounded-full border border-border/50 bg-surface/30 py-2 pr-2 pl-6 backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-500 data-[scrolled=true]:border-border data-[scrolled=true]:bg-surface/75 data-[scrolled=true]:shadow-[0_8px_32px] data-[scrolled=true]:shadow-black/40 motion-reduce:transition-none"
        >
          <a
            href="#"
            aria-label="Léon Cha, retour à l'accueil"
            onClick={() => setOpen(false)}
            className="rounded-full text-lg leading-none tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Léon{" "}
            <span className="bg-linear-to-r from-primary to-accent bg-clip-text pr-1 font-serif italic text-transparent">
              Cha
            </span>
          </a>

          {/* Desktop : chaque lien gère son propre survol en CSS, rien de partagé,
              donc rien à désynchroniser même en balayant vite. */}
          <ul className="hidden items-center md:flex">
            {LINKS.map((link) => (
              <li key={link.label}>
                <WaveLink href={link.href} label={link.label} />
              </li>
            ))}
          </ul>

          {/* Mobile : deux traits qui se croisent en X */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setOpen((v) => !v)}
            className="relative grid size-11 cursor-pointer place-items-center rounded-full border border-border bg-secondary transition-colors duration-300 hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none md:hidden"
          >
            <span
              aria-hidden="true"
              className={`absolute h-px w-5 bg-foreground transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none ${open ? "rotate-45" : "translate-y-[-3.5px]"}`}
            />
            <span
              aria-hidden="true"
              className={`absolute h-px w-5 bg-foreground transition-transform duration-500 ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none ${open ? "-rotate-45" : "translate-y-[3.5px]"}`}
            />
          </button>
        </nav>
      </header>
    </>
  );
}
