import { sitemap } from "$lib/server/sitemap";

export const prerender = true;

export function GET() {
  return sitemap(
    ["/", "/stress", "/stress-practice", "/conjugator", "/decliner", "/motion", "/case-game", "/transliterate"].flatMap(
      (path) => ["en", "ru"].map((locale) => `${path}?lang=${locale}`),
    ),
  );
}
