import type { ReactNode } from "react";
import { AgentIcon, DatabaseIcon, GaugeIcon, MonitorIcon, WaveIcon } from "./icons";

export type ServiceTone = "primary" | "accent";

export type Service = {
  title: string;
  description: string;
  icon: ReactNode;
  tags?: string[];
  /** Occupe deux colonnes sur la grille (sinon une). */
  wide?: boolean;
  /** Couleur de l'icône et des tags : champagne (défaut) ou lavande. */
  tone?: ServiceTone;
  /** Lueur dégradée dans le fond de la carte. */
  highlight?: boolean;
  /** Extrait de code affiché en haut à droite. */
  code?: string;
};

/**
 * Cartes de la section Services. L'ordre du tableau est l'ordre de la grille (3 colonnes) :
 * Une carte `wide` occupe deux colonnes, les autres une seule.
 */
export const SERVICES: Service[] = [
  {
    title: "Frontend & interfaces",
    description:
      "Des interfaces soignées, accessibles et rapides, de la maquette jusqu'aux composants réutilisables d'un design system.",
    icon: <MonitorIcon />,
    tags: [
      "React",
      "Next.js",
      "Angular",
      "SolidJS",
      "SolidStart",
      "Vue.js",
      "Nuxt",
      "TypeScript",
      "Tailwind CSS",
      "shadcn/ui",
      "DaisyUI",
    ],
    wide: true,
    highlight: true,
  },
  {
    title: "Backend & bases de données",
    description:
      "Les API, les données et les règles qui font tourner le produit, jusqu'à sa mise en production.",
    icon: <DatabaseIcon />,
    tags: [
      "Node.js",
      "AdonisJS",
      ".NET / C#",
      "Python",
      "PostgreSQL",
      "Supabase",
      "Docker",
      "Dokploy",
    ],
  },
  {
    title: "Performance, SEO & refonte",
    description:
      "Audit et modernisation d'applications existantes : Core Web Vitals, accessibilité et SEO technique.",
    icon: <GaugeIcon />,
    tags: ["Core Web Vitals", "SEO technique", "Accessibilité"],
  },
  {
    title: "Expériences interactives",
    description:
      "Animations et rendus WebGL qui donnent du caractère à un produit",
    icon: <WaveIcon />,
    tags: ["GSAP", "Motion", "AnimeJS"],
    tone: "accent",
  },
  {
    title: "Agents IA & automatisation",
    description:
      "Conception d'agents IA et automatisation de tâches : LLM enrichis par les données du projet grâce au RAG, outils connectés via MCP et skills adaptés aux besoins.",
    icon: <AgentIcon />,
    tags: [
      "Claude",
      "Codex",
      "Gemini",
      "LLM",
      "LangChain",
      "Agent Tools",
      "MCP",
      "Skills",
      "RAG",
      "Ollama",
      "API OpenAI",
      "API Anthropic",
    ],
    tone: "accent",
  },
];
