import { building, dev } from "$app/environment";
import { languageCookieMaxAge, preferredLocale } from "$lib/i18n";
import { languageUrl, siteOrigin, toolPaths } from "$lib/seo";
import { json, redirect } from "@sveltejs/kit";
import type { Handle, HandleFetch } from "@sveltejs/kit";

// Workers must read local dictionaries through the asset binding. Fetching the
// public origin from the Worker can fail when it points back to the same Worker.
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  const url = new URL(request.url);
  const assets = building || dev ? undefined : event.platform?.env?.ASSETS;
  if (
    assets
    && url.origin === event.url.origin
    && (/^\/data\/(verbs|nouns|adjectives)\.json\.gz$/.test(url.pathname)
      || /^\/data\/search\/(decliner|conjugator)\/(index-[0-9a-f]{3}|entries-\d+)\.json$/.test(url.pathname))
    && (request.method === "GET" || request.method === "HEAD")
  ) {
    return assets.fetch(request);
  }
  return fetch(request);
};

export const handle: Handle = async ({ event, resolve }) => {
  if (
    !building && (event.request.method === "GET" || event.request.method === "HEAD")
    && (event.url.hostname === "www.russian.tools"
      || (event.url.hostname === "russian.tools" && event.url.protocol !== "https:"))
  ) {
    redirect(308, siteOrigin + event.url.pathname + event.url.search);
  }
  const savedLanguage = event.cookies.get("language");
  const requestedLanguage = building ? null : event.url.searchParams.get("lang");
  const locale = preferredLocale(
    requestedLanguage === "en" || requestedLanguage === "ru" ? requestedLanguage : savedLanguage,
    event.request.headers.get("accept-language"),
  );
  event.locals.locale = locale;
  // A preference-dependent URL must resolve to a stable language URL before
  // rendering. Keep this redirect temporary and private because preferences vary.
  if (
    !building && (toolPaths.includes(event.url.pathname) || /^\/curse\/[^/]+$/.test(event.url.pathname))
    && (event.request.method === "GET" || event.request.method === "HEAD")
    && requestedLanguage !== "en" && requestedLanguage !== "ru"
  ) {
    const target = new URL(languageUrl(event.url.href, locale));
    const location = target.pathname + target.search;
    const headers = { "Cache-Control": "private, no-store", Vary: "Cookie, Accept-Language" };
    // Headers set via event.setHeaders are only applied by resolve(). Return
    // them directly, including on SvelteKit's client-navigation data responses.
    return event.isDataRequest
      ? json({ type: "redirect", location }, { headers })
      : new Response(null, { status: 307, headers: { ...headers, Location: location } });
  }
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
