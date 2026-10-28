import type { Metadata } from "next";
import "./globals.css";
import PyrefliesBackground from "@/components/pyreflies-background";
import LifestreamCursor from "@/components/lifestream-cursor";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Léon CHA",
  description:
    "Développeur Fullstack, passionné par le développement web et la création d'expériences interactives.",
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
