#!/usr/bin/env node
/* SearchBench-3 Agentic-20.  Credentials are read only from the process environment. */
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('searchbench3');
const value = (flag, fallback) => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : fallback;
const has = flag => process.argv.includes(flag);
const maxUsd = Number(value('--max-usd', '40'));
const smoke = has('--smoke');
const runLabel = value('--run-label', smoke ? 'agentic20-smoke' : 'agentic20');
const model = value('--model', process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929');
const maxToolCalls = Number(value('--max-tool-calls', smoke ? '1' : '3'));
const maxTokens = Number(value('--max-tokens', smoke ? '500' : '900'));
const dryRun = has('--dry-run');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = join(root, 'runs', `${runLabel}-${stamp}`);
const keys = Object.fromEntries(['ANTHROPIC_API_KEY', 'EXA_API_KEY', 'DEEPSEEK_API_KEY', 'TENCENT_WSA_API_KEY'].map(k => [k, process.env[k]]));
const required = Object.entries(keys).filter(([, v]) => !v).map(([k]) => k);
const rates = { input: Number(process.env.ANTHROPIC_INPUT_USD_PER_MTOK || 3), output: Number(process.env.ANTHROPIC_OUTPUT_USD_PER_MTOK || 15), deepseek: Number(process.env.DEEPSEEK_SEARCH_USD_PER_CALL || 0.00075), tencent: Number(process.env.TENCENT_SEARCH_USD_PER_CALL || 0.00299128), exa_lite: Number(process.env.EXA_LITE_USD_PER_CALL || 0.004), exa_auto: Number(process.env.EXA_AUTO_USD_PER_CALL || 0.007) };
const pricingComplete = Object.values(rates).every(Number.isFinite) && Object.values(rates).every(x => x >= 0);
const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));
const now = () => performance.now();
const json = async (url, init) => { const start = now(); const response = await fetch(url, init); const text = await response.text(); let body; try { body = JSON.parse(text); } catch { body = { _non_json: text.slice(0, 1000) }; } return { status: response.status, latency_ms: Math.round(now() - start), body }; };
let lastExaRequestAt = 0;
async function paceExa() {
  // Exa account limit supplied by the benchmark owner: at most 10 requests/second.
  const wait = Math.max(0, 100 - (Date.now() - lastExaRequestAt));
  if (wait) await sleep(wait);
  lastExaRequestAt = Date.now();
}

const data = JSON.parse(await readFile(join(root, 'dataset.json'), 'utf8'));
const taskIds = JSON.parse(await readFile(join(root, 'agentic20.json'), 'utf8'));
const allTasks = taskIds.map(id => data.find(x => x.id === id)).filter(Boolean);
if (allTasks.length !== 20) throw new Error('agentic20.json must name exactly 20 existing dataset tasks');
const tasks = smoke ? allTasks.slice(0, 1) : allTasks;
const allProviders = ['deepseek_search', 'tencent_yuanbao_searchpro', 'exa_lite', 'exa_auto'];
const requestedProviders = value('--providers', allProviders.join(',')).split(',').map(x => x.trim()).filter(Boolean);
const unknownProviders = requestedProviders.filter(provider => !allProviders.includes(provider));
if (unknownProviders.length) throw new Error(`Unknown provider(s): ${unknownProviders.join(', ')}`);
const providers = allProviders.filter(provider => requestedProviders.includes(provider));
if (!providers.length) throw new Error('At least one provider is required');
const settings = { model, max_tool_calls: maxToolCalls, tool_call_policy: 'exactly_budget_then_answer', max_tokens: maxTokens, temperature: 0, provider_runs_per_task: providers.length, retrieval_cache: 'disabled' };
const preflight = { timestamp: new Date().toISOString(), dry_run: dryRun, smoke, settings, task_count: tasks.length, provider_count: providers.length, run_count: tasks.length * providers.length, credential_names_missing: required, prices_usd: rates, pricing_note: 'Tencent rate converted from 20 CNY per 1,000 calls at 6.6861 CNY/USD.', pricing_complete: pricingComplete, estimated_upper_bound_usd: null, execution_decision: null, decision: null };
// A conservative reservation: each Claude turn may consume the declared output cap plus 12k input tokens.
const perRunClaude = (maxToolCalls + 1) * ((12000 / 1e6) * rates.input + (maxTokens / 1e6) * rates.output);
const perRunRetrieval = Math.max(rates.deepseek, rates.tencent, rates.exa_lite, rates.exa_auto) * maxToolCalls;
preflight.estimated_upper_bound_usd = Number((tasks.length * providers.length * (perRunClaude + perRunRetrieval)).toFixed(4));
if (required.length) preflight.execution_decision = 'blocked_missing_credentials';
else if (!pricingComplete) preflight.execution_decision = 'blocked_missing_price_configuration';
else if (preflight.estimated_upper_bound_usd > maxUsd) preflight.execution_decision = 'blocked_budget_reservation_exceeds_limit';
else preflight.execution_decision = 'approved_to_run';
preflight.decision = dryRun ? `dry_run_${preflight.execution_decision}` : preflight.execution_decision;
await mkdir(out, { recursive: true });
await writeFile(join(out, 'preflight.json'), JSON.stringify(preflight, null, 2));
if (dryRun) { console.log(JSON.stringify({ output: out, preflight }, null, 2)); process.exit(0); }
if (preflight.execution_decision !== 'approved_to_run') throw new Error(`Preflight ${preflight.execution_decision}; see ${join(out, 'preflight.json')}`);

async function providerSearch(provider, query) {
  if (provider === 'deepseek_search') return json('https://api.deepseek.com/v1/tools/search', { method: 'POST', headers: { Authorization: `Bearer ${keys.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query, count: 10, need_content: false }) });
  if (provider.startsWith('exa')) { await paceExa(); return json('https://api.exa.ai/search', { method: 'POST', headers: { 'x-api-key': keys.EXA_API_KEY, 'Exa-Beta': 'dynamic-highlights-2026-08-28', 'Content-Type': 'application/json' }, body: JSON.stringify({ query, type: provider === 'exa_lite' ? 'lite' : 'auto', numResults: 10, contents: { highlights: { dynamic: true } } }) }); }
  const host = 'api.wsa.cloud.tencent.com';
  const payload = JSON.stringify({ Query: query, Cnt: 10, Switch: 'open_yuanbao' });
  return json(`https://${host}/SearchPro`, { method: 'POST', headers: { Authorization: `Bearer ${keys.TENCENT_WSA_API_KEY}`, 'Content-Type': 'application/json; charset=utf-8' }, body: payload });
}
function normalize(provider, body) {
  const source = provider === 'deepseek_search' ? body?.results : provider.startsWith('exa') ? body?.results : body?.Response?.Pages || body?.Response?.Data || body?.Response?.SearchResults || [];
  // Keep the same 10-result / 8 KB evidence cap for every provider and tool call.
  return (Array.isArray(source) ? source : []).slice(0, 10).map(x => typeof x === 'string' ? JSON.parse(x) : x).map(x => ({ title: String(x.title || x.Title || x.name || x.Name || '').slice(0, 180), url: x.url || x.URL || x.link || x.Link || x.WebUrl || x.web_url || '', snippet: String(x.summary || x.snippet || x.text || x.highlights?.join(' ') || x.content || x.passage || x.Summary || x.Content || '').slice(0, 600) })).filter(x => x.url || x.title);
}
const system = `You are SearchBench-3's answer agent. Answer only the assigned question using evidence returned by the one search tool. You will be required to call the tool exactly ${maxToolCalls} time(s), one call per turn; make each query concise and targeted. Then give a concise answer with numbered source citations [1], [2] drawn from tool results. Do not use prior knowledge for factual claims. If evidence is insufficient, say so.`;
async function invokeClaude(task, provider) {
  const tool = { name: 'search', description: 'Live web search for the assigned benchmark only. It returns titles, URLs, and snippets. Results are not cached.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false } };
  let messages = [{ role: 'user', content: `Question: ${task.query}\nSuccess criteria: ${task.criteria}\nUse the search tool and answer the question.` }];
  const retrievals = [], turns = [], usage = { input_tokens: 0, output_tokens: 0 };
  for (let turn = 0; turn <= maxToolCalls; turn++) {
    const toolChoice = turn < maxToolCalls
      ? { type: 'any', disable_parallel_tool_use: true }
      : { type: 'none' };
    const response = await json('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': keys.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0, system, tools: [tool], tool_choice: toolChoice, messages }) });
    if (response.status !== 200) throw new Error(`Anthropic HTTP ${response.status}: ${String(response.body?.error?.message || '').slice(0, 200)}`);
    usage.input_tokens += Number(response.body?.usage?.input_tokens || 0); usage.output_tokens += Number(response.body?.usage?.output_tokens || 0);
    const content = response.body.content || []; const calls = content.filter(x => x.type === 'tool_use');
    turns.push({ stop_reason: response.body.stop_reason, usage: response.body.usage || {}, tool_calls: calls.length });
    if (!calls.length) return { answer: content.filter(x => x.type === 'text').map(x => x.text).join('\n').trim(), retrievals, turns, usage };
    if (calls.length > maxToolCalls - retrievals.length) throw new Error('Claude attempted to exceed the fixed tool-call budget');
    const toolResults = [];
    for (const call of calls) {
      const query = String(call.input?.query || '').slice(0, 1000); const result = await providerSearch(provider, query);
      const normalized = normalize(provider, result.body); const event = { call_id: call.id, query, http_status: result.status, latency_ms: result.latency_ms, result_count: normalized.length, results: normalized };
      retrievals.push(event);
      toolResults.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify({ results: normalized, status: result.status === 200 ? 'ok' : 'search_failed' }) });
    }
    messages = [...messages, { role: 'assistant', content }, { role: 'user', content: toolResults }];
  }
  throw new Error('Unreachable');
}
const records = [], estimate = () => records.reduce((sum, r) => sum + (r.cost?.estimated_usd || 0), 0);
for (const task of tasks) for (const provider of providers) {
  if (estimate() >= maxUsd) throw new Error(`Runtime budget limit reached before ${task.id}/${provider}`);
  const record = { run_id: randomUUID(), task_id: task.id, category: task.category, provider, model, settings, started_at: new Date().toISOString(), status: 'error' };
  try {
    const result = await invokeClaude(task, provider); const rateKey = provider === 'deepseek_search' ? 'deepseek' : provider === 'tencent_yuanbao_searchpro' ? 'tencent' : provider; const searchCostUsd = result.retrievals.length * rates[rateKey];
    const claudeCost = result.usage.input_tokens / 1e6 * rates.input + result.usage.output_tokens / 1e6 * rates.output;
    const failedRetrievals = result.retrievals.filter(call => call.http_status !== 200 || !call.result_count);
    Object.assign(record, { status: failedRetrievals.length ? 'retrieval_failed' : 'ok', answer: result.answer, retrievals: result.retrievals, turns: result.turns, usage: result.usage, cost: { claude_estimated_usd: claudeCost, retrieval_estimated_usd: searchCostUsd, estimated_usd: claudeCost + searchCostUsd } });
    if (failedRetrievals.length) record.error = `${failedRetrievals.length}/${result.retrievals.length} tool calls returned no usable results`;
  } catch (error) { record.error = String(error.message).slice(0, 500); }
  record.completed_at = new Date().toISOString(); records.push(record);
  await writeFile(join(out, 'records.json'), JSON.stringify(records, null, 2));
  await sleep(250);
}
const summary = providers.map(provider => { const rs = records.filter(r => r.provider === provider); return { provider, completed: rs.filter(r => r.status === 'ok').length, attempted: rs.length, mean_tool_calls: rs.length ? rs.reduce((s, r) => s + (r.retrievals?.length || 0), 0) / rs.length : 0, estimated_usd: rs.reduce((s, r) => s + (r.cost?.estimated_usd || 0), 0) }; });
await writeFile(join(out, 'summary.json'), JSON.stringify({ preflight, total_estimated_usd: estimate(), providers: summary, requires_human_checks: ['Verify each provider billing dashboard against estimates; provider responses do not provide billable totals.', 'Blind human factual scoring against maintained answer keys is required before quality ranking.'] }, null, 2));
console.log(JSON.stringify({ output: out, completed: records.filter(r => r.status === 'ok').length, total_estimated_usd: estimate() }, null, 2));
