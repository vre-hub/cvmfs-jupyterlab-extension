import json
from pathlib import Path


COLLECTIONS_FILE = (
    Path(__file__).parent / "collections.json"
)


def get_collections():
    """Return the curated software collections."""

    if not COLLECTIONS_FILE.exists():
        return []

    with COLLECTIONS_FILE.open(
        "r",
        encoding="utf-8",
    ) as file:
        data = json.load(file)

    return data.get("collections", [])