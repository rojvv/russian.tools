# Russian name diminutives

`diminutive-data.ts` is an editorial selection of Russian given names, familiar
forms, and affectionate forms. It is not a complete dictionary or a suffix-based
generator. The selection includes common affectionate extensions such as
Маша → Машенька as well as traditional short forms such as Дмитрий → Митя.
No dictionary definitions or etymological prose are reproduced.

Reference consulted on 2026-09-23:

- N. A. Petrovsky, _Словарь русских личных имён_,
  [online text at Azbyka](https://azbyka.ru/deti/slovar-russkih-lichnyh-imen-petrovskij).
  Its entries and reverse index document name relationships. The older reference
  does not enumerate every affectionate extension used in this selection.
- [Gramota’s guide to the dictionary](https://gramota.ru/biblioteka/slovari/slovar-russkih-imyon/kak-polzovatsya-slovarem).

Selection and display rules:

- Keep explicit relationships; do not invent forms from suffix rules.
- Preserve full-name spelling variants in `aliases`, separately from diminutives.
- A short form can map to several entries, including names of different genders.
  Return all listed parents rather than choosing one.
- The directory is deliberately selective. A missing relationship does not mean
  the form is impossible, and matches are not an exhaustive list of parents.
- Forms are presented together without universal politeness or frequency labels:
  their tone depends on the speaker, addressee, and context.
- Display normal Cyrillic spelling, including ё. Search alone folds ё to е and
  ignores acute stress marks and capitalization. Latin queries use the shared
  transliteration comparison in `search-text.ts`; displayed names stay Cyrillic.

When extending the selection, check the relationship in a name reference, retain
ambiguities, and run `node --test tests/diminutive.test.mjs`.
