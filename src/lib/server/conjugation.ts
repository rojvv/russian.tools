import type { Verb } from '$lib/conjugation';

let dictionary: Promise<Verb[]> | undefined;
export function getVerbs(): Promise<Verb[]> {
	return dictionary ??= import('../../../static/data/verbs.json').then(({ default: data }) => data as Verb[]);
}
