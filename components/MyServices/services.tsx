import type { ReactNode } from "react";
import { AgentIcon, DatabaseIcon, GaugeIcon, MonitorIcon, WaveIcon } from "./icons";

export type ServiceTone = "primary" | "accent";

export type Service = {
  /** Clé du texte dans le dictionnaire (`services.items`). */
  id: string;
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
 * Cartes de la section Services (textes : dictionnaire, `services.items`).
 * L'ordre du tableau est l'ordre de la grille (3 colonnes) :
 * une carte `wide` occupe deux colonnes, les autres une seule.
 */
export const SERVICES: Service[] = [
  {
    id: "frontend",
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
    id: "backend",
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
    id: "performance",
    icon: <GaugeIcon />,
    tags: ["Core Web Vitals", "SEO technique", "Accessibilité"],
  },
  {
    id: "interactive",
    icon: <WaveIcon />,
    tags: ["GSAP", "Motion", "AnimeJS"],
    tone: "accent",
  },
  {
    id: "ai",
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
