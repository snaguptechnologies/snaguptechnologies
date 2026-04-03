const db = require('./database');

try {
    console.log("Creating email_logs table...");
    db.prepare(`
        CREATE TABLE IF NOT EXISTS email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            purpose TEXT,
            status TEXT NOT NULL DEFAULT 'sent',
            sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    console.log("Success! email_logs table is ready.");
} catch (e) {
    console.error("Migration failed:", e);
}
