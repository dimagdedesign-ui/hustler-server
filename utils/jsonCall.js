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

  // Find the first { or [ and matching close.
  const firstObj = inner.indexOf('{');
  const firstArr = inner.indexOf('[');
  const starts = [firstObj, firstArr].filter(i => i >= 0);
  if (!starts.length) throw new Error(`No JSON object/array found in response: ${inner.slice(0, 200)}`);
  const start = Math.min(...starts);
  const openChar = inner[start];
  const closeChar = openChar === '{' ? '}' : ']';

  // Walk to matching close, respecting strings.
  let depth = 0, inString = false, escape = false, end = -1;
  for (let i = start; i < inner.length; i++) {
    const c = inner[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === openChar) depth++;
    else if (c === closeChar) {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end < 0) throw new Error(`Unterminated JSON in response: ${inner.slice(start, start + 300)}…`);

  const slice = inner.slice(start, end + 1);
  return JSON.parse(slice);
}

async function callJson({ system, user, max_tokens = 1500, label = 'agent' }) {
  const started = Date.now();
  const resp = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens,
    system,
    messages: [{ role: 'user', content: user }],
  });
  const text = resp.content[0]?.text || '';
  const ms = Date.now() - started;

  try {
    const parsed = extractJson(text);
    console.log(`[${label}] JSON ok (${ms}ms, ${text.length} chars)`);
    return parsed;
  } catch (err) {
    console.error(`[${label}] JSON parse failed (${ms}ms): ${err.message}`);
    console.error(`[${label}] Raw head: ${text.slice(0, 300)}`);
    throw new Error(`${label} did not return valid JSON: ${err.message}`);
  }
}

module.exports = { callJson, extractJson };
