#!/usr/bin/env node
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve('searchbench3');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const arg = (name, fallback) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : fallback;
const out = join(root, 'runs', `${arg('--run-label', 'pilot')}-${stamp}`);
const skipScoring = process.argv.includes('--skip-scoring');
const keys = Object.fromEntries(['DEEPSEEK_API_KEY', 'TENCENT_SECRET_ID', 'TENCENT_SECRET_KEY', 'TENCENT_WSA_API_KEY', 'EXA_API_KEY'].map(k => [k, process.env[k]]));
const allData = JSON.parse(await readFile(join(root, 'dataset.json'), 'utf8'));
const offset = Number(arg('--offset', '0'));
const limit = Number(arg('--limit', String(allData.length)));
const data = allData.slice(offset, offset + limit);
await mkdir(join(out, 'raw'), { recursive: true });
const pause = ms => new Promise(r => setTimeout(r, ms));
const now = () => performance.now();
const pct = (xs, p) => { const a = xs.filter(Number.isFinite).sort((a,b)=>a-b); return a.length ? a[Math.min(a.length - 1, Math.ceil(p * a.length) - 1)] : null; };
const sha256 = x => createHash('sha256').update(x).digest('hex');
const hmac = (key, msg, hex = false) => createHmac('sha256', key).update(msg).digest(hex ? 'hex' : undefined);
const json = async (url, init) => { const t = now(); const r = await fetch(url, init); const text = await r.text(); let body; try { body = JSON.parse(text); } catch { body = { _non_json: text.slice(0, 1000) }; } return { status: r.status, latency_ms: Math.round(now() - t), body }; };
const compact = x => typeof x === 'string' ? x.slice(0, 2400) : x;

function normalize(provider, body) {
  const candidates = provider === 'deepseek_search' ? body?.results : provider.startsWith('exa') ? body?.results : body?.Response?.Pages || body?.Response?.Data || body?.Response?.SearchResults || body?.Response?.WebPages || [];
  const arr = Array.isArray(candidates) ? candidates : [];
  return arr.slice(0, 10).map(x => typeof x === 'string' ? JSON.parse(x) : x).map(x => ({
    title: compact(x.title || x.Title || x.name || x.Name || ''),
    url: x.url || x.URL || x.link || x.Link || x.WebUrl || x.web_url || '',
    // Yuanbao Pages use lowercase `content` (dynamic summary) and `passage`
    // (standard summary). Preserve the richer dynamic summary where present.
    snippet: compact(x.summary || x.snippet || x.text || x.highlights?.join(' ') || x.content || x.passage || x.Summary || x.Content || x.Description || ''),
    published_date: x.publishedDate || x.date || x.Date || x.PublishTime || null
  })).filter(x => x.url || x.title);
}

async function deepseekSearch(query) {
  return json('https://api.deepseek.com/v1/tools/search', { method:'POST', headers:{ Authorization:`Bearer ${keys.DEEPSEEK_API_KEY}`, 'Content-Type':'application/json' }, body:JSON.stringify({query, count:10, need_content:false}) });
}
async function exaSearch(query, type) {
  return json('https://api.exa.ai/search', { method:'POST', headers:{ 'x-api-key':keys.EXA_API_KEY, 'Exa-Beta':'dynamic-highlights-2026-08-28', 'Content-Type':'application/json' }, body:JSON.stringify({query, type, numResults:10, contents:{highlights:{dynamic:true}}}) });
}
async function tencentSearch(query) {
  if (keys.TENCENT_WSA_API_KEY) {
    const payload = JSON.stringify({Query:query, Cnt:10, Switch:'open_yuanbao'});
    return json('https://api.wsa.cloud.tencent.com/SearchPro', {method:'POST', headers:{Authorization:`Bearer ${keys.TENCENT_WSA_API_KEY}`, 'Content-Type':'application/json; charset=utf-8'}, body:payload});
  }
  const host = 'wsa.tencentcloudapi.com', service = 'wsa', action = 'SearchPro', version = '2025-05-08';
  const date = new Date(), dateStamp = date.toISOString().slice(0,10);
  const timestamp = Math.floor(date.getTime()/1000), payload = JSON.stringify({Query:query, Cnt:10, Switch:'open_yuanbao'});
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\n`, signedHeaders = 'content-type;host';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256(payload)}`;
  const credentialScope = `${dateStamp}/${service}/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${sha256(canonicalRequest)}`;
  const secretDate = hmac(`TC3${keys.TENCENT_SECRET_KEY}`, dateStamp);
  const secretService = hmac(secretDate, service), secretSigning = hmac(secretService, 'tc3_request');
  const signature = hmac(secretSigning, stringToSign, true);
  const authorization = `TC3-HMAC-SHA256 Credential=${keys.TENCENT_SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return json(`https://${host}`, {method:'POST', headers:{Authorization:authorization, 'Content-Type':'application/json; charset=utf-8', Host:host, 'X-TC-Action':action, 'X-TC-Version':version, 'X-TC-Timestamp':String(timestamp)}, body:payload});
}
async function ask(prompt) {
  const r = await json('https://api.deepseek.com/chat/completions', {method:'POST', headers:{Authorization:`Bearer ${keys.DEEPSEEK_API_KEY}`, 'Content-Type':'application/json'}, body:JSON.stringify({model:'deepseek-flash', temperature:0, max_tokens:700, messages:[{role:'system',content:'You are a careful web-grounded evaluator. Do not claim facts not in the provided sources.'},{role:'user',content:prompt}]})});
  return { ...r, answer: r.body?.choices?.[0]?.message?.content || '', usage:r.body?.usage || null };
}
function sources(results) { return results.map((r,i)=>`[${i+1}] ${r.title}\n${r.url}\n${r.snippet}`).join('\n\n').slice(0, 14000); }
function authority(results, domains) { return results.some(r => { try { return domains.some(d => new URL(r.url).hostname.endsWith(d)); } catch { return false; } }); }

const providers = [
  ['deepseek_search', () => deepseekSearch],
  ['tencent_yuanbao_searchpro', () => tencentSearch],
  ['exa_lite', () => q => exaSearch(q, 'lite')],
  ['exa_auto', () => q => exaSearch(q, 'auto')]
];
const available = {deepseek_search:!!keys.DEEPSEEK_API_KEY, tencent_yuanbao_searchpro:!!keys.TENCENT_WSA_API_KEY || !!(keys.TENCENT_SECRET_ID && keys.TENCENT_SECRET_KEY), exa_lite:!!keys.EXA_API_KEY, exa_auto:!!keys.EXA_API_KEY};
const rows = [];
async function collect(provider, factory, item) {
  const row = {run_id:stamp, query_id:item.id, category:item.category, query:item.query, provider, criteria:item.criteria, expected_domains:item.domains, started_at:new Date().toISOString(), status:'skipped', ...(provider === 'tencent_yuanbao_searchpro' ? { tencent_auth_mode: keys.TENCENT_WSA_API_KEY ? 'bearer_wsa' : 'tc3_signature' } : {})};
  if (available[provider]) try { const res = await factory()(item.query); row.status=res.status === 200 && !res.body?.Response?.Error && !res.body?.error ? 'ok' : `http_${res.status}`; row.latency_ms=res.latency_ms; row.raw_file=`raw/${item.id}__${provider}.json`; row.results=normalize(provider, res.body); row.result_count=row.results.length; row.expected_domain_present=authority(row.results,item.domains); await writeFile(join(out,row.raw_file), JSON.stringify(res.body,null,2)); } catch (e) { row.status='error'; row.error=String(e.message).slice(0,500); }
  rows.push(row);
}
async function pool(tasks, limit, gap = 0) { let cursor = 0; await Promise.all(Array.from({length:Math.min(limit,tasks.length)}, async () => { while (cursor < tasks.length) { const task=tasks[cursor++]; await task(); if (gap) await pause(gap); } })); }
await Promise.all(providers.map(([provider, factory]) => pool(data.map(item => () => collect(provider, factory, item)), provider === 'deepseek_search' || provider.startsWith('exa') ? 1 : 10, provider === 'deepseek_search' ? 230 : provider.startsWith('exa') ? 250 : 0)));

const answerRows = rows.filter(r => !skipScoring && r.status === 'ok' && r.results.length && keys.DEEPSEEK_API_KEY);
for (let i=0; i<answerRows.length; i+=24) await Promise.all(answerRows.slice(i,i+24).map(async row => {
  const a = await ask(`Question: ${row.query}\nSuccess criteria: ${row.criteria}\nSources:\n${sources(row.results)}\n\nWrite a concise answer only from these sources. Cite source numbers like [1]. If sources do not support the answer, state the limitation.`);
  row.answer=a.answer; row.answer_latency_ms=a.latency_ms; row.answer_usage=a.usage;
  const j = await ask(`Score this web-grounded answer. Question: ${row.query}\nCriteria: ${row.criteria}\nExpected authoritative domains: ${row.expected_domains.join(', ')}\nSources:\n${sources(row.results)}\nAnswer:\n${row.answer}\n\nReturn ONLY JSON: {"correctness":0-4,"source_support":0-4,"authority":0-4,"needs_human_review":true|false,"reason":"<=25 words"}. Mark human review true for time-sensitive, regulated, local, ambiguous, missing authoritative sources, or any score below 3.`);
  row.judge_raw=j.answer; try { row.judge=JSON.parse(j.answer.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch { row.judge={needs_human_review:true,reason:'Judge output not parseable'}; }
  row.needs_human_review=!!row.judge.needs_human_review || !row.expected_domain_present || ['current_news','finance_regulatory','commerce_local'].includes(row.category);
}));

const costUsd = {deepseek_search:0.00075,tencent_yuanbao_searchpro:Number(process.env.TENCENT_SEARCH_USD_PER_CALL || 0.00299128),exa_lite:0.004,exa_auto:0.007};
const summary = providers.map(([p]) => { const rs=rows.filter(r=>r.provider===p), ok=rs.filter(r=>r.status==='ok'), judged=ok.filter(r=>r.judge); const avg=k=>judged.length ? judged.reduce((s,r)=>s+(Number(r.judge[k])||0),0)/judged.length : null; const base={provider:p, attempted:rs.length,succeeded:ok.length,p50_ms:pct(ok.map(r=>r.latency_ms),.5), p90_ms:pct(ok.map(r=>r.latency_ms),.9), avg_results:ok.length?ok.reduce((s,r)=>s+r.result_count,0)/ok.length:null, expected_domain_rate:ok.length?ok.filter(r=>r.expected_domain_present).length/ok.length:null, correctness:avg('correctness'), source_support:avg('source_support'), authority:avg('authority'), human_review:ok.filter(r=>r.needs_human_review).length,estimated_retrieval_cost_usd:ok.length*costUsd[p]}; return p==='tencent_yuanbao_searchpro'?{...base,pricing_basis:'20 CNY per 1000 calls converted at 6.6861 CNY/USD',tencent_auth_mode:keys.TENCENT_WSA_API_KEY?'bearer_wsa':'tc3_signature'}:base; });
const md = ['# SearchBench-3 temporal retrieval summary', '', `Run: ${stamp}`, '', '| Provider | OK / 60 | p50 / p90 ms | Expected-domain rate | Retrieval estimate |','|---|---:|---:|---:|---:|', ...summary.map(s=>`| ${s.provider} | ${s.succeeded}/${s.attempted} | ${s.p50_ms ?? '-'} / ${s.p90_ms ?? '-'} | ${s.expected_domain_rate === null?'-':(s.expected_domain_rate*100).toFixed(1)+'%'} | $${s.estimated_retrieval_cost_usd.toFixed(3)} |`), '', 'Tencent pricing uses a USD-converted rate of $2.991 per 1,000 calls. The baseline used TC3 Secret ID/Secret Key and the repeat used endpoint/API-key authentication; the account owner confirmed that both invoke the same underlying SearchPro model without retrieval-behavior differences.', '', 'This retrieval-only repeat intentionally skips model scoring. Compare per-query URL/domain overlap, authoritative-domain changes, latency, and failures against the baseline.'];
await writeFile(join(out,'results.json'),JSON.stringify(rows,null,2));
await writeFile(join(out,'summary.json'),JSON.stringify(summary,null,2));
await writeFile(join(out,'summary.md'),md.join('\n'));
await writeFile(join(out,'results.csv'),['query_id,category,provider,status,latency_ms,result_count,expected_domain_present,correctness,source_support,authority,needs_human_review',...rows.map(r=>[r.query_id,r.category,r.provider,r.status,r.latency_ms??'',r.result_count??'',r.expected_domain_present??'',r.judge?.correctness??'',r.judge?.source_support??'',r.judge?.authority??'',r.needs_human_review??''].map(v=>JSON.stringify(v)).join(','))].join('\n'));
console.log(JSON.stringify({output:out,summary},null,2));
