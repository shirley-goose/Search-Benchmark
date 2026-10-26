# SearchBench-3 temporal repeat — 2026-10-25

## Timepoints

- P0 retrieval baseline: 2026-10-22T02:38:45.253Z; repeat: 2026-10-25T22:52:47.871Z; elapsed: **92.23 hours**.
- Agentic-20 baseline: 2026-10-23T17:37:10.286Z; repeat: 2026-10-25T22:55:34.014Z; elapsed: **53.31 hours**.
- P0 Tencent authentication: the baseline used TC3 Secret ID/Secret Key and the repeat used endpoint/API-key authentication. The account owner confirmed that both invoke the same underlying SearchPro model without retrieval-behavior differences.

## P0 retrieval stability

| Provider | Success baseline → repeat | Expected-domain coverage | p50/p90 latency ms | Mean URL retention | Mean domain retention | Authority gains / losses |
|---|---:|---:|---:|---:|---:|---:|
| DeepSeek Search | 60/60 → 60/60 | 75.0% → 73.3% | 565/699 → 541/636 | 60.4% | 70.0% | +3 / −4 |
| Tencent Yuanbao | 60/60 → 60/60 | 75.0% → 76.7% | 1005/1230 → 727/1165 | 65.8% | 80.3% | +1 / −0 |
| Exa Lite | 60/60 → 60/60 | 100.0% → 98.3% | 582/1066 → 598/965 | 81.7% | 85.2% | +0 / −1 |
| Exa Auto | 60/60 → 60/60 | 98.3% → 100.0% | 1333/2063 → 1553/2195 | 80.0% | 85.6% | +1 / −0 |

URL retention is the fraction of baseline normalized URLs that reappeared in the repeat top ten, averaged across 60 paired queries. Domain retention applies the same calculation to hostnames. It measures result stability, not relevance.

## Agentic-20 stability

| Provider | Completed | Expected-domain coverage | Claude input tokens | Session p50 ms | Retrieval p50 ms | Cost | Mean URL retention |
|---|---:|---:|---:|---:|---:|---:|---:|
| DeepSeek Search | 20/20 → 20/20 | 90.0% → 90.0% | 439,874 → 430,770 (-2.1%) | 14583 → 14490 | 533 → 526 | $1.514 → $1.485 | 58.1% |
| Tencent Yuanbao | 20/20 → 20/20 | 95.0% → 90.0% | 525,651 → 522,185 (-0.7%) | 15859 → 15585 | 946 → 790 | $1.908 → $1.899 | 81.4% |
| Exa Lite | 20/20 → 20/20 | 100.0% → 100.0% | 368,269 → 362,918 (-1.5%) | 16022 → 14598 | 614 → 652 | $1.497 → $1.479 | 66.2% |
| Exa Auto | 20/20 → 20/20 | 100.0% → 100.0% | 362,818 → 367,387 (+1.3%) | 18297 → 17170 | 1648 → 1435 | $1.660 → $1.670 | 63.5% |

All repeat sessions used the same Claude model identifier, temperature, prompt, evidence cap, three-search requirement, and task manifest as the baseline. URL retention is paired by task and provider across the union of each session's three retrieval result lists. Differences may reflect both changing search results and different model-generated search queries.

## Interpretation boundaries

- Two observations establish short-horizon repeatability, not long-run reliability or causal attribution.
- Latency comparisons are wall-clock snapshots and may reflect regional load or network conditions.
- Tencent P0 changed authentication paths, but the account owner confirmed service/model equivalence.
- Agentic answers have not been independently rescored for factual correctness; this repeat tests process stability, evidence coverage, token use, and cost.
