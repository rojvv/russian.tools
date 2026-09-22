import type { LayoutServerLoad } from "./$types";
export const load: LayoutServerLoad = ({ locals, url }) => {
  // Cookies alone are not a SvelteKit load dependency. Re-read the preference
  // when navigating, including from an explicit language URL to a plain URL.
  void url.href;
  return { locale: locals.locale };
};
