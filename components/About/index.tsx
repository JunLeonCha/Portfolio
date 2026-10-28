"use client";

import { useRef } from "react";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { INTRO, PARAGRAPHS, STATS } from "./about";

export default function About() {
  const root = useRef<HTMLElement>(null);

  useScrollReveal(root, (tl) => {
    tl.from("[data-about='title']", { y: 30, autoAlpha: 0 })
      .from("[data-about='intro']", { y: 20, autoAlpha: 0 }, "<0.15")
      .from(
        "[data-about='paragraph']",
        { y: 20, autoAlpha: 0, stagger: 0.12 },
        "<0.3",
      )
      .from(
        "[data-about='stat']",
        { y: 20, autoAlpha: 0, stagger: 0.1 },
        "<0.2",
      )
      // Les chiffres comptent depuis 0 pendant qu'ils apparaissent.
      .from(
        "[data-about='count']",
        {
          textContent: 0,
          snap: { textContent: 1 },
          duration: 1.2,
          ease: "power2.out",
          stagger: 0.1,
        },
        "<",
      );
  });

  return (
    <section
      ref={root}
      id="a-propos"
      aria-labelledby="a-propos-title"
      className="scroll-mt-24 py-24 lg:grid lg:grid-cols-12 lg:gap-8"
    >
      <div className="lg:col-span-5">
        {/* Le titre reste en vue pendant qu'on lit le texte. */}
        <h2
          id="a-propos-title"
          data-about="title"
          className="text-[3.5rem] xl:text-[5rem] leading-none tracking-tight lg:sticky lg:top-32"
        >
          À propos{" "}
          {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
          <span className="font-serif italic font-normal pr-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            de moi
          </span>
        </h2>
      </div>

      <div className="mt-12 lg:col-span-7 lg:mt-0">
        <p
          data-about="intro"
          className="max-w-2xl leading-relaxed text-foreground"
        >
          {INTRO}
        </p>

        <div className="mt-6 flex max-w-2xl flex-col gap-6 text-muted-foreground">
          {PARAGRAPHS.map((paragraph, i) => (
            <p key={i} data-about="paragraph" className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <dl
          aria-label="Chiffres clés"
          className="mt-14 grid grid-cols-2 border-t border-border/60"
        >
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              data-about="stat"
              className={`flex flex-col-reverse gap-2 pt-8 ${i > 0 ? "border-l border-border/60 pl-8" : ""}`}
            >
              <dt className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="font-serif text-5xl text-primary xl:text-6xl">
                {"value" in stat ? (
                  <>
                    <span data-about="count">{stat.value}</span>
                    {stat.suffix}
                  </>
                ) : (
                  stat.text
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
