"""Inference Engine for LibraAI – coordinates facts, rules, chaining, scoring, hill climbing."""

from __future__ import annotations

from typing import Any

from .hill_climbing import random_restart_hill_climbing
from .knowledge_base import fol_facts_for_book, get_all_books
from .rules import RULES, evaluate_rules_for_book, get_rules_public
from .scoring import recommendation_score, ranking_key, score_breakdown


def preferences_to_facts(user: dict[str, Any]) -> list[str]:
    facts: list[str] = []
    mapping = [
        ("genre", "UserGenre"),
        ("interest", "UserInterest"),
        ("mood", "UserMood"),
        ("readingLevel", "UserReadingLevel"),
        ("ageGroup", "UserAgeGroup"),
        ("length", "UserLength"),
        ("theme", "UserTheme"),
        ("minimumRating", "UserMinimumRating"),
    ]
    for key, predicate in mapping:
        value = user.get(key)
        if value is None or value == "" or str(value).lower() == "any":
            continue
        if isinstance(value, float):
            facts.append(f"{predicate}({value})")
        else:
            facts.append(f"{predicate}({value})")

    keywords = user.get("keywords") or []
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    for kw in keywords:
        facts.append(f"UserKeyword({kw})")
    return facts


def normalize_preferences(payload: dict[str, Any]) -> dict[str, Any]:
    keywords = payload.get("keywords") or []
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]

    min_rating = payload.get("minimumRating")
    if min_rating in (None, "", "any", "Any"):
        min_rating = None
    else:
        try:
            min_rating = float(min_rating)
        except (TypeError, ValueError):
            min_rating = None

    restarts = payload.get("restarts", 8)
    try:
        restarts = max(1, min(20, int(restarts)))
    except (TypeError, ValueError):
        restarts = 8

    return {
        "genre": (payload.get("genre") or "").strip() or None,
        "interest": (payload.get("interest") or "").strip() or None,
        "mood": (payload.get("mood") or "").strip() or None,
        "readingLevel": (payload.get("readingLevel") or "").strip() or None,
        "ageGroup": (payload.get("ageGroup") or "").strip() or None,
        "length": (payload.get("length") or "Any").strip() or "Any",
        "theme": (payload.get("theme") or "").strip() or None,
        "minimumRating": min_rating,
        "keywords": keywords,
        "reasoningMethod": (payload.get("reasoningMethod") or "forward").strip().lower(),
        "restarts": restarts,
    }


def _soft_prefilter(user: dict[str, Any], books: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Narrow the search space before expensive rule evaluation."""
    from .scoring import INTEREST_ALIASES, interest_matches, mood_matches

    filtered = books
    if user.get("genre"):
        genre_matches = [b for b in filtered if b["genre"].lower() == user["genre"].lower()]
        if genre_matches:
            filtered = genre_matches

    if user.get("minimumRating") is not None:
        rated = [b for b in filtered if b["score"] >= user["minimumRating"]]
        if rated:
            filtered = rated

    interest = (user.get("interest") or "").strip()
    interest_l = interest.lower()
    keywords = [k.lower() for k in (user.get("keywords") or [])]
    theme = (user.get("theme") or "").lower()
    mood = (user.get("mood") or "").lower()

    # If interest names a genre family, prioritize those genres
    interest_genre_map = {
        "programming": {"Programming", "Computer Science", "Algorithms"},
        "artificial intelligence": {"Artificial Intelligence", "Computer Science"},
        "psychology": {"Psychology"},
        "mystery": {"Mystery", "Crime", "Thriller"},
        "horror": {"Horror"},
        "fantasy": {"Fantasy"},
    }
    if not user.get("genre") and interest_l in interest_genre_map:
        preferred = [b for b in filtered if b["genre"] in interest_genre_map[interest_l]]
        extras = [
            b
            for b in filtered
            if interest_matches(interest, b) and b["genre"] not in interest_genre_map[interest_l]
        ]
        # Prefer family genres heavily; keep a few strong textual extras
        merged = preferred + extras[:40]
        if preferred:
            filtered = merged
        elif extras:
            filtered = extras

    if interest or keywords or theme or mood:
        scored = []
        aliases = INTEREST_ALIASES.get(interest_l, [interest_l] if interest_l else [])
        for book in filtered:
            hits = 0
            if interest and interest_matches(interest, book):
                hits += 5
                if book["genre"].lower() == interest_l:
                    hits += 4
            blob = " ".join(
                [
                    book["title"],
                    book["genre"],
                    book["subgenre"],
                    " ".join(book["keywords"]),
                    book["description"][:800],
                ]
            ).lower()
            for alias in aliases:
                if alias and alias in blob:
                    hits += 2
            if theme and any(theme == t.lower() or theme in t.lower() for t in book["themes"]):
                hits += 2
            if mood and (book["mood"].lower() == mood or mood_matches(mood, book["mood"])):
                hits += 2
            for kw in keywords:
                if kw and kw in blob:
                    hits += 1
            if user.get("readingLevel") and book["readingLevel"].lower() == user["readingLevel"].lower():
                hits += 2
            if hits > 0 or (not interest and not keywords and not theme):
                scored.append((hits, book))
        if scored:
            scored.sort(key=lambda x: (-x[0], -x[1]["score"], -x[1]["ratings"]))
            filtered = [b for _, b in scored[:400]]

    if len(filtered) > 500:
        filtered = sorted(filtered, key=lambda b: (-b["score"], -b["ratings"]))[:500]
    return filtered


def _candidate_threshold(user: dict[str, Any]) -> int:
    """Minimum match points for a book to become a candidate."""
    provided = sum(
        1
        for key in ("genre", "interest", "mood", "readingLevel", "ageGroup", "theme")
        if user.get(key)
    )
    provided += 1 if user.get("keywords") else 0
    if provided >= 4:
        return 2
    if provided >= 2:
        return 1
    return 1


def forward_chaining(user: dict[str, Any], books: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """
    Forward chaining: start from user facts, apply IF–THEN rules, derive new facts,
    and collect candidate books until no useful new facts appear.
    """
    initial_facts = preferences_to_facts(user)
    pool = _soft_prefilter(user, books or get_all_books())
    threshold = _candidate_threshold(user)

    rules_checked: list[str] = []
    rules_fired_global: list[dict[str, str]] = []
    derived_facts: list[str] = []
    candidates: list[dict[str, Any]] = []
    reasoning_trace: list[str] = [
        "Forward Chaining starts from known user facts.",
        f"Initial facts: {', '.join(initial_facts) if initial_facts else '(none provided)'}",
        f"Evaluating {len(pool)} books from the Knowledge Base against IF–THEN rules.",
    ]

    match_predicates = {
        "GenreMatch",
        "MoodMatch",
        "LevelMatch",
        "AgeMatch",
        "ThemeMatch",
        "KeywordMatch",
        "InterestMatch",
        "StrongMoodMatch",
        "SuitableForSuspenseReader",
        "LevelInterestFit",
        "SubgenreInterestMatch",
    }

    for book in pool:
        result = evaluate_rules_for_book(user, book)
        rules_checked.extend(result["rulesChecked"])
        derived_facts.extend(result["derivedFacts"])

        preference_hits = [
            f for f in result["derivedFacts"] if any(f.startswith(p) for p in match_predicates)
        ]
        # Always require rating match if minimum rating given
        rating_ok = True
        if user.get("minimumRating") is not None:
            rating_ok = any(f.startswith("RatingMatch") for f in result["derivedFacts"])

        if len(preference_hits) >= threshold and rating_ok:
            for fired in result["firedRules"]:
                rules_fired_global.append(
                    {
                        "id": fired["id"],
                        "name": fired["name"],
                        "bookId": book["id"],
                        "fact": fired["fact"],
                    }
                )
            candidates.append(book)

    # Deduplicate fired rules for display (keep first N informative)
    seen_fire = set()
    unique_fired = []
    for item in rules_fired_global:
        key = (item["id"], item["bookId"], item["fact"])
        if key not in seen_fire:
            seen_fire.add(key)
            unique_fired.append(item)

    # Rank candidates roughly before hill climbing
    candidates.sort(key=lambda b: ranking_key(user, b))
    # Cap candidates for hill climbing efficiency
    candidates = candidates[:120]

    reasoning_trace.append(f"Rules checked across candidates: {len(set(rules_checked))} unique rule IDs.")
    reasoning_trace.append(f"Derived preference facts for matching books.")
    reasoning_trace.append(f"Final candidate set size: {len(candidates)}")

    sample_derived = sorted(set(derived_facts))[:80]

    return {
        "method": "forward",
        "initialFacts": initial_facts,
        "rulesChecked": sorted(set(rules_checked)),
        "firedRules": unique_fired[:100],
        "derivedFacts": sample_derived,
        "candidateBooks": [_brief_candidate(b, user) for b in candidates],
        "candidateBookObjects": candidates,
        "reasoningSteps": reasoning_trace,
    }


def backward_chaining(user: dict[str, Any], books: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """
    Backward chaining: start from goal Recommend(Book) and prove subgoals
    (genre, interest, mood, level, theme, rating, availability, ...).
    """
    initial_facts = preferences_to_facts(user)
    pool = _soft_prefilter(user, books or get_all_books())

    goal_tree = [
        "Goal: Recommend(Book)",
        "  ← Does Genre Match? (if genre provided)",
        "  ← Does Interest Match? (if interest provided)",
        "  ← Does Mood Match? (if mood provided)",
        "  ← Does Reading Level Match? (if level provided)",
        "  ← Does Theme Match? (if theme provided)",
        "  ← Does Age Group Match? (if age provided)",
        "  ← Does Keyword Match? (if keywords provided)",
        "  ← Does Rating Match?",
        "  ← Does Availability Match? (preferred)",
        "  → Recommendation if enough subgoals succeed",
    ]

    reasoning_steps = [
        "Backward Chaining starts from the goal Recommend(Book).",
        "Each book is tested by proving preference subgoals working backward.",
        *goal_tree,
    ]

    candidates: list[dict[str, Any]] = []
    fired_rules: list[dict[str, str]] = []
    derived_facts: list[str] = []
    proof_examples: list[dict[str, Any]] = []

    threshold = _candidate_threshold(user)

    for book in pool:
        proof = _prove_recommend(user, book)
        derived_facts.extend(proof["derivedFacts"])
        if proof["success"]:
            candidates.append(book)
            fired_rules.extend(proof["firedRules"])
            if len(proof_examples) < 8:
                proof_examples.append(
                    {
                        "bookId": book["id"],
                        "title": book["title"],
                        "goal": "Recommend(Book)",
                        "subgoals": proof["subgoals"],
                        "proven": proof["proven"],
                        "failed": proof["failed"],
                    }
                )

    candidates.sort(key=lambda b: ranking_key(user, b))
    candidates = candidates[:120]

    reasoning_steps.append(f"Books that satisfied the goal: {len(candidates)}")

    return {
        "method": "backward",
        "goal": "Recommend(Book)",
        "goalTree": goal_tree,
        "initialFacts": initial_facts,
        "proofExamples": proof_examples,
        "firedRules": fired_rules[:100],
        "derivedFacts": sorted(set(derived_facts))[:80],
        "candidateBooks": [_brief_candidate(b, user) for b in candidates],
        "candidateBookObjects": candidates,
        "reasoningSteps": reasoning_steps,
        "rulesChecked": [r["id"] for r in RULES],
    }


def _prove_recommend(user: dict[str, Any], book: dict[str, Any]) -> dict[str, Any]:
    """Attempt to prove Recommend(book) by checking subgoals."""
    subgoals = []
    proven = []
    failed = []
    derived = []
    fired = []

    checks = []
    if user.get("genre"):
        checks.append(("GenreMatch", "R1 – Genre Match", lambda: book["genre"].lower() == user["genre"].lower()))
    if user.get("interest"):
        from .scoring import interest_matches

        interest = user["interest"]
        checks.append(
            (
                "InterestMatch",
                "R7 – Interest Match",
                lambda: interest_matches(interest, book),
            )
        )
    if user.get("mood"):
        checks.append(("MoodMatch", "R2 – Mood Match", lambda: book["mood"].lower() == user["mood"].lower()))
    if user.get("readingLevel"):
        checks.append(
            (
                "LevelMatch",
                "R3 – Reading Level Match",
                lambda: book["readingLevel"].lower() == user["readingLevel"].lower(),
            )
        )
    if user.get("theme"):
        theme = user["theme"].lower()
        checks.append(
            (
                "ThemeMatch",
                "R5 – Theme Match",
                lambda: any(theme == t.lower() or theme in t.lower() for t in book["themes"]),
            )
        )
    if user.get("ageGroup"):
        checks.append(
            (
                "AgeMatch",
                "R4 – Age Group Match",
                lambda: book["ageGroup"].lower() == user["ageGroup"].lower(),
            )
        )
    if user.get("keywords"):
        kws = [k.lower() for k in user["keywords"]]

        def keyword_ok() -> bool:
            blob = " ".join(book["keywords"] + [book["description"]]).lower()
            return any(k in blob for k in kws)

        checks.append(("KeywordMatch", "R6 – Keyword Match", keyword_ok))

    # Rating is a hard subgoal when specified
    def rating_ok() -> bool:
        if user.get("minimumRating") is None:
            return True
        return book["score"] >= user["minimumRating"]

    checks.append(("RatingMatch", "R8 – Rating Match", rating_ok))

    # Soft preference for availability
    checks.append(
        ("AvailableBook", "R10 – Availability", lambda: book["availability"].lower() == "available")
    )

    preference_success = 0
    rating_passed = True

    for name, rule_label, predicate in checks:
        subgoals.append(name)
        ok = bool(predicate())
        if ok:
            proven.append(name)
            derived.append(f"{name}({book['id']})")
            fired.append(
                {
                    "id": rule_label.split("–")[0].strip() if "–" in rule_label else rule_label,
                    "name": rule_label,
                    "bookId": book["id"],
                    "fact": f"{name}({book['id']})",
                }
            )
            if name not in ("RatingMatch", "AvailableBook"):
                preference_success += 1
            if name == "RatingMatch" and user.get("minimumRating") is not None and not ok:
                rating_passed = False
        else:
            failed.append(name)
            if name == "RatingMatch" and user.get("minimumRating") is not None:
                rating_passed = False

    # Re-evaluate rating_passed properly
    rating_passed = rating_ok()
    threshold = _candidate_threshold(user)
    # Availability failure alone should not reject
    success = preference_success >= threshold and rating_passed
    if success:
        derived.append(f"Recommend({book['id']})")
        proven.append("Recommend")

    return {
        "success": success,
        "subgoals": subgoals,
        "proven": proven,
        "failed": failed,
        "derivedFacts": derived,
        "firedRules": fired,
    }


def _brief_candidate(book: dict[str, Any], user: dict[str, Any]) -> dict[str, Any]:
    breakdown = score_breakdown(user, book)
    return {
        "id": book["id"],
        "title": book["title"],
        "author": book["author"],
        "genre": book["genre"],
        "mood": book["mood"],
        "score": book["score"],
        "recommendationScore": breakdown["total"],
        "image": book["image"],
    }


def run_inference(payload: dict[str, Any]) -> dict[str, Any]:
    """Full inference pipeline used by /api/recommend."""
    user = normalize_preferences(payload)
    method = user["reasoningMethod"]
    if method not in ("forward", "backward"):
        method = "forward"

    if method == "backward":
        chaining = backward_chaining(user)
    else:
        chaining = forward_chaining(user)

    candidates = chaining.pop("candidateBookObjects")
    scores = [
        {
            "id": b["id"],
            "title": b["title"],
            "recommendationScore": recommendation_score(user, b),
            "breakdown": score_breakdown(user, b)["parts"],
        }
        for b in candidates[:40]
    ]

    restarts_count = user.get("restarts", 8)
    hc = random_restart_hill_climbing(user, candidates, restarts=restarts_count, top_n=5)

    # Attach FOL sample for top recommendations
    for rec in hc["recommendations"]:
        full = next((b for b in candidates if b["id"] == rec["id"]), None)
        if full:
            rec["knowledgeRepresentation"] = fol_facts_for_book(full)[:16]

    reasoning_steps = list(chaining.get("reasoningSteps", []))
    reasoning_steps.extend(
        [
            "Candidate books scored using preference-weighted recommendation function.",
            "Hill Climbing maximized recommendation score over neighboring candidates.",
            "Random restarts explored multiple starting points to avoid weak local optima.",
            f"Final Top {len(hc['recommendations'])} recommendations ranked by score.",
        ]
    )

    return {
        "facts": chaining.get("initialFacts", preferences_to_facts(user)),
        "derivedFacts": chaining.get("derivedFacts", []),
        "firedRules": chaining.get("firedRules", []),
        "rulesChecked": chaining.get("rulesChecked", []),
        "candidateBooks": chaining.get("candidateBooks", []),
        "scores": scores,
        "hillClimbing": hc["hillClimbing"],
        "hill_climbing": hc["hill_climbing"],
        "restarts": hc["restarts"],
        "recommendations": hc["recommendations"],
        "reasoningSteps": reasoning_steps,
        "reasoningMethod": method,
        "goalTree": chaining.get("goalTree"),
        "proofExamples": chaining.get("proofExamples"),
        "userPreferences": user,
        "scoreWeights": {
            "Genre Match": 4,
            "Interest Match": 4,
            "Mood Match": 2,
            "Reading Level Match": 2,
            "Theme Match": 2,
            "Age Group Match": 1,
            "Keyword Match": 1,
            "Rating Match": 1,
            "Publication Match": 1,
            "Popularity Match": 1,
            "Availability Match": 1,
        },
    }


def run_backward_only(payload: dict[str, Any]) -> dict[str, Any]:
    user = normalize_preferences(payload)
    user["reasoningMethod"] = "backward"
    result = backward_chaining(user)
    result.pop("candidateBookObjects", None)
    return result


def run_hill_climb_only(payload: dict[str, Any]) -> dict[str, Any]:
    user = normalize_preferences(payload)
    method = user.get("reasoningMethod") or "forward"
    chaining = backward_chaining(user) if method == "backward" else forward_chaining(user)
    candidates = chaining.pop("candidateBookObjects")
    restarts_count = user.get("restarts", 8)
    return random_restart_hill_climbing(user, candidates, restarts=restarts_count, top_n=5)


def peas_description() -> dict[str, Any]:
    return {
        "agent": "LibraAI – Library Book Recommendation Assistant",
        "performanceMeasure": [
            "Recommendation relevance",
            "Preference matching accuracy",
            "Search accuracy of Hill Climbing",
            "Reasoning correctness (rules fired / facts derived)",
            "Recommendation score quality",
            "Explanation quality for each recommendation",
        ],
        "environment": [
            "Digital library Knowledge Base",
            "10,538-book enriched dataset",
            "User preference inputs",
            "Simulated availability and derived length fields",
        ],
        "actuators": [
            "Book recommendations (Top 5)",
            "Library search results",
            "Book detail views",
            "Reasoning explanations",
            "Triggered IF–THEN rules",
            "Hill Climbing / restart results",
        ],
        "sensors": [
            "Genre",
            "Interest / Topic",
            "Mood",
            "Reading Level",
            "Age Group",
            "Preferred Length",
            "Theme",
            "Keywords",
            "Minimum Rating",
            "Search Query",
            "Reasoning Method (Forward / Backward)",
        ],
    }


def fol_examples() -> list[str]:
    return [
        "Book(x) ∧ Genre(x, Horror) → HorrorBook(x)",
        "Book(x) ∧ Rating(x, r) ∧ r ≥ 4.0 → HighlyRatedBook(x)",
        "Book(x) ∧ Keyword(x, Programming) → ProgrammingBook(x)",
        "Book(x) ∧ Mood(x, Suspenseful) → SuspensefulBook(x)",
        "Book(x) ∧ Genre(x, Horror) ∧ Mood(x, Suspenseful) → SuitableForSuspenseReader(x)",
        "Book(x) ∧ Theme(x, Artificial Intelligence) → AIThemeBook(x)",
        "UserGenre(g) ∧ Genre(x, g) → GenreMatch(x)",
        "GenreMatch(x) ∧ MoodMatch(x) → StrongMoodMatch(x)",
    ]


def get_public_rules() -> list[dict[str, Any]]:
    return get_rules_public()
