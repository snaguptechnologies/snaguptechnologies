require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet()); // Set various security headers

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { error: "Too many login attempts. Please try again later." }
});
app.use('/api/auth/login', authLimiter);

// Refined CORS — add your production domain to ALLOWED_ORIGINS in .env
// e.g. ALLOWED_ORIGINS=https://snagup.com,https://www.snagup.com
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:3000', 
        'https://localhost:3000',
        process.env.FRONTEND_URL // Also include FRONTEND_URL if set
      ].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Dynamic origin check
        const isAllowed = allowedOrigins.some(ao => origin.startsWith(ao));
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`🔓 CORS Blocked: ${origin} not in ${allowedOrigins.join(',')}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '1mb' })); // Reduced limit for better security
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Serve static certificates publicly
const path = require('path');
app.use('/certs', express.static(path.join(__dirname, 'certs')));
app.use('/signatures', express.static(path.join(__dirname, 'signatures')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/certificates', require('./routes/certificates').router);
app.use('/api/payments', require('./routes/payments'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/inquiries', require('./routes/inquiries'));


// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

// Database Initialization & Startup
const db = require('./db/database');

db.dbReady.then(() => {
    // Start Notification Worker
    const { startNotificationWorker } = require('./lib/notifications');
    startNotificationWorker();

    // Start Server
    app.listen(PORT, () => {
        console.log(`🚀 API Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("💥 FAILED to start server: Database could not be initialized.");
    console.error(err);
    process.exit(1);
});
