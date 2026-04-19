const { buildContextBlock } = require('../prompts/systemBase');
const { DIGITAL_PRESENCE_PROMPT } = require('../prompts/digitalPresence');
const { callJson } = require('../utils/jsonCall');

const DP_SCHEMA = {
  type: 'object',
  properties: {
    eeat: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          k: { type: 'string' },
          score: { type: 'number' },
          max: { type: 'number' },
          note: { type: 'string' },
        },
        required: ['k', 'score', 'max', 'note'],
      },
      minItems: 4,
      maxItems: 4,
    },
    geo: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          k: { type: 'string' },
          value: { type: 'number' },
          max: { type: 'number' },
          note: { type: 'string' },
        },
        required: ['k', 'value', 'max', 'note'],
      },
      minItems: 5,
      maxItems: 5,
    },
    brand: {
      type: 'object',
      properties: {
        consistency: { type: 'number' },
        colourAlignment: { type: 'string' },
        toneConsistency: { type: 'string' },
        ctaConsistency: { type: 'string' },
        visualCoherence: { type: 'string' },
        socialPresenceNote: { type: 'string' },
        marketplacePresenceNote: { type: 'string' },
        voice: {
          type: 'object',
          properties: {
            tone: { type: 'string' },
            do:   { type: 'array', items: { type: 'string' } },
            dont: { type: 'array', items: { type: 'string' } },
          },
          required: ['tone', 'do', 'dont'],
        },
      },
      required: ['consistency', 'colourAlignment', 'toneConsistency', 'voice'],
    },
    keywordSeeds: {
      type: 'object',
      properties: {
        tofu: { type: 'array', items: { type: 'string' } },
        mofu: { type: 'array', items: { type: 'string' } },
        bofu: { type: 'array', items: { type: 'string' } },
        note: { type: 'string' },
      },
      required: ['tofu', 'mofu', 'bofu'],
    },
  },
  required: ['eeat', 'geo', 'brand', 'keywordSeeds'],
};

async function runDigitalPresenceAgent({ scrape, userType, pageSpeed }) {
  console.log('[AGENT:DP] Running Digital Presence Agent…');
  const context = buildContextBlock(scrape, userType, pageSpeed);
  const json = await callJson({
    label: 'AGENT:DP',
    system: DIGITAL_PRESENCE_PROMPT,
    user: context + '\n\nProduce the Digital Presence JSON now via the submit_report tool call.',
    max_tokens: 4500,
    schema: DP_SCHEMA,
  });
  return json;
}

module.exports = { runDigitalPresenceAgent };
