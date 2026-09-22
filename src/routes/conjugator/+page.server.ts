import { normalizeVerb, suggestVerbs } from '$lib/conjugation';
import { readVerbQuery } from '$lib/conjugation-url';
import { getVerbs } from '$lib/server/conjugation';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = readVerbQuery(url);
	if (!query.trim()) return { query, matches: [], message: '' as const };
	if (!/^[а-яё]+(?:-[а-яё]+)*$/u.test(normalizeVerb(query))) {
		return { query, matches: [], message: 'invalidVerb' as const };
	}
	const matches = suggestVerbs(await getVerbs(), query);
	return {
		query,
		matches,
		message: matches.length ? '' as const : 'verbNotFound' as const
	};
};
