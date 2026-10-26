# Methodology

## Research question

SearchBench-3 tests whether retrieval quality changes the economics of an LLM agent. It therefore measures both the search layer and the downstream model work required to use search results.

## Providers

- DeepSeek Search
- Tencent Yuanbao SearchPro
- Exa 3.0 Lite
- Exa 3.0 Auto

Tencent's Secret ID/Secret Key and endpoint/API-key authentication paths invoke the same underlying SearchPro service; the account owner confirmed that authentication choice does not change retrieval behavior.

## Dataset

The base set contains 60 queries, evenly divided among:

- current news;
- technical documentation;
- academic research;
- commerce and local information;
- finance and regulation;
- Chinese-web search.

Each query has a stable ID, a success criterion, and one or more expected authoritative domains. Expected-domain coverage is a reproducible source-authority proxy, not a complete relevance judgment.

## Retrieval stage

Each provider received the same 60 queries and returned up to ten results. The primary measurements were:

- successful calls;
- median and 90th-percentile latency;
- presence of an expected authoritative domain in the top ten;
- estimated search cost.

## Evidence evaluation

For each of the 240 query-provider pairs, the first four results were supplied to Claude Opus 4.6 under the same prompt and per-result character cap. The evaluator produced a cited answer and four 0–4 ratings:

- groundedness;
- source authority;
- completeness;
- confidence.

The total evidence-quality score ranges from 0 to 16. It measures the usefulness of retrieved evidence to a common answer model; it is not independently verified factual accuracy.

### Statistical analysis

Provider comparisons use the 60 fully paired queries.

- Confidence intervals: 20,000 paired-query bootstrap samples.
- Primary test: two-sided paired sign-flip randomization test.
- Overall comparisons: 200,000 seeded Monte Carlo draws.
- Small category comparisons: exact sign-flip enumeration.
- Multiple comparisons: Holm correction across the six overall provider pairs; category comparisons use a separate 36-comparison family.

## Fixed-budget agent stage

The Agentic-20 study contains 20 tasks and four independent Claude Sonnet 4.5 sessions per task. Every session:

- was bound to one retrieval provider;
- made exactly three sequential searches;
- used temperature 0;
- received up to ten normalized results per search;
- used the same evidence and snippet limits;
- ran without retrieval caching.

The stage reports completion, retrieval latency, authoritative-domain coverage, input/output tokens, and total estimated cost.

## Adaptive agent stage

The P1 study contains 10 tasks and four independent provider-bound sessions per task. Agents could answer when evidence was sufficient or continue up to ten searches. The primary outputs are searches per task, completion, token usage, latency, and total estimated cost.

Because this cohort lacks independently verified gold answers, its main result is search efficiency—not cost per correct task.

## Temporal repeat

The 60-query retrieval stage was repeated after 92.23 hours. Agentic-20 was repeated after 53.31 hours using the same task manifest, answer model, prompt, evidence cap, and three-search budget.

The temporal analysis reports:

- authoritative-domain coverage;
- URL and domain retention;
- latency;
- token usage;
- total estimated cost.

URL retention is a stability measure, not a relevance measure.

## Cost accounting

Model costs use recorded input/output tokens and the configured model rates. Retrieval costs use configured per-call rates. All published comparisons are in U.S. dollars.

Tencent's supplied price of 20 CNY per 1,000 SearchPro calls is converted at 6.6861 CNY/USD, or approximately $0.002991 per call. Smoke tests, development traffic, retries, and superseded sessions are excluded from canonical comparison cohorts.

## Interpretation boundaries

- The study does not contain a complete, expert-reviewed gold-answer set.
- The sample is intentionally diverse but small.
- Equal context caps improve comparability but may understate provider-native content features.
- Agent results use one answer-model family.
- Temporal results cover days rather than long-term index behavior.
- Ten Chinese-web queries cannot establish a general regional ranking.

The most valuable next extension is a gold-backed evaluation with time-stamped key facts, acceptable answer ranges, primary sources, two independent reviewers, and adjudication.
