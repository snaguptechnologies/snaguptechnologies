const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail } = require('../lib/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'snagup_secret_2026';
if (!process.env.JWT_SECRET) console.warn("⚠️ JWT_SECRET not found in environment, using default.");

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
        // Calculate expiration 10 mins from now in MySQL format
        const expiresDate = new Date(Date.now() + 10 * 60 * 1000);
        // Format to YYYY-MM-DD HH:MM:SS
        const expires = expiresDate.toISOString().slice(0, 19).replace('T', ' ');

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

        if (new Date() > new Date(user.reset_otp_expires)) {
            return res.status(401).json({ error: 'OTP has expired' });
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

        if (new Date() > new Date(user.reset_otp_expires)) {
            return res.status(401).json({ error: 'Session expired' });
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

    try {
        const [rows] = await db.execute(`SELECT * FROM users WHERE email = ? AND is_active = 1`, [email.toLowerCase().trim()]);
        const user = rows[0];
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = bcrypt.compareSync(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
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
        const token = jwt.sign({ id: insertId, email: email.toLowerCase().trim(), role: 'student', name }, JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({ token, user: { id: insertId, name, email: email.toLowerCase().trim(), role: 'student' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await db.execute(`SELECT id, name, email, role, phone, is_active FROM users WHERE id = ?`, [decoded.id]);
        const user = rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (e) {
        res.status(403).json({ error: 'Invalid token' });
    }
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
