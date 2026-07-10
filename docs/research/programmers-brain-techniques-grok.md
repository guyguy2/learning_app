# Catalog: Learning / Cognition Techniques from *The Programmer's Brain*

Foundational research input for a personal, subject-agnostic web learning app whose pedagogy is grounded in techniques from Felienne Hermans, *The Programmer's Brain: What every programmer needs to know about cognition* (Manning, 2021). For each technique: (1) the underlying claim about how people learn, (2) a subject-agnostic operationalization as an app feature/mechanic, and (3) evidence on cadence, frequency, or thresholds for scheduling.

**Primary-source priority.** Claims are traced to Hermans (book structure, Manning liveBook/excerpts, her writing), Sajaniemi (variable roles), Sweller (cognitive load theory), and classical memory/learning research the book draws on. Where the full book text was not directly accessible, detailed secondary notes that closely track the book structure are used and marked as secondary.

---

## 1. Working memory limits (capacity and decay)

### 1.1 Claim / mechanism

Hermans models three collaborating cognitive processes when coding: **long-term memory (LTM)**, **short-term memory (STM)**, and **working memory**. Confusion maps to them: lack of knowledge → LTM; lack of information → STM; lack of processing power → working memory ([Manning liveBook ch. 1 TOC](https://livebook.manning.com/book/the-programmers-brain/chapter-1); [Manning product FAQ](https://www.manning.com/books/the-programmers-brain)).

Analogies Hermans uses (widely reported from the book):

| Process | Role | Computer analogy |
| --- | --- | --- |
| LTM | Stores facts, syntax, patterns, domain knowledge over long periods | Hard drive |
| STM | Briefly holds incoming information | RAM / cache |
| Working memory | Where thinking, problem-solving, and mental execution happen | Processor |

**Capacity claims Hermans relays (via secondary book notes):**

- STM holds only a few items, classically **7 ± 2** (Miller, 1956), with later research suggesting **about 2–6** items; not more than about a dozen ([secondary: Yoan Thirion notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain); [secondary: understandlegacycode summary](https://understandlegacycode.com/blog/key-points-of-programmer-brain/)).
- STM **decays in roughly ~30 seconds** without rehearsal (secondary book notes; same sources).
- Working memory is similarly limited to processing **about 2–6 things at a time**; when that limit is exceeded, learners experience overload and often need external aids (state tables, notes) ([Manning FAQ on working memory](https://www.manning.com/books/the-programmers-brain); secondary notes).

Miller's original paper established the 7±2 short-term capacity bound ([Miller, *Psychological Review*, 1956](https://doi.org/10.1037/h0043158)). Modern working-memory research often cites lower effective capacity for concurrent processing; Hermans leans on the tighter 2–6 range when discussing cognitive load.

**Sign of overload:** feeling the need to write intermediate values down while tracing material is a signal that working memory is full ([secondary book notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain)).

### 1.2 Subject-agnostic app operationalization

- **Load meter / "how hard is this?" prompt** after each item: self-report of mental effort (Paas 9-point scale: very, very low → very high mental effort; used in Hermans' cognitive-load discussion via secondary notes). Use as a signal to simplify presentation or insert an external-aid step.
- **External working-memory scaffolds:** scratchpad, state table (rows = steps, columns = key entities), and dependency/relationship graph that the learner fills while solving. Offer these automatically when nesting/depth exceeds a threshold, or when the learner marks "too many things to juggle."
- **Item complexity budgeting:** tag each problem by number of simultaneous "elements" (entities + relations + novel terms). Cap concurrent novel elements in a session near the 2–6 range for novices.
- **Timeout / re-expose:** if a multi-part problem spans more than ~30s of uninterrupted hold of un-chunked facts, re-display those facts rather than assuming they stay in STM.

### 1.3 Cadence / conditions

| Signal | Implication for scheduling |
| --- | --- |
| Capacity ~2–6 concurrent elements | Prefer short steps; split multi-hop reasoning into sequenced micro-tasks |
| STM ~30s decay | Keep critical facts visible; do not force pure hold across long interruptions |
| Need for external notes | Trigger scaffold UI; do not treat as failure—treat as load management |
| After interruption (~15–20 min to resume deep work; Parnin, cited in book via secondary notes) | On return, re-surface last subgoal, open scratchpad, and last unfinished step |

---

## 2. Long-term memory vs short-term memory, and movement between them

### 2.1 Claim / mechanism

Hermans frames LTM as durable knowledge store and STM as brief holding area. Information flows: sensory input → STM → working memory, where it is combined with retrieved LTM content for thinking ([Manning ch. 1](https://livebook.manning.com/book/the-programmers-brain/chapter-1); secondary notes).

Key mechanisms for **getting knowledge into LTM** (ch. 3 of the book: flashcards, spaced repetition, retrieval, elaboration):

1. **Encoding:** memories are stored with associations in a network, not as isolated bits ([secondary book notes on encoding/schemata](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain)).
2. **Forgetting curve:** without practice, LTM decays far faster than people expect; secondary notes of Hermans cite roughly **only ~25% remaining after 2 days** for unreviewed material (Ebbinghaus-style forgetting curve as presented in the book notes—not independently verified here against Hermans' exact citation).
3. **Storage strength vs retrieval strength:** a memory can be well stored yet hard to retrieve ("tip of the tongue"); active retrieval strengthens both ([secondary notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain)).
4. **Elaboration:** connecting new knowledge to existing schemata strengthens encoding.
5. **Schemata (schemas):** organized knowledge structures in LTM that shape how new information is interpreted and stored.

**Without LTM knowledge, STM fills with low-level tokens; with LTM knowledge, the same material collapses into fewer chunks** (see Chunking). Looking things up constantly is costly: it breaks flow and often invites further interruption ([secondary: Ian Hopkinson review](https://ianhopkinson.org.uk/2022/02/book-review-the-programmers-brain-by-felienne-hermans/); [understandlegacycode](https://understandlegacycode.com/blog/key-points-of-programmer-brain/)).

### 2.2 Subject-agnostic app operationalization

- **Capture-to-LTM pipeline:** when the learner looks up a fact (or marks "I don't know this"), offer a one-tap **create flashcard** (prompt on front, answer on back). Hermans recommends adding cards when learning something new *and* when about to search for a concept ([secondary notes ch. 3](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain)).
- **Elaboration prompts:** after introducing a concept, require a short "connect it" step: "How does this relate to X you already know?" or "Give an analogy from another domain."
- **Schema builders:** concept maps linking new items to existing tags/topics the learner already mastered.
- **Distinguish "know of" vs "can retrieve":** separate recognition quizzes (multiple choice) from free-recall quizzes; prefer free recall for strengthening LTM.
- **Tip-of-tongue recovery:** if retrieval fails, show progressive hints rather than full answer immediately (supports retrieval practice before full re-study).

### 2.3 Cadence / conditions

| Practice | Book-aligned cadence (secondary) |
| --- | --- |
| Initial flashcard study | Frequent while building a new topic; "after a few weeks" syntactic vocabulary improves ([secondary notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain)) |
| Maintenance review | Hermans (via secondary notes): **revisiting flashcards about once a month** is enough for long-run retention and is doable |
| Thinning the deck | Keep tallies of correct/incorrect; remove cards that are reliably correct |
| Spacing | Do **not** cram an entire deck in one day; spread study over a longer period |

Broader learning-science backup (not Hermans-primary): Bjork & Bjork's desirable difficulties frame spacing and retrieval as effortful but superior for durable learning ([Bjork & Bjork](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-introducing-desirable-difficulties-into-practice-and-instruction-bjork-and-bjork.pdf)).

---

## 3. Chunking

### 3.1 Claim / mechanism

**Chunking** is how experts overcome STM capacity limits: related elements are grouped into a single higher-level unit that occupies one STM "slot." Hermans builds on de Groot's chess experiments: masters recall meaningful board positions far better than novices, but **not** random illegal positions—showing the advantage is pattern knowledge in LTM, not larger STM ([secondary book notes ch. 2](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain); classic: de Groot; Chase & Simon, 1973).

McKeithen (1981) repeated similar memory tasks with programmers: experts recall meaningful code better than beginners; the gap shrinks for scrambled code ([cited in secondary notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain)).

**Implications Hermans draws:**

- The more relevant LTM knowledge, the larger and more useful the chunks.
- Design patterns, idioms, and conventional names act as chunk labels.
- **Beacons**—meaningful names, structural keywords, high-level comments—help readers recognize which chunk they are looking at ([secondary notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain); [Hopkinson review](https://ianhopkinson.org.uk/2022/02/book-review-the-programmers-brain-by-felienne-hermans/)).
- High-level comments aid chunking; low-level restatements of the next line can burden it.
- Remembering what you can reproduce from short exposure is a **self-diagnosis** of which chunks you already have.

### 3.2 Subject-agnostic app operationalization

- **Pattern library / named chunks:** for any subject, teach named "moves" or "patterns" (e.g., in history: "causes → event → consequences"; in math: "isolate variable"; in language: "claim–evidence–warrant"). Quizzes that flash a worked example and ask "which pattern is this?"
- **Beacon training:** given a short passage, highlight the 2–3 cues that should trigger recognition of the right schema.
- **Reproduction drills:** show material for N seconds/minutes, hide it, ask learner to reconstruct. Score by chunk-level accuracy, not token-level. Use as placement/diagnostic of expertise.
- **Artificial chunking UI:** break long explanations into labeled sections; require the learner to name each section in their own words (forces chunk creation).
- **Mis-chunking detection:** wrong answers that match a *near* pattern (e.g., treating a gatherer-like accumulation as a simple stepper—see roles) trigger a targeted contrast example.

### 3.3 Cadence / conditions

- Chunk training is continuous with expertise building; no single interval is prescribed by Hermans.
- **Diagnostic reproduction** can be used at topic start (baseline) and after deliberate practice blocks.
- Prefer materials that use **consistent structure and conventional labels** so chunks transfer across items.
- Experts benefit from pattern labels; novices may need the pattern **explicitly named** (secondary notes: design patterns help more when the programmer *knows the pattern is present*).

---

## 4. Notional machines (mental models of execution / system behavior)

### 4.1 Claim / mechanism

In ch. 6 Hermans covers **mental models** and **notional machines** as tools for solving problems and reasoning about code ([Manning liveBook ch. 6](https://livebook.manning.com/book/the-programmers-brain/chapter-6)).

- **Mental models:** abstractions held in working memory used to reason about a problem; people can hold multiple competing models.
- **Notional machines:** abstract models of how a computer/system executes programs, used when teaching and reasoning. Hermans discusses examples, levels of notional machines, expanding sets of machines as languages grow, and **conflicts when different machines imply incompatible mental models** (ch. 6 TOC).

**Primary lineage outside Hermans:** du Boulay et al. (1981) coined *notional machine* as "the idealised model of the computer implied by the constructs of the programming language" ([du Boulay, O'Shea & Monk, 1981](https://www.sciencedirect.com/science/article/abs/pii/S0020737381800569); overview in [Fincher et al. ITiCSE 2020 working group](https://dl.acm.org/doi/10.1145/3437800.3439202)). Hermans has also written on forms of notional machines ([felienne.com archive post](https://www.felienne.com/archives/6392)).

Manning FAQ restates Hermans: notional machines and mental models provide abstract representations of execution so programmers can apply familiar schemata to unfamiliar code ([Manning](https://www.manning.com/books/the-programmers-brain)).

### 4.2 Subject-agnostic app operationalization

Generalize "notional machine" to **executable mental models of how a domain system works**:

- **Explicit model cards:** for each topic, a short, consistent "how this works" model (inputs → rules → outputs/state changes). Example: economics supply/demand; biology protein synthesis; law "elements of a claim."
- **Trace-the-model exercises:** give starting state + rule set; learner steps through to final state (generalized state table / cognitive compiling).
- **Multi-level models:** beginner model (black box) → intermediate (main subsystems) → advanced (edge cases). Let the learner choose level; warn when switching levels mid-problem (conflicts).
- **Model conflict drills:** present two models that both seem to fit; ask which prediction each makes; show the discriminating case (addresses ch. 6 "conflicting mental models").
- **Team/shared vocabulary:** for multi-user later, shared names for models (Hermans notes shared mental-model vocabulary eases communication—Manning FAQ).

### 4.3 Cadence / conditions

- Introduce a notional machine **before** or **with** first practice on a mechanism, not only after failure.
- Revisit the same machine when complexity increases (expanding set of machines).
- Schedule **conflict checks** when transferring from one subtopic/system to a similar one (negative transfer risk—see Misconceptions).
- No fixed day-interval in Hermans; condition-driven: new mechanism, new language/system, or unexplained error.

---

## 5. Roles of variables (Sajaniemi's taxonomy)

### 5.1 Claim / mechanism

Hermans (ch. 5) uses **Sajaniemi's roles of variables** as a mid-level schema between "it's a variable" and specific names—improving plan knowledge and chunking of code structure ([secondary notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain); [Hopkinson](https://ianhopkinson.org.uk/2022/02/book-review-the-programmers-brain-by-felienne-hermans/)).

**Primary source — Jorma Sajaniemi:**

Roles capture the **dynamic behavior** of a variable: the sequence of successive values in relation to other variables and events—not the surface syntax of assignment ([Sajaniemi & Navarro Prieto, PPIG 2005](https://www.ppig.org/files/2005-PPIG-17th-sajaniemi.pdf); [Sajaniemi student materials](http://cs.joensuu.fi/pages/saja/var_roles/stud_vers/stud_Pascal_eng.html)).

Coverage claims from Sajaniemi:

- A small set of roles covers **~99% of variables in novice-level procedural programs** ([PPIG 2005](https://www.ppig.org/files/2005-PPIG-17th-sajaniemi.pdf)).
- Fixed value, stepper, and most-recent holder are among the most common (~70% of variables per Sajaniemi's teaching materials).
- Roles appear in experts' mental groupings of variables (card-sorting study with professional programmers; mean similarity of expert groupings to role criterion = 0.51, significantly above alternatives) ([PPIG 2005](https://www.ppig.org/files/2005-PPIG-17th-sajaniemi.pdf)).
- CS educators can learn the roles in about an hour and assign them with high accuracy in typical cases ([Ben-Ari & Sajaniemi, cited in PPIG 2005](https://www.ppig.org/files/2005-PPIG-17th-sajaniemi.pdf)).
- Teaching with roles can improve comprehension and plan knowledge ([Sajaniemi & Kuittinen work, cited in PPIG 2005 intro](https://www.ppig.org/files/2005-PPIG-17th-sajaniemi.pdf)).

**Role set (Sajaniemi teaching materials / Hermans' 11-role presentation):**

| Role | Informal meaning (Sajaniemi / Hermans) |
| --- | --- |
| Fixed value | Initialized; not changed afterward |
| Stepper | Steps through a systematic, predictable succession |
| Most-recent holder | Latest value from a series or latest input |
| Most-wanted holder | Best / most appropriate value so far (min, max, match) |
| Gatherer | Accumulates effects of individual values (sum, concat, …) |
| Follower | Always takes the old value of another variable |
| One-way flag | Two-valued; once changed, cannot return to initial value |
| Temporary | Held only briefly (swap, intermediate calc) |
| Organizer | Structure rearranged after fill (e.g., sort buffer) |
| Container | Structure where elements are added/removed |
| Walker | Traverses a data structure (path not fully known in advance) |

Note: Sajaniemi's earlier 10-role table uses "Transformation" in some papers; Hermans/teaching materials emphasize the 11-role set including walker/container/flag variants. For the app, treat the Hermans-facing 11-role set as the product vocabulary and cite Sajaniemi as owner of the theory.

**Co-occurrence as plan chunks:** e.g., stepper + most-wanted holder ≈ search; combinations act like design patterns for small algorithms ([secondary notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain)).

### 5.2 Subject-agnostic app operationalization

Roles are programming-specific as stated, but the **mechanic generalizes** to "role labels for stateful entities in a process":

- **Entity-role tagging:** in any worked process (lab protocol, proof, business workflow, historical timeline), label each tracked quantity with a role-like stereotype: *fixed parameter*, *iterator/counter*, *latest observation*, *running best*, *accumulator*, *previous snapshot*, *latched flag*, *scratch*, *reordering buffer*, *collection*, *cursor/walker*.
- **Role quiz:** show a short procedure; ask the learner to assign roles to named quantities. Immediate feedback with co-occurrence patterns ("this is a classic search: stepper + most-wanted").
- **Icon strip:** Hermans suggests icons for roles when annotating code ([secondary notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain))—reuse icon-based tagging in the UI for any domain process.
- **Transfer across subjects:** teach the role vocabulary once; reuse in math (running max), science (control vs measured variables), writing (claim held fixed while evidence accumulates).

### 5.3 Cadence / conditions

- Teach the role set early as a **shared vocabulary** (one focused lesson + practice), then reuse continuously when analyzing procedures.
- Educators reached useful accuracy after ~1 hour of training (Ben-Ari & Sajaniemi, via [PPIG 2005](https://www.ppig.org/files/2005-PPIG-17th-sajaniemi.pdf))—suggests a short onboarding module is enough for the taxonomy itself.
- Use role annotation whenever the learner struggles with "what is this quantity *for*?" rather than on a fixed calendar.
- Expert card-sort similarity to roles was real but imperfect (mean 0.51)—roles are a useful explicit schema, not the only expert criterion.

---

## 6. Cognitive load types: intrinsic, extraneous, germane

### 6.1 Claim / mechanism

Hermans applies **cognitive load theory (CLT)** when discussing complex code and working memory (ch. 4). Working-memory capacity consumed by a task is the cognitive load ([Manning ch. 4 TOC](https://livebook.manning.com/book/the-programmers-brain/chapter-4); secondary notes).

**Primary owner: John Sweller** and colleagues.

Three types (standard CLT triad; Hermans restates in programming terms via secondary notes):

| Type | Definition (CLT) | Hermans-facing programming gloss (secondary) |
| --- | --- | --- |
| **Intrinsic** | Inherent difficulty of the material (element interactivity given prior knowledge) | How complex the problem is by nature; cannot simplify without changing the problem |
| **Extraneous** | Load imposed by poor presentation / unnecessary demands | "Accidental complexity": unfamiliar constructs, vague names, bad structure, distractions |
| **Germane** | Load devoted to schema construction / learning | Effort that builds durable LTM knowledge |

Primary anchors:

- Sweller (1988): cognitive load during problem solving and effects on learning ([Sweller, *Cognitive Science*, 1988](https://doi.org/10.1207/s15516709cog1202_4)).
- Sweller, van Merriënboer & Paas (1998): cognitive architecture and instructional design; three-load framework ([*Educational Psychology Review*](https://doi.org/10.1023/A:1022193728205)).
- Chandler & Sweller (1991): extraneous load and instructional format ([*Cognition and Instruction*](https://doi.org/10.1207/s1532690xci0804_2)).
- Later: element interactivity as the root of intrinsic load (Sweller, 2010, *Educ Psychol Rev*).

**Hermans techniques to manage load (ch. 4, secondary notes + Manning TOC):**

- Temporary **refactoring for readability** (inline vague helpers; rewrite unfamiliar constructs into familiar form)—even if rolled back later.
- **Dependency graphs** and **state tables** as external memory when WM is full.
- Add **code synonyms** to flashcard decks (reduce future extraneous load).
- Long parameter lists, deep nesting, linguistic anti-patterns increase load (later chapters; secondary notes).

**Worked examples:** Hermans discusses Sweller's finding that studying worked examples can be far more efficient than unguided problem solving for novices (secondary notes ch. 10: algebra study, worked-example group much faster and transferred better). Classic primary: Sweller & Cooper; Cooper & Sweller on worked examples.

**Expertise reversal:** what reduces load for novices can hinder experts (Kalyuga et al., 2003)—important for adaptive difficulty.

### 6.2 Subject-agnostic app operationalization

- **Load-aware lesson design:** separate content into (a) core idea (intrinsic), (b) presentation shell (minimize extraneous), (c) schema-building activity (germane: explanation in own words, analogy, teach-back).
- **Presentation controls that cut extraneous load:** progressive disclosure; hide optional asides; consistent layout; avoid split-attention (keep diagram and explanation contiguous—Chandler & Sweller).
- **Worked-example → completion → full problem** sequence (fading): full example first, then partially blanked, then independent solve (Paas completion-problem tradition).
- **Temporary "defactor" mode:** rewrite a hard explanation into simpler parallel form (synonym view); schedule the hard form for later once the concept is in LTM.
- **Germane prompts:** "Why does this step work?", "What would break if X changed?"—effortful but productive (aligns with desirable difficulties).
- **Self-report load (Paas scale)** after items; if high load + low performance → reduce extraneous / split task; if low load + high performance → raise challenge (expertise reversal).

### 6.3 Cadence / conditions

| Condition | Design response |
| --- | --- |
| Novice + high element interactivity | Worked examples first; segment; pre-train components |
| High extraneous indicators (confusing UI, split info) | Fix presentation before adding practice volume |
| Germane activities | Include in every learning block, but not so many that total load exceeds WM |
| Expertise grows | Fade scaffolds; reverse example-heavy design (expertise reversal) |
| Measuring load | Use Paas-style 9-point mental effort after sessions; track with accuracy for relative efficiency (Paas & van Merriënboer) |

No universal "every N days" for load types—the schedule is **item design + adaptive fading**, not calendar alone.

---

## 7. Misconception patterns (wrong mental models)

### 7.1 Claim / mechanism

Hermans ch. 7: bugs often come from **mistakes in thinking**, not mere typos. Misconceptions are faulty beliefs held **consistently** and **with confidence** ([Manning ch. 7](https://livebook.manning.com/book/the-programmers-brain/chapter-7); [Manning FAQ](https://www.manning.com/books/the-programmers-brain)).

Core ideas:

- **Transfer of learning:** prior knowledge helps (positive) or hurts (negative) new learning.
  - Low-road transfer: automatized skills.
  - High-road transfer: deliberate application of abstract knowledge.
  - Near vs far transfer across similar/dissimilar domains.
- Misconceptions often arise from **negative transfer** (e.g., math variables that do not reassign → belief that programming variables are immutable; language A exception model ≠ language B).
- Fixing misconceptions requires **conceptual change**: replace the faulty mental model with a correct one—not just being told "you're wrong."
- Even after correction, **regression** to the old model remains a risk.
- Diagnosis/correction tactics Hermans discusses: pair work, tests, documentation; diagnose misconceptions in new codebases ([ch. 7 TOC](https://livebook.manning.com/book/the-programmers-brain/chapter-7)).

Manning FAQ examples: permanent links from assignment; misunderstanding loop termination ([Manning](https://www.manning.com/books/the-programmers-brain)).

### 7.2 Subject-agnostic app operationalization

- **Misconception catalog per topic:** known wrong models with confidence triggers (e.g., "force = mass only", "correlation implies causation", "past perfect = simple past").
- **Discriminating probes:** items where the wrong model and right model predict different answers—prefer these over items both models pass.
- **Conceptual change sequence:** (1) elicit prediction, (2) show conflicting evidence, (3) present replacement model, (4) practice applying new model, (5) delayed re-test for regression.
- **Transfer warnings:** when starting a near domain (e.g., related language, related scientific system), show "what carries over / what does not" cards (positive + negative transfer).
- **Confidence tagging:** ask "how sure?" ; high confidence + wrong → misconception protocol, not simple flashcard fail.
- **Regression schedule:** after a misconception is "fixed," re-probe at expanding intervals (combines with spaced repetition).

### 7.3 Cadence / conditions

| Stage | When |
| --- | --- |
| Elicit | First encounter with a concept known for misconceptions |
| Confront + replace | Immediately after wrong high-confidence answer |
| Re-probe | Same session (suppression check) + delayed (1 day, ~1 week, ~1 month—app-chosen; Hermans stresses risk of fall-back but does not mandate exact intervals) |
| Near-transfer topics | At the start of each adjacent unit |

---

## 8. Spaced repetition, desirable difficulty, retrieval practice

### 8.1 Claim / mechanism

**In Hermans (ch. 3, via secondary notes and reviews):**

- Flashcards are the concrete tool for syntax and concept memorization.
- **Spaced repetition:** study over a longer period; cramming is inferior for durable LTM.
- **Retrieval practice:** actively trying to remember strengthens memory more than re-reading.
- **Elaboration:** relating new knowledge to existing memories strengthens encoding.
- Monthly flashcard review is presented as a practical long-term habit ([secondary notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain); [understandlegacycode: ~10 min/day, space after success](https://understandlegacycode.com/blog/key-points-of-programmer-brain/)).
- Apps like Anki / Brainscape / Quizlet are endorsed as reminders for when to practice again.
- Add cards when learning something new or when about to look a concept up.
- Thin the deck using right/wrong tallies.

**Automatization (ch. 10 secondary notes):** deliberate practice of small skills until automatic frees WM for harder problems; spaced daily practice until effortless. Three phases: cognitive → associative → autonomous.

**Desirable difficulties (broader science Hermans-aligned but owned by Bjork):** conditions that feel harder (spacing, interleaving, retrieval, variation) often improve long-term learning despite worse short-term performance ([Bjork & Bjork overview PDF](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-introducing-desirable-difficulties-into-practice-and-instruction-bjork-and-bjork.pdf); term from Bjork 1994).

**Worked examples (Sweller):** for novices, studying explained solutions can beat pure problem-solving for schema acquisition (see Cognitive load).

### 8.2 Subject-agnostic app operationalization

- **First-class flashcard / cloze system** for atomic facts, definitions, procedures steps, and "synonyms" (two surface forms of same idea).
- **Scheduler:** spaced repetition with expanding intervals; default easy habit: short daily retrieval + monthly full-deck hygiene (book-aligned practical guidance).
- **Retrieval > restudy:** default card face is a prompt; answer is hidden; optional typed recall before reveal.
- **Elaboration card types:** "explain in your own words", "give an example", "contrast with Y".
- **Interleaving:** mix topics within a session once each topic has minimal foothold (desirable difficulty; not a Hermans algorithm detail).
- **Deliberate micro-skills:** 5–10 minute drills of one small procedure until automatic, then space.
- **Worked-example mode** for new problem types before free solve.
- **Onboarding packs:** Hermans suggests prepared flashcards for newcomers to a codebase ([understandlegacycode onboarding summary](https://understandlegacycode.com/blog/key-points-of-programmer-brain/))—generalize to "topic starter decks."

### 8.3 Cadence / conditions (scheduling-relevant)

| Practice | Suggested default (book-aligned where noted) |
| --- | --- |
| New cards | Add on first encounter / on lookup impulse |
| Daily retrieval | Short session (secondary reviews mention ~10 min/day as practical) |
| After correct recall | Increase interval (standard SR; secondary: "space the repetition a bit") |
| After fail | Reset / shorten interval; consider elaboration or worked example |
| Long-term maintenance | ~**monthly** revisit of the deck (Hermans via secondary notes) |
| Micro-skill automatization | Daily deliberate practice until consistent zero-effort performance |
| Misconception re-probes | Expanding delays after conceptual change |
| Worked examples | Front-load when intrinsic load is high and expertise is low |

**Productive struggle:** Hermans (Manning blurb) frames turning confusion into a learning tool and benefiting from productive struggle ([Manning](https://www.manning.com/books/the-programmers-brain))—aligns with desirable difficulties: do not remove all difficulty; remove *extraneous* difficulty while keeping germane challenge.

---

## Cross-cutting session design map (for later scheduling work)

| Learner signal | Likely cognitive issue | Technique to apply |
| --- | --- | --- |
| "I don't know this word/fact" | LTM gap | Flashcard capture + spaced retrieval |
| "Too many things at once" | WM / STM overload | Split task; state table; reduce extraneous load |
| "I recognize it but can't use it" | High storage, low retrieval strength | Free-recall practice; elaboration |
| Fast but shallow success | Insufficient desirable difficulty | Space, interleave, delay feedback slightly |
| High confidence + wrong | Misconception | Conceptual change protocol + regression probes |
| Knows parts, fails composition | Weak chunks / missing notional machine | Pattern naming; model tracing |
| Can follow example, can't start blank | Needs fading | Worked example → completion → independent |
| Skill still effortful under load | Not automatized | Daily micro-drills until automatic |

---

## Gaps / things a primary read of the book would resolve

These items were reconstructed from Manning TOCs/FAQs, Hermans-adjacent primary research (Sajaniemi, Sweller, du Boulay), and detailed secondary book notes/reviews. A full primary read of Hermans (2021) would confirm or correct:

1. **Exact numerical claims** Hermans asserts for STM capacity (7±2 vs 2–6), STM duration (~30s), and LTM forgetting (~25% after 2 days)—including which studies she cites on which pages.
2. **Precise flashcard schedule** she recommends (daily vs monthly vs both; any explicit algorithm beyond "space repetitions" and "monthly maintenance").
3. **Full treatment of notional machines** in ch. 6: her chosen examples, levels, and how she distinguishes notional machines from mental models and schemata.
4. **Complete misconception catalog** she uses for programming (assignment, loops, scope, exceptions, etc.) and any empirical citations on conceptual change in CS.
5. **Whether she explicitly invokes Bjork "desirable difficulties"** by name, or only adjacent ideas (productive struggle, retrieval, spacing).
6. **Exact wording of cognitive-load type definitions** in ch. 4 and whether germane load is presented in the classic Sweller triad or a later reformulation.
7. **Roles set details as she prints them** (11-role list, icons, any renaming of Sajaniemi's "one-way flag" vs "flag", inclusion of transformation vs walker/container).
8. **Onboarding task taxonomy** (transcription, exploration, comprehension, searching, incrementation—reported in secondary onboarding summaries) and whether those labels are Hermans' own framework.
9. **Interruption recovery numbers** as she cites them (Parnin ~15 min; van Solingen interruption costs)—exact references and figures.
10. **Any scheduling formula** tying techniques together (the book is technique-oriented; an integrated "session engine" may be an app invention rather than Hermans' design).
11. **Storage vs retrieval strength** presentation—whether she cites Bjork's New Theory of Disuse explicitly.
12. **fMRI / Siegmund language-network findings** for code reading (secondary notes mention them in ch. 5)—confirm how central they are to her pedagogy vs background science.

Until a primary read, treat numeric thresholds in this catalog as **design priors from secondary transmission of Hermans**, not as verified quotations of the book, and prefer adaptive mechanisms (load self-report, accuracy, confidence) over hard-coded magic numbers.

---

## Key sources

### Primary / first-party

- Felienne Hermans, *The Programmer's Brain*, Manning, 2021 — [publisher page](https://www.manning.com/books/the-programmers-brain), [liveBook](https://livebook.manning.com/book/the-programmers-brain), [author book page](https://www.felienne.com/book)
- Manning chapter TOCs: [ch. 1](https://livebook.manning.com/book/the-programmers-brain/chapter-1), [ch. 2](https://livebook.manning.com/book/the-programmers-brain/chapter-2), [ch. 3](https://livebook.manning.com/book/the-programmers-brain/chapter-3), [ch. 4](https://livebook.manning.com/book/the-programmers-brain/chapter-4), [ch. 6](https://livebook.manning.com/book/the-programmers-brain/chapter-6), [ch. 7](https://livebook.manning.com/book/the-programmers-brain/chapter-7)
- Jorma Sajaniemi & Raquel Navarro Prieto, "Roles of Variables in Experts' Programming Knowledge," PPIG 2005 — [PDF](https://www.ppig.org/files/2005-PPIG-17th-sajaniemi.pdf)
- Sajaniemi, Roles of Variables teaching materials — [Pascal student version](http://cs.joensuu.fi/pages/saja/var_roles/stud_vers/stud_Pascal_eng.html)
- John Sweller, "Cognitive Load During Problem Solving: Effects on Learning," *Cognitive Science* 12(2), 1988
- Sweller, van Merriënboer & Paas, "Cognitive Architecture and Instructional Design," *Educational Psychology Review* 10, 1998
- Chandler & Sweller, "Cognitive Load Theory and the Format of Instruction," *Cognition and Instruction* 8(4), 1991
- du Boulay, O'Shea & Monk, notional machines (1981)
- George A. Miller, "The Magical Number Seven, Plus or Minus Two," *Psychological Review* 63(2), 1956
- Bjork & Bjork, desirable difficulties / spaced and retrieval practice (overview essays; Bjork 1994 coinage)

### Secondary (book transmission; used to fill Hermans content gaps)

- [Yoan Thirion detailed notes](https://yoan-thirion.gitbook.io/knowledge-base/software-craftsmanship/the-programmers-brain) (structure closely follows the book)
- [Nicolas Carlo, "Key points of The Programmer's Brain"](https://understandlegacycode.com/blog/key-points-of-programmer-brain/)
- [Ian Hopkinson book review](https://ianhopkinson.org.uk/2022/02/book-review-the-programmers-brain-by-felienne-hermans/)
- [DEV.to detailed review (Buzzpy)](https://dev.to/buzzpy/the-programmers-brain-how-it-works-and-how-to-make-it-work-glo)

---

*Document generated as research input for learning-app design. Prefer primary confirmation of any numeric scheduling threshold before hard-coding product behavior.*
