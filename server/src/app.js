const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const geocodeRoutes = require('./routes/geocode');
const swipeRoutes = require('./routes/swipes');
const preferenceRoutes = require('./routes/preferences');
const userRoutes = require('./routes/user');
const presidentsRoutes = require('./routes/presidents');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();

// CORS configuration
// Production: set ALLOWED_ORIGINS to a comma-separated list of your frontend
// origin(s), e.g. "https://rmp.xyz,https://www.rmp.xyz". If unset, we allow
// localhost dev origins plus the known Railway/Vercel deployment domains so the
// app is not CORS-blocked on first deploy; tighten via ALLOWED_ORIGINS in prod.
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://rate-my-president-production.up.railway.app'
];

function parseAllowedOrigins() {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return DEFAULT_ORIGINS;
}

const allowedOrigins = parseAllowedOrigins();

// Allow exact matches, or any subdomain of vercel.app / railway.app (the
// platforms this app deploys to). Tighten with ALLOWED_ORIGINS in production.
function isOriginAllowed(origin) {
  if (!origin) return false;
  if (allowedOrigins.indexOf(origin) !== -1) return true;
  try {
    const host = new URL(origin).host;
    return host.endsWith('.vercel.app') || host.endsWith('.railway.app');
  } catch {
    return false;
  }
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Trust proxy only when explicitly configured behind a reverse proxy
const trustProxy = process.env.TRUST_PROXY === 'true';
app.set('trust proxy', trustProxy);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);
app.use(express.json());

// Routes
app.use('/api/geocode', geocodeRoutes);
app.use('/api/swipes', swipeRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/presidents', presidentsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Rate My President API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      geocode: '/api/geocode?lat={lat}&lon={lon}',
      swipes: {
        log: 'POST /api/swipes/log',
        status: 'GET /api/swipes/status?userId={userId}&date={date}'
      },
      preferences: {
        get: 'GET /api/preferences?userId={userId}',
        update: 'PATCH /api/preferences'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
