export interface Verb {
	bare: string;
	infinitive: string;
	meaning: string;
	aspect: 'imperfective' | 'perfective' | 'both';
	finite: string[];
	past: string[];
	imperative: string[];
}
export interface Section { title: string; rows: { label: string; form: string }[] }
export const normalizeVerb = (text: string) => text.normalize('NFC').toLocaleLowerCase('ru').replaceAll('\u0301', '').trim();

export function findVerbs(verbs: Verb[], text: string): Verb[] {
	const query = normalizeVerb(text);
	const exact = verbs.filter((verb) => normalizeVerb(verb.bare) === query);
	return exact.length ? exact : verbs.filter((verb) => normalizeVerb(verb.bare).replaceAll('ё', 'е') === query.replaceAll('ё', 'е'));
}

/** Prefer exact spellings, then common prefix matches, then the smallest edit distance. */
export function suggestVerbs(verbs: Verb[], text: string): Verb[] {
	const query = normalizeVerb(text).replaceAll('ё', 'е');
	if (!query || query.length > 40) return [];
	const exact = findVerbs(verbs, text);
	if (exact.length) return exact;
	const prefix = verbs.find((verb) => normalizeVerb(verb.bare).replaceAll('ё', 'е').startsWith(query));
	if (prefix) return findVerbs(verbs, prefix.bare);
	let closest: Verb | undefined;
	let best = Infinity;
	for (const verb of verbs) {
		const word = normalizeVerb(verb.bare).replaceAll('ё', 'е');
		if (Math.abs(word.length - query.length) > best) continue;
		let previous = Array.from({ length: word.length + 1 }, (_, i) => i);
		for (let i = 1; i <= query.length; i++) {
			const current = [i];
			for (let j = 1; j <= word.length; j++) {
				current[j] = Math.min(current[j - 1] + 1, previous[j] + 1,
					previous[j - 1] + (query[i - 1] === word[j - 1] ? 0 : 1));
			}
			previous = current;
		}
		if (previous[word.length] < best) { best = previous[word.length]; closest = verb; }
	}
	return closest ? findVerbs(verbs, closest.bare) : [];
}

export function createTable(verb: Verb, aspect: 'imperfective' | 'perfective'): Section[] {
	const persons = ['я', 'ты', 'он / она / оно', 'мы', 'вы', 'они'];
	const section = (title: string, labels: string[], forms: string[]): Section => ({
		title, rows: labels.map((label, i) => ({ label, form: forms[i] === '-' ? '' : (forms[i] ?? '') }))
	});
	const future = ['бу́ду', 'бу́дешь', 'бу́дет', 'бу́дем', 'бу́дете', 'бу́дут'];
	return [
		...(aspect === 'imperfective' ? [section('Present', persons, verb.finite)] : []),
		section('Future', persons, aspect === 'perfective' ? verb.finite : future.map((form) =>
			verb.bare === 'быть' ? form : `${form} ${verb.infinitive}`)),
		section('Past', ['он (masculine)', 'она (feminine)', 'оно (neuter)', 'они (plural)'], verb.past),
		section('Imperative', ['ты', 'вы'], verb.imperative)
	];
}

export function exportRows(infinitive: string, aspect: string, sections: Section[]): string[][] {
	return [
		['Verb', infinitive], ['Aspect', aspect], ['Tense / mood', 'Person / gender', 'Form'],
		...sections.flatMap((section) => section.rows.map((row) => [section.title, row.label, row.form])),
		['Source', 'OpenRussian, CC BY-SA 4.0', 'https://github.com/Badestrand/russian-dictionary'],
		['Note', 'Dictionary forms may contain errors.']
	];
}

export function toCsv(rows: string[][]): string {
	return '\ufeff' + rows.map((row) => row.map((cell) => {
		// Keep cells as text when opened in spreadsheet software.
		const safe = /^[\s]*[=+\-@]/u.test(cell) ? `'${cell}` : cell;
		return `"${safe.replaceAll('"', '""')}"`;
	}).join(',')).join('\r\n');
}
