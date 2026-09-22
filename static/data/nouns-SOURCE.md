# Noun dictionary

Source: [OpenRussian](https://en.openrussian.org/), exported by
[Badestrand/russian-dictionary](https://github.com/Badestrand/russian-dictionary).

Source revision: `50e210c4803237779cb562bc1abcea529066031c`.
[Original nouns.csv](https://raw.githubusercontent.com/Badestrand/russian-dictionary/50e210c4803237779cb562bc1abcea529066031c/nouns.csv)
Retrieved 2026-09-22. Contains 26,982 noun entries, retaining homonyms and source ordering.

The data and this adapted dataset are licensed under **Creative Commons
Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**.
See [license text](nouns-LICENSE.txt) or https://creativecommons.org/licenses/by-sa/4.0/.
Attribution: OpenRussian and its contributors, including Wiktionary contributors.

Rebuild from the pinned TSV with:

```
python3 scripts/import-nouns.py /path/to/nouns.csv
```

Changes: retain English meanings, grammatical metadata, and six singular/plural
case forms; convert apostrophe stress notation to Unicode combining acute accents;
normalize whitespace; turn hyphen placeholders into empty strings. Suppress forms
for numbers explicitly marked unavailable. Fill missing indeclinable forms from
the headword, and missing nominative headword forms for the appropriate number.
Supply the missing plural paradigm of ножницы. No other missing case forms are
guessed. Source alternatives are retained.

This is an older export, with missing forms and possible inaccuracies. The tool
labels unavailable forms with an em dash. Closest matches are suggestions, not
proof that the entered word is a dictionary headword.
