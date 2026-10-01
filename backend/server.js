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
    max: 50, // 50 attempts per 15 min per IP (reasonable for dev + production)
    standardHeaders: true,    // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,     // Disable X-RateLimit-* headers
    handler: (req, res) => {
        res.status(429).json({ error: "Too many login attempts. Please wait 15 minutes and try again." });
    }
});
app.use('/api/auth/login', authLimiter);

// Production Configuration Check
if (process.env.NODE_ENV === 'production') {
    if (!process.env.ALLOWED_ORIGINS && !process.env.FRONTEND_URL) {
        console.warn("⚠️ [SECURITY WARNING] Neither ALLOWED_ORIGINS nor FRONTEND_URL is configured in production environment variables! Localhost fallback active.");
    }
}

const defaultDevOrigins = [
    'http://localhost:3000', 
    'http://127.0.0.1:3000', 
    'https://localhost:3000'
];

const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];

if (process.env.FRONTEND_URL) {
    envOrigins.push(process.env.FRONTEND_URL.trim());
}

const allowedOrigins = Array.from(new Set([...defaultDevOrigins, ...envOrigins])).filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, server-to-server, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Exact origin matching after normalizing trailing slashes
        const normalizedOrigin = origin.replace(/\/$/, '');
        const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));

        const isAllowed = normalizedAllowed.includes(normalizedOrigin);
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`🔓 CORS Blocked: ${origin} not in ${allowedOrigins.join(',')}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static certificates publicly (backward compatibility for local disk files)
const path = require('path');
app.use('/certs', express.static(path.join(__dirname, 'certs')));

// Fallback for /certs/:filename when file is not on local disk (redirects to Supabase Signed URL)
app.get('/certs/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const certId = filename.replace(/\.pdf$/i, '');
        const { getSupabaseClient } = require('./lib/jwtConfig');
        const supabase = getSupabaseClient();

        if (supabase) {
            const storagePath = `certificates/${certId}.pdf`;
            const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'snagup-files';
            const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(storagePath, 300);

            if (!error && data?.signedUrl) {
                return res.redirect(data.signedUrl);
            }
        }
        res.status(404).json({ error: 'Certificate file not found' });
    } catch (err) {
        console.error('Static cert fallback error:', err);
        res.status(500).json({ error: 'Failed to fetch certificate file' });
    }
});

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
app.use('/api/applications', require('./routes/applications'));
app.use('/api/security', require('./routes/security'));
app.use('/api/syllabus', require('./routes/syllabus'));
app.use('/api/assessments', require('./routes/assessments'));


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
