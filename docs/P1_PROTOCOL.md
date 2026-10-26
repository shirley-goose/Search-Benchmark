# Adaptive agent protocol

## Purpose

This stage tests search efficiency when an agent may stop after gathering sufficient evidence or continue searching up to a fixed ceiling.

## Configuration

- Tasks: 10, selected in `searchbench3/p1.json`
- Providers: DeepSeek Search, Tencent Yuanbao SearchPro, Exa Lite, and Exa Auto
- Answer model: Claude Sonnet 4.5
- Temperature: 0
- Search policy: autonomous, with a maximum of 10 searches per session
- Maximum results per search: 10
- Maximum snippet length: 600 characters
- Retrieval cache: disabled
- Sessions: 40 total, one independent provider-bound session for every task-provider pair

The execution order is randomized across provider-task pairs. Provider sessions do not share retrieved evidence or conversation state.

## Credentials

Set only the credentials required by the providers being run:

- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `TENCENT_WSA_API_KEY`
- `EXA_API_KEY`

Tencent retrieval cost defaults to `$0.00299128` per call and can be overridden with `TENCENT_SEARCH_USD_PER_CALL` when reproducing the study under a different price assumption.

## Run

From the repository root:

```bash
node searchbench3/scripts/run_p1.mjs --config searchbench3/p1.json --dry-run
node searchbench3/scripts/run_p1.mjs --config searchbench3/p1.json --smoke --budget-usd 40
node searchbench3/scripts/run_p1.mjs --config searchbench3/p1.json --budget-usd 40
```

Live runs incur provider and model charges. Review the dry-run schedule and cost ceiling before execution.

## Interpretation

The primary outcome is searches per completed task, with latency, token use, and estimated cost as supporting measures. This cohort does not include independent gold-answer scoring, so it should not be used to claim cost per correct task.
