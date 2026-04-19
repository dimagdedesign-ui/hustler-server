const { buildContextBlock } = require('../prompts/systemBase');
const { BUSINESS_MODEL_PROMPT } = require('../prompts/businessModel');
const { callJson } = require('../utils/jsonCall');

async function runBusinessModelAgent({ scrape, userType, pageSpeed }) {
  console.log('[AGENT:BM] Running Business Model Agent…');
  const context = buildContextBlock(scrape, userType, pageSpeed);
  const json = await callJson({
    label: 'AGENT:BM',
    system: BUSINESS_MODEL_PROMPT,
    user: context + '\n\nProduce the Business Model JSON now.',
    max_tokens: 2000,
  });
  return json;
}

module.exports = { runBusinessModelAgent };
