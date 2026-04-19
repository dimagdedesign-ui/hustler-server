/**
 * AI Business Analyst — server entry
 *
 * Routes:
 *   GET  /               → public/index.html (design prototype)
 *   POST /api/analyse    → runs the 5-agent pipeline, returns structured JSON
 *   POST /api/analyse/md → same pipeline, returns markdown attachment download
 *   POST /api/leads      → forwards email capture to Make.com webhook
 *   GET  /health         → liveness probe
 */
require('dotenv').config({ override: true });

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const analyseRoute = require('./routes/analyse');
const leadsRoute   = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '32kb' }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/analyse', analyseRoute);
app.use('/api/leads',   leadsRoute);

app.get('/health', (_, res) => res.json({ status: 'ok', app: 'ai-business-analyst', version: '0.1.0' }));

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🧠  AI Business Analyst running on port ${PORT}`);
  console.log(`    ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ set' : '❌ missing'}`);
  console.log(`    PAGESPEED_API_KEY: ${process.env.PAGESPEED_API_KEY ? '✅ set' : '⚠️  missing (limited quota)'}`);
});
