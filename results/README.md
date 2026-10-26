# Results guide

This directory contains the public, analysis-ready result layer. It excludes raw search snippets, complete model conversations, development runs, and diagnostic artifacts.

## `p0/`

- `retrieval_metrics.csv`: 240 query-provider retrieval observations.
- `retrieval_summary.json`: provider-level success, latency, authority coverage, and cost.
- `per_query_evidence_scores.csv`: 240 evidence-evaluation observations.
- `evidence_summary.json`: overall and category evidence-quality summaries.
- `overall_evidence_summary.csv`: provider means and bootstrap intervals.
- `overall_pairwise_tests.csv`: paired overall comparisons and corrected p-values.
- `category_evidence_summary.csv`: category-level descriptive results.
- `category_pairwise_tests.csv`: exploratory category comparisons.

## `agentic20/`

- `summary.json`: canonical session counts, token totals, and provider costs.
- `session_metrics.json`: safe per-session and category-level process metrics without answers or retrieved text.

## `p1/`

- `summary.json`: provider-level adaptive-search results.
- `session_metrics.csv`: 40 session-level observations.

## `temporal/`

- `README.md`: short temporal report.
- `summary.json`: provider-level retrieval and agent repeatability metrics. Per-query URL lists and model-generated search strings are not published here.

## `costs/`

- `tencent_cost_reconciliation.json`: source price, exchange-rate assumption, call counts, and USD totals.

All cost values used for provider comparison are in U.S. dollars.
