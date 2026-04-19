const { buildContextBlock } = require('../prompts/systemBase');
const { CHECKLIST_PROMPT } = require('../prompts/checklist');
const { callJson } = require('../utils/jsonCall');

async function runChecklistAgent({ scrape, userType, pageSpeed, businessModel, competitor, digital }) {
  console.log('[AGENT:CL] Running Checklist Agent…');

  const context = buildContextBlock(scrape, userType, pageSpeed);
  const priorFindings = `

## Prior Agent Findings (reference these in \`why\` fields)

### Business Model
${JSON.stringify(businessModel, null, 2).slice(0, 3000)}

### Competitors
${JSON.stringify(competitor, null, 2).slice(0, 2500)}

### Digital Presence
${JSON.stringify(digital, null, 2).slice(0, 3500)}
`;

  const json = await callJson({
    label: 'AGENT:CL',
    system: CHECKLIST_PROMPT,
    user: context + priorFindings + '\n\nProduce the 50-item JSON array now. No preamble.',
    max_tokens: 20000,
    prefill: '[',   // checklist output is a top-level array
  });

  // Basic shape validation — the UI depends on the fields being present.
  if (!Array.isArray(json)) throw new Error('Checklist agent did not return a JSON array');
  if (json.length < 40) console.warn(`[AGENT:CL] Expected 50 items, got ${json.length}`);
  return json;
}

module.exports = { runChecklistAgent };
