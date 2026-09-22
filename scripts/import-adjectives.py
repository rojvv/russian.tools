"""Import the pinned OpenRussian adjective TSV. See adjectives-SOURCE.md.
Usage: python3 scripts/import-adjectives.py SNAPSHOT.tsv.gz
"""

import csv
import gzip
import re
import sys
from dictionary_output import write_dictionary


def accent(text):
    return re.sub(r"([А-Яа-яЁё])'", r"\1" + "\u0301", text).strip()


def variants(text):
    return list(
        dict.fromkeys(
            value
            for part in re.split(r"[,/]", accent(text))
            if (value := part.strip().strip("()").strip()) and value != "-"
        )
    )


def normalize(text):
    return text.replace("\u0301", "").replace("ё", "е").lower()


result = []
open_source = gzip.open if sys.argv[1].endswith(".gz") else open
with open_source(sys.argv[1], mode="rt", encoding="utf-8", newline="") as source:
    for row in csv.DictReader(source, delimiter="\t"):
        # Repair Latin lookalikes and stray combining dots in source headwords.
        row["bare"] = (
            row["bare"]
            .strip()
            .replace("o", "о")
            .replace("\u0307", "")
            .replace("\u0323", "")
        )
        row["accented"] = (
            row["accented"]
            .replace("o", "о")
            .replace("\u0307", "")
            .replace("\u0323", "")
        )
        entry = {
            "kind": "adjective",
            "bare": row["bare"],
            "nominative": accent(row["accented"]),
            "meaning": row["translations_en"],
        }
        # Correct this malformed upstream neuter accusative.
        if row["bare"] == "рабочий":
            row["n_acc"] = row["n_nom"]
        for gender, name in [
            ("m", "masculine"),
            ("f", "feminine"),
            ("n", "neuter"),
            ("pl", "plural"),
        ]:
            forms = {
                case: variants(row[f"{gender}_{case}"])
                for case in ("nom", "gen", "dat", "acc", "inst", "prep")
            }
            if gender == "m" and not forms["nom"]:
                forms["nom"] = variants(row["accented"])
            if gender in ("m", "pl"):
                # Upstream accusative variants have inconsistent position order.
                # Classify only attested forms matching nominative/genitive.
                inanimate, animate = [
                    [
                        form
                        for form in forms["acc"]
                        if normalize(form)
                        in {normalize(value) for value in forms[case]}
                    ]
                    for case in ("nom", "gen")
                ]
            else:
                inanimate = animate = forms["acc"]
            entry[name] = [
                ", ".join(values)
                for values in [
                    forms["nom"],
                    forms["gen"],
                    forms["dat"],
                    inanimate,
                    animate,
                    forms["inst"],
                    forms["prep"],
                ]
            ]
        result.append(entry)

write_dictionary("adjectives", result)
print(f"Imported {len(result):,} adjective entries.")
