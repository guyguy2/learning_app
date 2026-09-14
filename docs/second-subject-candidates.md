# Second Proof Subject Candidates — Engine Generalization Assessment

> **Status:** July 2026 design document, superseded by the subject contract in
> [`src/subjects/README.md`](../src/subjects/README.md). Kept for history; it does not
> describe the current code.

**Status:** Decision Proposal  
**Target File:** `docs/second-subject-candidates.md`  
**Baseline Proof:** Spanish (Vocab + Regular Present-Tense Conjugation)

---

## 1. Executive Summary & Purpose

The `learning_app` engine was initially implemented and validated against **Spanish** (vocabulary + regular present-tense `-ar`/`-er`/`-ir` verb conjugation). Spanish served as an initial proof of concept to demonstrate that cognitive science techniques from *The Programmer's Brain*—such as chunking, notional machines, role-tagging, misconception repair, and calendar-driven spaced repetition—could be applied outside programming.

To prove that the pedagogy engine is truly **subject-agnostic** (and not hardcoded to natural language grammar or Spanish-specific data schemas), we require a **second proof subject**. 

This document evaluates **three candidate subjects** across distinct domains:
1. **Basic SQL Querying** (Declarative Database Logic & Query Execution Order)
2. **Music Theory** (Diatonic Triads, Key Signatures & Roman Numeral Analysis)
3. **Double-Entry Bookkeeping** (Financial Accounting, Debits/Credits & T-Accounts)

Each candidate is evaluated against:
* **Cognitive Technique Alignment**: Coverage of chunking, notional machine, roles/role-tagging, misconceptions/false cognates, and spaced repetition.
* **Exercise Type Mapping**: Compatibility with existing recognition, production (I-do/We-do/You-do), and role-tagging engines.
* **Estimated Content Volume**: Atomic facts, chunk breakdown, worked examples, and misconception seeds required.
* **Implementation & Pedagogical Risks**: Technical friction, UI requirements, or content modeling edge cases.

---

## 2. Candidate Subject Evaluation

### Candidate 1: Basic SQL Querying (Declarative Database Queries)

#### Domain & Scope
Introductory relational database querying covering `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `HAVING`, and `ORDER BY`. Scope is restricted to basic single-table and 2-table inner join queries (no window functions, subqueries, or complex mutations).

#### Cognitive Techniques Exercised
* **Chunking**: Query clause patterns grouped by logical task (e.g., Projection & Filtering chunk, Aggregation & Grouping chunk, Join Association chunk) rather than memorizing individual syntax keywords in isolation.
* **Notional Machine**: **SQL Logical Query Processing Execution Order**. Learners are explicitly taught the underlying execution engine sequence: `FROM` $\rightarrow$ `ON` $\rightarrow$ `JOIN` $\rightarrow$ `WHERE` $\rightarrow$ `GROUP BY` $\rightarrow$ `HAVING` $\rightarrow$ `SELECT` $\rightarrow$ `DISTINCT` $\rightarrow$ `ORDER BY`. This contrasts sharply with written clause order (`SELECT ... FROM ... WHERE`).
* **Roles / Role-Tagging**: Structural query tokens tagged by their operational role:
  * *Source Table* (`FROM users`)
  * *Filter Predicate* (`WHERE status = 'active'`)
  * *Grouping Key* (`GROUP BY country`)
  * *Aggregate Function* (`COUNT(id)`)
  * *Projection Target* (`SELECT name, email`)
  * *Sort Criterion* (`ORDER BY created_at DESC`)
* **Misconceptions & False-Cognates**:
  * *`NULL` Comparison Trap*: Using `WHERE col = NULL` instead of `WHERE col IS NULL` (false cognate with equality operators).
  * *`WHERE` vs. `HAVING` Overgeneralization*: Using `WHERE` to filter aggregate results (e.g., `WHERE COUNT(*) > 5`).
  * *Written vs. Execution Order Trap*: Believing `SELECT` executes first and trying to use `SELECT` column aliases inside `WHERE` clauses.
  * *`COUNT(*)` vs. `COUNT(col)`*: Assuming `COUNT(col)` includes `NULL` values.
* **Spaced Repetition**: Retention ladder applied to SQL keywords, operator precedence, and aggregate behavior rules, while schema table/column names recur as ingredients in query drills.

#### Mapping onto Existing 3 Exercise Types
* **Recognition**: Match SQL clause patterns or operators to visual table outputs or semantic goals (e.g., "Which query filters rows before grouping?").
* **Production (I-do / We-do / You-do)**:
  * *I-do (Worked Example)*: Step-by-step trace of SQL execution order showing table transformations at each stage (`FROM` $\rightarrow$ `WHERE` $\rightarrow$ `GROUP BY` $\rightarrow$ `SELECT`).
  * *We-do (Guided Practice)*: Fill-in query completion with clause hints (e.g., `Select stem: "WHERE age >= ", ending for group filter: "HAVING COUNT(*) > "`).
  * *You-do (Independent Recall)*: Free-form SQL clause production given a target data output prompt.
* **Role-Tagging**: Given a full SQL query string, tag token segments into *Source*, *Filter*, *Grouping Key*, *Aggregate*, or *Projection*.

#### Estimated Content Volume
* **Vocab/Atomic Facts**: ~35 items (table schemas, SQL keywords, operators like `LIKE`, `IN`, `BETWEEN`, `IS NULL`).
* **Chunks**: 3 chunks (`filtering_projection`, `aggregation_grouping`, `inner_joins`).
* **Worked Examples**: 3 worked examples (one per chunk).
* **Misconceptions & Distractors**: 15 misconception seeds with ~25 matching distractors.

#### Risks
* **String Matching Sensitivity**: SQL allows variable whitespace and case. Engine must normalize strings (e.g., lowercasing keywords, trimming whitespace) before comparing produced queries against expected forms.
* **Over-complexity in v1**: Must strictly limit query complexity to prevent explosion of valid alternative SQL formulations (e.g., enforcing canonical clause structures).

---

### Candidate 2: Music Theory (Diatonic Triads & Roman Numeral Analysis)

#### Domain & Scope
Western tonal music theory focusing on key signatures, major/minor/diminished diatonic triads, and Roman numeral harmonic analysis (`I`, `ii`, `iii`, `IV`, `V`, `vi`, `vii°`).

#### Cognitive Techniques Exercised
* **Chunking**: Stacking intervals into reusable chord chunks (Root + 3rd + 5th) and progression patterns (e.g., `ii` $\rightarrow$ `V` $\rightarrow$ `I` cadence) rather than analyzing isolated notes.
* **Notional Machine**: **Diatonic Scale & Triad Stacking Rules**. The major scale interval formula ($W\text{-}W\text{-}H\text{-}W\text{-}W\text{-}W\text{-}H$) and major vs. minor 3rd interval stacking ($4\text{ semitones} + 3\text{ semitones} = \text{Major Triad}$; $3 + 4 = \text{Minor Triad}$; $3 + 3 = \text{Diminished Triad}$).
* **Roles / Role-Tagging**: Structural note and harmonic roles:
  * *Chord Root* (foundation note)
  * *Third* (determines major/minor quality)
  * *Fifth* (determines stability/diminished quality)
  * *Harmonic Function* (Tonic [`I`], Subdominant [`IV`], Dominant [`V`])
* **Misconceptions & False-Cognates**:
  * *Enharmonic False Cognates*: Confusing $E\sharp$ with $F$ or $C\flat$ with $B$ in key signature spelling.
  * *Quality Overgeneralization*: Assuming `vii°` is a standard minor chord rather than diminished ($3+3$ semitones).
  * *Accidental Accumulation*: Over-applying key signature sharps/flats when spelling accidental modifications.
* **Spaced Repetition**: Key signature accidental counts (e.g., G Major = 1 sharp, A Major = 3 sharps) and interval distances tracked via calendar review ladder.

#### Mapping onto Existing 3 Exercise Types
* **Recognition**: Identify chord quality (Major, Minor, Diminished) or Roman numeral from a note triad string (e.g., `C - E - G` $\rightarrow$ `I / C Major`).
* **Production (I-do / We-do / You-do)**:
  * *I-do (Worked Example)*: Visual breakdown of building a triad step-by-step from Root $\rightarrow$ Add 3rd $\rightarrow$ Add 5th.
  * *We-do (Guided Practice)*: Spell a triad given the root with interval hints (e.g., "Root is C. Major 3rd is E. Minor 3rd above E is _").
  * *You-do (Independent Recall)*: Type or select the 3 notes for a requested Roman numeral in a specific key.
* **Role-Tagging**: Label notes in a triad as *Root*, *3rd*, or *5th*, or tag chords in a progression as *Tonic*, *Predominant*, or *Dominant*.

#### Estimated Content Volume
* **Vocab/Atomic Facts**: ~40 items (note names, interval names, key signatures).
* **Chunks**: 3 chunks (`major_triads`, `minor_triads`, `diminished_triads`).
* **Worked Examples**: 3 worked examples.
* **Misconceptions & Distractors**: 12 misconception seeds with ~20 distractors.

#### Risks
* **UI Expectations**: Learners might expect audio playback or stave notation. Keeping the app pure text/keyboard (e.g. `C - E - G`) avoids scope creep but may feel less engaging.
* **Enharmonic Equivalence**: Multiple text representations for identical pitches (e.g., `F#` vs `Gb`) require strict spelling rules tied to diatonic keys.

---

### Candidate 3: Double-Entry Bookkeeping (Financial Accounting & T-Accounts)

#### Domain & Scope
Basic financial accounting: recording transactions in T-Accounts, normal balances, account classification (Assets, Liabilities, Equity, Revenue, Expenses), and maintaining the Accounting Equation.

#### Cognitive Techniques Exercised
* **Chunking**: Transaction templates (e.g., *Cash Purchase of Supplies* = Asset up, Asset down; *Credit Sale* = Asset up, Revenue up) chunked as single financial events.
* **Notional Machine**: **The Accounting Equation & Debit/Credit Conservation Rule**. $\text{Assets} = \text{Liabilities} + \text{Equity}$. Every transaction must keep the equation in balance. Debit/Credit side rules follow the **DEALER** mnemonic (Debits increase **D**raw, **E**xpenses, **A**ssets; Credits increase **L**iabilities, **E**quity, **R**evenue).
* **Roles / Role-Tagging**: Elements of a journal entry tagged by accounting role:
  * *Debit Account* (receiving value / asset increase)
  * *Credit Account* (providing value / liability increase)
  * *Account Category* (Asset, Liability, Equity, Revenue, Expense)
  * *Transaction Amount* (conserved monetary quantity)
* **Misconceptions & False-Cognates**:
  * *Everyday Language False Cognate*: Assuming "Debit" means decrease/bad and "Credit" means increase/good (confusing bank debit cards with accounting debits).
  * *Expense vs. Liability Overgeneralization*: Conflating an Expense (reduction in equity) with a Liability (an unpaid obligation/debt owed).
  * *Unbalanced Entry Error*: Entering unequal Debit and Credit values.
  * *Prepaid Asset Misclassification*: Treating Prepaid Rent as an Expense immediately rather than an Asset.
* **Spaced Repetition**: Normal balance directions and account type classifications reviewed via calendar intervals.

#### Mapping onto Existing 3 Exercise Types
* **Recognition**: Match transactions or accounts to their category (Asset/Liability/etc.) and normal balance side (Debit vs. Credit).
* **Production (I-do / We-do / You-do)**:
  * *I-do (Worked Example)*: Show a transaction scenario breakdown with T-Accounts balancing total Debits and Credits.
  * *We-do (Guided Practice)*: Complete a journal entry with side hints (e.g., "Debited: Cash (Asset +), Credited: _ (Revenue +)").
  * *You-do (Independent Recall)*: Record the full 2-line journal entry for a business scenario.
* **Role-Tagging**: Tag parts of a business transaction into *Debit Account*, *Credit Account*, *Account Category*, and *Amount*.

#### Estimated Content Volume
* **Vocab/Atomic Facts**: ~30 items (standard accounts: Cash, Accounts Receivable, Inventory, Equipment, Accounts Payable, Capital, Sales Revenue, Rent Expense).
* **Chunks**: 3 chunks (`asset_expense_transactions`, `liability_revenue_transactions`, `equity_adjustment_transactions`).
* **Worked Examples**: 3 worked examples.
* **Misconceptions & Distractors**: 14 misconception seeds with ~22 distractors.

#### Risks
* **Scenario Wordiness**: Accounting transaction prompts can become text-heavy, increasing extraneous cognitive load if not carefully formatted.
* **Multi-line Entries**: Real accounting includes multi-credit/multi-debit entries. Scope must be strictly locked to 2-line entries (1 Debit, 1 Credit) for v1 proof.

---

## 3. Comparative Matrix

| Feature / Criteria | Candidate 1: Basic SQL | Candidate 2: Music Theory | Candidate 3: Double-Entry Bookkeeping |
| :--- | :--- | :--- | :--- |
| **Domain Type** | Declarative Programming / Data Logic | Non-Technical Symbolic Formal System | Applied Business / Conserved Quantity Rule System |
| **Notional Machine Depth** | **Very High** (Logical Query Processing execution order vs written order) | **High** (Diatonic scale & semitone interval stacking) | **High** (Accounting Equation balance & DEALER debit/credit rules) |
| **Role-Tagging Fit** | **Exact** (`Source`, `Filter`, `Group`, `Aggregate`, `Projection`) | **Exact** (`Root`, `3rd`, `5th`, `Tonic/Dominant Function`) | **Exact** (`Debit Account`, `Credit Account`, `Category`, `Amount`) |
| **Misconception Richness** | **Extremely Rich** (`NULL` comparison, `WHERE` vs `HAVING`, execution order) | **Rich** (Enharmonic traps, major/minor/diminished quality traps) | **Extremely Rich** (Everyday "debit/credit" false cognate, expense vs liability) |
| **Exercise Mapping Friction** | **Zero** (Maps 1:1 onto Recognition, Production, Role-Tagging) | **Low** (Needs strict string note formatting rules) | **Zero** (Maps 1:1 onto 2-line journal entries) |
| **Engine Generalization Proof** | Proves engine works on non-imperative query code | Proves engine works outside software/computing entirely | Proves engine works on quantitative rule-based business logic |
| **Content Authoring Effort** | Low (~35 facts, 3 chunks) | Low (~40 facts, 3 chunks) | Low (~30 facts, 3 chunks) |

---

## 4. Recommendation & Justification

### Recommended Subject: **Basic SQL Querying**

While all three candidate subjects map onto the engine's cognitive model, **Basic SQL Querying** is recommended as the **primary second proof subject**.

#### Key Rationale:
1. **Strongest Notional Machine Demonstration**: SQL's **Logical Query Processing Order** (`FROM` $\rightarrow$ `WHERE` $\rightarrow$ `GROUP BY` $\rightarrow$ `HAVING` $\rightarrow$ `SELECT` $\rightarrow$ `ORDER BY`) is one of the most classic, high-value notional machines in computer science education. It cleanly tests whether the engine's worked example (I-do), guided hint (We-do), and misconception repair mechanics can teach mental models of execution order.
2. **Flawless 1:1 Engine Mapping**: SQL queries break down perfectly into the existing 3 exercise types without needing any engine schema modifications:
   * **Recognition**: Keyword and clause purpose matching.
   * **Production**: Clause construction using mastered table/column facts.
   * **Role-Tagging**: Tagging query tokens into operational roles (`Source`, `Filter`, `Group`, `Aggregate`, `Projection`).
3. **Pristine Misconception Catalog**: SQL has exceptionally clean, well-defined misconceptions (`col = NULL`, `WHERE` vs `HAVING`, alias usage in `WHERE`) that allow seeded distractor detection to shine.
4. **Validates Non-Imperative Generalization**: Spanish proved the engine on natural language grammar (stem + ending swap). SQL proves the engine on declarative code logic. Together, they confirm that the engine is genuinely subject-agnostic.

*(Secondary recommendation if a non-computing domain is strictly preferred: **Double-Entry Bookkeeping**, which shares the exact same zero-friction engine mapping).*

---

## 5. Proposed Directory & Content Structure

Following the layout used by `content/spanish/`, the SQL content will be authored as static JSON files under `content/sql/`:

```
content/sql/
  ├── vocab.json          # Table schemas, column names, SQL keywords & operators
  ├── worked_examples.json # Step-by-step SQL logical execution order paradigms
  ├── misconceptions.json  # Catalog of SQL misconceptions (NULL traps, WHERE vs HAVING, etc.)
  └── distractors.json     # Seeded wrong query answers mapped to specific misconception IDs
```

### Next Steps for Implementation
1. Finalize authoring of `content/sql/*.json` content files.
2. Update dataset selector / engine config to allow switching between `spanish` and `sql`.
3. Run test suite (`npm test`) against SQL content pool to verify engine assertions (advancement gating, misconception mapping, review ladder).
