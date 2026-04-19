const { buildContextBlock } = require('../prompts/systemBase');
const { BUSINESS_MODEL_PROMPT } = require('../prompts/businessModel');
const { callJson } = require('../utils/jsonCall');

const CONF = { type: 'string', enum: ['high', 'medium', 'low'] };
const ECON_ITEM = {
  type: 'object',
  properties: { value: { type: 'string' }, conf: CONF, note: { type: 'string' } },
  required: ['value', 'conf', 'note'],
};

const BMC_SCHEMA = {
  type: 'object',
  properties: {
    canvas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          conf: CONF,
          text: { type: 'string' },
        },
        required: ['key', 'conf', 'text'],
      },
      minItems: 9,
      maxItems: 9,
    },
    unitEcon: {
      type: 'object',
      properties: {
        aov: ECON_ITEM,
        skus: ECON_ITEM,
        priceRange: ECON_ITEM,
        revenueTier: ECON_ITEM,
        reviewVelocity: ECON_ITEM,
      },
      required: ['aov', 'priceRange', 'revenueTier', 'reviewVelocity'],
    },
  },
  required: ['canvas', 'unitEcon'],
};

async function runBusinessModelAgent({ scrape, userType, pageSpeed }) {
  console.log('[AGENT:BM] Running Business Model Agent…');
  const context = buildContextBlock(scrape, userType, pageSpeed);
  const json = await callJson({
    label: 'AGENT:BM',
    system: BUSINESS_MODEL_PROMPT,
    user: context + '\n\nProduce the Business Model JSON now via the submit_report tool call.',
    max_tokens: 2500,
    schema: BMC_SCHEMA,
  });
  return json;
}

module.exports = { runBusinessModelAgent };
