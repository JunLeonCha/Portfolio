"use client";

import { useRef } from "react";
import { format } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useScrollReveal } from "@/lib/use-scroll-reveal";
import { SERVICES, type Service, type ServiceTone } from "./services";

/** Classes par teinte, écrites en entier pour que Tailwind les détecte. */
const TONES: Record<ServiceTone, { badge: string; tag: string; glow: string }> =
  {
    primary: {
      badge: "bg-primary/10 text-primary ring-1 ring-primary/20",
      tag: "bg-primary/10 text-primary",
      glow: "from-primary/10",
    },
    accent: {
      badge: "bg-accent/10 text-accent ring-1 ring-accent/20",
      tag: "bg-accent/10 text-accent",
      glow: "from-accent/10",
    },
  };

function ServiceCard({
  service,
  dict,
}: {
  service: Service;
  dict: Dictionary["services"];
}) {
  const text = dict.items[service.id];
  const tone = TONES[service.tone ?? "primary"];
  return (
    <article
      data-services="card"
      className={`relative flex min-h-64 flex-col justify-between gap-12 overflow-hidden rounded-3xl border border-border/70 bg-surface/50 p-6 backdrop-blur-sm transition-[border-color,box-shadow] duration-500 hover:border-border hover:shadow-[0_0_40px] hover:shadow-primary/5 motion-reduce:transition-none md:p-8 ${service.wide ? "md:col-span-2" : ""}`}
    >
      {service.highlight && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 bg-linear-to-tl ${tone.glow} to-transparent`}
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full ${tone.badge}`}
        >
          {service.icon}
        </span>
      </div>

      <div className="relative">
        <h3 className="text-2xl tracking-tight">{text.title}</h3>
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          {text.description}
        </p>
        {service.tags && service.tags.length > 0 && (
          <ul
            aria-label={format(dict.tagsLabel, { title: text.title })}
            className="mt-5 flex flex-wrap gap-2"
          >
            {service.tags.map((tag) => (
              <li
                key={tag}
                className={`rounded-full px-3 py-1.5 text-xs ${tone.tag}`}
              >
                {dict.tagLabels[tag] ?? tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function MyServices({
  dict,
}: {
  dict: Dictionary["services"];
}) {
  const root = useRef<HTMLElement>(null);

  useScrollReveal(root, (tl) => {
    tl.from("[data-services='title']", { y: 30, autoAlpha: 0 })
      .from("[data-services='text']", { y: 20, autoAlpha: 0 }, "<0.15")
      .from(
        "[data-services='card']",
        { y: 60, autoAlpha: 0, scale: 0.97, duration: 1, stagger: 0.12 },
        "<0.2",
      );
  });

  return (
    <section
      ref={root}
      id="services"
      aria-labelledby="services-title"
      className="scroll-mt-24 py-24"
    >
      <div className="flex flex-col gap-4">
        <h2
          id="services-title"
          data-services="title"
          className="text-[3.5rem] xl:text-[5rem] leading-none tracking-tight"
        >
          {dict.titleStart}{" "}
          {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
          <span className="font-serif italic font-normal pr-2 bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            {dict.titleAccent}
          </span>
        </h2>
        <p data-services="text" className="text-muted-foreground">
          {dict.subtitle}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => (
          <ServiceCard key={service.id} service={service} dict={dict} />
        ))}
      </div>
    </section>
  );
}
