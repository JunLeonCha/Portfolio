import type { Metadata } from "next";
import ProjectsList from "@/components/MyProjects/projects-list";

export const metadata: Metadata = {
  title: "Projets | Léon CHA",
  description:
    "Tous les projets de Léon Cha, développeur Fullstack : applications web, SaaS, mobile et prototypes.",
  alternates: { canonical: "/projets" },
};

export default function ProjetsPage() {
  return (
    <main className="px-8 xl:px-24">
      <ProjectsList />
    </main>
  );
}
