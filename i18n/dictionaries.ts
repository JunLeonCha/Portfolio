import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/fr";

export type { Dictionary };

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  fr: () => import("./dictionaries/fr").then((module) => module.fr),
  en: () => import("./dictionaries/en").then((module) => module.en),
};

export const getDictionary = (locale: Locale) => dictionaries[locale]();
