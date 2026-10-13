# LibraAI – Library Book Recommendation Assistant

> **An intelligent digital library recommendation assistant powered by First-Order Logic Knowledge Base (10,538 books), Forward/Backward Chaining rule inference, dynamic multi-attribute scoring, and Random-Restart Hill Climbing optimization.**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0%2B-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Knowledge Base](https://img.shields.io/badge/Knowledge%20Base-10%2C538%20Books-success)](Popular-Books-10000plus-Ratings-Enriched.csv)

## 1. Project Title

**LibraAI – Library Book Recommendation Assistant**

## 2. Project Overview

LibraAI is an intelligent digital library assistant that recommends books using Knowledge Representation, a Rule-Based System, Forward/Backward Chaining, dynamic multi-attribute scoring, and Random-Restart Hill Climbing optimization. The Knowledge Base comprises an enriched catalog of **10,538 books**.

The application combines a high-performance Python/Flask reasoning engine with a modern, glassmorphic React (Vite) interface that features virtual 3D bookshelves, reading progress HUDs, and real-time platform telemetry.

## 3. Problem Statement

Users struggle to discover suitable books among vast catalogs. Conventional keyword filters retrieve books mechanically without explaining *why* a book fits user intent. LibraAI solves this by:
1. Converting user preferences into First-Order Logic facts.
2. Firing IF–THEN domain rules via Forward or Backward Chaining.
3. Scoring candidates dynamically across 11 preference dimensions.
4. Navigating discrete semantic neighborhoods via Random-Restart Hill Climbing.
5. Returning explainable Top 5 recommendations with triggered reasoning chains.

## 4. Objectives

- Represent LibraAI as an Intelligent Agent using the **PEAS** framework.
- Model the complete 10,538-book enriched dataset as a structured **Knowledge Base**.
- Implement genuine rule-based inference in Python without external black-box models.
- Support both **Forward Chaining** (data-driven) and **Backward Chaining** (goal-driven).
- Score candidate books dynamically using a transparent objective function (max 20 points).
- Optimize local optima discovery with **Random-Restart Hill Climbing** over semantic neighborhoods.
- Present explainable recommendations with complete search traces and fired rules.
- Provide a responsive, modern React interface featuring virtual 3D bookshelves, reading schedule HUDs, and real-time platform analysis.

---

## 5. Dataset & Knowledge Base

- **Source File**: `Popular-Books-10000plus-Ratings-Enriched.csv`
- **Total Records**: **10,538 books**
- **Original Attributes**: `Title`, `Author`, `Score`, `Ratings`, `Shelvings`, `Published`, `Description`, `Image`
- **Enriched / Derived Features**: `Genre`, `Subgenre`, `Mood`, `ReadingLevel`, `AgeGroup`, `Themes`, `Keywords`, `Length`, `Availability`

> **Academic Note**: `Length` and `Availability` are simulated derived fields for academic prototype evaluation and do not reflect live physical library circulation systems.

---

## 6. Intelligent Agent Specification (PEAS)

| Component | Description |
|:---|:---|
| **Performance Measure (P)** | Recommendation relevance, preference satisfaction, reasoning correctness, score quality, explanation transparency |
| **Environment (E)** | Digital library catalog + 10,538-book Knowledge Base + user preference state |
| **Actuators (A)** | Top 5 recommendation lists, reasoning chains, Hill Climbing traces, search results, study schedules |
| **Sensors (S)** | Genre, mood, reading level, age group, length, theme, keyword, minimum rating, search queries |

---

## 7. Knowledge Representation

Books and preferences are represented as structured First-Order Logic (FOL) facts:

```text
Book(B00001)
Genre(B00001, "Thriller")
Mood(B00001, "Suspenseful")
Theme(B00001, "Crime")
Rating(B00001, 4.16)
ReadingLevel(B00001, "Intermediate")
```

Representative FOL Inference Rules:
```text
Book(x) ∧ Genre(x, Horror) → HorrorBook(x)
Book(x) ∧ Rating(x, r) ∧ r ≥ 4.0 → HighlyRatedBook(x)
HorrorBook(x) ∧ Mood(x, Suspenseful) → AtmosphericThriller(x)
```

---

## 8. Rule-Based System & Inference Engine

LibraAI incorporates 17 domain-specific IF–THEN inference rules covering genre, mood, reading level, age group, themes, keywords, interest families, popularity, and publication eras.

### 8.1 Forward Chaining (Data-Driven)
Begins with asserted user preference facts, iteratively fires matching rules, asserts derived conclusions (e.g., `GenreMatch`, `MoodMatch`, `HighPopularity`), and collects matching candidate books until no new facts can be deduced.

### 8.2 Backward Chaining (Goal-Driven)
Begins with the recommendation goal `Recommend(Book)` and systematically proves required subgoals (Genre → Mood → Level → Theme → Rating → Availability) against catalog facts to establish recommendation eligibility.

---

## 9. Recommendation Scoring Objective Function

Candidates are scored dynamically using the following weighted objective function:

$$\text{Score} = (\text{GenreMatch} \times 4) + (\text{InterestMatch} \times 4) + (\text{MoodMatch} \times 2) + (\text{LevelMatch} \times 2) + (\text{ThemeMatch} \times 2) + (\text{AgeMatch} \times 1) + (\text{KeywordMatch} \times 1) + (\text{RatingMatch} \times 1) + (\text{PublicationMatch} \times 1) + (\text{PopularityMatch} \times 1) + (\text{AvailabilityMatch} \times 1)$$

- **Maximum Possible Score**: 20 points
- Scores are computed dynamically on demand (never pre-baked into the database).

---

## 10. Hill Climbing Search Optimization

### 10.1 Algorithm Concept
Hill Climbing is an iterative local search optimization technique. Beginning at an initial candidate book state, it evaluates neighboring candidates and transitions strictly to a neighbor with a strictly higher recommendation evaluation score. When all neighbors have equal or lower scores, the algorithm halts at a local optimum.

### 10.2 Semantic Definition of a Neighboring Book
**Adjacent CSV rows are strictly NOT neighbors.** Two books are defined as neighbors if and only if they share genuine catalog and semantic affinities:
- **Shared Author**: $+3.0$ affinity
- **Shared Specific Subgenre**: $+2.5$ affinity
- **Same Genre AND Same Mood**: $+2.5$ affinity
- **Shared Themes**: $+2.0$ per shared theme
- **Shared Keywords**: $+0.8$ per shared keyword
- **Same Reading Level**: $+0.5$ supplementary affinity

Two books qualify as valid neighbors if $\text{Affinity Score} \ge 1.5$. A book's active neighborhood is bounded to its top 8–10 closest neighbors, forming a realistic discrete search space.

### 10.3 Random-Restart Hill Climbing
To avoid entrapment in sub-optimal local peaks:
1. Selects 5–10 distinct starting points (default: 8 restarts) distributed across different catalog clusters and score tiers.
2. Executes independent uphill climbs from each start point, capturing full transition traces.
3. Collects, deduplicates, and ranks unique local optima by recommendation score.
4. Returns the Top 5 unique recommendations with fired rule explanations.

---

## 11. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               React 19 + Vite Frontend                 │
│  (Sanctuary Dashboard, 3D Bookshelf, Telemetry HUD)    │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON (Proxy /api)
┌──────────────────────────▼─────────────────────────────┐
│                 Flask RESTful API                      │
│       (Endpoints for search, meta, inference)          │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                   AI Engine Core                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Knowledge Base (10,538 Books, FOL Facts)         │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 17 Rule-Based Inference Engine (FC / BC)         │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Recommendation Scoring Function (Max 20 Pts)     │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Random-Restart Hill Climbing (Semantic Graph)    │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 12. Frontend Features

The frontend is built with React 19, React Router 7, and custom Vanilla CSS following an Oxford Blue Dark theme:

1. **Home**: Top recommended showcases, live catalog statistics, and quick-start preference chips.
2. **AI Recommendations**: Interactive preference selector (Genre, Mood, Theme, Level, Rating, Method, Restarts) producing Top 5 books with explainable reasoning chains and search paths.
3. **AI Reasoning**: Detailed inspection of asserted facts, fired rules, candidate scoring breakdowns, and step-by-step Hill Climbing restart traces.
4. **My Library**:
   - Central reading headquarters with 4 interactive shelf hubs: *Currently Reading*, *Saved Wishlist*, *Completed Milestones*, and *Recently Viewed*.
   - **View Modes**: Modern Grid View, Cozy **Virtual 3D Bookshelf** (books standing upright on an illuminated mahogany shelf with realistic drop shadows and hover tilt), and Compact Editorial List.
   - Integrated Reading HUD with progress bars and chapter session management.
5. **Saved Favorites**:
   - Curated personal wishlist with dynamic genre affinity filter chips.
   - Multi-criteria sorting (Recently Saved, Rating ★, Alphabetical).
   - One-click actions to start reading or explore similar titles.
6. **Platform Analysis** (Zero Emojis):
   - Executive telemetry dashboard with clean SVG vector graphics.
   - Real-time catalog interaction metrics, genre/mood distribution bar charts.
   - Reading schedule velocity monitor and AI inference engine quality metrics.
   - Real-time activity audit trail.
7. **Study Companion**: Day-by-day reading schedule generator with daily chapter targets and milestone celebration.
8. **Similar Books**: Semantic neighbor explorer displaying affinity match percentages based on author, subgenre, and themes.
9. **Book Search & Catalog**: Fast filtering and keyword search across 10,538 titles.
10. **PEAS & How AI Works**: Academic documentation pages detailing agent architecture, FOL rules, and algorithmic workflows.

---

## 13. Backend Modules (`backend/ai/`)

- `knowledge_base.py`: Loads the enriched CSV, provides FOL fact extraction, multi-field filtering, search, and semantic neighbor discovery.
- `rules.py`: Contains the 17 IF–THEN domain rules and forward/backward chaining rule evaluators.
- `scoring.py`: Implements the 11-attribute recommendation objective function and candidate scoring logic.
- `hill_climbing.py`: Implements semantic neighborhood affinity computation, local search climbs, and Random-Restart Hill Climbing.
- `inference.py`: Coordinates the end-to-end pipeline: facts → chaining → candidate pruning → scoring → Hill Climbing → Top 5 ranking.

---

## 14. API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Health check returning status and total loaded books |
| `GET` | `/api/books` | Paginated books with multi-attribute filtering |
| `GET` | `/api/books/<id>` | Single book detail with FOL facts and similar titles |
| `GET` | `/api/similar/<id>` | Top semantic neighbors with affinity scores |
| `GET` | `/api/search?q=` | Keyword search across titles, authors, and genres |
| `GET` | `/api/meta` | Unique genres, subgenres, moods, themes, and reading levels |
| `GET` | `/api/rules` | Complete list of public inference rules and FOL examples |
| `GET` | `/api/peas` | PEAS model specification |
| `GET` | `/api/knowledge-base` | Knowledge tree taxonomy and sample book facts |
| `POST` | `/api/recommend` | Runs full inference pipeline (Chaining + Scoring + Hill Climbing) |
| `POST` | `/api/backward-chain` | Goal-driven verification for candidate books |
| `POST` | `/api/hill-climb` | Standalone Hill Climbing search execution |

---

## 15. Testing & Verification

Run the comprehensive automated test suite:

```bash
cd backend
python tests/test_inference.py
```

The test suite validates:
- Knowledge Base loading (10,538 books)
- Dynamic scoring correctness
- Strict uphill transitions in Hill Climbing
- Graceful termination on plateaus or isolated books
- Random-restart deduplication
- 5 real-world scenario tests (Horror/Suspense, AI/Tech, Beginner Programming, Fantasy Adventure, Psychology)

---

## 16. How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ (tested with Node 24)

### 1. Start the Backend API
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*API runs at:* `http://127.0.0.1:5000`

### 2. Start the Frontend UI
```bash
cd frontend
npm install
npm run dev
```
*UI runs at:* `http://localhost:5173`

*(Vite automatically proxies `/api` calls to the Flask backend on port 5000).*

---

## 17. Demo / Viva Guide

1. **Intelligent Agent & PEAS**: Open **How AI Works** and **PEAS** to demonstrate the formal agent definition.
2. **AI Recommendations**:
   - Navigate to **Get Recommendations**.
   - Select: Genre = `Horror`, Mood = `Suspenseful`, Reading Level = `Intermediate`, Min Rating = `4.0`.
   - Toggle **Forward Chaining** and **Hill Climbing (8 Restarts)**.
   - Click **Run Recommendations**.
3. **AI Reasoning Walkthrough**:
   - Inspect the **AI Reasoning** tab to demonstrate:
     - Fact assertions (`Genre(x, Horror)`, `Rating(x, r) ≥ 4.0`).
     - Fired IF–THEN rules with explanations.
     - Candidate score evaluations (out of 20).
     - Hill Climbing restart traces showing uphill score progression.
4. **My Library & 3D Bookshelf**:
   - Open **My Library** to demonstrate the 4 shelf hubs (*Currently Reading*, *Saved*, *Completed*, *Recently Viewed*).
   - Switch between **Grid View**, **Bookshelf View** (3D upright shelf with hover tilt), and **List View**.
5. **Platform Analysis**:
   - Navigate to **Platform Analysis** to show live system telemetry, genre distribution charts, reading pace velocity, and the real-time activity log.
6. **Contrast with Plain Search**:
   - Show **Book Search** (plain textual retrieval) vs. **AI Recommendations** (reasoning + scoring + local search optimization).
