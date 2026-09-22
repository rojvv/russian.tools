import { sitemap } from "$lib/server/sitemap";

export const prerender = true;

export function GET() {
  return sitemap(["/", "/stress", "/conjugator", "/decliner"]);
}
