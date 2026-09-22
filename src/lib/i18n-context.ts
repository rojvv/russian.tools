import { getContext, onDestroy, setContext } from 'svelte';
import { I18n } from 'sveltekit-i18n';
import { messages, type Locale } from './i18n';

const key = Symbol('i18n');

export function createI18n(initial: Locale) {
	// One library instance per layout tree / SSR request. Both small catalogs are
	// preloaded so SSR and language switching need no translation fetches.
	const i18n = new I18n({
		initLocale: initial,
		fallbackLocale: 'en',
		translations: messages
	});
	setContext(key, i18n);
	onDestroy(() => i18n.destroy());
	return i18n;
}

export function getI18n() {
	return getContext<ReturnType<typeof createI18n>>(key);
}
