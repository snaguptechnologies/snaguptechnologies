require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    console.log('--- Snagup Database Migration ---');
    
    const dbHost = process.env.DB_HOST || 'localhost';
    const config = {
        host: dbHost,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '3306'),
        database: process.env.DB_NAME || 'snagup',
        // Support secure connections for TiDB Cloud
        ssl: (process.env.DB_SSL === 'true' || (dbHost !== 'localhost' && dbHost !== '127.0.0.1')) ? {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        } : false
    };

    let conn;
    try {
        console.log(`📡 Connecting to ${dbHost}...`);
        conn = await mysql.createConnection(config);
        
        console.log('🚀 Migrating settings.value to LONGTEXT...');
        await conn.query('ALTER TABLE settings MODIFY COLUMN value LONGTEXT');
        
        console.log('✅ Migration successful! High-resolution QR storage is now enabled.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

migrate();
