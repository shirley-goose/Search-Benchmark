# Data card

## Dataset

`searchbench3/dataset.json` contains 60 benchmark queries: ten each in current news, technical documentation, academic research, commerce/local information, finance/regulation, and Chinese-web search.

Each record includes:

- a stable query ID;
- category;
- query text;
- a concise success criterion;
- expected authoritative domains.

`searchbench3/agentic20.json` and `searchbench3/p1.json` define the fixed-budget and adaptive task subsets.

## Published results

The `results/` directory contains analysis-ready outputs without raw page text or model conversations:

- `p0/retrieval_metrics.csv`: per-query retrieval status, latency, result count, and authoritative-domain match;
- `p0/per_query_evidence_scores.csv`: the four evaluator dimensions and total score for every query-provider pair;
- `p0/*summary*` and `p0/*pairwise*`: aggregate and inferential statistics;
- `agentic20/session_metrics.json`: per-session process, token, coverage, latency, and cost metrics;
- `p1/session_metrics.csv`: per-session adaptive-search metrics;
- `temporal/summary.json`: provider-level repeatability and retention summaries;
- `costs/tencent_cost_reconciliation.json`: the fixed exchange-rate conversion and exact canonical call counts.

## Scale

- Retrieval: 60 queries × 4 providers = 240 records.
- Evidence evaluation: 240 isolated query-provider evaluations.
- Fixed-budget agents: 20 tasks × 4 providers = 80 sessions and 240 searches.
- Adaptive agents: 10 tasks × 4 providers = 40 sessions.
- Temporal repeat: another 240 retrieval calls and 80 fixed-budget sessions.

## Intended use

- retrieval-system comparison;
- agent context-efficiency analysis;
- benchmark-method development;
- hypothesis generation for a larger gold-backed evaluation.

## Out-of-scope use

- claiming a universal provider leaderboard;
- treating model-judge scores as independently verified factual accuracy;
- estimating cost without preserving the recorded pricing and exchange-rate assumptions;
- redistributing omitted raw source content without reviewing applicable provider and publisher terms.

## Why raw responses are excluded

The private audit archive retains complete provider responses, model conversations, and diagnostic provenance. They are excluded from this public version to keep review focused and avoid republishing large quantities of third-party page text. The per-query and per-session metrics needed to audit the report's numerical claims remain available here.
