"""Import the pinned OpenRussian TSV. See static/data/nouns-SOURCE.md.
Usage: python3 scripts/import-nouns.py /path/to/nouns.csv
"""

import csv
import json
import re
import sys
from pathlib import Path


def accent(text):
    return " ".join(re.sub(r"([А-Яа-яЁё])'", r"\1" + "\u0301", text).split())


result = []
with open(sys.argv[1], encoding="utf-8", newline="") as source:
    for row in csv.DictReader(source, delimiter="\t"):
        result.append(
            {
                "bare": row["bare"],
                "nominative": accent(row["accented"]),
                "meaning": row["translations_en"],
                "gender": row["gender"],
                "animate": row["animate"] == "1",
                "indeclinable": row["indeclinable"] == "1",
                "singularOnly": row["sg_only"] == "1",
                "pluralOnly": row["pl_only"] == "1",
                **{
                    number: [
                        accent(row[prefix + case]) if row[prefix + case] != "-" else ""
                        for case in ("nom", "gen", "dat", "acc", "inst", "prep")
                    ]
                    for number, prefix in [("singular", "sg_"), ("plural", "pl_")]
                },
            }
        )
# Fill only forms implied by explicit dictionary metadata. Other gaps stay empty.
for noun in result:
    for number, unavailable in [
        ("singular", noun["pluralOnly"]),
        ("plural", noun["singularOnly"]),
    ]:
        if unavailable:
            noun[number] = [""] * 6
        elif noun["indeclinable"]:
            noun[number] = [form or noun["nominative"] for form in noun[number]]
        elif number == ("plural" if noun["pluralOnly"] else "singular"):
            noun[number][0] = noun[number][0] or noun["nominative"]
    # The old export omits the paradigm of this common plural-only noun.
    if noun["bare"] == "ножницы":
        noun["plural"] = [
            "но́жницы",
            "но́жниц",
            "но́жницам",
            "но́жницы",
            "но́жницами",
            "но́жницах",
        ]
Path("static/data/nouns.json").write_text(
    json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
)
print(f"Imported {len(result):,} noun entries.")
