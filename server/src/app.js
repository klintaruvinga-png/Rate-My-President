const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const geocodeRoutes = require('./routes/geocode');
const swipeRoutes = require('./routes/swipes');
const preferenceRoutes = require('./routes/preferences');

const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
