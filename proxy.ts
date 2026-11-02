import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  hasLocale,
  type Locale,
} from "@/i18n/config";

/** Langue demandée par le navigateur (en-tête Accept-Language, par ordre de préférence). */
function fromAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter(({ q }) => q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of preferred) {
    const base = tag.split("-")[0];
    const match = LOCALES.find((locale) => locale === base);
    if (match) return match;
  }
  return null;
}

function getLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;
  return (
    fromAcceptLanguage(request.headers.get("accept-language")) ??
    DEFAULT_LOCALE
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasPrefix = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasPrefix) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${getLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Ni les internes de Next, ni les fichiers de /public ou les routes SEO (tout ce qui a une extension).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
