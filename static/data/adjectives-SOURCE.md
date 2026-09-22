# Adjective dictionary

Source: [OpenRussian and its contributors](https://en.openrussian.org/).
The [public dictionary export](https://en.openrussian.org/dictionary-data) is
hosted on [TogetherDB](https://app.togetherdb.com/db/fwoedz5fvtwvq03v/openrussian_public/words).
Retrieved 2026-09-22. Joined `words`, `adjectives`, `translations`, and
`words_forms`, retaining 41,948 active adjective entries.

The adapted JSON datasets and retained TSV snapshot are distributed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), consistent with
[OpenRussian's public repository license](https://github.com/Badestrand/russian-dictionary/blob/master/LICENSE).
Audio is not included. Dictionary forms may contain errors and omissions.

## Reproduction

The exact flattened source is retained in
`scripts/data/openrussian-adjectives-2026-09-22.tsv.gz`. Rebuild with:

```sh
python3 scripts/import-adjectives.py scripts/data/openrussian-adjectives-2026-09-22.tsv.gz
```

To update the source, download the four CSV tables from the public export
interface into one directory, then run:

```sh
python3 scripts/prepare-openrussian-adjectives.py /path/to/exports /tmp/adjectives.tsv
python3 scripts/import-adjectives.py /tmp/adjectives.tsv
```

## Transformations

Keep active words classified as adjectives with an adjective metadata record;
join by word ID; retain English translations, homonyms, and alternative forms
in source position order. Sort entries by frequency rank, then ID. Convert
apostrophe stress notation to combining acute accents; split comma/slash form
variants and remove surrounding parentheses. Retain the four long-form
paradigms; short forms and degrees of comparison are outside this tool's scope.

Each paradigm stores nominative, genitive, dative, inanimate accusative, animate
accusative, instrumental, and prepositional forms, in that order. For masculine
and plural accusatives, compare attested variants with the nominative and
genitive, ignoring accents and ё/е differences. Source position is not a reliable
animacy indicator. For feminine and neuter accusatives, both rows use the same
attested forms. Missing forms remain empty; only a missing masculine nominative
is filled from the dictionary headword. No paradigms are generated from endings.

Local corrections: repair the neuter accusative of рабочий from рабо́чое to
рабо́чее; replace Latin o lookalikes and stray combining dots in headwords;
trim trailing whitespace. The minified JSON is stored as one deterministic gzip file,
`adjectives.json.gz` (about 4 MiB). Server and browser lookups decompress this
local static asset; dictionary data is not embedded in the Worker JavaScript bundle.

## SHA-256 of source exports

- `words.csv`: `2415038b378a2b0727bd17daac8a1fded1815d62d747e4a775aa805bfac1a64d`
- `adjectives.csv`: `167cacf773a391b2f3902af3e42906cf81d3229f29875d8db54e4cb7f7617940`
- `translations.csv`: `8c626b05eac0bbaa1c082e151f1a514d5b6bd405b56ec8adca09ed56029e5056`
- `words_forms.csv`: `863236fc9a18dc7fa54b536e4385b1e20c8dd8eb71fe93741cb402db69740c82`

Uncompressed flattened TSV: `d27d7391305de0abe71146b92809329d3283cc8ed4a40e9e1aca90ef4eeece3e`.
