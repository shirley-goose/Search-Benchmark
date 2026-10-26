# Fixed-budget agent protocol

## Purpose

This stage tests whether retrieval quality changes downstream model context and total task cost when every provider receives the same search budget.

## Configuration

- Tasks: 20, selected in `searchbench3/agentic20.json`
- Providers: DeepSeek Search, Tencent Yuanbao SearchPro, Exa Lite, and Exa Auto
- Answer model: Claude Sonnet 4.5
- Temperature: 0
- Searches: exactly three sequential searches per session
- Maximum results per search: 10
- Maximum snippet length: 600 characters
- Retrieval cache: disabled
- Sessions: 80 total, one independent provider-bound session for every task-provider pair

The runner normalizes provider output into the same evidence structure before passing it to the answer model. Provider sessions do not share retrieved evidence or conversation state.

## Credentials

Set only the credentials required by the providers being run:

- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `TENCENT_WSA_API_KEY`
- `EXA_API_KEY`

The runner reads credentials from environment variables and does not write their values to output files.

## Run

From the repository root:

```bash
node searchbench3/scripts/run_agentic20.mjs --dry-run --max-usd 20
node searchbench3/scripts/run_agentic20.mjs --smoke --max-usd 20
node searchbench3/scripts/run_agentic20.mjs --max-usd 20
```

Live runs incur provider and model charges. Before comparing a new run with the published cohort, preserve the dataset, model identifier, prompt, result cap, snippet cap, search budget, and price assumptions.

## Published metrics

The public result layer reports completion, search calls, session and retrieval latency, authoritative-domain coverage, input/output tokens, retrieval cost, and total estimated cost. Raw retrieved text and final model answers are not published.
