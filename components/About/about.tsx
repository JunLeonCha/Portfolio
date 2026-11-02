import type { ReactNode } from "react";

/** Mot ou groupe de mots mis en valeur dans le texte. */
function Highlight({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "accent";
}) {
  return (
    <strong
      className={`font-normal ${tone === "accent" ? "text-accent" : "text-primary"}`}
    >
      {children}
    </strong>
  );
}

/**
 * Texte du dictionnaire avec balisage léger : `**mot**` en champagne, `++mot++` en lavande.
 * Les textes viennent de nos dictionnaires, jamais de l'utilisateur.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\+\+[^+]+\+\+)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**")) {
          return <Highlight key={i}>{part.slice(2, -2)}</Highlight>;
        }
        if (part.startsWith("++")) {
          return (
            <Highlight key={i} tone="accent">
              {part.slice(2, -2)}
            </Highlight>
          );
        }
        return part;
      })}
    </>
  );
}

/** Chiffres clés : `value` (nombre, animé au scroll) ou `text` (affiché tel quel). Légendes : `about.stats` du dictionnaire. */
export type Stat =
  | { value: number; suffix?: string }
  | { text: string };

export const STATS: Stat[] = [{ value: 4, suffix: "+" }, { text: "MBA" }];
