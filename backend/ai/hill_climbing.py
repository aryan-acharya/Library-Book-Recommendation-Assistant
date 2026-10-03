"""Hill Climbing and Random-Restart Hill Climbing for LibraAI.

This module implements:
1. `neighbor_affinity` & `books_are_neighbors`: Meaningful attribute-based book neighbor relationship
   (shared genre, subgenre, mood, themes, keywords, author, and reading level — NOT adjacent CSV rows).
2. `get_neighbors`: Retrieves the closest neighboring candidates for a given book.
3. `hill_climbing` / `hill_climbing_recommendation`: Single-run Hill Climbing that moves strictly to
   better-scoring neighbors and terminates at a local optimum.
4. `random_restart_hill_climbing`: Multi-start local search that explores different candidate regions,
   collects local optima, and ranks the Top 5 unique recommendations.
"""

from __future__ import annotations

import random
from typing import Any

from .scoring import (
    INTEREST_GENRE_FAMILY,
    calculate_recommendation_score,
    ranking_key,
    score_breakdown,
)


def _norm(value: Any) -> str:
    return str(value or "").strip().lower()


def _genre_family_boost(user: dict[str, Any], book_like: dict[str, Any]) -> bool:
    interest = _norm(user.get("interest"))
    family = INTEREST_GENRE_FAMILY.get(interest, set())
    return bool(family and _norm(book_like.get("genre")) in family)


def neighbor_affinity(a: dict[str, Any], b: dict[str, Any]) -> float:
    """
    Calculate semantic and catalog affinity between two books.
    Books are considered neighbors if they share meaningful attributes such as:
    - Author (+3.0)
    - Specific Subgenre (+2.5)
    - Genre AND Mood combined (+2.5) or single (+1.0)
    - Shared Themes (+2.0 per shared theme)
    - Shared Keywords (+0.8 per shared keyword)
    - Shared Reading Level (+0.5 if already related)
    """
    if a["id"] == b["id"]:
        return 0.0

    affinity = 0.0

    # 1. Author match (books by the same author are natural neighbors)
    auth_a, auth_b = _norm(a.get("author")), _norm(b.get("author"))
    if auth_a and auth_b and auth_a == auth_b:
        affinity += 3.0

    # 2. Subgenre match (specific subgenres, e.g. "Gothic Horror", "Cyberpunk")
    sub_a, sub_b = _norm(a.get("subgenre")), _norm(b.get("subgenre"))
    if sub_a and sub_b and sub_a == sub_b and sub_a not in ("", "general", "unknown"):
        affinity += 2.5

    # 3. Genre and Mood combination
    genre_match = _norm(a.get("genre")) == _norm(b.get("genre")) and _norm(a.get("genre")) not in ("", "unknown")
    mood_match = _norm(a.get("mood")) == _norm(b.get("mood")) and _norm(a.get("mood")) not in ("", "neutral")

    if genre_match and mood_match:
        affinity += 2.5
    elif genre_match:
        affinity += 1.0
    elif mood_match:
        affinity += 1.0

    # 4. Shared themes (e.g. "Supernatural", "Mystery", "Artificial Intelligence")
    themes_a = set(t.lower() for t in a.get("themes", []))
    themes_b = set(t.lower() for t in b.get("themes", []))
    shared_themes = themes_a & themes_b
    affinity += len(shared_themes) * 2.0

    # 5. Shared keywords
    kw_a = set(k.lower() for k in a.get("keywords", []))
    kw_b = set(k.lower() for k in b.get("keywords", []))
    shared_kw = kw_a & kw_b
    affinity += len(shared_kw) * 0.8

    # 6. Reading level match (supplementary boost if already related)
    if affinity > 0 and _norm(a.get("readingLevel")) == _norm(b.get("readingLevel")):
        affinity += 0.5

    return affinity


def books_are_neighbors(a: dict[str, Any], b: dict[str, Any]) -> bool:
    """
    Two books are neighbors if they share meaningful attributes.
    Row adjacency in the CSV is strictly NOT a neighbor condition.
    """
    if a["id"] == b["id"]:
        return False
    return neighbor_affinity(a, b) >= 1.5


def get_neighbors(
    current_book: dict[str, Any],
    candidate_books: list[dict[str, Any]],
    max_neighbors: int = 10,
) -> list[dict[str, Any]]:
    """
    Find neighboring candidate books for current_book, sorted by affinity.
    Limits to max_neighbors (default 10) to define a realistic local search graph.
    """
    scored = [
        (neighbor_affinity(current_book, b), b)
        for b in candidate_books
        if b["id"] != current_book["id"]
    ]

    # Filter to books meeting neighbor threshold
    filtered = [x for x in scored if x[0] >= 1.5]

    # Fallback if candidates are scarce: accept any positive affinity
    if not filtered:
        filtered = [x for x in scored if x[0] > 0]

    # Extreme fallback if candidate set has no shared attributes (e.g. disconnected nodes):
    # allow any candidate to prevent crash while preserving algorithm correctness
    if not filtered and len(candidate_books) > 1:
        filtered = [(0.1, b) for b in candidate_books if b["id"] != current_book["id"]]

    filtered.sort(key=lambda x: -x[0])
    return [b for _, b in filtered[:max_neighbors]]


def hill_climbing_recommendation(
    user_preferences: dict[str, Any],
    candidate_books: list[dict[str, Any]],
    start_book: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Maximize recommendation score by moving to better neighboring candidates.
    Algorithm:
    1. Select initial candidate.
    2. Calculate its recommendation score.
    3. Find neighboring candidate books.
    4. Calculate each neighbor's score.
    5. Identify a better neighbor (strictly higher score).
    6. Move to the better neighbor.
    7. Repeat until no neighboring candidate has a higher score.
    8. Return the local optimum and full step history.
    """
    if not candidate_books:
        return {
            "startBook": None,
            "steps": [],
            "localOptimum": None,
            "path": [],
            "pathSummary": "No candidates available",
        }

    current = start_book or candidate_books[0]
    current_score = calculate_recommendation_score(user_preferences, current)
    path = [{"id": current["id"], "title": current["title"], "score": current_score}]
    visited = {current["id"]}
    steps: list[dict[str, Any]] = []

    step_number = 0
    max_steps = 30

    while step_number < max_steps:
        step_number += 1
        neighbors = get_neighbors(current, candidate_books, max_neighbors=10)

        # Fallback if no neighbors are found
        if not neighbors:
            steps.append(
                {
                    "step": step_number,
                    "stepNumber": step_number,
                    "action": "no_neighbors",
                    "status": "no_better_neighbor",
                    "current_book": current["title"],
                    "current_score": current_score,
                    "current": _brief(current),
                    "neighbors": [],
                    "selected": None,
                    "selected_book": None,
                    "fromScore": current_score,
                    "toScore": current_score,
                    "message": (
                        f"Step {step_number}: {current['title']} ({current_score}) — "
                        "No suitable neighboring candidates found. Search terminated at current candidate."
                    ),
                }
            )
            break

        neighbor_evals = []
        best_neighbor = None
        best_score = current_score

        for nb in neighbors:
            sc = calculate_recommendation_score(user_preferences, nb)
            is_better = sc > current_score and nb["id"] not in visited
            neighbor_evals.append(
                {
                    "book": _brief(nb),
                    "title": nb["title"],
                    "score": sc,
                    "better": is_better,
                }
            )
            if sc > best_score and nb["id"] not in visited:
                best_score = sc
                best_neighbor = nb

        # Check termination condition: no neighbor score > current score
        if best_neighbor is None or best_score <= current_score:
            steps.append(
                {
                    "step": step_number,
                    "stepNumber": step_number,
                    "action": "local_optimum",
                    "status": "no_better_neighbor",
                    "current_book": current["title"],
                    "current_score": current_score,
                    "current": _brief(current),
                    "neighbors": neighbor_evals,
                    "selected": None,
                    "selected_book": None,
                    "fromScore": current_score,
                    "toScore": current_score,
                    "message": (
                        f"Step {step_number}: {current['title']} ({current_score}) — "
                        f"No better neighboring book found. Local optimum reached."
                    ),
                }
            )
            break

        # Move strictly to better neighbor
        steps.append(
            {
                "step": step_number,
                "stepNumber": step_number,
                "action": "move",
                "status": "better_neighbor_found",
                "current_book": current["title"],
                "current_score": current_score,
                "current": _brief(current),
                "neighbors": neighbor_evals,
                "selected": best_neighbor["title"],
                "selected_book": _brief(best_neighbor),
                "fromScore": current_score,
                "toScore": best_score,
                "message": (
                    f"Step {step_number}: {current['title']} ({current_score}) → "
                    f"{best_neighbor['title']} ({best_score}) ✓ Better neighbor found"
                ),
            }
        )

        current = best_neighbor
        current_score = best_score
        visited.add(current["id"])
        path.append({"id": current["id"], "title": current["title"], "score": current_score})

    path_summary = " → ".join(f"{p['title']} ({p['score']})" for p in path)

    return {
        "startBook": path[0] if path else None,
        "steps": steps,
        "localOptimum": {
            "book": _brief(current),
            "id": current["id"],
            "title": current["title"],
            "score": current_score,
            "breakdown": score_breakdown(user_preferences, current),
        },
        "path": path,
        "pathSummary": path_summary,
    }


# Reusable function alias requested in guidelines
hill_climbing = hill_climbing_recommendation


def random_restart_hill_climbing(
    user_preferences: dict[str, Any],
    candidate_books: list[dict[str, Any]],
    restarts: int = 8,
    top_n: int = 5,
    seed: int | None = 42,
) -> dict[str, Any]:
    """
    Run hill climbing from multiple starting candidates across different regions.
    Collects unique local optima, ranks them by recommendation score, and returns Top 5.
    Hill Climbing does NOT guarantee a global optimum; random restarts mitigate weak local optima.
    """
    if not candidate_books:
        return {
            "restarts": [],
            "recommendations": [],
            "hillClimbing": {
                "enabled": True,
                "startBook": None,
                "steps": [],
                "localOptimum": None,
                "restarts": [],
                "bestScore": 0,
                "iterations": 0,
                "note": "No candidate books available for hill climbing.",
            },
            "hill_climbing": {
                "enabled": True,
                "restarts": 0,
                "search_paths": [],
                "best_score": 0,
                "iterations": 0,
            },
        }

    # Handle very small candidate sets gracefully
    if len(candidate_books) <= 2:
        restarts = 1

    rng = random.Random(seed)

    # Score all candidates dynamically
    scored = [
        (calculate_recommendation_score(user_preferences, b), b)
        for b in candidate_books
    ]
    scored.sort(key=lambda x: ranking_key(user_preferences, x[1]))

    # Pick diverse starting points across score tiers and subgenre regions
    # to demonstrate genuine uphill climbing and diverse local optima
    starts: list[dict[str, Any]] = []
    seen_start_ids: set[str] = set()

    def add_start(b: dict[str, Any]):
        if b["id"] not in seen_start_ids:
            seen_start_ids.add(b["id"])
            starts.append(b)

    n_pool = len(scored)
    # Tiered starting candidates: lower, mid, and higher
    if n_pool >= 6:
        # Lower-mid candidates (showcase multi-step uphill climbs)
        add_start(scored[min(n_pool - 1, int(n_pool * 0.75))][1])
        add_start(scored[min(n_pool - 1, int(n_pool * 0.50))][1])
        add_start(scored[min(n_pool - 1, int(n_pool * 0.25))][1])
        # High candidate
        add_start(scored[0][1])
    else:
        for _, b in scored:
            add_start(b)

    # Fill remaining restarts with random candidates for diversity
    shuffled_pool = [b for _, b in scored]
    rng.shuffle(shuffled_pool)
    for b in shuffled_pool:
        if len(starts) >= min(restarts, n_pool):
            break
        add_start(b)

    restart_summaries: list[dict[str, Any]] = []
    optima_by_id: dict[str, dict[str, Any]] = {}
    detailed_runs: list[dict[str, Any]] = []
    search_paths: list[list[dict[str, Any]]] = []

    total_iterations = 0

    for i, start in enumerate(starts):
        result = hill_climbing_recommendation(user_preferences, candidate_books, start)
        optimum = result["localOptimum"]
        if not optimum:
            continue

        book = next(b for b in candidate_books if b["id"] == optimum["book"]["id"])
        breakdown = score_breakdown(user_preferences, book)
        total_iterations += len(result["steps"])
        search_paths.append(result["path"])

        entry = {
            "restart": i + 1,
            "label": f"Random Restart {i + 1}",
            "startBook": result["startBook"],
            "startTitle": result["startBook"]["title"] if result["startBook"] else None,
            "startScore": result["startBook"]["score"] if result["startBook"] else None,
            "localOptimum": optimum["book"],
            "localOptimumTitle": optimum["book"]["title"],
            "localOptimumId": optimum["book"]["id"],
            "score": optimum["score"],
            "path": result["path"],
            "pathSummary": result["pathSummary"],
            "steps": result["steps"],
        }
        detailed_runs.append(entry)
        restart_summaries.append(
            {
                "restart": i + 1,
                "label": f"Random Restart {i + 1}",
                "startTitle": result["startBook"]["title"] if result["startBook"] else None,
                "startScore": result["startBook"]["score"] if result["startBook"] else None,
                "localOptimumTitle": optimum["book"]["title"],
                "localOptimumId": optimum["book"]["id"],
                "score": optimum["score"],
                "pathSummary": result["pathSummary"],
                "stepsCount": len(result["steps"]),
                "path": result["path"],
            }
        )

        existing = optima_by_id.get(book["id"])
        if existing is None or optimum["score"] > existing["recommendationScore"]:
            optima_by_id[book["id"]] = {
                **_full_card(book),
                "recommendationScore": optimum["score"],
                "maxScore": breakdown["maxScore"],
                "scoreBreakdown": breakdown["parts"],
                "whyRecommended": breakdown["reasons"],
                "triggeredRules": breakdown["triggeredRules"],
                "hillClimbingPath": result["path"],
                "hillClimbingSteps": result["steps"],
                "restartOrigin": i + 1,
            }

    # Rank unique local optima by recommendation score
    ranked = sorted(
        optima_by_id.values(),
        key=lambda x: (
            -x["recommendationScore"],
            -(1 if _genre_family_boost(user_preferences, x) else 0),
            -x["score"],
            -x["ratings"],
        ),
    )

    # If fewer than top_n unique local optima were discovered across restarts,
    # fill remaining slots with the highest-scoring candidate books from the candidate pool
    if len(ranked) < top_n:
        present = {r["id"] for r in ranked}
        for score, book in scored:
            if book["id"] in present:
                continue
            breakdown = score_breakdown(user_preferences, book)
            ranked.append(
                {
                    **_full_card(book),
                    "recommendationScore": score,
                    "maxScore": breakdown["maxScore"],
                    "scoreBreakdown": breakdown["parts"],
                    "whyRecommended": breakdown["reasons"],
                    "triggeredRules": breakdown["triggeredRules"],
                    "hillClimbingPath": [
                        {"id": book["id"], "title": book["title"], "score": score}
                    ],
                    "hillClimbingSteps": [
                        {
                            "step": 1,
                            "stepNumber": 1,
                            "action": "direct_rank",
                            "status": "local_optimum",
                            "current_book": book["title"],
                            "current_score": score,
                            "current": _brief(book),
                            "neighbors": [],
                            "selected": None,
                            "selected_book": None,
                            "fromScore": score,
                            "toScore": score,
                            "message": "Candidate ranked by recommendation score to complete Top 5.",
                        }
                    ],
                    "restartOrigin": None,
                }
            )
            present.add(book["id"])
            if len(ranked) >= top_n:
                break

    ranked = sorted(
        ranked,
        key=lambda x: (
            -x["recommendationScore"],
            -(1 if _genre_family_boost(user_preferences, x) else 0),
            -x["score"],
            -x["ratings"],
        ),
    )
    recommendations = ranked[:top_n]

    # Select primary run for visualization:
    # Prefer a run that took multiple steps and reached the highest score
    best_score = max((r["score"] for r in detailed_runs), default=0)
    candidate_primary_runs = [r for r in detailed_runs if r["score"] == best_score]
    # Among best score runs, choose the one with the most steps (most educational climb)
    if candidate_primary_runs:
        candidate_primary_runs.sort(key=lambda r: len(r["steps"]), reverse=True)
        primary = candidate_primary_runs[0]
    elif detailed_runs:
        detailed_runs.sort(key=lambda r: len(r["steps"]), reverse=True)
        primary = detailed_runs[0]
    else:
        primary = {
            "startBook": None,
            "steps": [],
            "localOptimum": None,
            "path": [],
            "pathSummary": "",
        }

    hc_data = {
        "enabled": True,
        "startBook": primary.get("startBook"),
        "steps": primary.get("steps", []),
        "localOptimum": (
            {
                "book": primary.get("localOptimum"),
                "score": primary.get("score"),
            }
            if primary.get("localOptimum")
            else None
        ),
        "restarts": restart_summaries,
        "restartCount": len(detailed_runs),
        "bestScore": best_score,
        "bestResult": primary.get("localOptimumTitle"),
        "iterations": total_iterations,
        "primaryRun": primary,
        "path": primary.get("path", []),
        "pathSummary": primary.get("pathSummary", ""),
        "note": (
            "Hill Climbing stops when no neighboring candidate has a better score. "
            "This candidate is a local optimum within the explored neighborhood. "
            "Random-Restart Hill Climbing explores multiple starting candidates to "
            "reduce the chance of getting stuck in weak local optima, but does not "
            "guarantee the globally optimal book."
        ),
        "allRuns": detailed_runs,
    }

    # Structure supporting both camelCase and snake_case API specifications
    return {
        "restarts": restart_summaries,
        "recommendations": recommendations,
        "hillClimbing": hc_data,
        "hill_climbing": {
            "enabled": True,
            "restarts": len(restart_summaries),
            "search_paths": search_paths,
            "best_score": best_score,
            "iterations": total_iterations,
            "steps": primary.get("steps", []),
        },
    }


def _brief(book: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": book["id"],
        "title": book["title"],
        "author": book.get("author"),
        "genre": book.get("genre"),
        "subgenre": book.get("subgenre"),
        "mood": book.get("mood"),
        "readingLevel": book.get("readingLevel"),
        "score": book.get("score"),
        "image": book.get("image"),
    }


def _full_card(book: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": book["id"],
        "title": book["title"],
        "author": book["author"],
        "genre": book["genre"],
        "subgenre": book["subgenre"],
        "mood": book["mood"],
        "readingLevel": book["readingLevel"],
        "ageGroup": book["ageGroup"],
        "themes": book["themes"],
        "keywords": book["keywords"],
        "score": book["score"],
        "ratings": book["ratings"],
        "shelvings": book["shelvings"],
        "published": book["published"],
        "length": book["length"],
        "availability": book["availability"],
        "image": book["image"],
        "description": book["description"][:500] + ("..." if len(book["description"]) > 500 else ""),
    }
