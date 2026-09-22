import { building } from "$app/environment";
import { languageCookieMaxAge, preferredLocale } from "$lib/i18n";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const savedLanguage = event.cookies.get("language");
  const requestedLanguage = building ? null : event.url.searchParams.get("lang");
  const locale = preferredLocale(
    requestedLanguage === "en" || requestedLanguage === "ru" ? requestedLanguage : savedLanguage,
    event.request.headers.get("accept-language"),
  );
  event.locals.locale = locale;
  // Speculative data preloads must not change the user's saved preference.
  if (
    !event.isDataRequest
    && (requestedLanguage === "en" || requestedLanguage === "ru" || savedLanguage === "en" || savedLanguage === "ru")
  ) {
    event.cookies.set("language", locale, {
      path: "/",
      maxAge: languageCookieMaxAge,
      httpOnly: false,
      sameSite: "lax",
      secure: event.url.protocol === "https:",
    });
  }
  return resolve(event, { transformPageChunk: ({ html }) => html.replace("%lang%", locale) });
};
