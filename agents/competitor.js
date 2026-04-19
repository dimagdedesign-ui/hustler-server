const { buildContextBlock } = require('../prompts/systemBase');
const { COMPETITOR_PROMPT } = require('../prompts/competitor');
const { callJson } = require('../utils/jsonCall');

const COMPETITOR_SCHEMA = {
  type: 'object',
  properties: {
    list: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          domain: { type: 'string' },
          threat: { type: 'number' },
          threatTier: { type: 'string', enum: ['high', 'medium', 'low'] },
          positioning: { type: 'string' },
          weakness: { type: 'string' },
        },
        required: ['name', 'domain', 'threat', 'threatTier', 'positioning', 'weakness'],
      },
      minItems: 3,
      maxItems: 5,
    },
    disclaimer: { type: 'string' },
  },
  required: ['list', 'disclaimer'],
};

async function runCompetitorAgent({ scrape, userType, pageSpeed }) {
  console.log('[AGENT:CP] Running Competitor Agent…');
  const context = buildContextBlock(scrape, userType, pageSpeed);
  const json = await callJson({
    label: 'AGENT:CP',
    system: COMPETITOR_PROMPT,
    user: context + '\n\nProduce the Competitor JSON now via the submit_report tool call.',
    max_tokens: 2500,
    schema: COMPETITOR_SCHEMA,
  });
  return json;
}

module.exports = { runCompetitorAgent };
