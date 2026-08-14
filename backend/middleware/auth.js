const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'snagup_secret_2026';
if (!process.env.JWT_SECRET) console.warn("⚠️ JWT_SECRET not found in environment, using default.");

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: `Access denied. Requires role: ${roles.join(' or ')}` });
        }
        next();
    };
}

module.exports = { authenticateToken, requireRole };
