# Verb dictionary

Source: OpenRussian and its contributors, https://en.openrussian.org/.
Current export advertised at https://en.openrussian.org/dictionary-data:
https://app.togetherdb.com/db/fwoedz5fvtwvq03v/openrussian_public/words

Retrieved 2026-09-22 from the public TogetherDB CSV export interface. Joined
`words`, `verbs`, `translations`, and `words_forms`. This replaces the older
GitHub TSV export: 14,870 entries become 15,300 active entries. Current upstream
removals, disabled entries, and entries without a known aspect are excluded.

OpenRussian data is CC BY-SA; this adapted dataset and the retained TSV snapshot
are distributed under CC BY-SA 4.0, consistent with OpenRussian's public GitHub
license: https://github.com/Badestrand/russian-dictionary/blob/master/LICENSE.
License: https://creativecommons.org/licenses/by-sa/4.0/.

## Reproduction

The exact flattened source snapshot is retained in
`scripts/data/openrussian-verbs-2026-09-22.tsv.gz`. Run:

```
python3 scripts/import-verbs.py scripts/data/openrussian-verbs-2026-09-22.tsv.gz
```

To prepare a future snapshot, download the four CSV tables from the public
export interface into one directory, then run:

```
python3 scripts/prepare-openrussian-verbs.py /path/to/exports /tmp/verbs.tsv
python3 scripts/import-verbs.py /tmp/verbs.tsv
```

Transformations: keep active words classified as verbs with a known aspect;
join by word ID; use English translations; retain homonyms and alternative
forms in source position order; order entries by frequency rank, then ID;
convert apostrophe stress notation to combining acute accents. Only the six
present/future, four past, and two imperative forms are used. Missing forms
remain empty; no forms are guessed. The existing correction suppressing the
synthetic first-person singular of победить is retained. Audio is not imported.
Dictionary forms may contain errors.

Local corrections also replace the Latin `c` in `cбраживать` with Cyrillic `с`,
restore its infinitive stress and neuter past form (`сбра́живало`), and replace
corrupted source markup in the feminine, neuter, and plural past forms of
`взъесться` with `взъе́лась`, `взъе́лось`, and `взъе́лись`.

## SHA-256 of original CSV exports

- `words.csv`: `2415038b378a2b0727bd17daac8a1fded1815d62d747e4a775aa805bfac1a64d`
- `verbs.csv`: `45013f752cc441fe8f20158cef7580da833a4f2014905c6fecf117847b898ed2`
- `translations.csv`: `8c626b05eac0bbaa1c082e151f1a514d5b6bd405b56ec8adca09ed56029e5056`
- `words_forms.csv`: `863236fc9a18dc7fa54b536e4385b1e20c8dd8eb71fe93741cb402db69740c82`

Flattened TSV SHA-256: `27894c9fe82e5044c6ab8725cf0b5122949400c033945d65d8df178792874ec7`.
