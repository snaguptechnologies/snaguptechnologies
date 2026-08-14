const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'snagup',
        port: parseInt(process.env.DB_PORT || '3306')
    });

    try {
        console.log("Adding attendance_completed column...");
        await connection.query("ALTER TABLE batches ADD COLUMN attendance_completed TINYINT(1) DEFAULT 0");
        console.log("Adding instructor_verified column...");
        await connection.query("ALTER TABLE batches ADD COLUMN instructor_verified TINYINT(1) DEFAULT 0");
        console.log("✅ Migration successful.");
    } catch (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log("Columns already exist.");
        } else {
            console.error("❌ Migration failed:", err.message);
        }
    } finally {
        await connection.end();
    }
}

migrate();
