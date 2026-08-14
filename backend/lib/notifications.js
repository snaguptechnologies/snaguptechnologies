const db = require('../db/database');
const { sendEmail, notifyVerificationPending, notifyCertificateFinalized, formatTimeAMPM } = require('./emailService');
// Helper: IST-aware current datetime string (YYYY-MM-DDTHH:mm)
function nowIST() {
    return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString();
}
// Worker fires every N minutes — tolerance band uses this to avoid missing a window between ticks
const WORKER_INTERVAL_MINS = 4; // Slightly above the 3-min interval for safety

const checkUpcomingSessions = async () => {
    // Check upcoming sessions is disabled in favor of manual instructor buttons
    console.log("[Worker] checkUpcomingSessions is currently disabled.");
};

const sendSessionAlert = async (session, minutes, reminderLabel = "Reminder") => {
    // Disabled in logic
};

/**
 * Automates the Batch Lifecycle:
 * 1. Auto-End: Active batches past their calculated end date -> 'completed'
 * 2. Auto-Archive: Completed batches past their verification deadline -> Set archived_at
 */
const processLifecycleTransitions = async () => {
    const now = nowIST();
    const today = now.split('T')[0];
    
    // We must parse now manually for MySQL compatibility in cases where T isn't accepted natively,
    // actually standard MySQL handles ISO format like 'YYYY-MM-DDTHH:MM:SS.mmmZ' decently, 
    // but better to prepare specifically.
    const mysqlNow = new Date().toISOString().slice(0, 19).replace('T', ' ');

    try {
        // 0. AUTO-CLOSE & AUTO-START SYNC
        await db.execute(`
            UPDATE batches
            SET enrollment_status = 'closed'
            WHERE enrollment_status = 'open'
              AND enrollment_end_date IS NOT NULL
              AND enrollment_end_date <= ?
              AND is_finalized = 0
        `, [mysqlNow]);

        await db.execute(`
            UPDATE batches
            SET batch_status = 'active'
            WHERE batch_status = 'upcoming'
              AND start_date IS NOT NULL
              AND start_date <= ?
        `, [today]);

        // 2. AUTO-ARCHIVE BATCHES (Finalize Certs & Hide from Instructor)
        const [archivingBatches] = await db.execute(`
            SELECT b.*, c.name as course_name 
            FROM batches b
            JOIN courses c ON b.course_id = c.id
            WHERE b.batch_status = 'completed' 
              AND b.archived_at IS NULL
              AND b.verification_deadline IS NOT NULL
              AND b.verification_deadline <= ?
        `, [mysqlNow]);

        const { generateCertificateInternal } = require('../routes/certificates');

        for (const batch of archivingBatches) {
            try {
                const archivedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
                
                await db.execute(`
                    UPDATE batches 
                    SET archived_at = ?
                    WHERE id = ?
                `, [archivedAt, batch.id]);

                // Fetch approved students to issue certificates
                const [students] = await db.execute(`
                    SELECT student_id as id, u.email, u.name 
                    FROM enrollments e 
                    JOIN users u ON e.student_id = u.id 
                    WHERE e.batch_id = ? AND e.status = 'approved'
                `, [batch.id]);

                let certsIssued = 0;
                for (const student of students) {
                    const result = await generateCertificateInternal(student.id, batch.id);
                    if (result && result.success) certsIssued++;
                }

                if (students.length > 0) {
                    await notifyCertificateFinalized(students, batch.name);
                }
                console.log(`✅ Auto-archived batch: ${batch.name}. Issued ${certsIssued} certificates. Hide trigger set for instructor.`);
            } catch (err) {
                console.error(`❌ Failed to auto-archive batch ${batch.id}:`, err);
            }
        }
    } catch (err) {
        console.error("Lifecycle error:", err);
    }
};

// Start the worker
const startNotificationWorker = () => {
    console.log("🚀 Lifecycle & (Manual-Only) Worker Started (Interval: 3 mins)");
    setInterval(() => {
        processLifecycleTransitions();
    }, 3 * 60 * 1000); // Check every 3 minutes
    
    // Initial checks
    processLifecycleTransitions();
};

module.exports = { startNotificationWorker, checkUpcomingSessions, processLifecycleTransitions };
