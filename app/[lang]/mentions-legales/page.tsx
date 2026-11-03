import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { EMAIL } from "@/components/Contact/contact";
import { format, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getHost, getSiret } from "@/lib/legal";
import { pageMetadata } from "@/lib/seo";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/mentions-legales">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { meta, legal } = await getDictionary(lang);
  return pageMetadata({
    lang,
    path: "/mentions-legales",
    title: legal.metaTitle,
    description: legal.metaDescription,
    siteName: meta.siteName,
    imageAlt: meta.ogAlt,
  });
}

const LABEL =
  "font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground";

const LINK =
  "text-primary underline-offset-4 hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/** Bloc « intitulé : valeur » (éditeur, hébergeur). */
function Details({
  title,
  rows,
}: {
  title: string;
  rows: (readonly [label: string, value: ReactNode])[];
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-surface/50 p-6">
      <h2 className="text-xl tracking-tight">{title}</h2>
      <dl className="mt-5 flex flex-col gap-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className={LABEL}>{label}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-foreground/90">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function LegalPage({
  params,
}: PageProps<"/[lang]/mentions-legales">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { legal: t } = await getDictionary(lang);
  const host = getHost();
  const siret = getSiret();

  const email = (
    <a href={`mailto:${EMAIL}`} className={LINK}>
      {EMAIL}
    </a>
  );
  const hostContact = host.contact.startsWith("http") ? (
    <a href={host.contact} target="_blank" rel="noreferrer" className={LINK}>
      {host.contact.replace(/^https?:\/\//, "")}
    </a>
  ) : (
    host.contact
  );

  return (
    <main className="px-8 pt-36 pb-24 md:pt-44 xl:px-24">
      <header className="max-w-3xl">
        <p className={LABEL}>{t.updated}</p>
        <h1 className="mt-4 text-[3rem] leading-none tracking-tight md:text-[4.5rem]">
          {t.titleStart}{" "}
          {/* pr-2 évite que la dernière lettre en italique soit rognée par bg-clip-text */}
          <span className="bg-linear-to-r from-primary to-accent bg-clip-text pr-2 font-serif font-normal italic text-transparent">
            {t.titleAccent}
          </span>
        </h1>
      </header>

      <div className="mt-14 grid max-w-4xl gap-4 md:grid-cols-2">
        <Details
          title={t.publisher.title}
          rows={[
            [t.publisher.name, "Léon Cha"],
            [t.publisher.email, email],
            [t.publisher.location, t.publisher.locationValue],
            ...(siret ? [[t.publisher.siret, siret] as const] : []),
          ]}
        />
        <Details
          title={t.host.title}
          rows={[
            [t.host.name, host.name],
            [t.host.address, host.address],
            [t.host.contact, hostContact],
          ]}
        />
      </div>

      <div className="mt-16 flex max-w-3xl flex-col gap-12">
        {t.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-2xl tracking-tight">{section.title}</h2>
            <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{format(paragraph, { email: EMAIL })}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
