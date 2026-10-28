# Fond animé Pyreflies

Adaptation du code fourni en composant React / TypeScript autonome pour Next.js. Aucun runtime d'éditeur, aucune image ni bibliothèque d'animation supplémentaire.

La page d'accueil affiche le fond seul. Lancez `pnpm dev`, puis ouvrez http://localhost:3000.

## Derrière le contenu d'une page

```tsx
import PyrefliesBackground from "@/components/pyreflies-background";

export default function Page() {
  return (
    <main className="min-h-svh">
      <PyrefliesBackground tint="#48ffa5" opacity={0.65} />
      <h1>Votre contenu</h1>
    </main>
  );
}
```

Le composant est fixé à la fenêtre et placé à `z-index: -1`. Le `body` possède déjà `isolation: isolate` dans `app/globals.css`, pour garder le fond visible derrière le contenu. Dans un autre projet, ajoutez cette règle au parent commun. Les sections de contenu doivent avoir un fond transparent pour laisser apparaître l'animation.

Pour le conserver sur toutes les pages, montez une seule instance dans `app/layout.tsx`, à côté de `{children}`.

## Dans une section

```tsx
<section style={{ position: "relative", isolation: "isolate", minHeight: 480 }}>
  <PyrefliesBackground position="absolute" />
  <h2>Votre section</h2>
</section>
```

Avec `overlay`, le fond devient transparent et les lueurs se mélangent en mode écran à une image ou une couleur placée dessous. `zIndex` permet d'ajuster l'ordre des calques.

## Réglages utiles

| Propriété | Effet |
| --- | --- |
| `tint` / `tintStrength` | Teinte dominante et force de la teinte |
| `background` | Couleur de fond et repli sans WebGL |
| `opacity` | Opacité des lueurs, sans modifier la couleur de fond |
| `orbs` / `orbSize` | Nombre et rayon des lueurs en pixels CSS |
| `tempo` / `crossing` | Vitesse globale et durée de traversée avant application du tempo |
| `mistDensity` / `sparks` | Particules de brume et étincelles par lueur |
| `maxFps` | Limite de fréquence de rendu |
| `resolution` / `quality` | Limite du ratio de pixels et résolution relative de la brume |
| `seed` | `0` pour une composition aléatoire ; une valeur positive la rend reproductible |
| `paused` | `true` pour une composition fixe, sans boucle d'animation |

Les valeurs initiales se règlent directement dans la signature du composant ; les props permettent de les remplacer pour chaque instance.

Les réglages de voiles, d'enveloppe, de brume, d'irisation et d'apparition du code original restent disponibles dans le type exporté `PyrefliesBackgroundProps`.

Pour alléger le rendu sur un appareil modeste :

```tsx
<PyrefliesBackground orbs={3} mistDensity={60} maxFps={30} resolution={1} />
```

Le composant laisse passer les clics et reste masqué aux technologies d'assistance. Il suspend le rendu quand l'onglet est masqué ou que la section est hors écran, respecte les changements de `prefers-reduced-motion`, recrée ses ressources après une restauration WebGL et libère les ressources GPU au démontage. Sans WebGL, la couleur de fond CSS reste affichée.

## Vérifications

```sh
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```
