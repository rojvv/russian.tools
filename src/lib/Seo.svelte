<script lang="ts">
import { getI18n } from "$lib/i18n-context";
import { serializeJsonLd } from "$lib/seo";
let { title, description, canonical, noindex = false, home = false }: {
  title: string;
  description: string;
  canonical: string;
  noindex?: boolean;
  home?: boolean;
} = $props();
const i18n = getI18n();
const structuredData = $derived({
  "@context": "https://schema.org",
  "@type": home ? "WebSite" : "WebApplication",
  name: title,
  url: canonical,
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
  <link rel="canonical" href={canonical} />
  {#if noindex}<meta name="robots" content="noindex, follow" />{/if}
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="russian.tools" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
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
