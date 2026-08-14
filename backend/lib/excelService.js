const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const EXCEL_FILE_PATH = path.join(REPORTS_DIR, 'Snagup_Applications.xlsx');

/**
 * Ensures that the backend/reports directory and Snagup_Applications.xlsx file exist.
 */
function ensureReportsFile() {
    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const headers = [
        "Application ID",
        "Student Name",
        "Phone Number",
        "Email",
        "College Name",
        "College Register ID",
        "WhatsApp Number",
        "Selected Course",
        "Application Status",
        "Application Date",
        "Application Time",
        "Enrollment Status",
        "Student/User ID",
        "Last Updated"
    ];

    if (!fs.existsSync(EXCEL_FILE_PATH)) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, "Applications");
        XLSX.writeFile(wb, EXCEL_FILE_PATH);
        console.log(`✅ Centralized Excel report created at: ${EXCEL_FILE_PATH}`);
    }
}

/**
 * Adds or updates an application row in the server-side Excel report.
 * Prevent duplicate rows for the same application ID.
 * 
 * @param {Object} appData
 */
function recordApplicationInExcel(appData) {
    try {
        ensureReportsFile();

        const workbook = XLSX.readFile(EXCEL_FILE_PATH);
        const sheetName = workbook.SheetNames[0] || "Applications";
        const worksheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rows.length === 0) {
            rows.push([
                "Application ID", "Student Name", "Phone Number", "Email",
                "College Name", "College Register ID", "WhatsApp Number", "Selected Course",
                "Application Status", "Application Date", "Application Time",
                "Enrollment Status", "Student/User ID", "Last Updated"
            ]);
        }

        const createdAt = appData.created_at ? new Date(appData.created_at) : new Date();
        const appDate = createdAt.toISOString().split('T')[0];
        const appTime = createdAt.toLocaleTimeString('en-IN', { hour12: true });

        const rowData = [
            appData.app_id || `APP-${appData.id}`,
            appData.student_name || '',
            appData.phone || '',
            appData.email || '',
            appData.college_name || '',
            appData.college_register_id || '',
            appData.whatsapp_number || appData.phone || '',
            appData.course_name || '',
            appData.status || 'Applied',
            appDate,
            appTime,
            appData.enrollment_status || 'Applied',
            appData.student_id || '',
            new Date().toISOString()
        ];

        // Check if application ID already exists
        const appIdToFind = String(rowData[0]);
        let existingIndex = -1;

        for (let i = 1; i < rows.length; i++) {
            if (rows[i] && String(rows[i][0]) === appIdToFind) {
                existingIndex = i;
                break;
            }
        }

        if (existingIndex !== -1) {
            rows[existingIndex] = rowData;
        } else {
            rows.push(rowData);
        }

        const updatedWs = XLSX.utils.aoa_to_sheet(rows);
        workbook.Sheets[sheetName] = updatedWs;
        XLSX.writeFile(workbook, EXCEL_FILE_PATH);
        console.log(`✅ Excel report updated for Application ID: ${appIdToFind}`);
    } catch (err) {
        console.error("❌ Error updating Excel application report:", err.message);
    }
}

module.exports = {
    recordApplicationInExcel,
    EXCEL_FILE_PATH
};
