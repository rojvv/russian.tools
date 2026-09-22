import type { Handle } from '@sveltejs/kit';
import { languageCookieMaxAge, preferredLocale } from '$lib/i18n';

export const handle: Handle = async ({ event, resolve }) => {
	const savedLanguage = event.cookies.get('language');
	const locale = preferredLocale(savedLanguage, event.request.headers.get('accept-language'));
	event.locals.locale = locale;
	if (savedLanguage === 'en' || savedLanguage === 'ru') {
		event.cookies.set('language', savedLanguage, {
			path: '/', maxAge: languageCookieMaxAge, httpOnly: false,
			sameSite: 'lax', secure: event.url.protocol === 'https:'
		});
	}
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', locale) });
};
