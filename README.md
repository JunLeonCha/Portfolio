# Léon Cha — Portfolio

Portfolio personnel de Léon Cha, développeur Full Stack basé à Nantes. Le site présente mes expertises, mes projets et mon parcours dans une interface sombre, animée par un fond WebGL et un curseur personnalisé.

![Accueil du portfolio de Léon Cha sur ordinateur](docs/screenshots/accueil-desktop.webp)

## Fonctionnalités

- **Services et expertises** : frontend, backend, performance, expériences interactives et agents IA.
- **Projets** : trois projets mis en avant sur l'accueil, une page dédiée avec la liste complète et une fiche détaillée par projet (galerie de captures en carrousel).
- **Parcours** : expériences professionnelles et formations organisées en onglets.
- **À propos et contact** : présentation, liens professionnels, contact par e-mail et CV téléchargeable.
- **Identité visuelle animée** : préchargement, transitions au défilement, Pyreflies en WebGL, curseur lumineux et éclairage du nom dans le footer.
- **Adaptation aux usages** : navigation mobile, commandes au clavier (carrousel des captures, navigation) et prise en compte de `prefers-reduced-motion`.

## Aperçus

Captures réalisées sur la version de production du portfolio. Les fichiers WebP sont conservés dans [docs/screenshots](docs/screenshots).

<details>
<summary>Services et expertises — ordinateur</summary>

![Les cinq cartes de services et expertises du portfolio](docs/screenshots/services-desktop.webp)

</details>

<details>
<summary>Projets — ordinateur</summary>

![Les projets Aria, Monster Triad et Dog Stories K9 mis en avant](docs/screenshots/projets-desktop.webp)

</details>

<details>
<summary>Accueil — mobile</summary>

<img src="docs/screenshots/accueil-mobile.webp" alt="Accueil du portfolio en version mobile, avec le menu, la présentation et le portrait" width="390" />

</details>

## Stack du portfolio

| Technologie             | Utilisation                                           |
| ----------------------- | ----------------------------------------------------- |
| Next.js 16 · App Router | Structure des pages, rendu et optimisation des images |
| React 19 · TypeScript   | Composants et typage                                  |
| Tailwind CSS 4          | Mise en page responsive et thème                      |
| GSAP · ScrollTrigger    | Préchargement et animations au défilement             |
| WebGL · GLSL            | Fond animé Pyreflies                                  |
| Canvas 2D               | Curseur lumineux et ses particules                    |
| pnpm 11.22.0            | Gestion des dépendances et commandes du projet        |

Le fond se suspend lorsque l'onglet est masqué ou que la galerie est ouverte. Le suivi des lumières dans le footer utilise des positions regroupées et interpolées pour limiter les lectures GPU ; le halo de souris est actualisé séparément du curseur.

## Lancer le projet

Environnement utilisé : **Node.js 24** et **pnpm 11.22.0**.

Dans PowerShell :

```powershell
git clone https://github.com/JunLeonCha/Portfolio.git
cd Portfolio
pnpm.cmd install
pnpm.cmd dev
```

Ouvrir ensuite [http://localhost:3000](http://localhost:3000).

Sur macOS ou Linux, utiliser `pnpm` à la place de `pnpm.cmd`.

### Commandes disponibles

| Commande         | Action                                         |
| ---------------- | ---------------------------------------------- |
| `pnpm run dev`   | Lancer le serveur de développement             |
| `pnpm run lint`  | Vérifier le code avec ESLint                   |
| `pnpm run build` | Générer la version de production               |
| `pnpm run start` | Servir la version de production après le build |

## Langues (français / anglais)

Le site est disponible en français (`/fr`, langue par défaut) et en anglais (`/en`). Le proxy ([proxy.ts](proxy.ts)) redirige les URL sans préfixe vers la langue mémorisée (cookie `NEXT_LOCALE`) ou, à défaut, celle du navigateur. Le sélecteur FR / EN de la navbar renvoie vers la même page dans l'autre langue. Chaque page déclare sa canonique et ses `hreflang`, et [app/sitemap.ts](app/sitemap.ts) relie les traductions.

Tous les textes sont dans les dictionnaires [i18n/dictionaries/fr.ts](i18n/dictionaries/fr.ts) (référence) et [i18n/dictionaries/en.ts](i18n/dictionaries/en.ts) : le compilateur refuse un dictionnaire dont la forme diffère. Pour ajouter une langue, créer un dictionnaire, l'ajouter à [i18n/config.ts](i18n/config.ts) et [i18n/dictionaries.ts](i18n/dictionaries.ts).

## Personnaliser le contenu

Les textes (titres, descriptions, parcours, projets…) se modifient dans les dictionnaires ci-dessus. Les fichiers ci-dessous portent la structure et les données qui ne dépendent pas de la langue.

| Contenu                                | Fichier                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------ |
| Textes du site, dans chaque langue     | [i18n/dictionaries](i18n/dictionaries)                                   |
| Services : icônes, technologies, mise en page | [components/MyServices/services.tsx](components/MyServices/services.tsx) |
| Projets : images, technologies, ordre d'affichage | [components/MyProjects/projects.ts](components/MyProjects/projects.ts) |
| Chiffres clés de la section À propos   | [components/About/about.tsx](components/About/about.tsx)                 |
| E-mail, réseaux et lien du CV          | [components/Contact/contact.ts](components/Contact/contact.ts)           |
| Couleurs et styles globaux             | [app/globals.css](app/globals.css)                                       |
| Métadonnées et composition globale     | [app/[lang]/layout.tsx](app/[lang]/layout.tsx)                           |

Les visuels des projets se trouvent dans [public/images/projects](public/images/projects). Les trois premières entrées de `PROJECT_BASES` sont affichées sur l'accueil ; la page `/projets` reprend la liste complète. Chaque projet peut fournir une image, un cadrage `imagePosition`, des technologies et un lien. Sans image, la carte affiche « Aperçu à venir ».

Les composants des effets visuels sont [pyreflies-background.tsx](components/pyreflies-background.tsx) et [lifestream-cursor.tsx](components/lifestream-cursor.tsx). Leur coordination se trouve dans [lib](lib).

## Contact

[LinkedIn](https://www.linkedin.com/in/leon-cha-02a039144/) · [GitHub](https://github.com/JunLeonCha) · [junleon.cha@gmail.com](mailto:junleon.cha@gmail.com)
