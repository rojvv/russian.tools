"""Flatten the public OpenRussian CSV tables into a reproducible adjective TSV.
Usage: python3 scripts/prepare-openrussian-adjectives.py EXPORT_DIRECTORY OUTPUT_TSV
Required exports: words.csv, adjectives.csv, translations.csv, words_forms.csv.
"""

import csv
import sys
from collections import defaultdict
from pathlib import Path

root = Path(sys.argv[1])


def read(name):
    with (root / name).open(encoding="utf-8-sig", newline="") as source:
        yield from csv.DictReader(source)


words = {
    row["id"]: row
    for row in read("words.csv")
    if row["type"] == "adjective" and row["disabled"] == "0"
}
adjectives = {row["word_id"] for row in read("adjectives.csv")} & words.keys()
columns = [
    f"{gender}_{case}"
    for gender in ("m", "f", "n", "pl")
    for case in ("nom", "gen", "dat", "acc", "inst", "prep")
]
forms = defaultdict(lambda: defaultdict(list))
for row in read("words_forms.csv"):
    kind = row["form_type"].removeprefix("ru_adj_")
    if row["word_id"] in adjectives and kind in columns and row["form"].strip():
        forms[row["word_id"]][kind].append((int(row["position"] or 0), row["form"]))
translations = defaultdict(list)
for row in read("translations.csv"):
    if row["word_id"] in adjectives and row["lang"] == "en" and row["tl"].strip():
        translations[row["word_id"]].append((int(row["position"] or 0), row["tl"]))


def joined(values, separator):
    return separator.join(dict.fromkeys(value for _, value in sorted(values)))


with Path(sys.argv[2]).open("w", encoding="utf-8", newline="") as target:
    writer = csv.DictWriter(
        target,
        delimiter="\t",
        fieldnames=["bare", "accented", "translations_en", *columns],
    )
    writer.writeheader()
    for word_id in sorted(
        adjectives, key=lambda key: (int(words[key]["rank"] or 10**9), int(key))
    ):
        word = words[word_id]
        writer.writerow(
            {
                "bare": word["bare"],
                "accented": word["accented"],
                "translations_en": joined(translations[word_id], "; "),
                **{column: joined(forms[word_id][column], ", ") for column in columns},
            }
        )
print(f"Prepared {len(adjectives):,} adjective entries.")
