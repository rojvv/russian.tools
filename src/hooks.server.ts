import { building, dev } from "$app/environment";
import { languageCookieMaxAge, preferredLocale } from "$lib/i18n";
import type { Handle, HandleFetch } from "@sveltejs/kit";

// Workers must read local dictionaries through the asset binding. Fetching the
// public origin from the Worker can fail when it points back to the same Worker.
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  const url = new URL(request.url);
  const assets = building || dev ? undefined : event.platform?.env?.ASSETS;
  if (
    assets
    && url.origin === event.url.origin
    && /^\/data\/(verbs|nouns|adjectives)\.json\.gz$/.test(url.pathname)
    && (request.method === "GET" || request.method === "HEAD")
  ) {
    return assets.fetch(request);
  }
  return fetch(request);
};

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
