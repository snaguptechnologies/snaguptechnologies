const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/settings - admin only
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const [settings] = await db.execute(`SELECT \`key\`, \`value\` FROM settings`);
        // Convert to object for easier frontend use
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });
        res.json(settingsObj);
    } catch (err) {
        console.error("❌ Failed to fetch admin settings:", err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// GET /api/settings/public - public access
router.get('/public', async (req, res) => {
    try {
        const publicKeys = ['site_name', 'site_logo', 'contact_email', 'contact_phone', 'upi_id', 'upi_qr_image'];
        const [settings] = await db.execute(`SELECT \`key\`, \`value\` FROM settings WHERE \`key\` IN (${publicKeys.map(() => '?').join(',')})`, publicKeys);
        const settingsObj = {};
        settings.forEach(s => {
            settingsObj[s.key] = s.value;
        });
        res.json(settingsObj);
    } catch (err) {
        console.error("❌ Failed to fetch public settings:", err);
        res.status(500).json({ error: 'Failed to fetch public settings' });
    }
});

// PUT /api/settings - admin only
router.put('/', authenticateToken, requireRole('admin'), async (req, res) => {
    const settings = req.body; // { key: value, ... }

    if (typeof settings !== 'object') {
        return res.status(400).json({ error: 'Invalid settings format' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        for (const [key, value] of Object.entries(settings)) {
            // Handle null/undefined values properly
            const finalValue = (value === null || value === undefined) ? null : String(value);
            
            await connection.query(`
                INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)
                ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)
            `, [key, finalValue]);
        }

        await connection.commit();
        res.json({ message: 'Settings updated successfully' });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to update settings' });
    } finally {
        if (connection) connection.release();
    }
});
// POST /api/settings/reset-database - admin only, destructive
router.post('/reset-database', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const tables = [
            'certificates', 'batch_materials', 'waitlist', 'enrollments', 
            'payments', 'sessions', 'attendance', 'batches', 'courses', 
            'service_inquiries', 'email_logs', 'settings', 'users'
        ];

        // Disable foreign key checks for a clean wipe
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Drop all tables
        for (const table of tables) {
            await db.query(`DROP TABLE IF EXISTS ${table}`);
        }
        
        // Re-enable foreign key checks
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        
        // Re-initialize tables and admin account
        if (typeof db.initializeDatabase === 'function') {
            await db.initializeDatabase();
        } else {
            throw new Error("initializeDatabase function not exported from db object");
        }
        
        console.log(`[ADMIN] Factory Reset successfully performed by user: ${req.user.email}`);
        res.json({ message: 'Database wiped and factory reset successfully.' });
    } catch (err) {
        console.error("❌ Failed to reset database:", err);
        // Ensure keys are enabled even on failure
        try { await db.query('SET FOREIGN_KEY_CHECKS = 1'); } catch(e){}
        res.status(500).json({ error: `Failed to reset: ${err.message}` });
    }
});

module.exports = router;
