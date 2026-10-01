const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail } = require('../lib/emailService');

const { getJwtSecret } = require('../lib/jwtConfig');

// --- Forgot Password Flow ---

// 1. Request OTP
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const [rows] = await db.execute(`SELECT id, name FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
        const user = rows[0];
        
        if (!user) {
            console.log(`[Forgot Password] No user found for: ${email}`);
            return res.json({ message: 'If an account exists with this email, an OTP has been sent.' });
        }

        console.log(`[Forgot Password] User found: ${user.name} (ID: ${user.id}). Generating OTP...`);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Calculate expiration 10 mins from now using local server time (avoids UTC/IST mismatch with MySQL DATETIME)
        const expiresDate = new Date(Date.now() + 10 * 60 * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        const expires = `${expiresDate.getFullYear()}-${pad(expiresDate.getMonth() + 1)}-${pad(expiresDate.getDate())} ${pad(expiresDate.getHours())}:${pad(expiresDate.getMinutes())}:${pad(expiresDate.getSeconds())}`;

        await db.execute(`UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE id = ?`, [otp, expires, user.id]);

        // Send Email
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">Password Reset OTP</h2>
                <p>Hello ${user.name},</p>
                <p>You requested a password reset. Use the following One-Time Password (OTP) to proceed:</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
                    ${otp}
                </div>
                <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888;">Snagup Technologies - Elite Learning Platform</p>
            </div>
        `;

        await sendEmail({
            to: email.toLowerCase().trim(),
            subject: 'Your Password Reset OTP - Snagup',
            html: html
        });

        res.json({ message: 'If an account exists with this email, an OTP has been sent.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// 2. Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    try {
        const [rows] = await db.execute(`SELECT id, reset_otp, reset_otp_expires FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
        const user = rows[0];

        if (!user || user.reset_otp !== otp) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // Compare local time against what was stored (both in local time)
        if (Date.now() > new Date(user.reset_otp_expires).getTime()) {
            return res.status(401).json({ error: 'OTP has expired. Please request a new one.' });
        }

        res.json({ success: true, message: 'OTP verified successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// 3. Reset Password
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Missing required fields' });

    try {
        const [rows] = await db.execute(`SELECT id, reset_otp, reset_otp_expires FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
        const user = rows[0];

        if (!user || user.reset_otp !== otp) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        if (Date.now() > new Date(user.reset_otp_expires).getTime()) {
            return res.status(401).json({ error: 'Session expired. Please request a new OTP.' });
        }

        const hash = bcrypt.hashSync(newPassword, 10);
        await db.execute(`UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE id = ?`, [hash, user.id]);

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[Auth] Attempting login for: ${normalizedEmail}`);

    try {
        // Step 1: Find user by normalized email
        const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?`, [normalizedEmail]);
        const user = rows[0];
        
        // Step 2: User not found
        if (!user) {
            console.warn(`[Auth] Login failed: User not found for ${normalizedEmail}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Step 3: Account inactive check
        if (user.is_active === 0 || user.is_active === false || user.is_active === null || user.is_active === undefined) {
            console.warn(`[Auth] Login rejected: Account deactivated for ${normalizedEmail} (ID: ${user.id})`);
            return res.status(403).json({ error: 'Account is deactivated. Please contact support.' });
        }

        // Step 4: Password verification
        const valid = bcrypt.compareSync(password, user.password_hash);
        if (!valid) {
            console.warn(`[Auth] Login failed: Password mismatch for ${normalizedEmail}`);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Step 5: JWT token creation
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, getJwtSecret(), { expiresIn: '7d' });
        console.log(`[Auth] Login success: ${normalizedEmail} (${user.role})`);

        // Step 6: Set HTTP-only cookie & return response
        res.cookie('snagup_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
        });
    } catch (err) {
        console.error("❌ [Auth] Database / Server error during login:", err.message);
        res.status(500).json({ error: 'Login failed due to server error' });
    }
});

// POST /api/auth/register (students only)
router.post('/register', async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    try {
        const [existing] = await db.execute(`SELECT id FROM users WHERE email = ?`, [email.toLowerCase().trim()]);
        if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

        const hash = bcrypt.hashSync(password, 10);
        const [result] = await db.execute(
            `INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, 'student', ?)`, 
            [name, email.toLowerCase().trim(), hash, phone || null]
        );

        const insertId = result.insertId;
        const token = jwt.sign({ id: insertId, email: email.toLowerCase().trim(), role: 'student', name }, getJwtSecret(), { expiresIn: '7d' });
        
        res.cookie('snagup_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({ token, user: { id: insertId, name, email: email.toLowerCase().trim(), role: 'student' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    } else if (req.headers.cookie) {
        const cookieMap = {};
        req.headers.cookie.split(';').forEach(cookieStr => {
            const parts = cookieStr.trim().split('=');
            if (parts.length >= 2) {
                cookieMap[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('='));
            }
        });
        token = cookieMap['snagup_token'];
    }

    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        const [rows] = await db.execute(`SELECT id, name, email, role, phone, is_active FROM users WHERE id = ?`, [decoded.id]);
        const user = rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(403).json({ error: 'Invalid token' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('snagup_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

// PUT /api/auth/profile - update current user profile
router.put('/profile', authenticateToken, async (req, res) => {
    const { name, email, phone } = req.body;
    const userId = req.user.id;

    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

    try {
        await db.execute(`
            UPDATE users SET name = ?, email = ?, phone = ?
            WHERE id = ?
        `, [name, email.toLowerCase().trim(), phone || null, userId]);

        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already in use' });
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// PUT /api/auth/password - update password
router.post('/password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new passwords required' });

    try {
        const [rows] = await db.execute(`SELECT password_hash FROM users WHERE id = ?`, [userId]);
        const user = rows[0];
        
        if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        const newHash = bcrypt.hashSync(newPassword, 10);
        await db.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [newHash, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Password update failed' });
    }
});

module.exports = router;
