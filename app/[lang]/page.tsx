import type { Metadata } from "next";
import { notFound } from "next/navigation";
import About from "@/components/About";
import Contact from "@/components/Contact";
import { EMAIL } from "@/components/Contact/contact";
import Hero from "@/components/Hero";
import MyJourney from "@/components/MyJourney";
import MyProjects from "@/components/MyProjects";
import { FEATURED_COUNT, getProjects } from "@/components/MyProjects/projects";
import MyServices from "@/components/MyServices";
import ScrollSpy from "@/components/ScrollSpy";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { meta } = await getDictionary(lang);
  return pageMetadata({
    lang,
    path: "",
    title: meta.title,
    description: meta.description,
    siteName: meta.siteName,
    imageAlt: meta.ogAlt,
  });
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const projects = getProjects(dict.projects);

  // Données structurées : la personne derrière le portfolio, dans la langue de la page.
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Léon Cha",
    jobTitle: dict.meta.jobTitle,
    description: dict.meta.description,
    url: `${getSiteUrl()}${localePath(lang)}`,
    email: EMAIL,
    inLanguage: lang,
    address: { "@type": "PostalAddress", addressLocality: "Nantes", addressCountry: "FR" },
    sameAs: [
      "https://www.linkedin.com/in/leon-cha-02a039144/",
      "https://github.com/JunLeonCha",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // `<` échappé : le JSON ne peut pas refermer la balise <script>.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(person).replace(/</g, "\\u003c"),
        }}
      />
      <ScrollSpy lang={lang} />
      <main className="px-8 xl:px-24">
        <Hero dict={dict.hero} />
        <MyServices dict={dict.services} />
        <MyProjects
          projects={projects.slice(0, FEATURED_COUNT)}
          total={projects.length}
          lang={lang}
          dict={dict.projects}
        />
        <MyJourney dict={dict.journey} />
        <About dict={dict.about} />
        <Contact dict={dict.contact} />
      </main>
    </>
  );
}
