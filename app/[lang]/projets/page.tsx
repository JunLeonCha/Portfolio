import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProjectsList from "@/components/MyProjects/projects-list";
import { getProjects } from "@/components/MyProjects/projects";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { pageMetadata } from "@/lib/seo";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/projets">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { meta } = await getDictionary(lang);
  return pageMetadata({
    lang,
    path: "/projets",
    title: meta.projectsTitle,
    description: meta.projectsDescription,
    siteName: meta.siteName,
    imageAlt: meta.ogAlt,
  });
}

export default async function ProjetsPage({
  params,
}: PageProps<"/[lang]/projets">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <main className="px-8 xl:px-24">
      <ProjectsList
        projects={getProjects(dict.projects)}
        lang={lang}
        dict={dict.projects}
      />
    </main>
  );
}
