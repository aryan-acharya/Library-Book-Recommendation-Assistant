"""LibraAI Flask API – Library Book Recommendation Assistant."""

from __future__ import annotations

import os
import sys

from flask import Flask, jsonify, request
from flask_cors import CORS

# Ensure backend package imports resolve when run as script
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai.inference import (  # noqa: E402
    fol_examples,
    get_public_rules,
    peas_description,
    run_backward_only,
    run_hill_climb_only,
    run_inference,
)
from ai.knowledge_base import (  # noqa: E402
    filter_books,
    find_similar_detailed,
    fol_facts_for_book,
    get_all_books,
    get_book,
    knowledge_tree,
    related_books,
    search_books,
    unique_values,
)

app = Flask(__name__)
CORS(app)


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "books": len(get_all_books()), "name": "LibraAI"})


@app.get("/api/books")
def api_books():
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    result = filter_books(
        genre=request.args.get("genre"),
        subgenre=request.args.get("subgenre"),
        mood=request.args.get("mood"),
        reading_level=request.args.get("readingLevel"),
        age_group=request.args.get("ageGroup"),
        availability=request.args.get("availability"),
        min_rating=float(request.args["minRating"]) if request.args.get("minRating") else None,
        published_from=int(request.args["publishedFrom"]) if request.args.get("publishedFrom") else None,
        published_to=int(request.args["publishedTo"]) if request.args.get("publishedTo") else None,
        page=page,
        limit=limit,
    )
    return jsonify(result)


@app.get("/api/books/<book_id>")
def api_book_detail(book_id: str):
    book = get_book(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    return jsonify(
        {
            "book": book,
            "knowledgeRepresentation": fol_facts_for_book(book),
            "related": related_books(book),
            "similar": find_similar_detailed(book),
        }
    )


@app.get("/api/books/<book_id>/similar")
@app.get("/api/similar/<book_id>")
def api_similar(book_id: str):
    book = get_book(book_id)
    if not book:
        return jsonify({"error": "Book not found"}), 404
    return jsonify(
        {
            "book": book,
            "similar": find_similar_detailed(book),
        }
    )


@app.get("/api/search")
def api_search():
    q = request.args.get("q", "")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    return jsonify(search_books(q, page=page, limit=limit))


@app.get("/api/genres")
def api_genres():
    return jsonify({"genres": unique_values("genre")})


@app.get("/api/subgenres")
def api_subgenres():
    return jsonify({"subgenres": unique_values("subgenre")})


@app.get("/api/moods")
def api_moods():
    return jsonify({"moods": unique_values("mood")})


@app.get("/api/themes")
def api_themes():
    return jsonify({"themes": unique_values("themes")})


@app.get("/api/meta")
def api_meta():
    return jsonify(
        {
            "genres": unique_values("genre"),
            "subgenres": unique_values("subgenre"),
            "moods": unique_values("mood"),
            "themes": unique_values("themes"),
            "readingLevels": ["Beginner", "Intermediate", "Advanced"],
            "ageGroups": ["Children", "Young Adult", "Adult", "General"],
            "lengths": ["Short", "Medium", "Long", "Any"],
            "availabilities": ["Available", "Limited", "Unavailable"],
            "bookCount": len(get_all_books()),
        }
    )


@app.get("/api/rules")
def api_rules():
    return jsonify({"rules": get_public_rules(), "folExamples": fol_examples()})


@app.get("/api/peas")
def api_peas():
    return jsonify(peas_description())


@app.get("/api/knowledge-base")
def api_knowledge_base():
    sample_id = request.args.get("id")
    tree = knowledge_tree()
    sample = None
    if sample_id:
        book = get_book(sample_id)
        if book:
            sample = {
                "book": {
                    "id": book["id"],
                    "title": book["title"],
                    "author": book["author"],
                    "genre": book["genre"],
                    "image": book["image"],
                },
                "facts": fol_facts_for_book(book),
            }
    else:
        book = get_all_books()[0]
        sample = {
            "book": {
                "id": book["id"],
                "title": book["title"],
                "author": book["author"],
                "genre": book["genre"],
                "image": book["image"],
            },
            "facts": fol_facts_for_book(book),
        }
    return jsonify({"tree": tree, "sample": sample, "totalBooks": tree["size"]})


@app.post("/api/recommend")
def api_recommend():
    payload = request.get_json(force=True, silent=True) or {}
    result = run_inference(payload)
    return jsonify(result)


@app.post("/api/backward-chain")
def api_backward_chain():
    payload = request.get_json(force=True, silent=True) or {}
    return jsonify(run_backward_only(payload))


@app.post("/api/hill-climb")
def api_hill_climb():
    payload = request.get_json(force=True, silent=True) or {}
    return jsonify(run_hill_climb_only(payload))


if __name__ == "__main__":
    print("Loading LibraAI Knowledge Base (Popular-Books-10000plus-Ratings-Enriched.csv)...")
    count = len(get_all_books())
    print(f"Loaded {count} books.")
    app.run(host="127.0.0.1", port=5000, debug=True)
