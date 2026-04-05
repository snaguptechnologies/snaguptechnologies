const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({ 
    host: 'gateway01.us-west-2.prod.aws.tidbcloud.com', 
    user: '2GmxTsPheUYMQt1.root', 
    password: 'GMBWedMI3SDmLX9G', 
    port: 4000, 
    database: 'test', 
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } 
  }); 

  try {
    const [rows] = await pool.query(`
      SELECT e.id as enrollment_id,
             e.status as enrollment_status,
              DATE_FORMAT(e.enrolled_at, '%Y-%m-%dT%H:%i:%sZ') as enrolled_at,
              DATE_FORMAT(e.updated_at, '%Y-%m-%dT%H:%i:%sZ') as updated_at,
              e.admin_feedback,
              e.rejection_category,
              u.name as student_name, 
              u.email as student_email,
              u.phone as student_phone,
              b.name as batch_name, 
              b.price as batch_price,
              b.start_date as batch_start_date,
              c.name as course_name,
              p.transaction_id as latest_transaction_id,
              DATE_FORMAT(p.created_at, '%Y-%m-%dT%H:%i:%sZ') as payment_date,
              (SELECT JSON_ARRAYAGG(JSON_OBJECT(
                'id', id, 
                'transaction_id', transaction_id, 
                'amount', amount, 
                'status', status, 
                'created_at', DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ')
              )) FROM payments WHERE enrollment_id = e.id) as payment_history
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN batches b ON e.batch_id = b.id
      JOIN courses c ON b.course_id = c.id
      LEFT JOIN (SELECT enrollment_id, MAX(id) as max_id FROM payments GROUP BY enrollment_id) p_max ON p_max.enrollment_id = e.id
      LEFT JOIN payments p ON p.id = p_max.max_id
      ORDER BY 
          CASE WHEN e.status = 'pending' THEN 0 ELSE 1 END,
          e.updated_at DESC,
          e.enrolled_at DESC
    `);
    console.log('Query OK:', rows.length);
  } catch(e) {
    console.error('Error in query:', e.message);
  }
  pool.end();
}

run();
