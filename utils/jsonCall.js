/**
 * Safe JSON call to Claude.
 * - Uses the Anthropic SDK.
 * - Extracts the first {...} or [...] block from the response (models sometimes
 *   slip a stray sentence before/after despite the strict-JSON instruction).
 * - Returns parsed JSON, or throws with the raw text for debugging.
 */
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function extractJson(text) {
  if (!text) throw new Error('Empty response from model');
  const trimmed = text.trim();

  // Strip markdown fences if present.
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const inner = fenced ? fenced[1].trim() : trimmed;

  // Try direct parse first.
  try { return JSON.parse(inner); } catch {}

  // Find the first { or [.
  const firstObj = inner.indexOf('{');
  const firstArr = inner.indexOf('[');
  const starts = [firstObj, firstArr].filter(i => i >= 0);
  if (!starts.length) throw new Error(`No JSON object/array found in response: ${inner.slice(0, 200)}`);
  const start = Math.min(...starts);

  // Walk from `start`, tracking bracket/brace stack + string state. Record the
  // last end position at depth 0. If we run out of text mid-structure
  // (truncation) we'll reconstruct by closing the open frames.
  const stack = [];      // '{' or '['
  let inString = false, escape = false, lastCompleteEnd = -1;

  for (let i = start; i < inner.length; i++) {
    const c = inner[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') {
      stack.pop();
      if (!stack.length) lastCompleteEnd = i;
    }
  }

  // Case 1: we found a clean close at the top level.
  if (lastCompleteEnd >= 0) {
    const slice = inner.slice(start, lastCompleteEnd + 1);
    return JSON.parse(slice);
  }

  // Case 2: truncated. Try to repair by closing open frames.
  if (stack.length) {
    // If we're mid-string, close it.
    let tail = '';
    if (inString) tail += '"';
    // Strip any trailing partial token (e.g. `"text": "foo`).
    // Find the last complete key/value pair — the last comma or `{`/`[` at depth 1.
    let repaired = inner.slice(start);
    // Drop the unterminated tail after the last comma or opening bracket.
    const lastSep = Math.max(repaired.lastIndexOf(','), repaired.lastIndexOf('{'), repaired.lastIndexOf('['));
    if (lastSep > 0) {
      // Rewind past any partial content on the trailing line.
      repaired = repaired.slice(0, lastSep);
      // If we left a trailing `,`, drop it.
      repaired = repaired.replace(/,\s*$/, '');
    }
    // Close every unclosed frame (reverse order).
    const closers = [];
    // Re-count stack from scratch on `repaired` to be safe.
    let ns = [], is = false, es = false;
    for (let i = 0; i < repaired.length; i++) {
      const c = repaired[i];
      if (es) { es = false; continue; }
      if (c === '\\') { es = true; continue; }
      if (c === '"') { is = !is; continue; }
      if (is) continue;
      if (c === '{' || c === '[') ns.push(c);
      else if (c === '}' || c === ']') ns.pop();
    }
    while (ns.length) {
      const open = ns.pop();
      closers.push(open === '{' ? '}' : ']');
    }
    const attempt = repaired + (is ? '"' : '') + closers.join('');
    try {
      const parsed = JSON.parse(attempt);
      console.warn(`[jsonCall] Repaired truncated JSON — dropped trailing partial content (${inner.length - (start + attempt.length)} chars)`);
      return parsed;
    } catch (err) {
      throw new Error(`Truncated JSON, repair failed: ${err.message}. Head: ${inner.slice(start, start + 200)}…`);
    }
  }

  throw new Error(`Unterminated JSON in response: ${inner.slice(start, start + 300)}…`);
}

async function callJson({ system, user, max_tokens = 1500, label = 'agent', prefill = '{' }) {
  const started = Date.now();

  // Prefill the assistant turn so the model can't emit preamble before the
  // JSON value. The API returns the continuation only — we re-prepend the
  // prefill before parsing.
  const messages = [{ role: 'user', content: user }];
  if (prefill) messages.push({ role: 'assistant', content: prefill });

  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens,
    system,
    messages,
  });
  const raw = resp.content[0]?.text || '';
  const text = (prefill || '') + raw;
  const ms = Date.now() - started;

  try {
    const parsed = extractJson(text);
    console.log(`[${label}] JSON ok (${ms}ms, ${text.length} chars)`);
    return parsed;
  } catch (err) {
    console.error(`[${label}] JSON parse failed (${ms}ms, ${text.length} chars): ${err.message}`);
    console.error(`[${label}] Raw head (500): ${text.slice(0, 500)}`);
    console.error(`[${label}] Raw tail (500): ${text.slice(-500)}`);
    console.error(`[${label}] Stop reason: ${resp.stop_reason} | usage:`, JSON.stringify(resp.usage || {}));
    throw new Error(`${label} did not return valid JSON: ${err.message}`);
  }
}

module.exports = { callJson, extractJson };
