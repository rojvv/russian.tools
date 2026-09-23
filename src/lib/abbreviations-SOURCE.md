# Russian abbreviation directory

`abbreviation-data.ts` is a manually curated selection of 400 meanings across
14 subjects. It includes initialisms, acronyms, graphical abbreviations, and
selected informal chat spellings. It is not an imported or exhaustive dictionary.
English glosses are written for this tool and are explanatory, not necessarily
official translations of institutional names.

## Reference checks

References consulted on 2026-09-23 for spelling conventions and selected entries:

- [Gramota: graphical abbreviations](https://gramota.ru/biblioteka/spravochniki/pravila-russkoy-orfografii-i-punktuatsii/graficheskie-sokrashcheniya)
  — everyday written forms, spaces, periods, and multiple expansions such as `г.`.
- [Gramota: dictionary abbreviations](https://gramota.ru/biblioteka/slovari/russkij-orfograficheskij-slovar/spisok-sokrashcheniy-ispolzuemykh-v-slovare)
  and [verb dictionary labels](https://gramota.ru/biblioteka/slovari/bolshoj-tolkovyj-slovar-russkikh-glagolov/spisok-russkikh-sokrashcheniy)
  — grammatical and usage labels. Dictionaries vary in their choice of shortened forms.
- [Federal Tax Service: ИНН](https://www.nalog.gov.ru/rn77/fl/interest/inn/)
  and [registration details](https://npd.nalog.ru/create_business/ul/creation/registration/step6/)
  — ИНН and the tax meaning of КПП.
- [Federal Tax Service: ЕГРЮЛ and ЕГРИП](https://www.nalog.gov.ru/rn77/related_activities/registries/egrul_egrip/)
  — register terminology.
- [Social Fund: СНИЛС](https://sfr.gov.ru/grazhdanam/personificirovannyj_uchet/snils/)
  — insurance account terminology.
- [Bank of Russia: СБП](https://www.cbr.ru/PSystem/sfp)
  and [national payment system](https://www.cbr.ru/PSystem/)
  — СБП and НСПК.
- [FIPI](https://fipi.ru/) — examination terminology.
- [Emergency Situations Ministry](https://mchs.gov.ru/ministerstvo)
  — МЧС institutional name.
- [Russian government: medical insurance law](https://government.ru/docs/all/99737/)
  — ОМС terminology, not an interpretation of insurance eligibility or rules.

These are reference checks, not a claim of independent verification of every
entry. No dictionary descriptions or bulk third-party datasets are reproduced.

## Editorial and matching decisions

- Separate rows retain distinct meanings, including within one subject (`ЕГРН`).
  Labels help distinguish them; there is no automatic contextual disambiguation.
- The decoder ignores capitalization, stress marks, periods, and whitespace.
  Hyphens and slashes remain meaningful. Explicit aliases cover other spellings.
- Latin input uses the site's transliteration search. Cyrillic exact matches take
  priority; expansions and English glosses are also searchable in the directory.
- Historical organizations and older company forms are grouped under historical
  terms; inclusion does not assert that an organization or legal form is current.
- English chat borrowings (e.g. `имхо`, `афк`, `лол`) have Russian meanings rather
  than invented Cyrillic letter-by-letter expansions. Informal and coarse usage is
  noted in the English gloss. Shortened expressions may have other meanings.
- Medical entries expand terminology only; they do not interpret test results.

When extending the catalog, retain alternative meanings, verify uncertain terms
with an appropriate reference, and run `node --test tests/abbreviation.test.mjs`.
