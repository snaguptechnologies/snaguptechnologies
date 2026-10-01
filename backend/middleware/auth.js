const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../lib/jwtConfig');

function authenticateToken(req, res, next) {
    let token = null;

    // 1. Check Authorization Bearer header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    // 2. Fallback to HTTP-only cookie if header is absent
    if (!token && req.headers.cookie) {
        const cookieMap = {};
        req.headers.cookie.split(';').forEach(cookieStr => {
            const parts = cookieStr.trim().split('=');
            if (parts.length >= 2) {
                cookieMap[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('='));
            }
        });
        token = cookieMap['snagup_token'];
    }

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, getJwtSecret());
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
