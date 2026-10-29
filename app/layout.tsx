import type { Metadata } from "next";
import "./globals.css";
import PyrefliesBackground from "@/components/pyreflies-background";
import LifestreamCursor from "@/components/lifestream-cursor";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TITLE = "Léon CHA";
const DESCRIPTION =
  "Développeur Fullstack, passionné par le développement web et la création d'expériences interactives.";
const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Léon Cha, développeur Fullstack à Nantes",
};

// Les réseaux exigent des URL absolues et publiques pour les images de partage :
// un repli sur localhost rend l'image OG injoignable une fois en ligne.
function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "/",
    siteName: TITLE,
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <PyrefliesBackground />
        <Navbar />
        {children}
        <Footer />
        <LifestreamCursor />
      </body>
    </html>
  );
}
