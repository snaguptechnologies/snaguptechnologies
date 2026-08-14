const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/payments - Admin only: List all payments
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
        const [payments] = await db.execute(`
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
                    b.course_id as course_id,
                    e.batch_id as batch_id,
                    c.name as course_name,
                    p.transaction_id as latest_transaction_id,
                    p.amount as paid_amount,
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

    const formattedPayments = payments.map(p => {
        let history = [];
        if (p.payment_history) {
            history = typeof p.payment_history === 'string' ? JSON.parse(p.payment_history) : p.payment_history;
        }
        return {
            ...p,
            id: p.enrollment_id, // Ensure frontend 'key' is enrollment_id
            payment_history: history
        };
    });

    res.json(formattedPayments);
  } catch (err) {
    console.error('Fetch Payments Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/payments/create-order - Create a Razorpay order
router.post('/create-order', authenticateToken, async (req, res) => {
  const { batch_id } = req.body;

  if (!batch_id) {
    return res.status(400).json({ error: 'Batch ID is required' });
  }

  try {
    const [batchRows] = await db.execute('SELECT price, name FROM batches WHERE id = ?', [batch_id]);
    const batch = batchRows[0];
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const [settings] = await db.execute('SELECT \`key\`, \`value\` FROM settings WHERE \`key\` IN (?, ?)', ['razorpay_key_id', 'razorpay_key_secret']);
    const keyId = settings.find(s => s.key === 'razorpay_key_id')?.value;
    const keySecret = settings.find(s => s.key === 'razorpay_key_secret')?.value;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay keys not configured by admin' });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(batch.price * 100), 
      currency: "INR",
      receipt: `receipt_batch_${batch_id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId, 
      batch_name: batch.name
    });

  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order: ' + error.message });
  }
});

module.exports = router;
