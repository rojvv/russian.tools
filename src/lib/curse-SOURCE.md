# Curse word browser: sources and scope

The catalog contains **1,000 distinct headwords**: 101 manually curated entries
in `curse-data.ts` and 899 dictionary entries in `curse-dictionary.json`.
Aliases, inflections, е/ё variants, and stress variants do not increase the count.

## Curated entries

The original 100 entries and **иди́ на́ хуй** have original bilingual meanings,
usage notes, and example sentences. The latter displays the Latin reading aid
`idi na khuy`; joined forms such as `idi nakhuy` are search aliases only.
Its reference is [English Wiktionary](https://en.wiktionary.org/wiki/иди_на_хуй#Russian).
The 76 expansion references from the earlier catalog are retained below.
Other starter references include Russian Wiktionary entries for
[блядь](https://ru.wiktionary.org/wiki/блядь),
[пиздец](https://ru.wiktionary.org/wiki/пиздец),
[пизда](https://ru.wiktionary.org/wiki/пизда),
[хуй](https://ru.wiktionary.org/wiki/хуй),
[ебать](https://ru.wiktionary.org/wiki/ебать), and
[сука](https://ru.wiktionary.org/wiki/сука).

## Imported dictionary definitions

Copyright English Wiktionary contributors. The 899 imported definitions and
this adapted dictionary data are available under
[Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
The acknowledgements page lists each entry's Wiktionary article, whose history
identifies contributors. The browser and entry pages link to this section
through a Sources link; references are not displayed within individual cards.
Extraction: [Kaikki / Wiktextract](https://kaikki.org/dictionary/Russian/index.html).
Downloaded on 2026-09-25 from the
[vulgar](https://kaikki.org/dictionary/Russian/tags/hR/vulgar/index.html) and
[derogatory](https://kaikki.org/dictionary/Russian/tags/Fy/derogatory/index.html)
Russian subsets of English Wiktionary. Exact download URLs and SHA-256 hashes
are recorded in `curse-dictionary.json`; upstream downloads can change.

The import keeps only vulgar or derogatory senses with definitions. It excludes
inflection-only and alternate-spelling senses, proper names, affixes, political
senses, censored spellings, and duplicates of curated entries. It prioritizes
vulgar entries, then derogatory entries, alphabetically within each group, until
the combined catalog reaches 1,000. Homographic entries are merged. These are
selected dictionary senses: a headword may also have ordinary, neutral meanings.
Not every derogatory word is a swear word or mat.

Adaptations: selection and merging of senses, concatenation of definition
hierarchies with their register qualifiers, generated Latin reading aids,
bilingual register labels, and approximate intensity/type grouping. Core mat
roots map to the obscene category; other imported entries map to rude. Types
use part of speech and the derogatory tag. These automatic groupings are learning
aids, not claims about every use of a word. Definitions retain the source's
qualifiers, including offensive, ethnic slur, rare, and dated where supplied.

Imported definitions remain **in English**, explicitly labeled in the Russian
interface. Russian translations and example sentences are not fabricated.
Third-party quotations, audio, and dictionary examples are not imported.
Stress is retained where supplied by the source; it is not guessed otherwise.

To regenerate, download the two JSONL URLs recorded in the JSON metadata, then:

```sh
node scripts/import-curse-words.mjs /path/to/vulgar.jsonl /path/to/derogatory.jsonl
```

The checked-in JSON is the offline snapshot used by the app; normal builds make
no network requests. Re-running against the same downloads produces the same
entries. Review changed upstream data before replacing the snapshot.

## Search and presentation

Intensity and English equivalents depend on context. Latin forms are informal
reading aids, not IPA. Aliases are selected search aids, not complete inflection
tables. Exact Cyrillic headwords rank ahead of aliases and substring matches.
Search accepts Latin transliteration, stress-free Cyrillic, and е/ё variants.
The tool neither generates inflections nor detects profanity in arbitrary text.

All 1,000 entries are rendered directly, with no pagination. Search and filters
show every matching entry. Queries are shareable through `q`, `level`, `type`,
and `lang`; native GET forms also work without JavaScript. The obsolete `p`
parameter is ignored and removed when URL state is saved. Filtered URLs are
noindex; the unfiltered catalog is canonical.

Each entry also has an indexable `/curse/[slug]?lang=en|ru` page, linked from
its catalog heading. Slugs use stress-free Cyrillic with underscores for spaces.
The dedicated sitemap includes both interface languages for all 1,000 entries.
Metadata and `DefinedTerm` structured data use the same visible definitions,
including English-language attribution for imported definitions. Russian UI
pages do not claim that English definitions have been translated.

## Earlier expansion references

| Entry        | Reference                                                         |
| ------------ | ----------------------------------------------------------------- |
| бля́ха-му́ха   | [Russian Wiktionary](https://ru.wiktionary.org/wiki/бляха-муха)   |
| болва́н       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/болван)       |
| въеба́ть      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/въебать)      |
| выёбываться  | [Russian Wiktionary](https://ru.wiktionary.org/wiki/выёбываться)  |
| гад          | [Russian Wiktionary](https://ru.wiktionary.org/wiki/гад)          |
| говню́к       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/говнюк)       |
| дерьмо́       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/дерьмо)       |
| до фига́      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/до_фига)      |
| доеба́ться    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/доебаться)    |
| долбоёб      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/долбоёб)      |
| дохуя́        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/дохуя)        |
| дрянь        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/дрянь)        |
| ё-моё        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ё-моё)        |
| ёб твою́ мать | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ёб_твою_мать) |
| еба́ло        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ебало)        |
| ебану́тый     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ебанутый)     |
| ёбаный       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ёбаный)       |
| ебла́н        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/еблан)        |
| ебу́чий       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ебучий)       |
| ёшкин кот    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ёшкин_кот)    |
| задолба́ть    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/задолбать)    |
| задолба́ться  | [Russian Wiktionary](https://ru.wiktionary.org/wiki/задолбаться)  |
| заеба́ться    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/заебаться)    |
| засра́нец     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/засранец)     |
| идио́т        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/идиот)        |
| козёл        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/козёл)        |
| мерза́вец     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/мерзавец)     |
| мразь        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/мразь)        |
| на фиг       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/на_фиг)       |
| на фига́      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/на_фига)      |
| наеба́ть      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/наебать)      |
| на́хуй        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/нахуй)        |
| нахуя́        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/нахуя)        |
| негодя́й      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/негодяй)      |
| нехуёвый     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/нехуёвый)     |
| ни фига́      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ни_фига)      |
| ни фига́ себе́ | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ни_фига_себе) |
| ни хуя́       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ни_хуя)       |
| ни хуя́ себе́  | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ни_хуя_себе)  |
| объеба́ть     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/объебать)     |
| отъеба́ться   | [Russian Wiktionary](https://ru.wiktionary.org/wiki/отъебаться)   |
| офиге́нный    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/офигенный)    |
| офиге́ть      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/офигеть)      |
| охрене́ть     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/охренеть)     |
| охуе́нный     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/охуенный)     |
| пизда́тый     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/пиздатый)     |
| пиздёж       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/пиздёж)       |
| пизде́ть      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/пиздеть)      |
| пи́здить      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/пиздить)      |
| пиздобо́л     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/пиздобол)     |
| пизду́н       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/пиздун)       |
| пипе́ц        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/пипец)        |
| подле́ц       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/подлец)       |
| подо́нок      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/подонок)      |
| подъеба́ть    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/подъебать)    |
| по́фиг        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/пофиг)        |
| приду́рок     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/придурок)     |
| проеба́ть     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/проебать)     |
| разъеба́ть    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/разъебать)    |
| распиздя́й    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/распиздяй)    |
| скоти́на      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/скотина)      |
| спи́здить     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/спиздить)     |
| срать        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/срать)        |
| съеба́ться    | [Russian Wiktionary](https://ru.wiktionary.org/wiki/съебаться)    |
| тварь        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/тварь)        |
| тупи́ца       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/тупица)       |
| ублю́док      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/ублюдок)      |
| уёбок        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/уёбок)        |
| фиго́вый      | [Russian Wiktionary](https://ru.wiktionary.org/wiki/фиговый)      |
| хрено́вый     | [Russian Wiktionary](https://ru.wiktionary.org/wiki/хреновый)     |
| хрень        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/хрень)        |
| хуёвый       | [Russian Wiktionary](https://ru.wiktionary.org/wiki/хуёвый)       |
| хуета́        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/хуета)        |
| хуи́ло        | [Russian Wiktionary](https://ru.wiktionary.org/wiki/хуило)        |
| чёрт возьми́  | [Russian Wiktionary](https://ru.wiktionary.org/wiki/чёрт_возьми)  |
| чёрт побери́  | [Russian Wiktionary](https://ru.wiktionary.org/wiki/чёрт_побери)  |
