"""Write compact, deterministic gzip JSON for browser and server dictionary loads."""

import gzip
import json
from pathlib import Path


def write_dictionary(name, entries):
    data = json.dumps(entries, ensure_ascii=False, separators=(",", ":")).encode(
        "utf-8"
    )
    compressed = gzip.compress(data, compresslevel=9, mtime=0)
    if len(compressed) >= 25 * 1024 * 1024:
        raise ValueError(f"{name} exceeds the static asset size limit")
    Path(f"static/data/{name}.json.gz").write_bytes(compressed)
