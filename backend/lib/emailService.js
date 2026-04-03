const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const db = require('../db/database');
dotenv.config();

// Dynamic site URL — reads from Admin System Settings (site_url key)
// Falls back to SITE_URL env var, then localhost for dev
const getSiteUrl = async () => {
    try {
        const [rows] = await db.execute(`SELECT \`value\` FROM settings WHERE \`key\` = 'site_url'`);
        if (rows.length > 0 && rows[0].value && rows[0].value !== 'http://localhost:3000') {
            return rows[0].value.replace(/\/$/, ''); // strip trailing slash
        }
    } catch (e) { /* db not ready yet */ }
    return process.env.SITE_URL || 'http://localhost:3000';
};

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutesStr} ${ampm}`;
};

const sendEmail = async ({ to, subject, body, html, purpose = 'System Alert' }) => {
    let status = 'sent';
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.warn("⚠️ SMTP not configured. Logging email instead.");
        console.log(`📧 TO: ${to}\n📝 SUBJECT: ${subject}\n📄 BODY: ${body}`);
    } else {
        try {
            const info = await transporter.sendMail({
                from: process.env.EMAIL_FROM || '"Snagup Technologies" <noreply@snagup.com>',
                to,
                subject,
                text: body,
                html: html || body.replace(/\n/g, '<br>'),
            });
            console.log(`✅ Email sent: ${info.messageId}`);
        } catch (error) {
            console.error("❌ Error sending email:", error);
            status = 'failed';
        }
    }

    try {
        await db.execute(`
            INSERT INTO email_logs (recipient_email, subject, purpose, status)
            VALUES (?, ?, ?, ?)
        `, [to, subject, purpose, status]);
    } catch(e) {
        console.error("Failed to insert email log", e);
    }
    return status === 'sent';
};

const notifyStudentsOfSessionLink = async (students, courseName, batchName, sessionLink, sessionTimeStr) => {
    // sessionTimeStr is "YYYY-MM-DD HH:MM"
    const [date, time] = sessionTimeStr.split(' ');
    const formattedTime = formatTimeAMPM(time);
    const subject = `Session Planned: ${courseName} - ${batchName}`;

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #000000; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 22px; font-weight: 900; margin: 0 0 10px 0; text-transform: uppercase;">Session Planned</h2>
                <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">${courseName}</div>
                <p style="font-size: 14px; line-height: 1.6; margin: 0;">A new live session has been scheduled for your batch: <strong>${batchName}</strong>.</p>
            </div>
            
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px;">
                <p style="margin: 0 0 15px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">Session Logistics</p>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 5px 0; font-weight: 700; width: 100px;">Course:</td><td>${courseName}</td></tr>
                    <tr><td style="padding: 5px 0; font-weight: 700;">Batch:</td><td>${batchName}</td></tr>
                    <tr><td style="padding: 5px 0; font-weight: 700;">Date:</td><td>${date}</td></tr>
                    <tr><td style="padding: 5px 0; font-weight: 700;">Time:</td><td style="font-size: 16px; font-weight: 900;">🕒 ${formattedTime}</td></tr>
                </table>
            </div>

            <a href="${sessionLink}" style="display: block; background-color: #000000; color: #ffffff; text-align: center; padding: 20px; font-weight: 900; text-decoration: none; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em;">JOIN LIVE SESSION</a>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Hello,\n\nA new session has been planned for:\nCourse: ${courseName}\nBatch: ${batchName}\nDate: ${date}\nTime: ${formattedTime}\n\nJoin the session here: ${sessionLink}\n\nHappy learning!\n- Snagup Technologies Team`;

    for (const student of students) {
        if (student.email) {
            await sendEmail({
                to: student.email,
                subject,
                body: plainBody,
                html: htmlTemplate,
                purpose: 'Session Planned Notification'
            });
        }
    }
};

const notifyEnrollmentReceived = async (student, batchName, transactionId) => {
    const subject = `Registration Received: ${batchName}`;

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #000000; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 24px; font-weight: 900; margin: 0 0 10px 0; text-transform: uppercase;">Registration Received</h2>
                <p style="font-size: 14px; line-height: 1.6; margin: 0;">Hello <strong>${student.name}</strong>, we have received your enrollment request for:</p>
                <div style="font-size: 20px; font-weight: 900; margin-top: 10px;">${batchName}</div>
            </div>
            
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">Verification Status</p>
                <div style="margin-top: 10px; font-size: 14px; line-height: 1.6;">
                    Your payment (UTR: <strong>${transactionId}</strong>) is currently being manually verified by our administration team. 
                    <br><br>
                    <strong>Estimated Time:</strong> 24-48 Hours.
                </div>
            </div>

            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px; background-color: #f8f9fa;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">What's Next?</p>
                <ul style="margin: 10px 0 0 0; padding: 0 0 0 20px; font-size: 14px; line-height: 1.6;">
                    <li>You will receive another email once your payment is approved.</li>
                    <li>Once approved, you will gain full access to course materials and session links.</li>
                    <li>If there are any issues with your UTR, we will notify you through the portal.</li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Hello ${student.name},\n\nWe have received your enrollment request for "${batchName}".\n\nYour payment (UTR: ${transactionId}) is currently being verified. This process typically takes 24-48 hours.\n\nYou will be notified via email once your enrollment is approved.\n\nThank you for choosing Snagup Technologies.\n\n- The Snagup Technologies Team`;

    await sendEmail({
        to: student.email,
        subject,
        body: plainBody,
        html: htmlTemplate,
        purpose: 'Registration Received Notification'
    });
};

const notifyEnrollmentSuccess = async (student, batchName, details = {}) => {
    const { courseName, price, start_date, instructor_name, broadcast_message } = details;
    const subject = `Welcome to the Course: ${courseName || batchName}`;

    const siteUrl = await getSiteUrl();

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #000000; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 24px; font-weight: 900; margin: 0 0 10px 0; text-transform: uppercase;">Enrollment Successful</h2>
                <p style="font-size: 14px; line-height: 1.6; margin: 0;">Congratulations, <strong>${student.name}</strong>! Your payment was successful and you are now officially enrolled in:</p>
                <div style="font-size: 20px; font-weight: 900; margin-top: 10px;">${courseName} - ${batchName}</div>
            </div>
            
            ${broadcast_message ? `
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px; background-color: #fffbeb;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">Instructor Guidelines</p>
                <div style="margin-top: 10px; font-size: 14px; line-height: 1.6; font-style: italic;">
                    "${broadcast_message}"
                </div>
            </div>
            ` : ''}

            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">Enrollment Details</p>
                <table style="width: 100%; margin-top: 10px; border-collapse: collapse; font-size: 14px;">
                    <tr><td style="padding: 5px 0; font-weight: 700; width: 100px;">Course:</td><td>${courseName}</td></tr>
                    <tr><td style="padding: 5px 0; font-weight: 700;">Batch:</td><td>${batchName}</td></tr>
                    <tr><td style="padding: 5px 0; font-weight: 700;">Price Paid:</td><td>₹${price || 'N/A'}</td></tr>
                    ${instructor_name ? `<tr><td style="padding: 5px 0; font-weight: 700;">Instructor:</td><td>${instructor_name}</td></tr>` : ''}
                </table>
                <p style="margin: 15px 0 0 0; font-size: 13px; font-weight: 600; font-style: italic; color: #444;">Note: Your session schedule will be handled and notified to you directly by your instructor.</p>
            </div>

            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px; background-color: #f8f9fa;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">Preparation</p>
                <ul style="margin: 10px 0 0 0; padding: 0 0 0 20px; font-size: 14px; line-height: 1.6;">
                    <li>Log in to your dashboard to access course materials.</li>
                    <li>Check your schedule for upcoming live sessions.</li>
                    <li>Stay tuned for email reminders before each session.</li>
                </ul>
            </div>

            <a href="${siteUrl}/dashboard/student" style="display: block; background-color: #000000; color: #ffffff; text-align: center; padding: 20px; font-weight: 900; text-decoration: none; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em;">GO TO DASHBOARD</a>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Congratulations ${student.name}!\n\nYour payment was successful and you have been enrolled in ${courseName} - ${batchName}.\n\n${broadcast_message ? `Instructor Guidelines:\n"${broadcast_message}"\n\n` : ''}Course: ${courseName}\nBatch: ${batchName}\nPrice: ₹${price || 'N/A'}\nInstructor: ${instructor_name || 'TBA'}\n\nNote: Your session schedule will be handled and notified to you directly by your instructor.\n\nLog in here: ${siteUrl}/dashboard/student\n\nHappy learning!\n- Snagup Technologies Team`;

    await sendEmail({
        to: student.email,
        subject,
        body: plainBody,
        html: htmlTemplate,
        purpose: 'Enrollment Success Notification'
    });
};

const notifyEnrollmentOpened = async (students, courseName, batchName, deadline) => {
    const subject = `Enrollment is OPEN: ${courseName} - ${batchName}`;

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #000000; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 24px; font-weight: 900; margin: 0 0 10px 0; text-transform: uppercase;">Enrollment Now Open</h2>
                <p style="font-size: 14px; line-height: 1.6; margin: 0;">You asked us to notify you! Enrollment is now officially open for your requested course.</p>
            </div>
            
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">Course Details</p>
                <div style="margin-top: 10px;">
                    <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Course:</strong> ${courseName}</p>
                    <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Batch:</strong> ${batchName}</p>
                    <p style="margin: 0; font-size: 14px; color: #e11d48;"><strong>Deadline:</strong> ${deadline || 'TBA'}</p>
                </div>
            </div>

            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px; background-color: #f8f9fa;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">Act Fast</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.6;">Seats may fill up quickly. Secure your admission immediately through the student portal.</p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Hello,\n\nYou asked us to notify you! Enrollment is now OPEN.\n\nCourse: ${courseName}\nBatch: ${batchName}\nDeadline: ${deadline || 'TBA'}\n\nSeats may fill up quickly. Secure your admission immediately through the student portal.\n\nHappy learning!\n- Snagup Technologies Team`;

    for (const student of students) {
        if (student.email) {
            await sendEmail({
                to: student.email,
                subject,
                body: plainBody,
                html: htmlTemplate,
                purpose: 'Enrollment Opened Notification'
            });
        }
    }
};

const notifyStudentsOfInstructorNote = async (students, batchName, note) => {
    const subject = `Update for ${batchName}: Note from Instructor`;

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #000000; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase;">Note from Instructor</h2>
            </div>
            
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px; line-height: 1.6;">
                <p style="margin: 0; font-size: 15px;">${note}</p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Hello,\n\nYour instructor has sent a note for batch "${batchName}":\n\n"${note}"\n\nPlease check your student portal for further updates.\n\n- Snagup Technologies Team`;

    for (const student of students) {
        if (student.email) {
            await sendEmail({
                to: student.email,
                subject,
                body: plainBody,
                html: htmlTemplate,
                purpose: 'Instructor Note Notification'
            });
        }
    }
};

const notifyCertificateIssued = async (studentEmail, studentName, batchName, certId) => {
    const subject = `Congratulations! Your Certificate is Ready: ${batchName}`;

    const siteUrl = await getSiteUrl();

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #000000; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 24px; font-weight: 900; margin: 0 0 10px 0; text-transform: uppercase;">Graduation Successful</h2>
                <p style="font-size: 14px; line-height: 1.6; margin: 0;">Congratulations, <strong>${studentName}</strong>! Your digital certificate has been issued for the batch: <strong>${batchName}</strong>.</p>
            </div>
            
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; border-bottom: 1px solid #000000; display: inline-block;">Certificate Information</p>
                <div style="margin-top: 10px;">
                    <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Certificate ID:</strong> ${certId}</p>
                    <p style="margin: 0; font-size: 12px; color: #666;">This certificate is digitally signed and verifiable via QR code.</p>
                </div>
            </div>

            <a href="${siteUrl}/dashboard/student" style="display: block; background-color: #000000; color: #ffffff; text-align: center; padding: 20px; font-weight: 900; text-decoration: none; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em;">VIEW IN PORTAL</a>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Congratulations ${studentName}!\n\nYour digital certificate for ${batchName} has been issued.\n\nCertificate ID: ${certId}\n\nYou can download it from your student dashboard: ${siteUrl}/dashboard/student\n\n- Snagup Technologies Team`;

    await sendEmail({
        to: studentEmail,
        subject,
        body: plainBody,
        html: htmlTemplate,
        purpose: 'Certificate Issuance Notification'
    });
};

const notifyInstructorOfUpdate = async (instructorEmail, instructorName, courseName, batchName, updateType, updateDetails = "") => {
    const subject = `Instructor Alert: ${updateType} | ${courseName}`;

    const siteUrl = await getSiteUrl();

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 40px; border: 4px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="margin-bottom: 40px; border-bottom: 4px solid #000000; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.05em; text-transform: uppercase; line-height: 1;">FACILITATOR ALERT</h1>
                    <p style="margin: 5px 0 0 0; font-size: 10px; font-weight: 800; letter-spacing: 0.3em; text-transform: uppercase; color: #666;">Snagup Technologies Core</p>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 10px; font-weight: 900; background-color: #000000; color: #ffffff; padding: 4px 8px; text-transform: uppercase; letter-spacing: 0.1em;">PRIORITY 1</span>
                </div>
            </div>

            <div style="margin-bottom: 40px;">
                <p style="font-size: 16px; font-weight: 500; margin: 0 0 10px 0;">Greetings Facilitator <strong>${instructorName}</strong>,</p>
                <h2 style="font-size: 36px; font-weight: 900; margin: 0; line-height: 1; letter-spacing: -0.02em; text-transform: uppercase;">${updateType}</h2>
                <div style="font-size: 20px; font-weight: 700; margin-top: 10px; text-transform: uppercase;">${courseName}</div>
            </div>

            <div style="background-color: #f8f9fa; border: 2px solid #000000; padding: 30px; margin-bottom: 40px;">
                <p style="margin: 0 0 15px 0; font-size: 10px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; display: inline-block;">Contextual Data</p>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 10px 0; font-size: 14px; font-weight: 700; width: 120px; text-transform: uppercase; letter-spacing: 0.05em;">Course:</td>
                        <td style="padding: 10px 0; font-size: 16px; font-weight: 800;">${courseName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; font-size: 14px; font-weight: 700; width: 120px; text-transform: uppercase; letter-spacing: 0.05em;">Batch:</td>
                        <td style="padding: 10px 0; font-size: 16px; font-weight: 800;">${batchName}</td>
                    </tr>
                    ${updateDetails ? `
                    <tr>
                        <td style="padding: 10px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: top;">Update:</td>
                        <td style="padding: 10px 0; font-size: 14px; line-height: 1.5;">${updateDetails}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            <a href="${siteUrl}/dashboard/instructor" style="display: block; background-color: #000000; color: #ffffff; text-align: center; padding: 25px; font-weight: 900; text-decoration: none; font-size: 16px; text-transform: uppercase; letter-spacing: 0.1em;">ACCESS INSTRUCTOR CONSOLE</a>

            <div style="text-align: center; margin-top: 60px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Instructor Alert: ${updateType}\n\nCourse: ${courseName}\nBatch: ${batchName}\nDetails: ${updateDetails}\n\nAccess Dashboard: ${siteUrl}/dashboard/instructor\n\n- Snagup Technologies Team`;

    await sendEmail({
        to: instructorEmail,
        subject,
        body: plainBody,
        html: htmlTemplate,
        purpose: `Instructor Alert: ${updateType}`
    });
};

const notifyVerificationPending = async (students, batchName) => {
    const subject = `Course Completed: Verification in Progress - ${batchName}`;

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #000000; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase;">Batch Completed</h2>
            </div>
            
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px; line-height: 1.6;">
                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 700;">Congratulations on completing your course: ${batchName}!</p>
                <p style="margin: 0; font-size: 14px;">Our team is currently performing the final attendance and performance verification. You will receive your digital certificate within **two days** after this verification process is finalized.</p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Congratulations! You have completed the course "${batchName}".\n\nOur team is performing final verifications. You will receive your certificate within two days after the verification process.\n\n- Snagup Technologies Team`;

    for (const student of students) {
        if (student.email) {
            await sendEmail({
                to: student.email,
                subject,
                body: plainBody,
                html: htmlTemplate,
                purpose: 'Course Completion Pending'
            });
        }
    }
};

const notifyCertificateFinalized = async (students, batchName) => {
    const subject = `Your Certificate is Now Available: ${batchName}`;

    const siteUrl = await getSiteUrl();

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #10b981; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase;">Certificate Issued</h2>
            </div>
            
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px; line-height: 1.6;">
                <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: 700;">Achievement Finalized!</p>
                <p style="margin: 0; font-size: 14px;">The verification process for **${batchName}** is complete. Your certificate is now ready for download from the student portal.</p>
            </div>

            <a href="${siteUrl}/dashboard/student" style="display: block; background-color: #000000; color: #ffffff; text-align: center; padding: 20px; font-weight: 900; text-decoration: none; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em;">DOWNLOAD CERTIFICATE</a>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Great news! Your certificate for "${batchName}" is now available for download from your student portal.\n\n- Snagup Technologies Team`;

    for (const student of students) {
        if (student.email) {
            await sendEmail({
                to: student.email,
                subject,
                body: plainBody,
                html: htmlTemplate,
                purpose: 'Certificate Finalized'
            });
        }
    }
};

const notifyEnrollmentRejected = async (user, batchName, feedback) => {
    const subject = `Enrollment Status Update: ${batchName}`;
    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #e11d48; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>
            <div style="background-color: #fce7f3; color: #e11d48; padding: 30px; margin-bottom: 30px; border: 1px solid #e11d48;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 900; text-transform: uppercase;">Action Required: Enrollment Rejected</h2>
                <p style="margin: 10px 0 0 0; font-size: 14px; font-weight: 700; opacity: 0.9;">${batchName}</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; font-weight: 500; margin-bottom: 24px;">Hello ${user.name},</p>
            <p style="font-size: 16px; line-height: 1.6; font-weight: 500; margin-bottom: 24px;">Your enrollment request for <strong>${batchName}</strong> has been reviewed and unfortunately cannot be approved at this time.</p>
            <div style="background-color: #f8fafc; padding: 24px; border-left: 4px solid #e11d48; margin-bottom: 30px;">
                <p style="font-size: 12px; font-weight: 900; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0;">Official Feedback</p>
                <p style="font-size: 15px; font-weight: 600; color: #0f172a; margin: 0; font-style: italic;">"${feedback || 'No specific reason provided.'}"</p>
            </div>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 30px;">You can log in to your dashboard to clear this request and re-apply with the correct information.</p>
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;
    const plainBody = `Your enrollment for ${batchName} was rejected. Feedback: ${feedback}`;
    await sendEmail({ to: user.email, subject, body: plainBody, html: htmlTemplate, purpose: 'Enrollment Rejected' });
};

const notifyGuidelines = async (students, batchName, guidelines) => {
    const subject = `Important Guidelines for ${batchName}`;

    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 2px solid #000000; background-color: #ffffff; color: #000000;">
            <div style="text-align: center; border-bottom: 2px solid #000000; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Snagup Technologies</h1>
                <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;">E-Learning Excellence</p>
            </div>

            <div style="background-color: #000000; color: #ffffff; padding: 30px; margin-bottom: 30px;">
                <h2 style="font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase;">Course Guidelines</h2>
                <p style="font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">Important information regarding your upcoming sessions.</p>
            </div>
            
            <div style="border: 2px solid #000000; padding: 25px; margin-bottom: 30px; line-height: 1.6;">
                <p style="margin: 0; font-size: 15px;">${guidelines}</p>
            </div>

            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #000000;">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #000000;">Snagup Technologies Team</p>
            </div>
        </div>
    `;

    const plainBody = `Important Guidelines for ${batchName}:\n\n${guidelines}\n\n- Snagup Technologies Team`;

    for (const student of students) {
        if (student.email) {
            await sendEmail({
                to: student.email,
                subject,
                body: plainBody,
                html: htmlTemplate,
                purpose: 'Course Guidelines'
            });
        }
    }
};

module.exports = {
    sendEmail,
    formatTimeAMPM,
    notifyStudentsOfSessionLink,
    notifyEnrollmentSuccess,
    notifyStudentsOfInstructorNote,
    notifyCertificateIssued,
    notifyInstructorOfUpdate,
    notifyVerificationPending,
    notifyCertificateFinalized,
    notifyEnrollmentOpened,
    notifyEnrollmentRejected,
    notifyGuidelines,
    notifyEnrollmentReceived
};
