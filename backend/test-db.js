const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '3306')
    };
    console.log("Testing Connection with:", config);
    try {
        const conn = await mysql.createConnection(config);
        console.log("✅ Success! Connection established.");
        await conn.end();
    } catch (err) {
        console.error("❌ Failed:", err.message);
    }
}
test();
