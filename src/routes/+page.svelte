<script lang="ts">
 import { getI18n } from '$lib/i18n-context';
 const i18n = getI18n();
</script>

<svelte:head>
 <title>russian.tools</title>
 <meta name="description" content={i18n.t('homeDescription')} />
</svelte:head>

<nav aria-label={i18n.t('tools')}>
 <div><a href="/stress">{i18n.t('stressTitle')}</a></div>
 <div><a href="/conjugator">{i18n.t('verbTitle')}</a></div>
</nav>

<style>
 nav { margin-top: 32px; display: grid; gap: 24px; }
 nav a { font-weight: 500; }
</style>
