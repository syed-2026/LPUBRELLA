const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes/index');
const paymentController = require('./controllers/paymentController');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiters');
const AppError = require('./utils/AppError');

const app = express();

// Trust reverse proxy (Railway, Heroku, Cloudflare) for accurate client IP in rate limiting
app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://lpubrella.vercel.app',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const configured = Array.isArray(env.corsOrigin) ? env.corsOrigin : [env.corsOrigin];
    if (
      configured.includes(origin) ||
      configured.includes('*') ||
      defaultAllowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      /^http:\/\/localhost(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Don't log request bodies (may contain passwords/tokens); morgan's
// default combined-ish format below logs only method/url/status/timing.
app.use(morgan(env.isProduction ? 'combined' : 'dev', { skip: () => env.isTest }));

app.use(globalLimiter);

// ---------------------------------------------------------------
// IMPORTANT: the payment webhook route is mounted here, BEFORE the
// global express.json() body parser, using express.raw(). This is
// required so the payment provider's HMAC signature can be verified
// against the exact raw bytes of the request body. If the body were
// parsed to JSON first, re-serializing it for signature verification
// could produce different bytes (key order, whitespace) and silently
// break signature validation.
// ---------------------------------------------------------------
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json', limit: '1mb' }),
  paymentController.webhook
);

// Standard JSON body parsing for all other routes, with a sane size cap.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'lpu-umbrella-backend', time: new Date().toISOString() });
});

app.use('/api/v1', apiRoutes);

// Unmatched routes.
app.use((req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handler - must be registered last.
app.use(errorHandler);

module.exports = app;
