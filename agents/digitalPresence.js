const { buildContextBlock } = require('../prompts/systemBase');
const { DIGITAL_PRESENCE_PROMPT } = require('../prompts/digitalPresence');
const { callJson } = require('../utils/jsonCall');

async function runDigitalPresenceAgent({ scrape, userType, pageSpeed }) {
  console.log('[AGENT:DP] Running Digital Presence Agent…');
  const context = buildContextBlock(scrape, userType, pageSpeed);
  const json = await callJson({
    label: 'AGENT:DP',
    system: DIGITAL_PRESENCE_PROMPT,
    user: context + '\n\nProduce the Digital Presence JSON now.',
    max_tokens: 3500,
  });
  return json;
}

module.exports = { runDigitalPresenceAgent };
