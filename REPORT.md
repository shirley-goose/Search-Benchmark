# Where Exa Differentiates Against Lower-Cost Chinese Search APIs

## SearchBench-3: DeepSeek Search vs. Tencent Yuanbao SearchPro vs. Exa 3.0

**Study date:** October 2026  
**Scope:** 60-query retrieval benchmark, 20-task fixed-budget agent study, 10-task adaptive agent study, and short-horizon repeats  
**Question:** As lower-cost Chinese search APIs enter the agentic-search market, where does Exa retain a measurable advantage?

## Executive summary

This study suggests that Exa's strongest advantage is not the price of an individual search call. It is the ability to return authoritative, answer-ready evidence with less downstream model context.

Four results support that conclusion:

1. **Exa retrieved authoritative sources more consistently.** On 60 queries, Exa Lite found a predeclared authoritative domain on 100% of tasks and Exa Auto on 98.3%, compared with 75% for both DeepSeek Search and Tencent Yuanbao SearchPro.
2. **Exa's retrieved evidence scored substantially higher.** Under the same isolated Claude Opus evaluation, Exa Lite averaged 14.62/16 and Exa Auto 14.53/16, versus 12.02 for DeepSeek and 11.85 for Tencent. All four Exa-versus-Chinese-provider gaps were statistically significant after multiple-comparison correction; Lite and Auto were statistically indistinguishable.
3. **Better retrieval offset higher search pricing.** In the fixed three-search agent study, Exa Lite used about 16% fewer Claude input tokens than DeepSeek and 30% fewer than Tencent. Its estimated total cost was $1.497, slightly below DeepSeek's $1.514 and Tencent's $1.908.
4. **The main signals reproduced.** In a second time window, Exa Lite and Auto again achieved 100% authoritative-domain coverage in the agent study. Their P0 result sets also retained about 80% of baseline URLs, compared with 60% for DeepSeek and 66% for Tencent.

The clearest product result is **Exa Lite**. It combined the best authoritative-source coverage, the highest evidence-quality score, latency close to DeepSeek, and the lowest estimated end-to-end cost in the fixed-budget agent study.

These findings do not establish a universal search ranking or externally verified factual accuracy. They do establish a useful competitive signal: **on this benchmark, Exa supplied more useful evidence per unit of downstream model context.**

## 1. Benchmark design

The benchmark compared four retrieval configurations:

- DeepSeek Search
- Tencent Yuanbao SearchPro
- Exa 3.0 Lite
- Exa 3.0 Auto

The base dataset contains 60 queries, with ten each in current news, technical documentation, academic research, commerce/local information, finance/regulation, and Chinese-web search. Each query includes a success criterion and expected authoritative domains.

The study used four complementary stages:

| Stage | Scope | What it measures |
|---|---:|---|
| Retrieval benchmark | 60 queries × 4 providers | Completion, latency, authoritative-domain coverage, and search cost |
| Evidence evaluation | 60 queries × 4 providers | Groundedness, authority, completeness, and evaluator confidence under a common context format |
| Fixed-budget agent study | 20 tasks × 4 providers; 3 searches per task | Model-token use, latency, evidence coverage, and total estimated cost |
| Adaptive agent study | 10 tasks × 4 providers; up to 10 searches | Search efficiency and total estimated cost when the agent chooses when to stop |

The retrieval and agent stages were also repeated after roughly two to four days to test short-horizon reproducibility.

All cost figures in this report are in U.S. dollars. Tencent's supplied account rate of 20 CNY per 1,000 calls was converted at **6.6861 CNY per USD**. This gives a Tencent search price of approximately **$2.991 per 1,000 calls**. The conversion is for comparability and does not imply a billing currency change. [Exchange-rate source](https://www.federalreserve.gov/releases/h10/Current/default.htm)

## 2. Retrieval quality and latency

All four providers completed all 60 queries.

| Provider | Completed | Retrieval p50 / p90 | Authoritative-domain coverage | Retrieval cost |
|---|---:|---:|---:|---:|
| DeepSeek Search | 60/60 | **565 / 699 ms** | 75.0% | **$0.045** |
| Tencent Yuanbao SearchPro | 60/60 | 1005 / 1230 ms | 75.0% | $0.179 |
| Exa Lite | 60/60 | 582 / 1066 ms | **100.0%** | $0.240 |
| Exa Auto | 60/60 | 1333 / 2063 ms | 98.3% | $0.420 |

DeepSeek was the fastest and cheapest retrieval API in this test. Exa's advantage was source selection: Lite improved authoritative-domain coverage by 25 percentage points over both Chinese providers while adding only 17 ms to DeepSeek's median latency.

The domain metric is intentionally narrow. It asks whether at least one expected official or primary-source domain appeared in the top ten results. It is reproducible and strategically relevant for agents, but it is not a complete relevance or ranking metric.

## 3. Answer-ready evidence

For every query-provider pair, the evaluator received only that provider's first four results, using the same prompt and per-result character limit. Claude Opus 4.6 then produced a short cited answer and four 0–4 ratings: groundedness, source authority, completeness, and confidence.

| Provider | Mean score /16 | 95% paired-query bootstrap interval | Total /960 |
|---|---:|---:|---:|
| Exa Lite | **14.62** | [14.02, 15.13] | 877 |
| Exa Auto | 14.53 | [13.95, 15.05] | 872 |
| DeepSeek Search | 12.02 | [11.12, 12.90] | 721 |
| Tencent Yuanbao SearchPro | 11.85 | [10.87, 12.77] | 711 |

Exa Lite exceeded DeepSeek by 2.60 points and Tencent by 2.77 points. Exa Auto exceeded them by 2.52 and 2.68 points. The four Exa-versus-Chinese-provider comparisons remained significant after Holm correction (`adjusted p = 0.00003`). The difference between Lite and Auto was not significant.

The largest descriptive advantages appeared in technical documentation and finance/regulatory tasks, where primary documentation and authoritative sources are especially valuable. The Chinese-web subset did not show the expected Tencent lead: Exa scored higher descriptively, although ten queries are too few to support a broad market conclusion.

These scores measure the quality of evidence available to a common answer model. They should not be read as independently verified factual accuracy.

## 4. End-to-end agent economics

### 4.1 Fixed three-search budget

The fixed-budget study ran 20 tasks across four independent Claude Sonnet 4.5 sessions per task. Each session made exactly three searches against its assigned provider. Model settings, result counts, evidence formatting, and context limits were held constant.

| Provider | Session p50 / p90 | Retrieval p50 / p90 | Authoritative-domain coverage | Claude input tokens | Total estimated cost |
|---|---:|---:|---:|---:|---:|
| DeepSeek Search | 14.6 / 18.5 s | **533 / 616 ms** | 90% | 439,874 | $1.514 |
| Tencent Yuanbao SearchPro | 15.9 / 19.3 s | 946 / 1246 ms | 95% | 525,651 | $1.908 |
| Exa Lite | 16.0 / 18.5 s | 614 / 1133 ms | **100%** | 368,269 | **$1.497** |
| Exa Auto | 18.3 / 21.0 s | 1648 / 2508 ms | **100%** | **362,818** | $1.660 |

Exa Lite used about 71,600 fewer input tokens than DeepSeek and 157,400 fewer than Tencent. That reduction was sufficient to offset Lite's higher search-call price and produce the lowest total estimate in this cohort.

This is the study's most important economic result: **search-call price alone did not predict agent cost.** Evidence density and source selection affected how much context the reasoning model had to process.

### 4.2 Adaptive search

In the smaller adaptive study, agents could stop when they believed they had enough evidence or continue for up to ten searches.

| Provider | Complete sessions | Mean searches per task | Total estimated cost |
|---|---:|---:|---:|
| DeepSeek Search | 10/10 | 3.20 | $1.089 |
| Tencent Yuanbao SearchPro | 10/10 | 4.10 | $1.485 |
| Exa Lite | 10/10 | 3.10 | $0.842 |
| Exa Auto | 10/10 | **2.40** | **$0.667** |

Exa Auto used 25% fewer searches than DeepSeek, 41% fewer than Tencent, and 23% fewer than Lite. This is a small exploratory cohort, but it suggests where Auto's higher per-call price may pay off: workloads in which better first-pass retrieval allows an agent to stop earlier.

## 5. Short-horizon reproducibility

The 60-query retrieval benchmark was repeated after 92.23 hours, and the fixed-budget agent study was repeated after 53.31 hours. Every call and session completed successfully.

| Provider | Retrieval authority, baseline → repeat | Baseline URL retention | Agent authority, baseline → repeat | Agent input tokens, baseline → repeat | Agent cost, baseline → repeat |
|---|---:|---:|---:|---:|---:|
| DeepSeek Search | 75.0% → 73.3% | 60.4% | 90% → 90% | 439,874 → 430,770 | $1.514 → $1.485 |
| Tencent Yuanbao SearchPro | 75.0% → 76.7% | 65.8% | 95% → 90% | 525,651 → 522,185 | $1.908 → $1.899 |
| Exa Lite | **100.0% → 98.3%** | **81.7%** | **100% → 100%** | **368,269 → 362,918** | **$1.497 → $1.479** |
| Exa Auto | **98.3% → 100.0%** | **80.0%** | **100% → 100%** | 362,818 → 367,387 | $1.660 → $1.670 |

The repeat supports two conclusions. First, Exa's authoritative-source advantage was not confined to one snapshot. Second, Lite's context-efficiency result reproduced: it again used about 16% fewer input tokens than DeepSeek and 30% fewer than Tencent, with a slightly lower total estimate than DeepSeek.

URL retention is a stability measure, not a relevance score. Even so, Exa's approximately 80% retention—versus 60–66% for the Chinese providers—suggests a more stable result set over the observed interval.

## 6. What Exa appears to win

### Authoritative evidence

Exa more consistently surfaced official specifications, regulator pages, academic sources, and other predeclared authoritative domains. For agent systems, one strong primary source can be more valuable than several loosely relevant secondary pages.

### Context efficiency

Exa Lite's evidence required materially fewer downstream input tokens. This creates an economic advantage that is invisible in per-search pricing and becomes more important as answer-model context and reasoning costs rise.

### A strong Lite tier

Lite was not merely a cheaper version of Auto in this study. It matched Auto on measured evidence quality, was substantially faster, and delivered the best fixed-budget agent economics. It is the most direct Exa response to lower-cost competitors.

### Adaptive-task potential for Auto

Auto was less attractive under a fixed search budget but strongest when the agent could stop early. Its product value is therefore better tested on complex, adaptive workflows than on fixed-query retrieval alone.

## 7. Boundaries and next research

This is a serious pilot, not a final market leaderboard. Its main limitations are:

- **No complete gold-answer set.** The benchmark measures evidence quality and source coverage, but does not yet verify every final claim against a time-stamped factual key.
- **Limited sample size.** Sixty retrieval queries, twenty fixed-budget tasks, and ten adaptive tasks can identify meaningful signals but cannot represent the full search market.
- **Common-context evaluation.** Equal result and snippet caps improve experimental fairness, but may not capture every provider's best native content mode.
- **Single answer-model family.** Agent-cost findings may shift with different reasoning models, context pricing, or tool-use behavior.
- **Short time horizon.** The repeat demonstrates near-term reproducibility, not long-run index stability.
- **Exploratory Chinese-web coverage.** The study did not observe a Tencent advantage, but a larger China-specific set is required before drawing a strong regional conclusion.

The highest-value extension is not simply more API calls. It is a gold-backed benchmark with 30 expert-reviewed calibration questions followed by a 100–150 query stratified evaluation. Each question should include a cutoff time, required facts, acceptable values or ranges, primary sources, and an explicit scoring rubric. Two independent reviewers and adjudication would make it possible to report factual accuracy and cost per correct task.

A second useful extension would compare the current equal-context protocol with provider-native content modes. That would test whether Exa's richer retrieval output creates an additional production advantage beyond the conservative comparison reported here.

## Conclusion

DeepSeek and Tencent are credible competitors. DeepSeek demonstrated excellent latency and very low per-call pricing, while Tencent brings distribution and ecosystem strengths that this benchmark was not designed to measure.

The measured case for Exa is different:

> Exa—especially Exa Lite—returned more authoritative, answer-ready evidence, and that evidence reduced downstream model context enough to offset higher search-call pricing.

For agentic search, the durable competitive question is not the cost of one retrieval request. It is the cost and reliability of reaching a supported answer. On this pilot, Exa showed a meaningful advantage on that higher-level objective.
