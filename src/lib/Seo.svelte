<script lang="ts">
import { getI18n } from "$lib/i18n-context";
import { languageUrl, serializeJsonLd } from "$lib/seo";
let { title, description, canonical, noindex = false, home = false }: {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
  home?: boolean;
} = $props();
const i18n = getI18n();
const localizedCanonical = $derived(
  languageUrl(canonical, i18n.locale ?? "en"),
);
const structuredData = $derived({
  "@context": "https://schema.org",
  "@type": home ? "WebSite" : "WebApplication",
  name: title,
  url: localizedCanonical,
  description,
  inLanguage: i18n.locale,
  ...(home
    ? {}
    : {
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser",
    }),
});
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  {#if !noindex}
    <link rel="canonical" href={localizedCanonical} />
    <link rel="alternate" hreflang="en" href={languageUrl(canonical, "en")} />
    <link rel="alternate" hreflang="ru" href={languageUrl(canonical, "ru")} />
  {/if}
  {#if noindex}<meta name="robots" content="noindex, follow" />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="russian.tools" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={localizedCanonical} />
  <meta
    property="og:locale"
    content={i18n.locale === "ru" ? "ru_RU" : "en_US"}
  />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  {#if !noindex}{@html `<script type="application/ld+json">${
      serializeJsonLd(structuredData)
    }</script>`}{/if}
</svelte:head>
