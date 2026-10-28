"use client";

import { useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { CONTACT_LINKS, EMAIL } from "./contact";

const COPIED_DURATION = 2000; // ms avant de revenir à « Copier mon e-mail »

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <rect x="8" y="8" width="13" height="13" rx="2" />
      <path d="M4 16V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useScrollReveal(root, (tl) => {
    tl.from("[data-contact='card']", { y: 60, autoAlpha: 0, duration: 1 })
      .from("[data-contact='title']", { y: 30, autoAlpha: 0 }, "<0.2")
      .from("[data-contact='text']", { y: 20, autoAlpha: 0 }, "<0.15")
      .from(
        "[data-contact='action']",
        { y: 20, autoAlpha: 0, stagger: 0.08 },
        "<0.15",
      );
  });

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_DURATION);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
    } catch {
      // Presse-papiers refusé (contexte non sécurisé, permission) : on ouvre la messagerie.
      window.location.href = `mailto:${EMAIL}`;
    }
  }

  return (
    <section
      ref={root}
      id="contact"
      aria-labelledby="contact-title"
      className="scroll-mt-24 py-24"
    >
      <div
        data-contact="card"
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-surface/50 p-8 backdrop-blur-sm md:p-12 lg:grid lg:grid-cols-2 lg:items-end lg:gap-12 xl:p-16"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-linear-to-tl from-primary/10 to-transparent"
        />

        <div className="relative">
          <h2
            id="contact-title"
            data-contact="title"
            className="text-[3.5rem] xl:text-[5rem] leading-none tracking-tight"
          >
            Travaillons{" "}
            {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
            <span className="font-serif italic font-normal pr-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              ensemble
            </span>
          </h2>
          <p
            data-contact="text"
            className="mt-6 max-w-md text-lg text-muted-foreground"
          >
            Transformer vos idées en applications simples, fiables et durables.
          </p>
        </div>

        <div className="relative mt-10 flex flex-col gap-6 lg:mt-0">
          <div data-contact="action" className="flex flex-col gap-3">
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary p-4 text-primary-foreground shadow-[0_0_16px] shadow-primary/25 transition-[background-color,box-shadow] duration-300 hover:bg-primary-hover hover:shadow-[0_0_30px] hover:shadow-primary/50 focus-visible:shadow-[0_0_30px] focus-visible:shadow-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "E-mail copié" : "Copier mon e-mail"}
            </button>
            <a
              href={`mailto:${EMAIL}`}
              aria-label={`Écrire à ${EMAIL}`}
              className="self-center font-mono text-xs text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none"
            >
              {EMAIL}
            </a>
            {/* Annonce la copie aux lecteurs d'écran. */}
            <span className="sr-only" aria-live="polite">
              {copied ? "Adresse e-mail copiée dans le presse-papiers" : ""}
            </span>
          </div>

          <ul aria-label="Réseaux et CV" className="flex flex-wrap gap-3">
            {CONTACT_LINKS.map((link) => {
              const external = link.href.startsWith("http");
              return (
                <li key={link.label} data-contact="action">
                  <a
                    href={link.href}
                    {...(external && { target: "_blank", rel: "noreferrer" })}
                    {...(link.download && { download: "" })}
                    className="inline-flex rounded-full border border-border bg-secondary px-5 py-2.5 text-sm text-secondary-foreground transition-[background-color,border-color] duration-300 hover:border-primary/50 hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-ring motion-reduce:transition-none"
                  >
                    {link.label}
                    {external && (
                      <span className="sr-only"> (nouvel onglet)</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
