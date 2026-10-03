"""Recommendation scoring for LibraAI."""

from __future__ import annotations

import re
from typing import Any


SCORE_WEIGHTS = {
    "genre": 4,
    "interest": 4,
    "mood": 2,
    "readingLevel": 2,
    "theme": 2,
    "ageGroup": 1,
    "keyword": 1,
    "rating": 1,
    "publication": 1,
    "popularity": 1,
    "availability": 1,
}

MAX_SCORE = sum(SCORE_WEIGHTS.values())  # 20


def _norm(value: Any) -> str:
    return str(value or "").strip().lower()


def _list_contains(items: list[str], needle: str) -> bool:
    n = _norm(needle)
    if not n:
        return False
    return any(n == _norm(i) or n in _norm(i) or _norm(i) in n for i in items)


def _keywords_from_user(user: dict[str, Any]) -> list[str]:
    keywords = user.get("keywords") or []
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    return keywords


# Domain aliases help interest matching for academic/demo queries
INTEREST_ALIASES = {
    "programming": [
        "programming",
        "programmer",
        "coding",
        "computer science",
        "software engineering",
        "clean code",
        "source code",
    ],
    "artificial intelligence": [
        "artificial intelligence",
        "machine learning",
        "neural network",
        "deep learning",
    ],
    "psychology": ["psychology", "human behavior", "cognitive", "mental health"],
    "mystery": ["mystery", "detective", "crime", "murder", "investigation"],
}

MOOD_ALIASES = {
    "relaxing": ["inspirational", "humorous", "thought-provoking", "romantic"],
    "calm": ["inspirational", "thought-provoking"],
    "uplifting": ["inspirational", "motivational", "humorous"],
    "funny": ["humorous"],
    "scary": ["dark", "suspenseful"],
    "tense": ["suspenseful", "dark", "mysterious"],
    "exciting": ["exciting", "adventurous"],
}


def mood_matches(user_mood: str, book_mood: str) -> bool:
    if not user_mood or not book_mood:
        return False
    u = _norm(user_mood)
    b = _norm(book_mood)
    if u == b:
        return True
    return b in MOOD_ALIASES.get(u, [])

TECH_GENRES = {
    "programming",
    "artificial intelligence",
    "computer science",
    "algorithms",
    "psychology",
}

INTEREST_GENRE_FAMILY = {
    "programming": {"programming", "computer science", "algorithms"},
    "artificial intelligence": {"artificial intelligence", "computer science"},
    "psychology": {"psychology"},
    "mystery": {"mystery", "crime", "thriller"},
    "horror": {"horror"},
    "fantasy": {"fantasy"},
}


def _token_in_text(token: str, text: str) -> bool:
    """Word-boundary aware containment to avoid substring false positives."""
    token = token.strip().lower()
    if not token:
        return False
    return re.search(rf"(?<![a-z0-9]){re.escape(token)}(?![a-z0-9])", text) is not None


def interest_matches(interest: str, book: dict[str, Any]) -> bool:
    """Strong interest match: prefer genre/title/description/strong keywords over weak tags."""
    if not interest:
        return False
    n = _norm(interest)
    genre = _norm(book["genre"])

    if n == genre or n in _norm(book["subgenre"]):
        return True
    if genre in INTEREST_GENRE_FAMILY.get(n, set()):
        return True
    if n in _norm(book["title"]):
        return True
    if n in _norm(book["description"]):
        return True

    aliases = INTEREST_ALIASES.get(n, [n])
    title_desc = f"{book['title']} {book['description'][:1200]} {book['subgenre']}".lower()

    # Title/description alias hits are trusted
    if any(_token_in_text(alias, title_desc) for alias in aliases):
        return True

    # Keyword hits are trusted only inside related genre families (dataset keywords are noisy)
    family = INTEREST_GENRE_FAMILY.get(n, TECH_GENRES if n in TECH_GENRES else set())
    keyword_hit = any(
        _norm(k) == alias or alias in _norm(k) for alias in aliases for k in book["keywords"]
    )
    if keyword_hit and (not family or genre in family):
        return True

    # Exact theme match for non-noisy cases
    if any(n == _norm(t) for t in book["themes"]):
        if n in TECH_GENRES and genre not in TECH_GENRES and genre not in family:
            return False
        return True

    return False


def score_breakdown(user: dict[str, Any], book: dict[str, Any]) -> dict[str, Any]:
    reasons: list[str] = []
    parts: dict[str, int] = {k: 0 for k in SCORE_WEIGHTS}
    triggered: list[str] = []

    if user.get("genre") and _norm(user["genre"]) == _norm(book.get("genre")):
        parts["genre"] = SCORE_WEIGHTS["genre"]
        reasons.append(f"Genre matches your preference ({book.get('genre')})")
        triggered.append("R1 – Genre Match")

    interest = user.get("interest")
    if interest and interest_matches(interest, book):
        parts["interest"] = SCORE_WEIGHTS["interest"]
        reasons.append(f"Strong interest/topic match ({interest})")
        triggered.append("R7 – Interest Match")

    if user.get("mood") and mood_matches(user["mood"], book.get("mood")):
        parts["mood"] = SCORE_WEIGHTS["mood"]
        reasons.append(f"Matches your selected mood ({book.get('mood')})")
        triggered.append("R2 – Mood Match")

    if user.get("readingLevel") and _norm(user["readingLevel"]) == _norm(book.get("readingLevel")):
        parts["readingLevel"] = SCORE_WEIGHTS["readingLevel"]
        reasons.append(f"Suitable reading level ({book.get('readingLevel')})")
        triggered.append("R3 – Reading Level Match")

    if user.get("theme") and _list_contains(book.get("themes", []), user["theme"]):
        parts["theme"] = SCORE_WEIGHTS["theme"]
        reasons.append(f"Theme matches your preference ({user['theme']})")
        triggered.append("R5 – Theme Match")

    if user.get("ageGroup") and _norm(user["ageGroup"]) == _norm(book.get("ageGroup")):
        parts["ageGroup"] = SCORE_WEIGHTS["ageGroup"]
        reasons.append(f"Suitable for {book.get('ageGroup')} audience")
        triggered.append("R4 – Age Group Match")

    for kw in _keywords_from_user(user):
        if _list_contains(book.get("keywords", []), kw) or _norm(kw) in _norm(book.get("description", "")):
            parts["keyword"] = SCORE_WEIGHTS["keyword"]
            reasons.append(f"Keyword '{kw}' matches book content")
            triggered.append("R6 – Keyword Match")
            break

    min_rating = user.get("minimumRating")
    rating_ok = True
    if min_rating not in (None, "", "any"):
        try:
            rating_ok = float(book.get("score", 0)) >= float(min_rating)
        except (TypeError, ValueError):
            rating_ok = True
    if rating_ok and float(book.get("score", 0)) >= 3.8:
        parts["rating"] = SCORE_WEIGHTS["rating"]
        reasons.append(f"High rating (★ {book.get('score', 0)})")
        triggered.append("R8 – Rating Match")
    elif rating_ok and min_rating not in (None, "", "any"):
        parts["rating"] = SCORE_WEIGHTS["rating"]
        reasons.append(f"Rating meets requirement (★ {book.get('score', 0)} >= {min_rating})")
        triggered.append("R8 – Rating Match")

    pub_year = book.get("published")
    if pub_year and pub_year >= 1990:
        parts["publication"] = SCORE_WEIGHTS["publication"]
        reasons.append("Publication era is suitable")
        triggered.append("R17 – Publication Match")

    ratings_count = book.get("ratings", 0)
    shelvings_count = book.get("shelvings", 0)
    if ratings_count >= 50000 or shelvings_count >= 80000:
        parts["popularity"] = SCORE_WEIGHTS["popularity"]
        reasons.append(f"Popular among library readers ({ratings_count:,} ratings)")
        triggered.append("R9 – Popularity")

    if _norm(book.get("availability")) == "available":
        parts["availability"] = SCORE_WEIGHTS["availability"]
        reasons.append("Currently available in library catalog")
        triggered.append("R10 – Availability")

    total = sum(parts.values())
    return {
        "total": total,
        "maxScore": MAX_SCORE,
        "parts": parts,
        "reasons": reasons,
        "triggeredRules": triggered,
    }


def calculate_recommendation_score(user: dict[str, Any], book: dict[str, Any]) -> int:
    """
    Calculate the dynamic recommendation score for a candidate book based on user preferences.
    Formula:
        Genre Match * 4 + Interest Match * 4 + Mood Match * 2 + Reading Level * 2 +
        Theme Match * 2 + Age Group * 1 + Keyword Match * 1 + Rating Match * 1 +
        Publication Match * 1 + Popularity Match * 1 + Availability Match * 1
    Maximum score = 20.
    """
    return score_breakdown(user, book)["total"]


# Backwards compatibility alias
recommendation_score = calculate_recommendation_score


def ranking_key(user: dict[str, Any], book: dict[str, Any]) -> tuple:
    """Sort key: score first, then prefer interest-family genres, then dataset quality."""
    score = calculate_recommendation_score(user, book)
    interest = _norm(user.get("interest"))
    family = INTEREST_GENRE_FAMILY.get(interest, set())
    family_boost = 1 if family and _norm(book.get("genre")) in family else 0
    return (-score, -family_boost, -book.get("score", 0), -book.get("ratings", 0))

