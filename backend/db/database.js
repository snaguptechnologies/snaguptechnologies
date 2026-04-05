require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbHost = process.env.DB_HOST || 'localhost';

const dbConfig = {
  host: dbHost,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'snagup',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  // Automatic SSL: Default to true if not on localhost, or if explicitly requested
  ssl: (process.env.DB_SSL === 'true' || (dbHost !== 'localhost' && dbHost !== '127.0.0.1')) ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  } : false
};

const dbName = process.env.DB_NAME || 'snagup';

// Initial pool is created WITH the database name for simplicity in routes,
// but we'll try to ensure the DB exists first.
let pool = mysql.createPool({ ...dbConfig, database: dbName });

async function ensureDatabaseExists() {
    let connection;
    try {
        // Try connecting to the server without a database first
        connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port,
            ssl: dbConfig.ssl
        });
        
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' ensured.`);
        await connection.end();
    } catch (err) {
        if (connection) await connection.end();
        console.error("❌ MySQL Connection Failed during initialization!");
        console.error("   Details:", err.message);
        console.error("   Check if your MySQL server is running on port:", dbConfig.port);
        console.error("   Current Configuration:", { host: dbConfig.host, user: dbConfig.user, port: dbConfig.port });
        // Removed process.exit(1) to prevent the entire server from crashing
    }
}

async function initializeTables() {
  try {
    const connection = await pool.getConnection();
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','instructor','student') NOT NULL,
        phone VARCHAR(50),
        is_active BOOLEAN DEFAULT 1,
        reset_otp VARCHAR(255),
        reset_otp_expires DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        duration_days INT DEFAULT 30,
        category VARCHAR(255) DEFAULT 'General',
        status ENUM('active','inactive') DEFAULT 'active',
        thumbnail VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        course_id INT NOT NULL,
        instructor_id INT,
        duration_days INT DEFAULT 30,
        price DECIMAL(10,2) DEFAULT 0,
        enrollment_status ENUM('open','closed') DEFAULT 'closed',
        batch_status ENUM('upcoming','active','completed','closed') DEFAULT 'upcoming',
        enrollment_end_date DATETIME,
        start_date DATETIME,
        end_date DATETIME,
        session_link VARCHAR(255),
        session_time VARCHAR(255),
        session_date DATETIME,
        session_message TEXT,
        is_finalized BOOLEAN DEFAULT 0,
        material_link VARCHAR(255),
        material_message TEXT,
        broadcast_message TEXT,
        broadcast_updated_at DATETIME,
        archived_at DATETIME,
        verification_deadline DATETIME,
        attendance_completed BOOLEAN DEFAULT 0,
        instructor_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        date DATETIME NOT NULL,
        time VARCHAR(255) NOT NULL,
        link VARCHAR(255) NOT NULL,
        message TEXT,
        notified_1h BOOLEAN DEFAULT 0,
        notified_30m BOOLEAN DEFAULT 0,
        notified_times JSON,
        last_emailed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(batch_id, date),
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        batch_id INT NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status ENUM('pending','approved','rejected','partial') DEFAULT 'pending',
        last_read_guideline_at DATETIME,
        admin_feedback TEXT,
        is_utr_updated BOOLEAN DEFAULT 0,
        rejection_category VARCHAR(255),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE(student_id, batch_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        enrollment_id INT NOT NULL,
        student_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(255) DEFAULT 'upi',
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        status ENUM('pending','completed','refunded','partial') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        batch_id INT NOT NULL,
        date DATETIME NOT NULL,
        status ENUM('present','absent') DEFAULT 'present',
        marked_by INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, batch_id, date),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE,
        FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        batch_id INT NOT NULL,
        cert_id VARCHAR(255) UNIQUE NOT NULL,
        pdf_path VARCHAR(255),
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_eligible BOOLEAN DEFAULT 0,
        UNIQUE(student_id, batch_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS waitlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        batch_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, batch_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS service_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        service_type VARCHAR(255) NOT NULL,
        message TEXT,
        status ENUM('pending','contacted','archived') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS batch_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        message TEXT,
        link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        \`value\` TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS email_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        purpose VARCHAR(255),
        body TEXT,
        html TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'sent',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tables) {
      await connection.query(sql);
    }
    
    console.log("✅ MySQL Database schema initialized.");

    // Insert default settings
    const defaultSettings = [
      ['min_attendance_pct', '75'],
      ['cert_counter', '0'],
      ['site_name', 'Snagup Technologies'],
      ['site_url', 'http://localhost:3000'],
      ['site_logo', 'https://snagup.com/logo.png'],
      ['contact_email', 'snaguptechnologies@gmail.com'],
      ['contact_phone', '+91 98765 43210'],
      ['upi_id', ''],
      ['upi_qr_image', ''],
      ['razorpay_key_id', ''],
      ['razorpay_key_secret', ''],
      ['session_reminders', '[60, 30]']
    ];

    for (const [key, value] of defaultSettings) {
      await connection.query('INSERT IGNORE INTO settings (\`key\`, \`value\`) VALUES (?, ?)', [key, value]);
    }

    // Seed admin user
    const adminEmail = 'admin@snagup.com';
    const [adminRows] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (adminRows.length === 0) {
      const hash = bcrypt.hashSync('Admin@123', 10);
      await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Super Admin', adminEmail, hash, 'admin']);
      console.log(`✅ Admin seeded: ${adminEmail} / Admin@123`);
    }

    connection.release();
  } catch (err) {
    console.error("❌ Error initializing MySQL schema:", err.message);
  }
}

async function initializeDatabase() {
    await ensureDatabaseExists();
    await initializeTables();
}

const dbReady = initializeDatabase();
pool.dbReady = dbReady;
pool.initializeDatabase = initializeDatabase;

module.exports = pool;
