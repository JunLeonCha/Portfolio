"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ProjectShot } from "./projects";

const ARROW_CLASS =
  "grid size-12 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground backdrop-blur-sm transition-[color,border-color,background-color,transform] duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-30 motion-reduce:transition-none";

function Arrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`size-5 ${flip ? "rotate-180" : ""}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Carrousel de captures : la capture courante est centrée et éclairée, les voisines s'estompent
 * sur les bords. Défilement horizontal natif avec accroche (tactile, molette, clavier), glisser à
 * la souris, flèches et pastilles de progression.
 */
export default function ProjectGallery({
  shots,
  title,
}: {
  shots: ProjectShot[];
  title: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const sync = useCallback(() => {
    const el = track.current;
    if (!el) return;
    // La capture courante est celle dont le centre est le plus proche du centre du conteneur.
    const box = el.getBoundingClientRect();
    const center = box.left + box.width / 2;
    let nearest = 0;
    let best = Infinity;
    Array.from(el.children).forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    });
    setIndex(nearest);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync]);

  const goTo = (target: number) => {
    const el = track.current;
    const slide = el?.children[target] as HTMLElement | undefined;
    if (!el || !slide) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollTo({
      left: slide.offsetLeft - (el.clientWidth - slide.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  const last = shots.length - 1;

  return (
    <section
      aria-roledescription="carrousel"
      aria-label={`Captures de ${title}`}
      className="mt-24"
    >
      <h2 className="text-2xl tracking-tight md:text-3xl">
        En <span className="font-serif italic text-primary">images</span>
      </h2>

      <ul
        ref={track}
        onScroll={sync}
        // Focusable pour défiler aux flèches du clavier.
        tabIndex={0}
        aria-label="Liste des captures"
        onPointerDown={(event) => {
          // Glisser à la souris ; le tactile défile nativement.
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          const el = track.current;
          if (!el) return;
          drag.current = {
            x: event.clientX,
            left: el.scrollLeft,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          const el = track.current;
          if (!state || !el) return;
          const delta = event.clientX - state.x;
          if (!state.moved && Math.abs(delta) < 6) return;
          if (!state.moved) {
            state.moved = true;
            setDragging(true);
          }
          el.scrollLeft = state.left - delta;
        }}
        onPointerUp={() => {
          const state = drag.current;
          drag.current = null;
          if (!state?.moved) return;
          setDragging(false);
          // L'accroche reprend la main : on rejoint la capture la plus proche.
          requestAnimationFrame(() => goTo(index));
        }}
        onPointerLeave={() => {
          if (!drag.current?.moved) drag.current = null;
        }}
        onClickCapture={(event) => {
          // Un glisser ne doit pas compter comme un clic sur une capture.
          if (dragging) event.stopPropagation();
        }}
        className={`relative mt-10 flex gap-5 overflow-x-auto overscroll-x-contain py-6 before:content-[''] before:w-[calc(8%-1.25rem)] before:shrink-0 after:content-[''] after:w-[calc(8%-1.25rem)] after:shrink-0 md:before:w-[calc(16%-1.25rem)] md:after:w-[calc(16%-1.25rem)] xl:before:w-[calc(22%-1.25rem)] xl:after:w-[calc(22%-1.25rem)] [mask-image:linear-gradient(90deg,transparent,#000_7%,#000_93%,transparent)] scrollbar-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-scrollbar]:hidden ${dragging ? "cursor-grabbing select-none" : "cursor-grab snap-x snap-mandatory scroll-smooth motion-reduce:scroll-auto"}`}
      >
        {shots.map((shot, i) => {
          const active = i === index;
          return (
            <li
              key={shot.src}
              aria-roledescription="diapositive"
              aria-label={`${i + 1} sur ${shots.length}`}
              aria-current={active}
              onClick={() => !active && goTo(i)}
              className={`w-[84%] shrink-0 snap-center transition-[opacity,transform] duration-500 ease-out md:w-[68%] xl:w-[56%] motion-reduce:transition-none ${active ? "scale-100 opacity-100" : "scale-[0.94] opacity-45 hover:opacity-70"}`}
            >
              <div
                className={`overflow-hidden rounded-2xl border bg-surface transition-[border-color,box-shadow] duration-500 motion-reduce:transition-none ${active ? "border-primary/30 shadow-[0_0_70px] shadow-primary/10" : "border-border/70"}`}
              >
                {/* Barre de fenêtre : cadre les captures comme des écrans d'application. */}
                <div
                  aria-hidden="true"
                  className="flex h-8 items-center gap-1.5 border-b border-border/70 bg-surface-elevated/60 px-4"
                >
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                </div>
                <div className="relative aspect-16/10">
                  <Image
                    src={shot.src}
                    alt={shot.alt}
                    fill
                    draggable={false}
                    sizes="(min-width: 1280px) 56vw, (min-width: 768px) 68vw, 84vw"
                    style={{ objectPosition: "top" }}
                    className="object-cover"
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-6">
        <p
          aria-live="polite"
          className="hidden w-20 font-mono sm:block text-xs tabular-nums tracking-[0.2em] text-muted-foreground"
        >
          <span className="text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>{" "}
          / {String(shots.length).padStart(2, "0")}
        </p>

        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="Aller à une capture"
        >
          {shots.map((shot, i) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Capture ${i + 1}`}
              aria-current={i === index}
              className="group grid h-6 place-items-center px-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span
                className={`block h-1.5 rounded-full transition-[width,background-color] duration-500 motion-reduce:transition-none ${i === index ? "w-8 bg-linear-to-r from-primary to-accent" : "w-1.5 bg-border group-hover:bg-muted-foreground"}`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Capture précédente"
            className={ARROW_CLASS}
          >
            <Arrow flip />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === last}
            aria-label="Capture suivante"
            className={ARROW_CLASS}
          >
            <Arrow />
          </button>
        </div>
      </div>
    </section>
  );
}
