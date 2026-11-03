import type { Metadata } from "next";
import "./globals.css";
import PyrefliesBackground from "@/components/pyreflies-background";
import LifestreamCursor from "@/components/lifestream-cursor";
import LangSync from "@/components/LangSync";
import ScrollReset from "@/components/ScrollReset";
import Preloader from "@/components/Preloader";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { en } from "@/i18n/dictionaries/en";
import { fr } from "@/i18n/dictionaries/fr";
import { GLOW_COLOR, GLOW_SECONDARY_COLOR } from "@/lib/glow-colors";
import { getSiteUrl } from "@/lib/site";

// Titre, description et partage sont posés page par page (voir lib/seo.ts) : ils dépendent de la langue.
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

/**
 * Posé avant le premier affichage : le HTML statique est le même pour toutes les langues,
 * ce script y inscrit celle de l'URL (`/fr/…`, `/en/…`). Ensuite, LangSync suit les navigations.
 */
const SET_LANG = `(function(){var l=location.pathname.split("/")[1];if(l==="fr"||l==="en")document.documentElement.lang=l})()`;

/**
 * Layout racine UNIQUE (au-dessus de `[lang]`) : le loader, le fond WebGL et le curseur y vivent,
 * donc un changement de langue ne les remonte pas — seuls la navbar, la page et le footer changent.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : `lang` est ajusté par SET_LANG / LangSync selon l'URL.
    <html lang={DEFAULT_LOCALE} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SET_LANG }} />
      </head>
      <body className="min-h-full flex flex-col">
        <LangSync />
        <ScrollReset />
        {/* Dans le layout : monté une seule fois par chargement de document, jamais rejoué par la navigation. */}
        <Preloader loading={{ fr: fr.preloader.loading, en: en.preloader.loading }} />
        <PyrefliesBackground />
        {children}
        {/* Violet des ténèbres façon Riku : tête électrique, filament indigo, refus en rose vif. */}
        <LifestreamCursor
          color={GLOW_COLOR}
          secondaryColor={GLOW_SECONDARY_COLOR}
          blockedColor="#ff4d7d"
        />
      </body>
    </html>
  );
}
