"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { hasLocale } from "@/i18n/config";

/** Garde `<html lang>` à la langue de l'URL quand on change de langue sans recharger la page. */
export default function LangSync() {
  const { lang } = useParams<{ lang?: string }>();
  useEffect(() => {
    if (lang && hasLocale(lang)) document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
