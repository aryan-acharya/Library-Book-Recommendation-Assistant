"""LibraAI test cases – verify rule-based reasoning, chaining, scoring, hill climbing."""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai.inference import normalize_preferences, run_inference  # noqa: E402
from ai.knowledge_base import get_all_books  # noqa: E402
from ai.scoring import recommendation_score  # noqa: E402


def _assert_top_has_signal(result: dict, predicate, message: str):
    recs = result["recommendations"]
    assert len(recs) >= 1, "Expected at least one recommendation"
    assert len(recs) <= 5, "Expected at most 5 recommendations"
    assert any(predicate(r) for r in recs), message
    # Scores should be non-increasing
    scores = [r["recommendationScore"] for r in recs]
    assert scores == sorted(scores, reverse=True), "Recommendations must be ranked by score"


def test_knowledge_base_loads():
    books = get_all_books()
    assert len(books) == 10538
    sample = books[0]
    for key in (
        "title",
        "author",
        "score",
        "genre",
        "mood",
        "readingLevel",
        "ageGroup",
        "themes",
        "keywords",
        "length",
        "availability",
    ):
        assert key in sample


def test_case_1_horror_suspenseful_adult():
    """Genre=Horror, Mood=Suspenseful, Age=Adult → horror/suspenseful score higher."""
    payload = {
        "genre": "Horror",
        "mood": "Suspenseful",
        "ageGroup": "Adult",
        "minimumRating": 3.5,
        "reasoningMethod": "forward",
    }
    result = run_inference(payload)
    assert result["facts"], "User facts should be generated"
    assert result["firedRules"] or result["candidateBooks"], "Rules/candidates expected"
    assert result["hillClimbing"]["steps"] or result["restarts"], "Hill climbing should run"
    _assert_top_has_signal(
        result,
        lambda r: r["genre"] == "Horror" or r["mood"] == "Suspenseful",
        "Expected Horror or Suspenseful books in Top 5",
    )
    # Horror books should generally outscore unrelated genres among candidates
    user = normalize_preferences(payload)
    if result["candidateBooks"]:
        horror = [c for c in result["candidateBooks"] if c["genre"] == "Horror"]
        other = [c for c in result["candidateBooks"] if c["genre"] != "Horror"]
        if horror and other:
            assert max(c["recommendationScore"] for c in horror) >= max(
                c["recommendationScore"] for c in other[:5]
            )


def test_case_2_ai_intermediate():
    """Interest=Artificial Intelligence, Reading Level=Intermediate."""
    payload = {
        "interest": "Artificial Intelligence",
        "readingLevel": "Intermediate",
        "reasoningMethod": "forward",
    }
    result = run_inference(payload)
    assert result["reasoningMethod"] == "forward"
    _assert_top_has_signal(
        result,
        lambda r: (
            "artificial intelligence" in (r.get("description") or "").lower()
            or "artificial intelligence" in " ".join(r.get("keywords") or []).lower()
            or "artificial intelligence" in " ".join(r.get("themes") or []).lower()
            or r.get("genre") == "Artificial Intelligence"
            or "intelligence" in r["title"].lower()
            or "ai" in " ".join(r.get("keywords") or []).lower()
        ),
        "Expected AI-related books to be prioritized",
    )


def test_case_3_programming_beginner():
    """Interest=Programming, Reading Level=Beginner."""
    payload = {
        "interest": "Programming",
        "readingLevel": "Beginner",
        "reasoningMethod": "backward",
    }
    result = run_inference(payload)
    assert result["reasoningMethod"] == "backward"
    assert result.get("goalTree") or result["reasoningSteps"]
    _assert_top_has_signal(
        result,
        lambda r: (
            r.get("genre") in {"Programming", "Computer Science", "Algorithms"}
            or "programming" in r["title"].lower()
            or "programming" in " ".join(r.get("keywords") or []).lower()
            or "programmer" in " ".join(r.get("keywords") or []).lower()
            or "coding" in " ".join(r.get("keywords") or []).lower()
        ),
        "Expected beginner programming-related books",
    )


def test_case_4_fantasy_adventurous():
    """Genre=Fantasy, Mood=Adventurous."""
    payload = {
        "genre": "Fantasy",
        "mood": "Adventurous",
        "reasoningMethod": "forward",
    }
    result = run_inference(payload)
    _assert_top_has_signal(
        result,
        lambda r: r["genre"] == "Fantasy" or r["mood"] == "Adventurous",
        "Expected Fantasy/Adventurous books to rank higher",
    )
    for rec in result["recommendations"]:
        assert "whyRecommended" in rec
        assert "triggeredRules" in rec


def test_case_5_psychology_human_behavior():
    """Interest=Psychology, Theme=Human Behavior."""
    payload = {
        "interest": "Psychology",
        "theme": "Human Behavior",
        "reasoningMethod": "backward",
    }
    result = run_inference(payload)
    _assert_top_has_signal(
        result,
        lambda r: (
            r.get("genre") == "Psychology"
            or "psychology" in r["title"].lower()
            or "Human Behavior" in (r.get("themes") or [])
            or "psychology" in " ".join(r.get("keywords") or []).lower()
        ),
        "Expected psychology / human-behavior books",
    )


def test_hill_climbing_improves_or_equals():
    payload = {
        "genre": "Thriller",
        "mood": "Suspenseful",
        "minimumRating": 4.0,
        "reasoningMethod": "forward",
    }
    result = run_inference(payload)
    for restart in result.get("restarts", []):
        if restart.get("startScore") is not None and restart.get("score") is not None:
            assert restart["score"] >= restart["startScore"]


def test_scoring_dynamic():
    books = get_all_books()
    user = normalize_preferences(
        {"genre": books[0]["genre"], "mood": books[0]["mood"], "minimumRating": 0}
    )
    score = recommendation_score(user, books[0])
    assert score > 0
    assert isinstance(score, int)


def test_hc_scenario_1_genre():
    """Scenario 1: 'I want a horror book.'"""
    payload = {"genre": "Horror", "reasoningMethod": "forward"}
    result = run_inference(payload)
    assert result["candidateBooks"], "Rule engine must identify horror candidates"
    assert result["hillClimbing"]["restarts"], "Hill Climbing must evaluate restarts"
    recs = result["recommendations"]
    assert len(recs) >= 1
    assert all(r["genre"] == "Horror" for r in recs), "All recommendations should be Horror"
    scores = [r["recommendationScore"] for r in recs]
    assert scores == sorted(scores, reverse=True), "Must be ranked by recommendation score"


def test_hc_scenario_2_mood():
    """Scenario 2: 'I'm stressed and want something relaxing.'"""
    payload = {"mood": "Inspirational", "reasoningMethod": "forward"}
    result = run_inference(payload)
    recs = result["recommendations"]
    assert len(recs) >= 1
    assert any(r["mood"] == "Inspirational" for r in recs), "Expected Inspirational mood books in Top 5"
    top_with_mood = next(r for r in recs if r["mood"] == "Inspirational")
    assert top_with_mood["scoreBreakdown"]["mood"] == 2, "Mood match must contribute +2 points"


def test_hc_scenario_3_difficulty():
    """Scenario 3: 'I want an easy mystery book.'"""
    payload = {"readingLevel": "Beginner", "interest": "Mystery", "reasoningMethod": "forward"}
    result = run_inference(payload)
    recs = result["recommendations"]
    assert len(recs) >= 1
    # Verify readingLevel contributes to score
    beginner_rec = next((r for r in recs if r["readingLevel"] == "Beginner"), None)
    assert beginner_rec is not None, "Expected Beginner reading level recommendations"
    assert beginner_rec["scoreBreakdown"]["readingLevel"] == 2, "Reading level must contribute to score"


def test_hc_scenario_4_multiple_preferences():
    """Scenario 4: 'I want a short beginner-friendly mystery book with a high rating.'"""
    payload = {
        "interest": "Mystery",
        "readingLevel": "Beginner",
        "length": "Short",
        "minimumRating": 4.0,
        "reasoningMethod": "forward",
    }
    result = run_inference(payload)
    recs = result["recommendations"]
    assert len(recs) >= 1
    top = recs[0]
    # Verify multiple components contribute
    parts = top["scoreBreakdown"]
    active_parts = [k for k, v in parts.items() if v > 0]
    assert len(active_parts) >= 3, "Multiple preference components must be used in score"
    assert top["score"] >= 4.0, "Rating match requirement must be satisfied"


def test_hc_scenario_5_similar_books():
    """Scenario 5: 'Books like this' — Hill Climbing applied to relevant candidate set."""
    books = get_all_books()
    ref_book = books[12]  # select a sample reference book
    derived_user = normalize_preferences({
        "genre": ref_book["genre"],
        "mood": ref_book["mood"],
        "theme": ref_book["themes"][0] if ref_book["themes"] else None,
        "readingLevel": ref_book["readingLevel"],
        "minimumRating": 3.5,
    })
    result = run_inference(derived_user)
    recs = result["recommendations"]
    assert len(recs) >= 1
    # Verify similar books share genre or mood with reference
    assert any(
        r["genre"] == ref_book["genre"] or r["mood"] == ref_book["mood"]
        for r in recs
    ), "Recommendations must be similar to reference book"


def test_hc_scenario_6_no_neighbors_graceful_termination():
    """Scenario 6: Small/disconnected candidate set terminates gracefully."""
    from ai.hill_climbing import hill_climbing_recommendation

    user = normalize_preferences({"genre": "Horror", "mood": "Suspenseful"})
    single_cand = [get_all_books()[0]]
    result = hill_climbing_recommendation(user, single_cand)
    assert result["localOptimum"] is not None
    assert result["localOptimum"]["id"] == single_cand[0]["id"]
    # Empty candidate list
    empty_res = hill_climbing_recommendation(user, [])
    assert empty_res["localOptimum"] is None


def test_hc_scenario_7_random_restart_multiple_starts():
    """Scenario 7: Random-Restart Hill Climbing evaluates multiple distinct candidates."""
    payload = {
        "genre": "Horror",
        "mood": "Suspenseful",
        "theme": "Supernatural",
        "restarts": 6,
    }
    result = run_inference(payload)
    restarts = result["restarts"]
    assert len(restarts) >= 4, "Expected multiple restarts to be evaluated"
    start_ids = set()
    for r in restarts:
        if r.get("startTitle"):
            start_ids.add(r["startTitle"])
    assert len(start_ids) > 1, "Restarts must evaluate multiple distinct starting candidates"


def test_hc_programmatic_strict_uphill_and_termination():
    """
    Verification that:
    1. selected_neighbor_score > current_score on EVERY move.
    2. No neighbor score > current score at local optimum stop.
    3. Changing user preferences dynamically changes scores, ranking, and search paths.
    """
    payload_a = {
        "genre": "Horror",
        "mood": "Suspenseful",
        "readingLevel": "Intermediate",
        "minimumRating": 4.0,
    }
    result_a = run_inference(payload_a)

    for run in result_a["hillClimbing"].get("allRuns", []):
        for step in run.get("steps", []):
            if step["action"] == "move":
                assert step["toScore"] > step["fromScore"], (
                    f"Violation of Hill Climbing invariant: move from {step['fromScore']} "
                    f"to {step['toScore']} must be strictly uphill."
                )
            elif step["action"] == "local_optimum":
                # Verify that no evaluated neighbor had a score strictly higher than current_score
                for nb in step.get("neighbors", []):
                    assert nb["score"] <= step["current_score"], (
                        f"Termination invariant failed: neighbor {nb['title']} has score "
                        f"{nb['score']} > current {step['current_score']}"
                    )

    # Changing user preferences must change scores, rankings, and recommendations
    payload_b = {
        "genre": "Fantasy",
        "mood": "Adventurous",
        "readingLevel": "Advanced",
        "minimumRating": 3.8,
    }
    result_b = run_inference(payload_b)
    recs_a_ids = [r["id"] for r in result_a["recommendations"]]
    recs_b_ids = [r["id"] for r in result_b["recommendations"]]
    assert recs_a_ids != recs_b_ids, "Changing preferences must yield different recommendations"


if __name__ == "__main__":
    tests = [
        test_knowledge_base_loads,
        test_case_1_horror_suspenseful_adult,
        test_case_2_ai_intermediate,
        test_case_3_programming_beginner,
        test_case_4_fantasy_adventurous,
        test_case_5_psychology_human_behavior,
        test_hill_climbing_improves_or_equals,
        test_scoring_dynamic,
        test_hc_scenario_1_genre,
        test_hc_scenario_2_mood,
        test_hc_scenario_3_difficulty,
        test_hc_scenario_4_multiple_preferences,
        test_hc_scenario_5_similar_books,
        test_hc_scenario_6_no_neighbors_graceful_termination,
        test_hc_scenario_7_random_restart_multiple_starts,
        test_hc_programmatic_strict_uphill_and_termination,
    ]
    for fn in tests:
        print(f"Running {fn.__name__}...")
        fn()
        print("  PASS")
    print(f"\nAll {len(tests)} tests passed successfully!")

