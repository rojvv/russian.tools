"""Flatten the current OpenRussian public CSV tables for import-verbs.py.
Usage: python3 scripts/prepare-openrussian-verbs.py EXPORT_DIRECTORY OUTPUT_TSV
Required exports: words.csv, verbs.csv, translations.csv, words_forms.csv.
Only active verb entries with a known aspect are included. See verbs-SOURCE.md.
"""
import csv
import sys
from collections import defaultdict
from pathlib import Path

root = Path(sys.argv[1])


def read(name):
    with (root / name).open(encoding='utf-8-sig', newline='') as source:
        yield from csv.DictReader(source)


words = {r['id']: r for r in read('words.csv') if r['type'] == 'verb' and r['disabled'] == '0'}
verbs = {r['word_id']: r for r in read('verbs.csv')
         if r['word_id'] in words and r['aspect'] in ('imperfective', 'perfective', 'both')}
forms = defaultdict(lambda: defaultdict(list))
columns = ['imperative_sg', 'imperative_pl', 'past_m', 'past_f', 'past_n', 'past_pl',
           'presfut_sg1', 'presfut_sg2', 'presfut_sg3', 'presfut_pl1', 'presfut_pl2', 'presfut_pl3']
for row in read('words_forms.csv'):
    kind = row['form_type'].removeprefix('ru_verb_')
    if row['word_id'] in verbs and kind in columns and row['form'].strip():
        forms[row['word_id']][kind].append((int(row['position'] or 0), row['form']))
translations = defaultdict(list)
for row in read('translations.csv'):
    if row['word_id'] in verbs and row['lang'] == 'en' and row['tl'].strip():
        translations[row['word_id']].append((int(row['position'] or 0), row['tl']))


def joined(values, separator):
    return separator.join(dict.fromkeys(value for _, value in sorted(values)))


with Path(sys.argv[2]).open('w', encoding='utf-8', newline='') as target:
    writer = csv.DictWriter(target, delimiter='\t', fieldnames=['bare', 'accented', 'translations_en', 'aspect', *columns])
    writer.writeheader()
    for word_id in sorted(verbs, key=lambda key: (int(words[key]['rank'] or 10**9), int(key))):
        word = words[word_id]
        writer.writerow({'bare': word['bare'], 'accented': word['accented'],
                         'translations_en': joined(translations[word_id], '; '),
                         'aspect': verbs[word_id]['aspect'],
                         **{column: joined(forms[word_id][column], ', ') for column in columns}})
print(f'Prepared {len(verbs):,} current verb entries.')
