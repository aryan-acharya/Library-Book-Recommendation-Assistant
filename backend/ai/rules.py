"""Rule-based system for LibraAI – IF–THEN rules and rule definitions."""

from __future__ import annotations

from typing import Any, Callable


RuleFn = Callable[[dict[str, Any], dict[str, Any], set[str]], tuple[bool, str | None]]


def _norm(value: Any) -> str:
    return str(value or "").strip().lower()


def _list_contains(items: list[str], needle: str) -> bool:
    n = _norm(needle)
    if not n:
        return False
    return any(n == _norm(i) or n in _norm(i) or _norm(i) in n for i in items)


def _text_contains(text: str, needle: str) -> bool:
    n = _norm(needle)
    return bool(n) and n in _norm(text)


def rule_genre(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    if user.get("genre") and _norm(user["genre"]) == _norm(book["genre"]):
        return True, f"GenreMatch({book['id']})"
    return False, None


def rule_mood(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    from .scoring import mood_matches

    if user.get("mood") and mood_matches(user["mood"], book["mood"]):
        return True, f"MoodMatch({book['id']})"
    return False, None


def rule_reading_level(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    if user.get("readingLevel") and _norm(user["readingLevel"]) == _norm(book["readingLevel"]):
        return True, f"LevelMatch({book['id']})"
    return False, None


def rule_age_group(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    if user.get("ageGroup") and _norm(user["ageGroup"]) == _norm(book["ageGroup"]):
        return True, f"AgeMatch({book['id']})"
    return False, None


def rule_theme(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    if user.get("theme") and _list_contains(book["themes"], user["theme"]):
        return True, f"ThemeMatch({book['id']})"
    return False, None


def rule_keyword(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    keywords = user.get("keywords") or []
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    for kw in keywords:
        if _list_contains(book["keywords"], kw) or _text_contains(book["description"], kw):
            return True, f"KeywordMatch({book['id']})"
    return False, None


def rule_interest(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    from .scoring import interest_matches

    interest = user.get("interest")
    if not interest:
        return False, None
    if interest_matches(interest, book):
        return True, f"InterestMatch({book['id']})"
    return False, None


def rule_rating(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    min_rating = user.get("minimumRating")
    if min_rating is None or min_rating == "" or str(min_rating).lower() == "any":
        return True, f"RatingMatch({book['id']})"
    try:
        threshold = float(min_rating)
    except (TypeError, ValueError):
        return False, None
    if book["score"] >= threshold:
        return True, f"RatingMatch({book['id']})"
    return False, None


def rule_popularity(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    # High popularity: ratings above ~80th percentile of typical library books
    if book["ratings"] >= 50000 or book["shelvings"] >= 80000:
        return True, f"PopularBook({book['id']})"
    return False, None


def rule_availability(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    if _norm(book["availability"]) == "available":
        return True, f"AvailableBook({book['id']})"
    return False, None


def rule_length(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    length = user.get("length")
    if not length or _norm(length) == "any":
        return True, f"LengthMatch({book['id']})"
    if _norm(length) == _norm(book["length"]):
        return True, f"LengthMatch({book['id']})"
    return False, None


def rule_subgenre_interest(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    interest = user.get("interest")
    if interest and _norm(interest) in _norm(book["subgenre"]):
        return True, f"SubgenreInterestMatch({book['id']})"
    return False, None


def rule_strong_genre_mood(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    """Compound rule: genre + mood together strengthen recommendation."""
    bid = book["id"]
    if f"GenreMatch({bid})" in derived and f"MoodMatch({bid})" in derived:
        return True, f"StrongMoodMatch({bid})"
    # Also fire if both conditions hold even if not yet in derived (for chaining)
    genre_ok = user.get("genre") and _norm(user["genre"]) == _norm(book["genre"])
    mood_ok = user.get("mood") and _norm(user["mood"]) == _norm(book["mood"])
    if genre_ok and mood_ok:
        return True, f"StrongMoodMatch({bid})"
    return False, None


def rule_suitable_suspense(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    bid = book["id"]
    if (
        f"GenreMatch({bid})" in derived
        and f"MoodMatch({bid})" in derived
        and f"RatingMatch({bid})" in derived
    ):
        return True, f"SuitableForSuspenseReader({bid})"
    genre_ok = user.get("genre") and _norm(user["genre"]) == _norm(book["genre"])
    mood_ok = user.get("mood") and _norm(user["mood"]) == _norm(book["mood"])
    min_rating = user.get("minimumRating")
    try:
        threshold = float(min_rating) if min_rating not in (None, "", "any") else 0.0
    except (TypeError, ValueError):
        threshold = 0.0
    if genre_ok and mood_ok and book["score"] >= threshold:
        return True, f"SuitableForSuspenseReader({bid})"
    return False, None


def rule_level_and_interest(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    from .scoring import interest_matches

    bid = book["id"]
    if f"LevelMatch({bid})" in derived and f"InterestMatch({bid})" in derived:
        return True, f"LevelInterestFit({bid})"
    level_ok = user.get("readingLevel") and _norm(user["readingLevel"]) == _norm(book["readingLevel"])
    interest_ok = bool(user.get("interest") and interest_matches(user["interest"], book))
    if level_ok and interest_ok:
        return True, f"LevelInterestFit({bid})"
    return False, None


def rule_highly_rated(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    if book["score"] >= 4.0:
        return True, f"HighlyRatedBook({book['id']})"
    return False, None


def rule_publication(user: dict, book: dict, derived: set[str]) -> tuple[bool, str | None]:
    # Prefer relatively modern or well-established published works when year exists
    if book["published"] and book["published"] >= 1990:
        return True, f"PublicationMatch({book['id']})"
    return False, None


RULES: list[dict[str, Any]] = [
    {
        "id": "R1",
        "name": "Genre Match",
        "description": "IF user.genre = book.genre THEN GenreMatch(book)",
        "if": "user.genre = book.genre",
        "then": "GenreMatch(book)",
        "fn": rule_genre,
        "category": "preference",
    },
    {
        "id": "R2",
        "name": "Mood Match",
        "description": "IF user.mood = book.mood THEN MoodMatch(book)",
        "if": "user.mood = book.mood",
        "then": "MoodMatch(book)",
        "fn": rule_mood,
        "category": "preference",
    },
    {
        "id": "R3",
        "name": "Reading Level Match",
        "description": "IF user.readingLevel = book.readingLevel THEN LevelMatch(book)",
        "if": "user.readingLevel = book.readingLevel",
        "then": "LevelMatch(book)",
        "fn": rule_reading_level,
        "category": "preference",
    },
    {
        "id": "R4",
        "name": "Age Group Match",
        "description": "IF user.ageGroup = book.ageGroup THEN AgeMatch(book)",
        "if": "user.ageGroup = book.ageGroup",
        "then": "AgeMatch(book)",
        "fn": rule_age_group,
        "category": "preference",
    },
    {
        "id": "R5",
        "name": "Theme Match",
        "description": "IF user.theme exists in book.themes THEN ThemeMatch(book)",
        "if": "user.theme ∈ book.themes",
        "then": "ThemeMatch(book)",
        "fn": rule_theme,
        "category": "preference",
    },
    {
        "id": "R6",
        "name": "Keyword Match",
        "description": "IF user.keyword exists in book.keywords THEN KeywordMatch(book)",
        "if": "user.keyword ∈ book.keywords OR description",
        "then": "KeywordMatch(book)",
        "fn": rule_keyword,
        "category": "preference",
    },
    {
        "id": "R7",
        "name": "Interest Match",
        "description": "IF user.interest matches keywords/description/title THEN InterestMatch(book)",
        "if": "user.interest matches book content",
        "then": "InterestMatch(book)",
        "fn": rule_interest,
        "category": "preference",
    },
    {
        "id": "R8",
        "name": "Rating Match",
        "description": "IF book.Score >= user.minimumRating THEN RatingMatch(book)",
        "if": "book.Score ≥ user.minimumRating",
        "then": "RatingMatch(book)",
        "fn": rule_rating,
        "category": "quality",
    },
    {
        "id": "R9",
        "name": "Popularity",
        "description": "IF book.Ratings/Shelvings is high THEN PopularBook(book)",
        "if": "book.Ratings ≥ 50000 OR Shelvings ≥ 80000",
        "then": "PopularBook(book)",
        "fn": rule_popularity,
        "category": "quality",
    },
    {
        "id": "R10",
        "name": "Availability",
        "description": "IF book.Availability = Available THEN AvailableBook(book)",
        "if": "book.Availability = Available",
        "then": "AvailableBook(book)",
        "fn": rule_availability,
        "category": "library",
    },
    {
        "id": "R11",
        "name": "Length Match",
        "description": "IF user.length = book.length OR Any THEN LengthMatch(book)",
        "if": "user.length = book.length OR Any",
        "then": "LengthMatch(book)",
        "fn": rule_length,
        "category": "preference",
    },
    {
        "id": "R12",
        "name": "Subgenre Interest",
        "description": "IF user.interest appears in book.subgenre THEN SubgenreInterestMatch(book)",
        "if": "user.interest ∈ book.subgenre",
        "then": "SubgenreInterestMatch(book)",
        "fn": rule_subgenre_interest,
        "category": "preference",
    },
    {
        "id": "R13",
        "name": "Strong Genre–Mood Match",
        "description": "IF GenreMatch AND MoodMatch THEN StrongMoodMatch(book)",
        "if": "GenreMatch(book) ∧ MoodMatch(book)",
        "then": "StrongMoodMatch(book)",
        "fn": rule_strong_genre_mood,
        "category": "compound",
    },
    {
        "id": "R14",
        "name": "Suitable for Suspense Reader",
        "description": "IF GenreMatch ∧ MoodMatch ∧ RatingMatch THEN SuitableForSuspenseReader(book)",
        "if": "GenreMatch ∧ MoodMatch ∧ RatingMatch",
        "then": "SuitableForSuspenseReader(book)",
        "fn": rule_suitable_suspense,
        "category": "compound",
    },
    {
        "id": "R15",
        "name": "Level + Interest Fit",
        "description": "IF LevelMatch AND InterestMatch THEN LevelInterestFit(book)",
        "if": "LevelMatch(book) ∧ InterestMatch(book)",
        "then": "LevelInterestFit(book)",
        "fn": rule_level_and_interest,
        "category": "compound",
    },
    {
        "id": "R16",
        "name": "Highly Rated Book",
        "description": "IF book.Score ≥ 4.0 THEN HighlyRatedBook(book)",
        "if": "book.Score ≥ 4.0",
        "then": "HighlyRatedBook(book)",
        "fn": rule_highly_rated,
        "category": "quality",
    },
    {
        "id": "R17",
        "name": "Publication Match",
        "description": "IF book.Published ≥ 1990 THEN PublicationMatch(book)",
        "if": "book.Published ≥ 1990",
        "then": "PublicationMatch(book)",
        "fn": rule_publication,
        "category": "quality",
    },
]


def get_rules_public() -> list[dict[str, Any]]:
    return [
        {
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "if": r["if"],
            "then": r["then"],
            "category": r["category"],
        }
        for r in RULES
    ]


def evaluate_rules_for_book(
    user: dict[str, Any], book: dict[str, Any]
) -> dict[str, Any]:
    derived: set[str] = set()
    fired: list[dict[str, str]] = []
    checked: list[str] = []

    # Multiple passes to allow compound rules to use previously derived facts
    for _ in range(3):
        new_facts = False
        for rule in RULES:
            checked.append(rule["id"])
            matched, fact = rule["fn"](user, book, derived)
            if matched and fact and fact not in derived:
                derived.add(fact)
                fired.append(
                    {
                        "id": rule["id"],
                        "name": rule["name"],
                        "fact": fact,
                        "description": rule["description"],
                    }
                )
                new_facts = True
        if not new_facts:
            break

    return {
        "derivedFacts": sorted(derived),
        "firedRules": fired,
        "rulesChecked": sorted(set(checked)),
    }
