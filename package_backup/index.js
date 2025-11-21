// Teacher Management System Backend
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Get the correct path to frontend
const frontendPath = path.join(__dirname, '..', 'frontend');

// Middleware
// Configure CORS to explicitly allow the common dev origins (Live Server and backend host).
// This helps browsers accept cross-origin requests during local development.
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5501',
  'http://localhost:5500',
  'http://localhost:5501',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'file://'
];
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin like curl or server-side requests
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // allow all origins as a fallback during development
    return callback(null, true);
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization','Accept'],
  credentials: true,
  maxAge: 86400
}));
// Accept OPTIONS preflight for all routes
app.options('*', cors());

// Add CORS headers to every response (ensures headers are present even if middleware doesn't set them)
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Capture raw body for debugging (helps when requests are rejected or show 405)
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf) => {
    try { req.rawBody = buf && buf.toString(); } catch (e) { req.rawBody = undefined; }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Import routes
const apiRoutes = require('./routes');
const aiRoutes = require('./ai-routes');
const phase2Routes = require('./phase2-routes');
const phase3Routes = require('./phase3-routes');
const models = require('./models');
const crypto = require('crypto');

// Add an explicit POST handler for /api/teacher-requests to ensure the endpoint
// is available even if router mounting order causes issues. This mirrors the
// logic in `routes.js` but lives here as a reliable fallback.
app.post('/api/teacher-requests', (req, res) => {
  try {
    const { name, school, subjects, email } = req.body || {};
    if (!name || !school) return res.status(400).json({ error: 'Name and school required' });
    const id = crypto.randomBytes(8).toString('hex');
    const request = { id, name, school, subjects: subjects || [], email: email || '', createdAt: new Date() };
    models.db.teacherRequests.push(request);
    console.log('HANDLED /api/teacher-requests ->', request.id);
    return res.status(201).json({ message: 'Request submitted', request });
  } catch (e) {
    console.error('Error in explicit /api/teacher-requests handler', e && e.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verbose request logger: prints method, originalUrl, a few headers and raw body (truncated)
app.use((req, res, next) => {
  try {
    const headersPreview = {};
    ['content-type', 'origin', 'user-agent', 'referer', 'host', 'accept'].forEach(h => {
      if (req.headers[h]) headersPreview[h] = req.headers[h];
    });
    const bodyPreview = req.rawBody || (req.body && JSON.stringify(req.body)) || '';
    const shortBody = bodyPreview ? bodyPreview.toString().slice(0, 1000) : '';
    console.log(`REQ ${req.method} ${req.originalUrl} HEADERS=${JSON.stringify(headersPreview)} BODY=${shortBody}`);
  } catch (e) { /* ignore logging errors */ }
  next();
});

// Use API routes first so static files don't interfere with /api paths
app.use('/api', apiRoutes);

// Use AI routes under /api/ai namespace
app.use('/api/ai', aiRoutes);

// Use Phase 2 routes under /api/phase2 namespace
app.use('/api/phase2', phase2Routes);

// Use Phase 3 routes under /api/phase3 namespace
app.use('/api/phase3', phase3Routes);

// Serve frontend static files (after API mounting)
app.use(express.static(frontendPath, { index: 'index.html', extensions: ['html'], redirect: false }));

// Temporary diagnostic endpoint to help debug client requests (remove when done)
app.post('/api/diagnose/echo', (req, res) => {
  console.log('DIAG POST', req.path, JSON.stringify(req.body).slice(0, 1000));
  res.json({ ok: true, route: '/api/diagnose/echo', received: req.body });
});

// CORS diagnostic endpoint: returns explicit CORS response and echoes origin
app.get('/api/diagnose/cors-test', (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.json({ ok: true, route: '/api/diagnose/cors-test', originReceived: req.headers.origin || null, time: Date.now() });
});

// Simple health check for frontend to verify backend reachability
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});
// Debug: inspect what's exported from ./routes
console.log('DEBUG: apiRoutes type =', typeof apiRoutes);
try { console.log('DEBUG: apiRoutes keys =', Object.keys(apiRoutes)); } catch (e) { console.log('DEBUG: apiRoutes inspect error', e && e.message); }

// (Routes already mounted above) -- avoid mounting twice


// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Fallback to index.html for SPA-like behavior
app.get('*', (req, res) => {
  const filePath = path.join(frontendPath, req.path);
  
  // Check if file exists AND is a file (not a directory)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile() && !req.path.startsWith('/api')) {
    res.sendFile(filePath);
  } else {
    // If not a static file, serve index.html
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Global error handlers to keep the process healthy and log issues
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION', err && err.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION', reason && reason.stack || reason);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎓 Teacher Management System running on http://0.0.0.0:${PORT}/`);
  console.log(`API Documentation available at http://0.0.0.0:${PORT}/api/`);
});
