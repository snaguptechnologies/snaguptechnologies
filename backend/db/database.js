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
        learning_objectives TEXT,
        prerequisites TEXT,
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
        release_type ENUM('AUTOMATIC', 'ADMIN_OVERRIDE') DEFAULT 'AUTOMATIC',
        status VARCHAR(50) DEFAULT 'GENERATED',
        release_reason TEXT,
        released_by_admin_id INT,
        released_by_admin_name VARCHAR(255),
        progress_at_release DECIMAL(5,2) DEFAULT 0.00,
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
        \`value\` LONGTEXT
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
      )`,
      `CREATE TABLE IF NOT EXISTS course_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        app_id VARCHAR(50) UNIQUE NOT NULL,
        student_id INT NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        college_name VARCHAR(255) NOT NULL,
        college_register_id VARCHAR(100),
        whatsapp_number VARCHAR(50) NOT NULL,
        course_id INT,
        course_name VARCHAR(255) NOT NULL,
        status ENUM('Applied', 'Enrolled', 'In Progress', 'Completed', 'Rejected') DEFAULT 'Applied',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS student_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        activity_type ENUM('application', 'enrollment', 'course_start', 'course_completion', 'certificate_issued', 'certificate_downloaded') NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS digital_twin_devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        ip_address VARCHAR(100) NOT NULL,
        status ENUM('GREEN','YELLOW','ORANGE','RED','GRAY') DEFAULT 'GREEN',
        cpu_utilization INT DEFAULT 15,
        memory_utilization INT DEFAULT 30,
        network_traffic INT DEFAULT 1000,
        active_connections INT DEFAULT 50,
        criticality INT DEFAULT 8,
        risk_level INT DEFAULT 10,
        anomaly_score DECIMAL(5,2) DEFAULT 0.05,
        last_sync_time DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS security_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id VARCHAR(100) UNIQUE NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        source_ip VARCHAR(100),
        dest_ip VARCHAR(100),
        attack_type VARCHAR(100) NOT NULL,
        confidence DECIMAL(5,2) DEFAULT 95.0,
        anomaly_score DECIMAL(5,2) DEFAULT 0.85,
        risk_score INT DEFAULT 75,
        severity ENUM('LOW','MEDIUM','HIGH','CRITICAL') DEFAULT 'HIGH',
        affected_device_id VARCHAR(50),
        explanation_json TEXT,
        recommended_response VARCHAR(255),
        response_status ENUM('RECOMMENDED','SIMULATED','EXECUTED','DISMISSED') DEFAULT 'RECOMMENDED'
      )`,
      `CREATE TABLE IF NOT EXISTS course_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        sequence_order INT DEFAULT 1,
        status ENUM('active','inactive') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS course_lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        resource_url VARCHAR(500),
        video_url VARCHAR(500),
        sequence_order INT DEFAULT 1,
        status ENUM('active','inactive') DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
      )`
    ];

    for (const sql of tables) {
      await connection.query(sql);
    }
    
    // Ensure courses table columns exist
    try { await connection.query(`ALTER TABLE courses ADD COLUMN learning_objectives TEXT`); } catch (e) {}
    try { await connection.query(`ALTER TABLE courses ADD COLUMN prerequisites TEXT`); } catch (e) {}

    console.log("✅ MySQL Database schema initialized.");

    // Insert default settings
    const defaultSettings = [
      ['min_attendance_pct', '75'],
      ['cert_counter', '0'],
      ['site_name', 'Snagup Technologies'],
      ['site_url', 'http://localhost:3000'],
      ['site_logo', 'https://snagup.com/logo.png'],
      ['contact_email', 'snaguptechnologies@gmail.com'],
      ['contact_phone', '+91 82703 03995'],
      ['site_description', 'Premium LMS Platform by Snagup Technologies'],
      ['site_keywords', 'lms, education, snagup, courses, training'],
      ['favicon_url', ''],
      ['upi_id', ''],
      ['upi_qr_image', ''],
      ['razorpay_key_id', ''],
      ['razorpay_key_secret', ''],
      ['session_reminders', '[60, 30]']
    ];

    for (const [key, value] of defaultSettings) {
      await connection.query('INSERT IGNORE INTO settings (`key`, `value`) VALUES (?, ?)', [key, value]);
    }

    // Seed admin user
    const adminEmail = 'admin@snagup.com';
    const [adminRows] = await connection.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (adminRows.length === 0) {
      const hash = bcrypt.hashSync('Admin@123', 10);
      await connection.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', ['Super Admin', adminEmail, hash, 'admin']);
      console.log(`✅ Admin seeded: ${adminEmail} / Admin@123`);
    }

    // Migration: ensure certificates table has override audit columns
    const certCols = [
      { name: 'release_type', type: "ENUM('AUTOMATIC', 'ADMIN_OVERRIDE') DEFAULT 'AUTOMATIC'" },
      { name: 'status', type: "VARCHAR(50) DEFAULT 'GENERATED'" },
      { name: 'release_reason', type: "TEXT" },
      { name: 'released_by_admin_id', type: "INT" },
      { name: 'released_by_admin_name', type: "VARCHAR(255)" },
      { name: 'progress_at_release', type: "DECIMAL(5,2) DEFAULT 0.00" }
    ];
    for (const col of certCols) {
      try {
        await connection.query(`ALTER TABLE certificates ADD COLUMN ${col.name} ${col.type}`);
      } catch (colErr) {
        // Column likely already exists
      }
    }

    // Seed all 17 courses & default batches
    const targetCourses = [
      { name: 'Frontend Development', category: 'Software Development', description: 'Modern HTML5, CSS3, JavaScript ES6+, React & Responsive UI Design' },
      { name: 'Advanced Python Programming', category: 'Software Development', description: 'Object-Oriented Architecture, Metaprogramming, Async Workflows & System Design' },
      { name: 'Java Programming', category: 'Software Development', description: 'Comprehensive Object-Oriented Java Programming & Enterprise Apps' },
      { name: 'C Programming', category: 'Software Development', description: 'Core C Programming Foundations, Memory Management & Data Structures' },
      { name: 'C++ Programming', category: 'Software Development', description: 'Modern C++17/20, STL Optimization, Templates & High Performance Code' },
      { name: 'Python Backend Development', category: 'Backend & Application Development', description: 'REST APIs, FastAPI, Django, PostgreSQL & Async Microservices' },
      { name: 'Java Backend Development', category: 'Backend & Application Development', description: 'Spring Boot 3, Microservices Architecture, Hibernate & Security' },
      { name: 'Generative AI & Prompt Engineering', category: 'Backend & Application Development', description: 'Generative AI Prompt Design, Fine-tuning, RAG & LLM Application Workflows' },
      { name: 'VLSI Design & Development', category: 'Backend & Application Development', description: 'Verilog HDL, Semiconductor Design, FPGA & Digital Circuit Architecture' },
      { name: 'Embedded Systems Programming', category: 'Backend & Application Development', description: 'Comprehensive Embedded C Systems, ARM Microcontrollers & IoT Hardware' },
      { name: 'Database Management Systems', category: 'Data & Artificial Intelligence', description: 'Relational SQL, Query Optimization, Indexing, Transactions & NoSQL' },
      { name: 'Data Analytics with Power BI', category: 'Data & Artificial Intelligence', description: 'Business Intelligence, DAX Queries & Interactive Dashboards' },
      { name: 'Machine Learning', category: 'Data & Artificial Intelligence', description: 'Supervised & Unsupervised ML, Predictive Models & Neural Networks' },
      { name: 'Data Science', category: 'Data & Artificial Intelligence', description: 'Pandas, Statistical Analysis, Predictive Analytics & Data Visualizations' },
      { name: 'AWS Cloud Computing', category: 'Cloud & Web3 Technologies', description: 'AWS Cloud Architecture, EC2, S3, Serverless Lambda & DevOps' },
      { name: 'Web3 Development', category: 'Cloud & Web3 Technologies', description: 'Decentralized Applications (dApps), Ethers.js, IPFS & Blockchain Clients' },
      { name: 'Smart Contract Development', category: 'Cloud & Web3 Technologies', description: 'Ethereum EVM Solidity Programming, Security Audits & Token Standards' },
      { name: 'Advanced Backend', category: 'Backend & Application Development', description: 'Master REST API architecture, microservices design, performance optimization, rate limiting, and system design patterns' },
      { name: 'Deep Learning', category: 'Data & Artificial Intelligence', description: 'Neural network architectures, PyTorch, TensorFlow, CNNs, Transformers, and computer vision models' },
      { name: 'Statistics Python', category: 'Data & Artificial Intelligence', description: 'Statistical computing with Python, SciPy, Statsmodels, hypothesis testing, probability distributions, and inferential analytics' },
      { name: 'Hardhat', category: 'Cloud & Web3 Technologies', description: 'Ethereum development environment, smart contract compilation, automated unit testing with Hardhat, deployment scripts, and debugging' },
      { name: 'Blockchain Basics', category: 'Cloud & Web3 Technologies', description: 'Foundational decentralized ledgers, cryptographic hashing, consensus mechanisms, transactions, wallet security, and Web3 fundamentals' }
    ];

    const approvedNames = targetCourses.map(c => c.name);

    for (const cData of targetCourses) {
      try {
        const [cRows] = await connection.query("SELECT id FROM courses WHERE name = ? ORDER BY id ASC", [cData.name]);
        let courseId;
        if (cRows.length === 0) {
          const [cRes] = await connection.query(
            "INSERT INTO courses (name, description, duration_days, category, status) VALUES (?, ?, ?, ?, ?)",
            [cData.name, cData.description, 30, cData.category, 'active']
          );
          courseId = cRes.insertId;
          console.log(`✅ Course seeded: ${cData.name} (ID: ${courseId})`);
        } else {
          courseId = cRows[0].id;
          // Clean up duplicate course rows for this same name if any exist
          if (cRows.length > 1) {
            const duplicateIds = cRows.slice(1).map(r => r.id);
            await connection.query("DELETE FROM courses WHERE id IN (?)", [duplicateIds]);
            console.log(`🧹 Removed ${duplicateIds.length} duplicate course rows for: ${cData.name}`);
          }
        }

        // Seed default batch if absent
        const [bRows] = await connection.query(
          "SELECT id FROM batches WHERE course_id = ? AND batch_status IN ('upcoming', 'active') ORDER BY id ASC",
          [courseId]
        );
        if (bRows.length === 0) {
          await connection.query(
            "INSERT INTO batches (name, course_id, duration_days, price, enrollment_status, batch_status, start_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
            ['Batch 1', courseId, 30, 0, 'open', 'upcoming', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
          );
          console.log(`✅ Batch 1 seeded for course: ${cData.name}`);
        } else if (bRows.length > 1) {
          // Clean up duplicate batches for this course
          const duplicateBatchIds = bRows.slice(1).map(r => r.id);
          await connection.query("DELETE FROM batches WHERE id IN (?)", [duplicateBatchIds]);
          console.log(`🧹 Removed ${duplicateBatchIds.length} duplicate batch rows for course: ${cData.name}`);
        }
      } catch (cErr) {
        console.error(`⚠️ Error seeding course ${cData.name}:`, cErr.message);
      }
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
