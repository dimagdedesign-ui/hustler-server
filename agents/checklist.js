const { buildContextBlock } = require('../prompts/systemBase');
const { CHECKLIST_PROMPT } = require('../prompts/checklist');
const { callJson } = require('../utils/jsonCall');

const CHECKLIST_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    title: { type: 'string' },
    category: { type: 'string' },
    effort: { type: 'string', enum: ['Low', 'Medium', 'High'] },
    impact: { type: 'number' },
    confidence: { type: 'number' },
    ease: { type: 'number' },
    ice: { type: 'number' },
    quadrant: { type: 'string', enum: ['Do First', 'Plan', 'Batch', 'Deprioritise'] },
    why: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'title', 'category', 'effort', 'impact', 'confidence', 'ease', 'ice', 'quadrant', 'why', 'steps'],
};

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

  const items = await callJson({
    label: 'AGENT:CL',
    system: CHECKLIST_PROMPT,
    user: context + priorFindings + '\n\nProduce the 50 items now via the submit_report tool call.',
    max_tokens: 20000,
    isArray: true,
    itemSchema: CHECKLIST_ITEM_SCHEMA,
  });

  if (!Array.isArray(items)) throw new Error('Checklist agent did not return an items array');
  if (items.length < 40) console.warn(`[AGENT:CL] Expected 50 items, got ${items.length}`);
  return items;
}

module.exports = { runChecklistAgent };
