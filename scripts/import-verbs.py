"""Convert the OpenRussian TSV export to the local browser dataset.
Usage: python3 scripts/import-verbs.py /path/to/verbs.csv
See static/data/verbs-SOURCE.md for the pinned source and license.
"""

import csv
import gzip
import json
import re
import sys
from pathlib import Path


def accent(text):
    return re.sub(r"([А-Яа-яЁё])'", r"\1" + "\u0301", text).strip()


result = []
open_source = gzip.open if sys.argv[1].endswith(".gz") else open
with open_source(sys.argv[1], mode="rt", encoding="utf-8", newline="") as source:
    for row in csv.DictReader(source, delimiter="\t"):
        if row["aspect"] not in ("perfective", "imperfective", "both"):
            continue
        # Corrections for malformed Russian fields in the upstream export.
        if row["bare"] in ("cбраживать", "сбраживать"):
            row["bare"] = "сбраживать"
            row["accented"] = "сбра́живать"
            row["past_n"] = "сбра́живало"
        if row["bare"] == "взъесться":
            row["past_f"] = "взъе́лась"
            row["past_n"] = "взъе́лось"
            row["past_pl"] = "взъе́лись"
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
