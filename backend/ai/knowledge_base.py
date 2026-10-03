"""Knowledge Base for LibraAI – loads and represents the 10,538-book dataset."""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Any

import pandas as pd

DATASET_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "Popular-Books-10000plus-Ratings-Enriched.csv",
    )
)


def _split_multi(value: Any) -> list[str]:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return []
    text = str(value).strip()
    if not text or text.lower() == "nan":
        return []
    parts = [p.strip() for p in text.replace("|", ";").split(";")]
    return [p for p in parts if p]


def _safe_str(value: Any, default: str = "") -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return default
    text = str(value).strip()
    return default if text.lower() == "nan" else text


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


@lru_cache(maxsize=1)
def load_dataframe() -> pd.DataFrame:
    df = pd.read_csv(DATASET_PATH)
    df = df.reset_index(drop=True)
    df.insert(0, "id", df.index.map(lambda i: f"B{i + 1:05d}"))
    return df


def book_from_row(row: pd.Series) -> dict[str, Any]:
    book_id = _safe_str(row.get("id"))
    themes = _split_multi(row.get("Themes"))
    keywords = _split_multi(row.get("Keywords"))
    return {
        "id": book_id,
        "title": _safe_str(row.get("Title")),
        "author": _safe_str(row.get("Author")),
        "score": round(_safe_float(row.get("Score")), 2),
        "ratings": _safe_int(row.get("Ratings")),
        "shelvings": _safe_int(row.get("Shelvings")),
        "published": _safe_int(row.get("Published")),
        "description": _safe_str(row.get("Description")),
        "image": _safe_str(row.get("Image")),
        "genre": _safe_str(row.get("Genre"), "Unknown"),
        "subgenre": _safe_str(row.get("Subgenre"), "General"),
        "mood": _safe_str(row.get("Mood"), "Neutral"),
        "readingLevel": _safe_str(row.get("ReadingLevel"), "Intermediate"),
        "ageGroup": _safe_str(row.get("AgeGroup"), "General"),
        "themes": themes,
        "keywords": keywords,
        "length": _safe_str(row.get("Length"), "Medium"),
        "availability": _safe_str(row.get("Availability"), "Available"),
    }


@lru_cache(maxsize=1)
def get_all_books() -> list[dict[str, Any]]:
    df = load_dataframe()
    return [book_from_row(row) for _, row in df.iterrows()]


@lru_cache(maxsize=1)
def get_book_index() -> dict[str, dict[str, Any]]:
    return {book["id"]: book for book in get_all_books()}


def get_book(book_id: str) -> dict[str, Any] | None:
    return get_book_index().get(book_id)


def fol_facts_for_book(book: dict[str, Any]) -> list[str]:
    """Generate FOL-style knowledge representation for a book."""
    bid = book["id"]
    facts = [
        f"Book({bid})",
        f'Title({bid}, "{book["title"]}")',
        f'Author({bid}, "{book["author"]}")',
        f'Genre({bid}, "{book["genre"]}")',
        f'Subgenre({bid}, "{book["subgenre"]}")',
        f'Mood({bid}, "{book["mood"]}")',
        f'ReadingLevel({bid}, "{book["readingLevel"]}")',
        f'AgeGroup({bid}, "{book["ageGroup"]}")',
        f'Rating({bid}, {book["score"]})',
        f'RatingsCount({bid}, {book["ratings"]})',
        f'Popularity({bid}, {book["shelvings"]})',
        f'Published({bid}, {book["published"]})',
        f'Length({bid}, "{book["length"]}")',
        f'Availability({bid}, "{book["availability"]}")',
    ]
    for theme in book["themes"]:
        facts.append(f'Theme({bid}, "{theme}")')
    for keyword in book["keywords"]:
        facts.append(f'Keyword({bid}, "{keyword}")')
    return facts


def knowledge_tree() -> dict[str, Any]:
    return {
        "Book": [
            "Title",
            "Author",
            "Genre",
            "Subgenre",
            "Mood",
            "Reading Level",
            "Age Group",
            "Themes",
            "Keywords",
            "Rating (Score)",
            "Ratings Count",
            "Popularity (Shelvings)",
            "Publication Year",
            "Length (derived/simulated)",
            "Availability (derived/simulated)",
        ],
        "note": (
            "Length and Availability are derived/simulated fields for this "
            "academic prototype. All other fields come from the enriched dataset."
        ),
        "size": len(get_all_books()),
    }


def unique_values(field: str) -> list[str]:
    books = get_all_books()
    values: set[str] = set()
    for book in books:
        raw = book.get(field)
        if isinstance(raw, list):
            values.update(x for x in raw if x and x != "Unknown")
        elif raw and raw != "Unknown":
            values.add(str(raw))
    return sorted(values)


def filter_books(
    *,
    genre: str | None = None,
    subgenre: str | None = None,
    mood: str | None = None,
    reading_level: str | None = None,
    age_group: str | None = None,
    availability: str | None = None,
    min_rating: float | None = None,
    published_from: int | None = None,
    published_to: int | None = None,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    books = get_all_books()
    filtered = []
    for book in books:
        if genre and book["genre"].lower() != genre.lower():
            continue
        if subgenre and book["subgenre"].lower() != subgenre.lower():
            continue
        if mood and book["mood"].lower() != mood.lower():
            continue
        if reading_level and book["readingLevel"].lower() != reading_level.lower():
            continue
        if age_group and book["ageGroup"].lower() != age_group.lower():
            continue
        if availability and book["availability"].lower() != availability.lower():
            continue
        if min_rating is not None and book["score"] < min_rating:
            continue
        if published_from is not None and book["published"] < published_from:
            continue
        if published_to is not None and book["published"] > published_to:
            continue
        filtered.append(book)

    total = len(filtered)
    page = max(1, page)
    limit = max(1, min(limit, 50))
    start = (page - 1) * limit
    end = start + limit
    page_books = [
        {
            "id": b["id"],
            "title": b["title"],
            "author": b["author"],
            "score": b["score"],
            "ratings": b["ratings"],
            "genre": b["genre"],
            "subgenre": b["subgenre"],
            "mood": b["mood"],
            "published": b["published"],
            "image": b["image"],
            "availability": b["availability"],
            "readingLevel": b["readingLevel"],
            "ageGroup": b["ageGroup"],
            "length": b["length"],
        }
        for b in filtered[start:end]
    ]
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total else 0,
        "books": page_books,
    }


def search_books(query: str, page: int = 1, limit: int = 20) -> dict[str, Any]:
    q = (query or "").strip().lower()
    if not q:
        return filter_books(page=page, limit=limit)

    books = get_all_books()
    matches = []
    for book in books:
        haystack = " ".join(
            [
                book["title"],
                book["author"],
                book["description"],
                book["genre"],
                book["subgenre"],
                " ".join(book["themes"]),
                " ".join(book["keywords"]),
            ]
        ).lower()
        if q in haystack:
            matches.append(book)

    total = len(matches)
    page = max(1, page)
    limit = max(1, min(limit, 50))
    start = (page - 1) * limit
    end = start + limit
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total else 0,
        "query": query,
        "books": [
            {
                "id": b["id"],
                "title": b["title"],
                "author": b["author"],
                "score": b["score"],
                "genre": b["genre"],
                "subgenre": b["subgenre"],
                "mood": b["mood"],
                "published": b["published"],
                "image": b["image"],
                "availability": b["availability"],
                "themes": b["themes"],
                "keywords": b["keywords"],
            }
            for b in matches[start:end]
        ],
    }


def related_books(book: dict[str, Any], limit: int = 6) -> list[dict[str, Any]]:
    related = []
    for other in get_all_books():
        if other["id"] == book["id"]:
            continue
        shared = 0
        if other["genre"] == book["genre"]:
            shared += 2
        if other["mood"] == book["mood"]:
            shared += 1
        if other["subgenre"] == book["subgenre"]:
            shared += 1
        shared += len(set(other["themes"]) & set(book["themes"]))
        shared += len(set(k.lower() for k in other["keywords"]) & set(k.lower() for k in book["keywords"]))
        if shared > 0:
            related.append((shared, other))
    related.sort(key=lambda x: (-x[0], -x[1]["score"]))
    return [
        {
            "id": b["id"],
            "title": b["title"],
            "author": b["author"],
            "score": b["score"],
            "genre": b["genre"],
            "image": b["image"],
        }
        for _, b in related[:limit]
    ]
