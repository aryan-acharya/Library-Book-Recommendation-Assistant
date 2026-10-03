# LibraAI – Library Book Recommendation Assistant

## 1. Project Title

**LibraAI – Library Book Recommendation Assistant**

## 2. Project Overview

LibraAI is an intelligent digital library assistant that recommends books using Knowledge Representation, a Rule-Based System, Forward/Backward Chaining, recommendation scoring, and Random-Restart Hill Climbing. The Knowledge Base is the provided enriched dataset of **10,538 books**.

## 3. Problem Statement

Users struggle to find suitable books among large catalogs. Simple filters do not explain *why* a book fits. LibraAI converts preferences into facts, reasons with IF–THEN rules, scores candidates, and searches neighboring books to produce explainable Top 5 recommendations.

## 4. Objectives

- Represent LibraAI as an Intelligent Agent with PEAS
- Use the complete enriched CSV as a Knowledge Base
- Implement genuine rule-based reasoning in Python
- Support Forward Chaining and Backward Chaining
- Score candidates dynamically from preferences
- Optimize selection with Hill Climbing + random restarts
- Return Top 5 recommendations with explanations
- Provide a polished React frontend for demonstration

## 5. Dataset

File: `Popular-Books-10000plus-Ratings-Enriched.csv`

- **10,538 books**
- **17 fields**

## 6. Dataset Fields (Original)

- Title, Author, Score, Ratings, Shelvings, Published, Description, Image

## 7. Derived Features

- Genre, Subgenre, Mood, ReadingLevel, AgeGroup, Themes, Keywords, Length, Availability

**Important:** `Length` and `Availability` are derived/simulated fields for this academic prototype. They are not claimed as real library inventory data.

## 8. Intelligent Agent

LibraAI receives preferences (sensors), observes the Knowledge Base (environment), reasons and searches, then produces recommendations and explanations (actuators), measured by relevance, score quality, and explanation quality (performance).

## 9. PEAS Representation

| Component | Description |
|---|---|
| Performance | Relevance, preference match, reasoning correctness, score, explanation quality |
| Environment | Digital library + 10,538-book KB + user preferences |
| Actuators | Recommendations, search results, details, triggered rules, HC traces |
| Sensors | Genre, interest, mood, level, age, length, theme, keywords, rating, query |

## 10. Knowledge Representation

Books are represented as structured facts, e.g.:

```text
Book(B00001)
Genre(B00001, "Thriller")
Mood(B00001, "Suspenseful")
Theme(B00001, "Crime")
Rating(B00001, 4.16)
```

FOL-style examples (demonstrative, not a full theorem prover):

```text
Book(x) ∧ Genre(x, Horror) → HorrorBook(x)
Book(x) ∧ Rating(x,r) ∧ r ≥ 4.0 → HighlyRatedBook(x)
```

## 11. Knowledge Base

The entire CSV is loaded by Pandas and treated as the LibraAI Knowledge Base. No fake books are added.

## 12. Rule-Based System

Python IF–THEN rules evaluate user preferences against book attributes and derive facts such as `GenreMatch`, `MoodMatch`, `InterestMatch`.

## 13. IF–THEN Rules

17 rules including genre, mood, reading level, age, theme, keyword, interest, rating, popularity, availability, length, compound genre–mood rules, and publication suitability.

## 14. Forward Chaining

Starts from user facts, fires applicable rules, derives new facts, and collects candidate books until no useful new facts remain.

## 15. Backward Chaining

Starts from goal `Recommend(Book)` and proves subgoals (genre/interest/mood/level/theme/rating/availability) working backward.

## 16. Inference Engine

Coordinates:

```text
Facts → Rules → Forward/Backward Chaining → Candidates → Scoring → Hill Climbing → Top 5
```

## 17. Recommendation Scoring

| Criterion | Points |
|---|---|
| Genre Match | +4 |
| Interest Match | +4 |
| Mood Match | +2 |
| Reading Level Match | +2 |
| Theme Match | +2 |
| Age Group Match | +1 |
| Keyword Match | +1 |
| Rating Match | +1 |
| Publication Match | +1 |
| Popularity Match | +1 |
| Availability Match | +1 |

Maximum score = 20. Scores are computed dynamically (never hard-coded per book).

## 18. Hill Climbing Search

### 18.1 What Hill Climbing Is
Hill Climbing is an iterative local search optimization algorithm that begins at an initial candidate state and repeatedly evaluates its local neighborhood, transitioning strictly to a neighboring candidate with a higher evaluation score. When no neighbor has a higher score, the algorithm halts.

### 18.2 Why LibraAI Uses Hill Climbing
Rule-based reasoning (Forward/Backward chaining) identifies books that satisfy logical conditions, creating a set of valid candidate books. Rather than simply ranking every candidate globally, Hill Climbing navigates candidate book neighborhoods to find local optima that maximize preference fit along semantic dimensions.

### 18.3 Real Definition of a Neighboring Book
In LibraAI, **adjacent rows in the CSV are strictly NOT neighbors**. Two books are neighbors if and only if they share genuine catalog and semantic affinities:
- **Shared Author** (+3.0 affinity)
- **Shared Specific Subgenre** (+2.5 affinity)
- **Same Genre AND Same Mood** (+2.5 affinity)
- **Shared Themes** (+2.0 per shared theme)
- **Shared Keywords** (+0.8 per shared keyword)
- **Same Reading Level** (+0.5 supplementary affinity)

Two books are valid neighbors if their affinity score is $\ge 1.5$. A book's neighborhood is restricted to its top 8–10 closest neighbors by affinity, forming a realistic discrete search space.

### 18.4 Recommendation Objective Function
Every candidate book is scored dynamically using:
$$\text{Score} = (\text{GenreMatch} \times 4) + (\text{InterestMatch} \times 4) + (\text{MoodMatch} \times 2) + (\text{LevelMatch} \times 2) + (\text{ThemeMatch} \times 2) + (\text{AgeMatch} \times 1) + (\text{KeywordMatch} \times 1) + (\text{RatingMatch} \times 1) + (\text{PublicationMatch} \times 1) + (\text{PopularityMatch} \times 1) + (\text{AvailabilityMatch} \times 1)$$
Maximum possible score is 20 points.

### 18.5 Local Optimum vs. Global Optimum
Hill Climbing stops at a candidate when every evaluated neighbor has an equal or lower recommendation score. This candidate is a **local optimum**. Hill Climbing does **not** guarantee discovering the globally optimal book, as it cannot traverse downward score valleys.

## 19. Random-Restart Hill Climbing

To mitigate being trapped in weak local optima, LibraAI implements **Random-Restart Hill Climbing**:
1. Selects multiple distinct starting points (configurable: 5–10 restarts, default 8) from different regions and score tiers of the candidate space.
2. Executes Hill Climbing independently from each start, preserving the complete search trace.
3. Collects the discovered local optima and deduplicates them by book ID.
4. Ranks unique local optima by recommendation score (with tie-breaks for interest family, score, and popularity).
5. Returns the Top 5 unique recommendations with dynamically generated explanations.

## 20. System Architecture

```text
React (Vite) UI  ←→  Flask API  ←→  AI Engine (Rules, Chaining, Scoring, Hill Climbing)
                                      ↑
                               Enriched CSV Knowledge Base
```

## 21. Frontend

React + Vite + JavaScript pages:

- Home, AI Recommendations, Explore Library, Search, Book Details
- Knowledge Base, AI Reasoning, PEAS, How AI Works, About

## 22. Backend

Python + Flask + Pandas modules under `backend/ai/`:

- `knowledge_base.py`
- `rules.py`
- `scoring.py`
- `hill_climbing.py`
- `inference.py`

## 23. API

- `GET /api/books?page=&limit=`
- `GET /api/books/<id>`
- `GET /api/search?q=`
- `GET /api/genres`, `/api/subgenres`, `/api/moods`, `/api/themes`
- `GET /api/rules`, `/api/peas`, `/api/meta`, `/api/knowledge-base`
- `POST /api/recommend`
- `POST /api/backward-chain`
- `POST /api/hill-climb`

## 24. Testing

Run:

```bash
cd backend
python tests/test_inference.py
```

Includes 5 scenario tests (Horror/Suspense, AI, Programming/Beginner, Fantasy/Adventure, Psychology/Human Behavior) plus KB load, scoring, and hill-climbing checks.

## 25. Results

The system returns Top 5 books with recommendation scores, triggered rules, why-recommended reasons, and hill-climbing paths. Forward and Backward chaining both produce candidate sets before search.

## 26. Conclusion

LibraAI demonstrates a complete, explainable college-level AI pipeline: agent + PEAS + KR + rules + chaining + inference + scoring + hill climbing + ranking on a real 10,538-book Knowledge Base.

## 27. Future Scope

- Collaborative signals beyond content attributes
- Better neighbor graphs / embeddings for search neighborhoods
- User feedback loops to refine rule weights
- Library LMS availability integration (replace simulated Availability)

## 28. How to Run

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

API: `http://127.0.0.1:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: `http://127.0.0.1:5173`

Vite proxies `/api` to the Flask server.

### Demo tip (viva)

1. Open **How AI Works** and **PEAS**
2. Go to **AI Recommendations**
3. Try: Genre=`Horror`, Mood=`Suspenseful`, Age=`Adult`, Min Rating=`4.0`, Forward Chaining
4. Open **AI Reasoning** to show facts, fired rules, scores, and hill-climbing restarts
5. Contrast with **Search Library** (plain retrieval, not AI recommendation)
