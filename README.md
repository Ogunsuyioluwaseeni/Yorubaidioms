# YorùbáÒwe (Yorùbá ↔ English Idiom & Proverb Translator)

**YorùbáÒwe** is a bidirectional Yorùbá ↔ English idiom and proverb translation tool built on a four-layer architecture proposed in computational linguistics research ("Development of a Yorùbá Idiom-to-English and English-to-Yorùbá Text Translation System").

Unlike general-purpose machine translation tools that translate text compositionally (word-for-word), **YorùbáÒwe** targets idiomatic and proverbial expressions (Yorùbá *"òwe"*) by matching input text against an indexed bidirectional lexicon, disambiguating usage context, and returning both literal glosses and figurative meanings side-by-side.

---

## 🏗️ Four-Layer Architecture

1. **Presentation Layer (Client - React 19 + Vite + Tailwind CSS)**:
   - Interactive source language toggle (Yorùbá → English / English → Yorùbá).
   - Yorùbá virtual keyboard palette with tone diacritics (`á, à, ã, ẹ, ẹ̀, ọ, ọ̀, ṣ, ń, ǹ`).
   - Matched idiom span highlighting in the original input.
   - Side-by-side display of **Literal Gloss** vs **Figurative Sense**.
   - Distinct visual confidence indicators (**Idiom match** vs **Literal fallback**).
   - Curator Dashboard for inspecting fallback logs and adding/editing lexicon entries.

2. **Application Layer (Server - Node.js + Express.js + TypeScript)**:
   - `POST /api/translate`: Main translation route.
   - `GET /api/lexicon`: Paginated, searchable lexicon repository listing.
   - `POST /api/lexicon`: Add a new entry (curator function).
   - `PUT /api/lexicon/:id`: Edit an existing entry.
   - `GET /api/flagged`: Fetch logged low-confidence/fallback translations.
   - Input sanitization & centralized JSON error middleware.

3. **Idiom Translation Engine (Core Logic Layer)**:
   - **(a) Segmentation & Idiom Spotting**: Sliding window candidate span generator (2–12 tokens) with diacritic-tolerant, case-insensitive Yorùbá normalisation.
   - **(b) Bidirectional Idiom Lexicon**: Indexed lookup by canonical Yorùbá form and English equivalents.
   - **(c) Context-Aware Disambiguation**:
     - Rule-based first pass evaluating surrounding literal keywords vs proverbial discourse markers.
     - Pluggable, feature-flagged second pass `disambiguateWithLLM()` using `@google/genai` Gemini API.
   - **(d) Fallback & Generation**: Word-level dictionary translation fallback for non-idiom spans with confidence tracing and translation logging to `translationLog.json`.

4. **Data Layer**:
   - `src/data/lexicon.json`: Seeded with starter Yorùbá proverbs/idioms.
   - `src/data/translationLog.json`: File-backed translation logs for curator review.

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Development
```bash
# Install dependencies
npm install

# Run unit tests
npm test

# Start full-stack development server (Express + Vite on port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## ⚙️ Enabling/Disabling LLM Disambiguation

The core idiom translation engine operates standalone without any external API calls.

To enable the optional Gemini API pass for context disambiguation:

1. Open or create `.env`:
   ```env
   ENABLE_LLM_DISAMBIGUATION="true"
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```
2. Restart the dev server (`npm run dev`).
3. When enabled, `disambiguateWithLLM()` will invoke Gemini 2.5 Flash only when checking if an idiom is used figuratively in context. If disabled (`ENABLE_LLM_DISAMBIGUATION="false"`), the system relies purely on rule-based heuristics.

---

## ✍️ Adding or Editing Lexicon Entries

### Method 1: Curator Dashboard (UI)
1. Navigate to the **Curator Dashboard** or **Lexicon** tab in the web UI.
2. Click **Add Entry** or **Curate into Lexicon** on any logged fallback query.
3. Fill in the required fields:
   - **Yorùbá Text**: Canonical Yorùbá form with tone marks (e.g., `Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de`).
   - **Literal Gloss**: Word-for-word English gloss.
   - **Figurative Sense**: Plain-English meaning.
   - **English Equivalents**: Ranked best-fit English idioms (comma-separated).
   - **Register**, **Usage Note**, **Is Proverb**, **Source Note**, **Native Speaker Verification**.
4. Click **Save Lexicon Entry**.

### Method 2: Directly in `src/data/lexicon.json`
Entries follow this schema:
```json
{
  "id": "yowe-014",
  "yoruba": "Ilé la ti ń kọ́ ẹ̀ṣọ́ rẹ̀ wọ̀de",
  "literalGloss": "It is from home that we wear good character to go outside",
  "figurativeSense": "Good character and discipline begin within the family",
  "englishEquivalents": [
    "Charity begins at home",
    "Manners begin at home"
  ],
  "register": "proverbial",
  "usageNote": "Used when reminding someone that discipline starts at home.",
  "isProverb": true,
  "sourceNote": "Native speaker collection",
  "verified": true
}
```

---

## ⚠️ Linguistic Notice & Disclaimer

The starter seed data included in `src/data/lexicon.json` is a placeholder dataset provided solely to demonstrate end-to-end prototype functionality. All seed entries are marked `"verified": false`. Full linguistic and native-speaker review is required before deploying this system for production, research publication, or educational use.
