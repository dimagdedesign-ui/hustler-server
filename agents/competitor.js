const { buildContextBlock } = require('../prompts/systemBase');
const { COMPETITOR_PROMPT } = require('../prompts/competitor');
const { callJson } = require('../utils/jsonCall');

async function runCompetitorAgent({ scrape, userType, pageSpeed }) {
  console.log('[AGENT:CP] Running Competitor Agent…');
  const context = buildContextBlock(scrape, userType, pageSpeed);
  const json = await callJson({
    label: 'AGENT:CP',
    system: COMPETITOR_PROMPT,
    user: context + '\n\nProduce the Competitor JSON now.',
    max_tokens: 2500,
  });
  return json;
}

module.exports = { runCompetitorAgent };
