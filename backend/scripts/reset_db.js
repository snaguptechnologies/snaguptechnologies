require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

const dbHost = process.env.DB_HOST || 'localhost';

const dbConfig = {
  host: dbHost,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'snagup',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  multipleStatements: true,
  ssl: (process.env.DB_SSL === 'true' || (dbHost !== 'localhost' && dbHost !== '127.0.0.1')) ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : false
};

const pool = mysql.createPool(dbConfig);

const tables = [
  'certificates',
  'batch_materials',
  'waitlist',
  'enrollments',
  'payments',
  'sessions',
  'attendance',
  'batches',
  'courses',
  'service_inquiries',
  'email_logs',
  'settings',
  'users'
];

async function resetDatabase() {
  console.log(`\n⚠️  WARNING: You are about to completely wipe the ${dbConfig.database} database at ${dbConfig.host}`);
  console.log('All user accounts, enrollments, payments, and certificates will be permanently deleted!\n');

  try {
    for (const table of tables) {
      console.log(`Dropping table ${table}...`);
      await pool.execute(`DROP TABLE IF EXISTS ${table}`);
    }

    console.log('\n✅ All tables successfully dropped.');
    console.log('To recreate the database, simply restart your Node.js backend using PM2 (e.g., "pm2 restart server").');
    console.log('The backend will automatically create empty tables and a new super-admin account on the next startup.');

  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

resetDatabase();
