/**
 * Leads Route — POST /api/leads
 * Receives email + business info after report generation,
 * forwards to Make.com webhook (configurable via env).
 */
const express = require('express');
const router = express.Router();

const MAKE_WEBHOOK = process.env.MAKE_WEBHOOK_URL || '';

router.post('/', async (req, res) => {
  const { email, businessUrl, businessName } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  const payload = {
    event: 'AUDIT_LEAD',
    email,
    businessUrl: businessUrl || 'N/A',
    businessName: businessName || 'Unknown',
    timestamp: new Date().toISOString(),
  };

  console.log(`[LEADS] New audit lead: ${email} — ${businessName}`);

  if (!MAKE_WEBHOOK) {
    console.warn('[LEADS] No MAKE_WEBHOOK_URL set — storing lead locally only.');
    return res.json({ ok: true, forwarded: false });
  }

  try {
    const response = await fetch(MAKE_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) console.error('[LEADS] Make webhook error:', response.status);
    else console.log('[LEADS] ✅ Forwarded to Make');
  } catch (err) {
    console.error('[LEADS] Webhook failed (non-blocking):', err.message);
  }

  res.json({ ok: true, forwarded: !!MAKE_WEBHOOK });
});

module.exports = router;
