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

/** Première phrase, affichée en grand. */
export const INTRO: ReactNode = (
  <>
    Développeur Full Stack diplômé d'un MBA à MyDigitalSchool Nantes, j'aime
    concevoir des applications qui répondent à de vrais besoins et qui restent
    agréables à faire évoluer.
  </>
);

/** Paragraphes suivants, dans l'ordre d'affichage. */
export const PARAGRAPHS: ReactNode[] = [
  <>
    Ce qui me motive avant tout, c'est résoudre des problèmes concrets, créer
    des outils utiles et continuer à apprendre. J'apprécie autant comprendre un
    besoin utilisateur que réfléchir à la meilleure façon de l'implémenter. Pour
    moi, une fonctionnalité ne se résume pas à « ça fonctionne » : elle doit
    être claire, performante et simple à maintenir.
  </>,
  <>
    Chez <Highlight tone="accent">Digglerz Factory</Highlight>, j'ai développé
    et fait évoluer des applications en{" "}
    <Highlight>Angular, Python, C# et SQL</Highlight>. J'accorde une attention
    particulière à la qualité du code, aux performances et à la conception
    d'architectures capables d'évoluer dans le temps.
  </>,
  <>
    J'aime construire des solutions utiles, penser sur le long terme et
    développer des applications qui restent fiables, aussi bien pour leurs
    utilisateurs que pour les équipes qui les feront évoluer.
  </>,
];

/** Chiffres clés : `value` (nombre, animé au scroll) ou `text` (affiché tel quel). */
export type Stat = { label: string } & (
  { value: number; suffix?: string } | { text: string }
);

export const STATS: Stat[] = [
  { value: 4, suffix: "+", label: "Expériences" },
  { text: "MBA", label: "MyDigitalSchool Nantes" },
];
