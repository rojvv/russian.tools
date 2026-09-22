"""Convert the OpenRussian TSV export to the local browser dataset.
Usage: python3 scripts/import-verbs.py /path/to/verbs.csv
See static/data/verbs-SOURCE.md for the pinned source and license.
"""

import csv
import json
import re
import sys
from pathlib import Path


def accent(text):
    return re.sub(r"([А-Яа-яЁё])'", r"\1" + "\u0301", text).strip()


result = []
with open(sys.argv[1], encoding="utf-8", newline="") as source:
    for row in csv.DictReader(source, delimiter="\t"):
        if row["aspect"] not in ("perfective", "imperfective", "both"):
            continue
        forms = [
            accent(row["presfut_" + key])
            for key in ("sg1", "sg2", "sg3", "pl1", "pl2", "pl3")
        ]
        # This defective verb has no generally accepted synthetic first-person form.
        if row["bare"] == "победить":
            forms[0] = ""
        result.append(
            {
                "bare": row["bare"],
                "infinitive": accent(row["accented"]),
                "meaning": row["translations_en"],
                "aspect": row["aspect"],
                "finite": forms,
                "past": [accent(row["past_" + key]) for key in ("m", "f", "n", "pl")],
                "imperative": [
                    accent(row["imperative_" + key]) for key in ("sg", "pl")
                ],
            }
        )
Path("static/data/verbs.json").write_text(
    json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
)
print(f"Imported {len(result):,} verb entries.")
