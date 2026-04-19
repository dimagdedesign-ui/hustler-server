/**
 * JSON calls to Claude via forced tool_use.
 *
 * Every agent calls this instead of text-and-parse. We define a generic
 * `submit_report` tool and force the model to call it with `tool_choice`.
 * The API then returns `input` already parsed and guaranteed to match the
 * top-level schema — no preamble, no fences, no truncation-to-text issues.
 *
 * For array responses (the checklist), pass `isArray: true`. We wrap the
 * schema as `{ items: [...] }` and unwrap on the way out.
 */
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function callJson({ system, user, max_tokens = 1500, label = 'agent', isArray = false, itemSchema = null, schema = null }) {
  const started = Date.now();

  // Priority: caller-supplied schema > isArray wrapper > permissive default.
  const input_schema = schema
    ? schema
    : isArray
      ? {
          type: 'object',
          properties: { items: { type: 'array', items: itemSchema || {} } },
          required: ['items'],
          additionalProperties: false,
        }
      : { type: 'object', additionalProperties: true };

  let resp;
  try {
    resp = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens,
      system,
      tools: [{
        name: 'submit_report',
        description: 'Submit the structured report section as JSON. Populate every field required by the system prompt.',
        input_schema,
      }],
      tool_choice: { type: 'tool', name: 'submit_report' },
      messages: [{ role: 'user', content: user }],
    });
  } catch (err) {
    const ms = Date.now() - started;
    console.error(`[${label}] API error (${ms}ms): ${err.message}`);
    throw err;
  }

  const ms = Date.now() - started;
  const toolUse = (resp.content || []).find(b => b && b.type === 'tool_use');

  if (!toolUse) {
    const textBlock = (resp.content || []).find(b => b && b.type === 'text');
    console.error(`[${label}] Model refused to call tool (${ms}ms). Stop reason: ${resp.stop_reason}. Usage:`, JSON.stringify(resp.usage || {}));
    if (textBlock) console.error(`[${label}] Text response instead: ${textBlock.text.slice(0, 400)}`);
    throw new Error(`${label} did not emit a tool_use response (stop_reason=${resp.stop_reason})`);
  }

  const raw = toolUse.input;
  const result = isArray ? (raw.items || []) : raw;
  const size = isArray ? (result.length + ' items') : (Object.keys(result || {}).length + ' keys');
  console.log(`[${label}] Tool-use ok (${ms}ms, ${size}, stop=${resp.stop_reason})`);

  if (resp.stop_reason === 'max_tokens') {
    console.warn(`[${label}] ⚠️  Hit max_tokens — output may be truncated. Consider raising the limit.`);
  }

  return result;
}

module.exports = { callJson };
