# Cognitive-Science Technique Catalog: *The Programmer's Brain* (Synthesis)

Synthesis of two independent research passes — one by Claude ([`programmers-brain-techniques.md`](./programmers-brain-techniques.md)), one by Grok ([`programmers-brain-techniques-grok.md`](./programmers-brain-techniques-grok.md)) — cataloging the cognitive-science techniques in Felienne Hermans' *The Programmer's Brain* (Manning, 2021) as input for a subject-agnostic learning app's session-mechanics and scheduling design. Where the two passes agree, this doc states the claim once. Where they diverge — a different number, a different sourcing claim, a source one pass could read and the other couldn't — both are shown and flagged, not silently merged. Neither pass obtained the book's full text; treat every number below as a design prior to verify against the physical book before hard-coding it into the scheduler.

**How to read the flags:** `[confirmed primary]` = read directly from a first-party source by at least one pass. `[secondary]` = from third-party notes/reviews of the book, not the book itself. `[conflict]` = the two passes disagree on a fact or a source's accessibility — see inline note.

---

## 1. Working memory limits

**Claim.** Working memory (Hermans' three-part model: LTM / STM / working memory, mapped to confusion types — lack of knowledge / lack of information / lack of processing power) is capacity- and duration-limited.

- Miller (1956), *7±2* — the classic STM span figure. Hermans cites it by name in her own words: *"your short-term memory... can only hold between five and nine things at the same time"* (Lambda Days 2022 talk, transcribed via `yt-dlp`) `[confirmed primary — Hermans' own voice]`.
- Cowan (2001) and later working-memory research tighten this to **~4 chunks** for the focus of attention specifically; Hermans' book reportedly settles on **2–6 chunks** `[secondary, reported consistently by both passes across independent notes sites — treat the book's specific number as probable but unconfirmed]`.
- Decay: unrehearsed STM content is lost within roughly **~30 seconds** `[secondary, both passes]`.
- Peterson & Peterson (1959) established the duration-limit finding underlying the decay claim; Sweller, van Merriënboer & Paas's 2019 retrospective cites both Miller and Peterson & Peterson directly — PDF read in full by the Claude pass `[confirmed primary]`.

`[conflict]` Grok's pass additionally cites a Paas 9-point self-report mental-effort scale and a Parnin-cited **~15–20 minute** interruption-recovery figure as part of this technique, attributed to the book via secondary notes. Claude's pass did not surface either claim. Both are plausible (Paas's scale is a real, well-known CLT instrument) but unverified against Hermans' text — treat as an additional design lead, not a confirmed book claim.

**Operationalization (merged).** Cap simultaneous *novel* elements per exercise step at roughly 3–6, regardless of subject (vocabulary drill: ~4 new words/step; math derivation: ~4 unfamiliar intermediate quantities/screen; history timeline: chunk events in groups of ~4 before asking learners to connect them). Add a self-report "how hard was that?" prompt (Paas-style) after items as a load signal, and offer external scaffolds (scratchpad, state table) automatically once nesting/complexity crosses a threshold rather than treating the request for notes as failure. Keep facts visible rather than requiring pure unaided hold across long steps — the ~30s decay figure argues against blind trust in unaided working-memory retention across a multi-part problem.

**Cadence/conditions.** No single uncontested number. Actionable range: **3–5 novel items per step**, decay budget of **~30s** before a working-memory-dependent step should either resolve or externalize its state. Flag both numbers for verification before hard-coding into scheduling logic.

---

## 2. Long-term memory (LTM) vs short-term memory (STM), and transfer between them

**Claim.** Novel information is processed by capacity-limited working memory, then — if consolidated — stored in an effectively unlimited LTM; once in LTM, working-memory limits on that material "disappear." Verified directly from Sweller et al. 2019: *"cognitive load theory emphasised that all novel information is first processed by a capacity and duration limited working memory and then stored in an unlimited long-term memory for later use"* `[confirmed primary]`. The empirical grounding is Ericsson & Kintsch's long-term working memory theory and De Groot's chess-expertise findings: expert skill was explained by memorized configurations in LTM, not superior raw working-memory capacity `[confirmed primary via Sweller et al. 2019's citation of De Groot]`.

Hermans' own talk restates the pipeline in her words — STM briefly holds new input, which working memory processes "in collaboration with" LTM, which supplies prior knowledge to interpret it `[confirmed primary — Hermans' own voice]`.

**Mechanisms for STM→LTM transfer** (both passes, secondary): encoding via associative networks/schemata, the forgetting curve, storage-strength vs. retrieval-strength as separable properties (a memory can be well-stored yet hard to retrieve), and elaboration (connecting new material to existing schemata). `[conflict — attribution]` Both passes suspect this storage/retrieval-strength framing traces to Bjork & Bjork's "New Theory of Disuse," but neither confirmed Hermans cites Bjork by name — treat as a plausible unconfirmed inference on both sides, not a citation.

**Operationalization (merged).** Track two categories per learning item: "should be LTM-resident" (facts, vocabulary, formulas — recognized instantly, no derivation) vs. "assembled via working memory" (applying a rule, translating a sentence in real time). Design practice to migrate items from the second category to the first through drilling until recall stops being effortful. Add a capture-to-LTM pipeline: when a learner looks up a fact or marks "I don't know this," one-tap creates a flashcard for it (Hermans reportedly recommends this exact moment — on lookup impulse — as a card-creation trigger, `[secondary]`). Prefer free-recall quizzes over recognition/multiple-choice for strengthening retrieval, with progressive hints (not the full answer) when retrieval fails.

**Cadence/conditions.** No fixed interval for the STM→LTM transfer itself — it's rehearsal/retrieval-practice-driven (see Technique 8), not timer-driven. Track per-item whether recall is still slow/effortful/error-prone vs. fast/low-error, and adjust scaffolding accordingly.

---

## 3. Chunking

**Claim.** Experts group familiar combinations of a domain's raw elements into single "chunks" occupying one working-memory slot each — this, not superior raw capacity, is what lets experts hold and manipulate far more effective information than novices. Canonical grounding: De Groot's chess-expertise research (masters recall meaningful board positions far better than novices, but the advantage vanishes for random/illegal positions — showing the effect is pattern-knowledge in LTM, not bigger STM) `[confirmed primary via Sweller et al. 2019's citation]`. Both passes independently surface McKeithen et al. as the programming-specific replication of this design (expert vs. novice programmers' recall of structured vs. randomized code, gap narrowing for scrambled code) `[secondary — both passes cite it via third-party notes, not the original McKeithen paper directly]`.

Hermans' own talk gives a direct code-specific instance: rewriting unfamiliar code into a more familiar form makes it "less chunked... letter soup" become organized — familiarity converts many small elements into fewer, larger chunks `[confirmed primary — Hermans' own voice]`.

Additional mechanism from the secondary notes (both passes): **beacons** — meaningful names, structural keywords, high-level comments — act as recognition cues that trigger the right chunk/schema `[secondary]`.

**Operationalization (merged).** Explicitly teach and drill a domain's mid-level "chunks," not just atomic facts or whole procedures: chord progressions (not individual notes) in music, grammatical constructions (not individual words) in language, proof strategies (not individual algebraic steps) in math, causal/narrative patterns (not individual dates) in history. Track a learner's growing library of recognized chunks as a progression axis distinct from raw fact recall. Add "beacon training" — given a passage, highlight the 2–3 cues that should trigger recognition of the right pattern. Use reproduction drills (show material briefly, hide it, ask for reconstruction, score by chunk-level not token-level accuracy) as a diagnostic of which chunks a learner already has.

**Cadence/conditions.** No dosage number. The actionable design implication is **interleaving** — varied surface-different examples of the same underlying chunk (many different code snippets that are all "loop with an accumulator," many sentences that are all "past-perfect construction") rather than repeating one example. Related to but distinct from spaced repetition (Technique 8). Diagnostic reproduction drills work well as a baseline-at-topic-start and after-practice-block checkpoint.

---

## 4. Notional machines (mental models of execution)

**Claim.** A notional machine is a pedagogic device — a simplified, idealized model of how the underlying system executes — that lets a learner reason about behavior without the full real complexity. Term originates with du Boulay, O'Shea & Monk (1981); developed in du Boulay (1986). `[conflict]` Neither pass fetched the original du Boulay text directly; both rely on secondary/search-summary sourcing for the exact definition, though Grok's pass gives a specific quoted definition ("the idealised model of the computer implied by the constructs of the programming language") that Claude's pass didn't independently verify — treat that exact wording as unconfirmed until checked against the primary text.

Hermans is a named co-author on the field's most recent synthesis (Fincher, Jeuring, Miller, du Boulay, Hermans et al., "Notional Machines in Computing Education: The Education of Attention," ITiCSE-WGR '20) `[confirmed primary — citation verified]`. Her own blog post, ["Forms of notional machines"](https://www.felienne.com/archives/6392), gives her working definition directly: *"a didactical tool that helps a learner understand the workings of the source code on an actual machine"* `[confirmed primary — Hermans' own words]`. She distinguishes four forms: **metaphors** (e.g., her "box"/"sticky notes" model for variables), **representations** (tools like PythonTutor — less translation loss, more visual load), **rules** (precise logical equivalences, e.g., `for` loop via equivalent `while` loop), and **actions** (habitual practices, credited to Katie Cunningham) — and explicitly flags as an open question how these should be sequenced in a curriculum.

**Operationalization (merged).** Generalizes to any domain with a hidden mechanism a learner must reason about: a simplified digestion model for biology, supply-and-demand curves for economics, "carrying the one" for arithmetic, a metaphorical case-model for a declined language. For each subject/skill, define and teach one canonical simplified model, deliberately choosing one of Hermans' four forms (metaphor/representation/rule/action), and represent it consistently across exercises rather than switching arbitrarily. Grok's pass adds a useful extension: multi-level models (beginner black-box → intermediate subsystems → advanced edge cases), letting the learner pick a level but warning on level-switch mid-problem, since switching models is a known source of confusion (see Misconceptions).

**Cadence/conditions.** No cadence evidence — this is a *what*-to-teach and *how*-to-represent question, not a *how-often* one. Grok's pass suggests introducing a notional machine before or with first practice on a mechanism (not only after failure) and revisiting it when complexity increases — a reasonable inference, not an evidenced interval.

---

## 5. Roles of variables (Sajaniemi's taxonomy)

**Claim.** Variables in procedural programs play a small set of recurring "roles" — stereotyped usage patterns — and recognizing them supports schema formation for novice programmers. The eleven roles, fetched directly from Sajaniemi's own site `[confirmed primary]`:

| Role | Definition |
|---|---|
| Fixed value | Doesn't get a new proper value after initialization |
| Stepper | Steps through a systematic, predictable succession of values |
| Most-recent holder | Holds the latest value from an unpredictable succession |
| Most-wanted holder | Holds the best/most appropriate value seen so far |
| Gatherer | Accumulates the effect of individual values |
| Follower | Always takes its new value from the old value of another variable |
| One-way flag | Two-valued; cannot return to its initial value once changed |
| Temporary | Holds a value for a very short time only |
| Organizer | A structure whose elements can be rearranged |
| Container | A structure whose elements can be added and removed |
| Walker | Traverses a data structure |

`[conflict — coverage statistic]` Both passes cite Sajaniemi's claim that a small role set covers **~99%** of variables in novice-level procedural programs, sourced to Sajaniemi's 2002 HCC paper / the 2005 PPIG paper. **Claude's pass attempted to fetch the PPIG 2005 PDF directly and reports it rendered as unreadable binary** — the 99% figure there is credited to a WebSearch summary, not a direct read. **Grok's pass cites the same PPIG 2005 PDF as successfully read**, and additionally reports specific figures from it: a card-sorting study where professional programmers' groupings had mean similarity 0.51 to the role criterion (significantly above alternatives), and that CS educators reached high-accuracy role assignment after about an hour of training (Ben-Ari & Sajaniemi). This is a direct discrepancy in reported source-accessibility between the two passes — **do not treat the 0.51/1-hour figures as confirmed until someone re-fetches the PPIG 2005 PDF and checks**, but they're a specific enough claim to be worth that follow-up rather than discarding.

**Operationalization (merged).** Generalizes as **role-tagging of atomic elements within a larger structure**: in language learning, tag words by grammatical/semantic role; in math, tag terms by role (the unknown, a fixed constant, a running-sum accumulator); in a lab protocol or business workflow, tag tracked quantities as fixed parameter / iterator / latest observation / running best / accumulator / latched flag / scratch value / collection / cursor. Any domain has a small, learnable vocabulary of structural roles recurring across surface-different examples; naming/tagging them explicitly accelerates comprehension. Becomes a cross-subject exercise type: given an artifact, label the role each part plays. Grok's pass adds a useful detail: role *combinations* act like design patterns (stepper + most-wanted-holder ≈ search) — worth building as a "recognize the combo" exercise once individual roles are learned.

**Cadence/conditions.** Not a scheduling technique — a content-classification one. The relevant design constraint is **coverage with a small vocabulary**: whatever the exact number, the point generalizes — a subject's role-taxonomy should stay small (single digits to low teens) to remain learnable. If Grok's ~1-hour-training figure holds up under verification, that argues for a short, focused onboarding module for the taxonomy itself rather than teaching roles gradually.

---

## 6. Cognitive load types: intrinsic, extraneous, germane

**Claim.** The best-sourced technique in this catalog — verified by directly reading Sweller, van Merriënboer & Paas, "Cognitive Architecture and Instructional Design: 20 Years Later" (2019) `[confirmed primary, full PDF read]`:

- **Intrinsic load**: "the complexity of the information being processed... related to element interactivity... determined by both the complexity of the information and the knowledge of the person processing it... can only be changed by changing what needs to be learned or changing the expertise of the learner."
- **Extraneous load**: "not determined by the intrinsic complexity of the information but rather how the information is presented and what the learner is required to do... can be changed by changing instructional procedures."
- **Germane load**: "the cognitive load required to learn... the working memory resources devoted to dealing with intrinsic cognitive load rather than extraneous cognitive load." The 2019 paper explicitly flags this as a **revision** from 1998: germane load used to be treated as additive to total load; the 2019 view treats it as *redistributive* — capacity freed from extraneous processing, redirected at intrinsic processing, not a separate load source.

`[conflict — which formulation the book uses]` Since the book was published in 2021, it's plausible Hermans used the 2019 redistributive framing, but neither pass confirmed this against her actual text — if she instead used the older 1998 additive framing, the operationalization below (germane load as "spend freed capacity," not "add more load") may need revisiting. Flagged by Claude's pass; worth resolving on a primary read.

Hermans reportedly applies the split directly to code reading: intrinsic = inherent problem complexity; extraneous = accidental complexity from presentation (unfamiliar syntax, poor naming); germane = the effort of storing new understanding in LTM `[secondary, both passes]`. Grok's pass adds specific mitigation techniques Hermans reportedly discusses: temporary refactoring for readability (even if rolled back later), dependency graphs and state tables as external memory, and worked-examples-beat-unguided-problem-solving-for-novices (a Sweller & Cooper finding) `[secondary]`, plus **expertise reversal** (Kalyuga et al. 2003) — techniques that reduce novice load can hinder experts — as a design consideration for adaptive difficulty `[secondary, cited by Grok's pass only]`.

**Operationalization (merged).** Maps cleanly onto any subject: intrinsic load is set by inherent difficulty relative to the learner's expertise (app lever: sequence by genuine conceptual difficulty, not surface length); extraneous load is caused by presentation (app lever: consistent formatting, pre-taught notation, distraction-free UI, avoid split-attention — keep diagram and explanation contiguous); germane load is productive schema-building effort (app lever: self-explanation prompts, worked-example-then-fade sequencing, retrieval practice). Concretely: don't bury which century a history event happened in (extraneous); sequence easy-before-hard causal chains (intrinsic); ask why an event mattered, not just that it happened (germane). Add expertise-reversal awareness: fade scaffolds and worked examples as a learner's measured accuracy/speed improves, since novice-helpful supports can start hindering an improving learner.

**Cadence/conditions.** No temporal cadence — this is a single-episode load-management framework, not a scheduling-interval theory. Structural implication for a scheduler: **fix extraneous load before increasing intrinsic difficulty**, not both at once, and keep total load (intrinsic + extraneous) within the learner's working-memory budget from Technique 1.

---

## 7. Misconception patterns

**Claim.** A Hermans-owned empirical result: Swidan, Hermans & Smit, "Programming Misconceptions for School Students" (ICER '18) `[confirmed primary author/citation via TU Delft research portal; abstract-level only, not full paper]`. 145 students aged 7–17 tested on 11 established programming misconceptions via Scratch-based multiple-choice exercises. Reported top patterns: difficulty with **sequential execution**; the misconception that **"a variable holds one value at a time"** (vs. correctly modeling reassignment); confusion about program interactivity/responsiveness to input. Correlated with the mathematical properties of numbers used, semantic suggestiveness of variable names, and inflated expectations of what a computer "understands."

Both passes converge on the book's broader framing (secondary-sourced): misconceptions are confidently-held *incorrect* mental models, not mere knowledge gaps, often formed via **negative transfer** — prior knowledge (another programming language, natural-language semantics, or in Grok's pass's example, math's non-reassigning "variables") actively interferes with learning the new concept correctly. Grok's pass adds useful vocabulary: **low-road vs. high-road transfer** (automatized skill application vs. deliberate abstract application) and **near vs. far transfer** (similar vs. dissimilar domains) `[secondary]`. Fixing a misconception requires *conceptual change* — replacing the faulty model, not just telling the learner they're wrong — and relapse to the old misconception remains a risk even after apparently correct learning `[secondary, both passes]`.

**Operationalization (merged).** Content-authoring requirement, not a UI feature: maintain a **catalog of known common misconceptions** per skill/topic (analogous to the 11 tested in Swidan/Hermans/Smit) — e.g., in language learning, false-friend/negative-transfer errors; in math, "multiplication always makes numbers bigger"; in history, correlation-in-time conflated with causation. Diagnostic exercises should specifically *elicit* the misconception (distinguish "doesn't know" from "confidently believes wrong"), using **discriminating probes** — items where the wrong and right models predict different answers, per Grok's pass — rather than items both models pass. Remediation should present the correct model as an explicit *replacement*: elicit prediction → show conflicting evidence → present replacement model → practice → delayed re-test for regression (a full sequence contributed by Grok's pass, consistent with Claude's pass's narrower "re-test later" point). Add confidence-tagging ("how sure are you?") — high confidence + wrong answer should trigger the misconception protocol rather than an ordinary flashcard-fail.

**Cadence/conditions.** No cadence evidence from the book directly. Both passes converge on the same inference: since relapse is a known risk, re-probe previously "corrected" misconceptions later rather than trusting a single correct answer — Grok's pass proposes concrete checkpoints (same-session suppression check, then delayed re-checks at roughly 1 day / 1 week / 1 month, app-chosen) as one reasonable schedule, explicitly noting Hermans stresses the *risk* but doesn't mandate exact intervals. Treat these specific delays as an app-design choice consistent with the source material, not a verified book claim.

---

## 8. Spaced repetition, desirable difficulty, and retrieval practice

**Claim.** The book reportedly builds its syntax-memorization advice (flashcards) on the classic Ebbinghaus forgetting-curve finding (forgetting fastest immediately after learning, slowing over time) and on active retrieval strengthening memory more than passive re-exposure `[secondary, both passes]`. The storage-strength/retrieval-strength distinction (frequency vs. ease of recall as separable properties) is discussed in Hermans' own talk Q&A on flashcards `[confirmed primary — Hermans' own voice, qualitative only]`, and is the hallmark terminology of Bjork & Bjork's "New Theory of Disuse" — plausibly the underlying source, but neither pass confirmed Hermans cites Bjork by name (see Technique 2's note on the same open question).

`[conflict — numeric specifics]` Both passes report the same three numbers via secondary sources, with no independent primary corroboration by either:
- **"After 2 days, ~25% of the knowledge remains in LTM"** (a specific forgetting-curve figure attributed to the book).
- **Revisit flashcard sets roughly monthly** once mastered, as a maintenance cadence.
- **~10 minutes/day** of flashcard review as a practice dosage, with intervals expanding on correct recall ("within a few weeks" to consolidate).

Both passes flag these identically: unverified against the book's primary text, and **not to be hard-coded into the scheduler** without confirmation. That two independent research passes landed on the same three numbers from overlapping-but-not-identical secondary sources is mild corroborating evidence they're at least accurately transmitted from *some* consistent reading of the book — but it is not primary confirmation.

Grok's pass adds two well-sourced adjacent concepts worth folding in: **desirable difficulties** (Bjork, 1994) — conditions that feel harder (spacing, interleaving, retrieval, variation) often improve long-term learning despite worse short-term performance, a term Hermans is "aligned with" but doesn't necessarily use `[confirmed primary for Bjork's own work; unconfirmed whether Hermans cites the term]` — and **automatization** (book ch. 10, secondary): deliberate practice of small skills until they become automatic frees working memory for harder problems, via three phases (cognitive → associative → autonomous).

**Operationalization (merged).** The most directly reusable technique for a subject-agnostic scheduler, since it's already domain-independent in the source material: track any discrete recallable fact/skill as a spaced-repetition item, reviewed via **active retrieval** (recall-then-check, not re-reading), with correct answers pushing longer intervals and incorrect answers resetting to shorter ones — a Leitner/SM2-style engine as the app's core review scheduler regardless of subject. Add: capture-on-lookup (create a flashcard the moment a learner looks something up, per Technique 2), elaboration card types ("explain in your own words," "give an example," "contrast with Y"), interleaving topics once each has minimal foothold, and short daily micro-drills (5–10 min) for procedural automatization separate from the fact-recall flashcard system.

**Cadence/conditions — flag for the scheduling ticket.** Treat the 2-day/25%, monthly-maintenance, and ~10-min/day figures as *design priors*, not confirmed constants — verify against the book's primary text or an underlying primary spaced-repetition source (Cepeda et al.'s spacing-effect meta-analyses, Bjork's own work) before encoding them as literal scheduler parameters. Prefer building the scheduler on adaptive signals (measured accuracy, self-reported confidence, time-since-last-correct) with these numbers as *initial defaults*, not hard limits.

---

## Cross-cutting session-design signal map

Contributed by Grok's pass — a useful lookup table mapping learner-visible signals to the technique that addresses them, worth carrying into the later session-mechanics ticket:

| Learner signal | Likely cognitive issue | Technique to apply |
| --- | --- | --- |
| "I don't know this word/fact" | LTM gap | Flashcard capture + spaced retrieval (8) |
| "Too many things at once" | Working memory / STM overload | Split task; state table; reduce extraneous load (1, 6) |
| "I recognize it but can't use it" | High storage, low retrieval strength | Free-recall practice; elaboration (2) |
| Fast but shallow success | Insufficient desirable difficulty | Space, interleave, delay feedback slightly (8) |
| High confidence + wrong | Misconception | Conceptual change protocol + regression probes (7) |
| Knows parts, fails composition | Weak chunks / missing notional machine | Pattern naming; model tracing (3, 4) |
| Can follow example, can't start blank | Needs fading | Worked example → completion → independent (6) |
| Skill still effortful under load | Not automatized | Daily micro-drills until automatic (8) |

---

## Gaps / things a primary read of the book would resolve

Merged from both passes; items only one pass raised are marked.

- **The book's own text was never directly accessible to either pass.** Manning liveBook, O'Reilly's hosted edition, and PDF mirrors either 403'd or returned partial/no content. Every claim marked `[secondary]` above should be checked against the physical/purchased text before being treated as authoritative for the app's design.
- **Direct conflict: Manning liveBook chapter TOC accessibility.** Claude's pass reports the liveBook TOC as mostly inaccessible (only Chapter 1's TOC confirmed, via an O'Reilly-hosted mirror). Grok's pass cites liveBook chapter TOCs for chapters 1, 2, 3, 4, 6, and 7 as if fetched. **This should be re-checked** — either Grok's pass had access Claude's didn't, or some of those links are unverified/hallucinated citations. Don't treat the ch.2/3/4/6/7 TOC-sourced claims in this synthesis as more solid than "secondary" until that's resolved.
- **Direct conflict: Sajaniemi's PPIG 2005 PDF accessibility.** Claude's pass reports the PDF as unreadable binary on fetch; Grok's pass reports reading it directly and extracting specific figures (99% coverage, 0.51 mean card-sort similarity, ~1hr educator training time). Re-fetch and confirm before relying on the specific statistics.
- **Working memory capacity figure for the book specifically** (the "2–6 chunks" number) — reported consistently across independent secondary sources by both passes but never seen in Hermans' own words.
- **The 2-day/25% LTM-retention figure and the monthly flashcard-revisit rule** — the two numbers most likely to anchor the scheduling ticket, and the least verified; both passes flag these as needing primary confirmation before being encoded as scheduler constants.
- **Chandler & Sweller (1991)'s exact wording** — not obtained by either pass (403 on every attempted host, per Claude's pass). The intrinsic/extraneous/germane definitions used here come from the *2019* Sweller retrospective (a legitimate primary source, same lead author) rather than the original 1991/1998 formulation — and the 2019 paper itself notes the germane-load definition changed between 1998 and 2019, so which formulation the book uses is still open (Technique 6).
- **Du Boulay's origin of "notional machine"** — reported via secondary/search-summary sourcing by both passes, not fetched from the original 1981/1986 texts.
- **Whether Hermans cites Bjork by name** for storage/retrieval strength and desirable difficulties — open on both passes, treated as plausible inference only.
- **Complete misconception catalog** — only the top 2–3 of the 11 tested misconceptions in Swidan/Hermans/Smit were available via the abstract; the full ICER'18 paper would give the complete list, valuable for building the app's misconception-catalog content.
- **No chapter-and-verse mapping** confirmed between this catalog's 8 techniques and the book's actual chapter numbers, beyond Chapter 1 (confirmed) and the flashcards material (Chapter 3, per search-summary of the TOC). A full chapter map would help the later session-mechanics ticket sequence content the way the book does. *(Grok's pass's ch.2–7 TOC citations, if genuine, would mostly resolve this — see the conflict noted above.)*
- **Onboarding task taxonomy** (transcription, exploration, comprehension, searching, incrementation) and whether these are Hermans' own framework — raised only by Grok's pass, unconfirmed.
- **Interruption-recovery numbers** (Parnin ~15–20 min) as cited in the book, if at all — raised only by Grok's pass, unconfirmed against Hermans' text.
- **Hermans' Lambda Days 2022 talk transcript** (the most primary source used across both passes, since it's her own spoken words) is an auto-generated YouTube transcript, not professionally verified — the specific quotes used read as clean and internally consistent, but minor transcription errors remain possible.

**Bottom line for the wayfinder map:** the core structural claims (working memory/STM/LTM pipeline, chunking, notional machines' four forms, the eleven variable roles, the intrinsic/extraneous/germane split, misconceptions-as-confident-wrong-models) are well-corroborated across both independent passes and safe to design against now. The specific *numbers* — capacity figures, the 2-day/25% retention claim, monthly/10-min-a-day cadences — are consistently reported but consistently unverified against primary text on both passes, and should be encoded as adjustable defaults, not fixed constants, until someone reads the actual book.
