#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(cell); cell = ''; }
    else if (char === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const [header, ...records] = rows.filter(cells => cells.some(value => value !== ''));
  return records.map(cells => Object.fromEntries(header.map((key, index) => [key, cells[index]])));
}

const approx = (actual, expected, tolerance = 1e-9) => {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${expected}, received ${actual}`);
  }
};

const retrieval = parseCsv(await readFile('results/p0/retrieval_metrics.csv', 'utf8'));
const evidence = parseCsv(await readFile('results/p0/per_query_evidence_scores.csv', 'utf8'));
const agentic = await readJson('results/agentic20/summary.json');
const adaptive = await readJson('results/p1/summary.json');
const temporal = await readJson('results/temporal/summary.json');

if (retrieval.length !== 240) throw new Error(`Expected 240 retrieval rows, received ${retrieval.length}`);
if (evidence.length !== 240) throw new Error(`Expected 240 evidence rows, received ${evidence.length}`);
if (agentic.record_count !== 80) throw new Error(`Expected 80 fixed-budget sessions, received ${agentic.record_count}`);
if (adaptive.recorded_sessions !== 40) throw new Error(`Expected 40 adaptive sessions, received ${adaptive.recorded_sessions}`);

const providers = ['deepseek_search', 'tencent_yuanbao_searchpro', 'exa_lite', 'exa_auto'];
const expected = {
  deepseek_search: { coverage: 0.75, evidence: 12.016666666666667, tokens: 439874, fixedCost: 1.514457, calls: 3.2, adaptiveCost: 1.089231, retention: 0.6038888888888889 },
  tencent_yuanbao_searchpro: { coverage: 0.75, evidence: 11.85, tokens: 525651, fixedCost: 1.907855, calls: 4.1, adaptiveCost: 1.4850384971208925, retention: 0.658148148148148 },
  exa_lite: { coverage: 1, evidence: 14.616666666666667, tokens: 368269, fixedCost: 1.4968920000000001, calls: 3.1, adaptiveCost: 0.842314, retention: 0.8166666666666665 },
  exa_auto: { coverage: 0.9833333333333333, evidence: 14.533333333333333, tokens: 362818, fixedCost: 1.660464, calls: 2.4, adaptiveCost: 0.6672239999999999, retention: 0.7999999999999996 }
};

const headline = {};
for (const provider of providers) {
  const retrievalRows = retrieval.filter(row => row.provider === provider);
  const evidenceRows = evidence.filter(row => row.provider === provider);
  const adaptiveRow = adaptive.results.find(row => row.provider === provider);
  const temporalRow = temporal.p0_provider_summary.find(row => row.provider === provider);
  if (retrievalRows.length !== 60 || evidenceRows.length !== 60 || !adaptiveRow || !temporalRow) {
    throw new Error(`Incomplete public data for ${provider}`);
  }
  const coverage = retrievalRows.filter(row => row.expected_domain_present === 'true').length / retrievalRows.length;
  const evidenceMean = evidenceRows.reduce((sum, row) => sum + Number(row.judge_score_0_16), 0) / evidenceRows.length;
  const fixed = agentic.providers[provider];
  approx(coverage, expected[provider].coverage);
  approx(evidenceMean, expected[provider].evidence);
  approx(fixed.input_tokens, expected[provider].tokens);
  approx(fixed.estimated_usd, expected[provider].fixedCost, 1e-6);
  approx(adaptiveRow.mean_calls, expected[provider].calls);
  approx(adaptiveRow.estimated_usd, expected[provider].adaptiveCost, 1e-6);
  approx(temporalRow.mean_url_retention, expected[provider].retention, 1e-9);
  headline[provider] = {
    authoritative_domain_coverage: coverage,
    evidence_score_mean_0_16: evidenceMean,
    fixed_agent_input_tokens: fixed.input_tokens,
    fixed_agent_estimated_usd: fixed.estimated_usd,
    adaptive_searches_per_task: adaptiveRow.mean_calls,
    adaptive_estimated_usd: adaptiveRow.estimated_usd,
    retrieval_url_retention: temporalRow.mean_url_retention
  };
}

console.log(JSON.stringify({ status: 'ok', counts: { retrieval: 240, evidence: 240, fixed_agent_sessions: 80, adaptive_sessions: 40 }, headline }, null, 2));
