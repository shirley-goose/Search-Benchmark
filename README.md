# SearchBench-3

An independent benchmark of **Exa 3.0 Lite and Auto**, **DeepSeek Search**, and **Tencent Yuanbao SearchPro** as retrieval backends for LLM agents.

The motivating question is simple:

> When lower-cost search APIs compete for agent workloads, does better retrieval quality reduce downstream model work enough to justify a higher per-search price?

## Results at a glance

| Metric | DeepSeek Search | Tencent Yuanbao | Exa Lite | Exa Auto |
|---|---:|---:|---:|---:|
| Authoritative-domain coverage, 60-query retrieval test | 75.0% | 75.0% | **100.0%** | 98.3% |
| Evidence-quality score, mean /16 | 12.02 | 11.85 | **14.62** | 14.53 |
| Fixed-budget agent input tokens | 439,874 | 525,651 | 368,269 | **362,818** |
| Fixed-budget agent total cost | $1.514 | $1.908 | **$1.497** | $1.660 |
| Adaptive-agent searches per task | 3.20 | 4.10 | 3.10 | **2.40** |
| Retrieval URL retention after 92 hours | 60.4% | 65.8% | **81.7%** | 80.0% |

The strongest result is **Exa Lite**: it paired the best authoritative-source coverage with the highest evidence-quality score and the lowest estimated total cost in the fixed three-search agent study. Exa Auto was most promising in the adaptive study, where agents using it stopped after fewer searches.

These are pilot findings. The benchmark supports claims about evidence authority, context efficiency, and observed agent economics—not a universal factual-accuracy leaderboard.

## Start here

- Read the [full report](REPORT.md) for findings and product implications.
- Read the [methodology](docs/METHODOLOGY.md) for experimental controls and metrics.
- Read the [data card](docs/DATA_CARD.md) for dataset scope and intended use.
- Browse [analysis-ready results](results/README.md) for per-query, per-session, statistical, temporal, and cost outputs.

## Study design

The benchmark contains four complementary stages:

1. **Retrieval:** 60 queries across six categories, run against four provider configurations.
2. **Evidence evaluation:** the first four results from each query-provider pair were evaluated under an identical context format.
3. **Fixed-budget agents:** 20 tasks, four provider-bound Claude sessions per task, and exactly three searches per session.
4. **Adaptive agents:** 10 tasks, with agents allowed to stop naturally or continue up to ten searches.

The retrieval and fixed-budget stages were repeated in a second time window to test short-horizon reproducibility.

## What is public here

This repository is intentionally presentation-focused. It includes:

- the complete benchmark questions and task selections;
- the full study report and methodology;
- per-query retrieval metrics and evidence scores;
- per-session agent metrics;
- paired statistical results;
- temporal stability summaries;
- cost reconciliation in U.S. dollars;
- credential-free runner source code.

Raw provider responses, model conversations, development runs, and diagnostic provenance are excluded. This keeps the repository reviewable and avoids republishing large quantities of third-party page text. The full audit archive can be shared on request, subject to provider and source-content terms.

## Repository layout

```text
.
├── README.md
├── REPORT.md
├── package.json
├── docs/
│   ├── METHODOLOGY.md
│   ├── DATA_CARD.md
│   ├── AGENTIC20_PROTOCOL.md
│   └── P1_PROTOCOL.md
├── searchbench3/
│   ├── dataset.json
│   ├── agentic20.json
│   ├── p1.json
│   └── scripts/
├── scripts/
│   ├── verify_results.mjs
│   └── build_manifest.mjs
└── results/
    ├── p0/
    ├── agentic20/
    ├── p1/
    ├── temporal/
    └── costs/
```

## Cost basis

All comparison tables use U.S. dollars. Tencent's supplied account rate of 20 CNY per 1,000 calls was converted at 6.6861 CNY/USD, giving approximately **$2.991 per 1,000 calls**. The exchange-rate reference is the [Federal Reserve H.10 release for October 16, 2026](https://www.federalreserve.gov/releases/h10/Current/default.htm).

## Reproduction notes

The runners read credentials from environment variables and do not serialize secret values. Live reruns may incur charges, and provider APIs, model identifiers, prices, and rate limits may change. Freeze the dataset and pricing assumptions before treating a new run as comparable.

Run `npm run verify` to recalculate the headline values from the published result files. Run `npm run manifest` to regenerate `MANIFEST.sha256` after an intentional repository change.

## License

This repository is available under the [MIT License](LICENSE).

