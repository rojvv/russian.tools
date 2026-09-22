import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findVerbs, suggestVerbs, createTable, exportRows, toCsv } from '../src/lib/conjugation.ts';
const verbs = JSON.parse(readFileSync(new URL('../static/data/verbs.json', import.meta.url), 'utf8'));
const get = (word) => findVerbs(verbs, word)[0];

test('lookup accepts case and stress, preserves homonyms, and rejects unknown verbs', () => {
 assert.equal(get(' ЧИТА́ТЬ ').bare, 'читать');
 assert.ok(findVerbs(verbs, 'писать').length > 1);
 assert.equal(findVerbs(verbs, 'абракадабрить').length, 0);
});

test('imperfective, perfective and irregular forms have the correct tense', () => {
 const read = createTable(get('читать'), 'imperfective');
 assert.equal(read[0].title, 'Present');
 assert.equal(read[0].rows[0].form, 'чита́ю');
 assert.equal(read[1].rows[0].form, 'бу́ду чита́ть');
 const done = createTable(get('прочитать'), 'perfective');
 assert.equal(done[0].title, 'Future');
 assert.equal(done[0].rows[0].form, 'прочита́ю');
 assert.ok(!done.some(s => s.title === 'Present'));
 assert.equal(createTable(get('идти'), 'imperfective')[2].rows[0].form, 'шёл');
 assert.equal(createTable(get('быть'), 'imperfective')[1].rows[0].form, 'бу́ду');
 assert.equal(createTable(get('победить'), 'perfective')[0].rows[0].form, '');
 assert.equal(createTable(get('учиться'), 'imperfective')[0].rows[0].form, 'учу́сь');
});

test('both-aspect entries support either interpretation', () => {
 const verb = verbs.find(v => v.aspect === 'both');
 assert.equal(createTable(verb, 'imperfective').length, 4);
 assert.equal(createTable(verb, 'perfective').length, 3);
});

test('edits are exported without changing the dictionary; CSV escapes cells and formulas', () => {
 const verb = get('читать');
 const sections = createTable(verb, 'imperfective');
 sections[0].rows[0].form = 'edited, "form"\nsecond line';
 assert.equal(verb.finite[0], 'чита́ю');
 const rows = exportRows(verb.infinitive, 'imperfective', sections);
 assert.ok(rows.some(row => row.includes('edited, "form"\nsecond line')));
 const csv = toCsv([...rows, ['=1+1']]);
 assert.ok(csv.includes('"edited, ""form""\nsecond line"'));
 assert.ok(csv.includes('"\'=1+1"'));
 assert.ok(csv.includes('CC BY-SA 4.0'));
});


test('live lookup completes prefixes and finds spelling mistakes without changing exact matches', () => {
 assert.equal(suggestVerbs(verbs, 'чита')[0].bare, 'читать');
 assert.equal(suggestVerbs(verbs, 'читать')[0].bare, 'читать');
 assert.equal(suggestVerbs(verbs, 'читат')[0].bare, 'читать');
 assert.ok(suggestVerbs(verbs, 'писать').length > 1);
 assert.deepEqual(suggestVerbs(verbs, ''), []);
 assert.equal(suggestVerbs(verbs, 'читтаь')[0].bare, 'читать');
});
