import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LOCALES, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Les langues sont toutes connues (generateStaticParams) : chaque page existe en HTML statique par langue.
// `params` n'est donc lu qu'avec une valeur déjà prérendue ; on autorise la navigation à bloquer
// plutôt que d'envelopper tout le site dans un Suspense (qui afficherait un écran vide au changement de langue).
export const instant = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/** La partie du site qui change de langue : navbar, page et footer (le reste est dans app/layout.tsx). */
export default async function LangLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <>
      <Navbar dict={dict.nav} lang={lang} />
      {children}
      <Footer
        dict={dict.footer}
        contact={dict.contact}
        nav={dict.nav}
        lang={lang}
      />
    </>
  );
}
