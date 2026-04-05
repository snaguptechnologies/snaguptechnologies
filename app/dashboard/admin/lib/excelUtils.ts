import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file.
 * @param data - Array of objects to export
 * @param fileName - Desired filename (without extension)
 * @param sheetName - Name of the worksheet
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
    try {
        // Create a new workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // Generate the Excel file and trigger download
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    } catch (error) {
        console.error('Excel Export Error:', error);
        throw new Error('Failed to generate Excel report');
    }
};

/**
 * Formats student data for Excel export.
 */
export const formatStudentExport = (students: any[]) => {
    return students.map(s => ({
        'Student ID': s.id,
        'Name': s.name,
        'Email': s.email,
        'Phone': s.phone || 'N/A',
        'Total Enrollments': s.enrollment_count || 0,
        'Join Date': new Date(s.created_at).toLocaleDateString(),
        'Status': s.is_active ? 'Active' : 'Inactive'
    }));
};

/**
 * Formats payment data for Excel export.
 */
export const formatPaymentExport = (payments: any[]) => {
    return payments.map(p => ({
        'Transaction ID': p.transaction_id || p.latest_transaction_id || 'N/A',
        'Student Name': p.student_name || p.user_name || 'N/A',
        'Contact Phone': p.student_phone || p.phone || 'N/A',
        'Course': p.course_name || 'N/A',
        'Batch': p.batch_name || 'N/A',
        'Amount (INR)': p.amount || 0,
        'Status': p.status || p.enrollment_status || 'N/A',
        'Date': new Date(p.created_at).toLocaleString(),
        'Method': p.payment_method || 'N/A'
    }));
};

/**
 * Formats certificate data for Excel export.
 */
export const formatCertificateExport = (certs: any[]) => {
    return certs.map(c => ({
        'Certificate ID': c.cert_id,
        'Student Name': c.student_name,
        'Course': c.course_name,
        'Batch': c.batch_name,
        'Issue Date': new Date(c.issued_at).toLocaleDateString(),
        'Verification Link': `${process.env.NEXT_PUBLIC_SITE_URL || ''}/verify/${c.cert_id}`
    }));
};

/**
 * Formats attendance data for Excel export.
 */
export const formatAttendanceExport = (attendance: any) => {
    if (!attendance || !attendance.students) return [];

    const { dates, students, records } = attendance;
    
    return students.map((s: any) => {
        const row: any = {
            'Student Name': s.name,
            'Email': s.email
        };

        // Add each date as a column
        dates.forEach((date: string) => {
            const status = records[date]?.[s.id] || 'N/A';
            row[date] = status.charAt(0).toUpperCase() + status.slice(1);
        });

        // Calculate attendance percentage
        const presentCount = dates.filter((d: string) => records[d]?.[s.id] === 'present').length;
        row['Attendance %'] = ((presentCount / dates.length) * 100).toFixed(2) + '%';

        return row;
    });
};

/**
 * Formats dashboard graph data for Excel export.
 */
export const formatGraphExport = (data: any[], type: string) => {
    return data.map(item => ({
        'Timeline / Label': item.name,
        [type]: item.value,
        'Export Date': new Date().toLocaleString()
    }));
};

/**
 * Formats detailed student list for filtered dashboard export.
 */
export const formatFilteredEnrollmentExport = (enrollments: any[]) => {
    return enrollments.map(e => ({
        'Student Name': e.student_name || 'N/A',
        'Email': e.student_email || e.email || 'N/A',
        'Contact Phone': e.student_phone || e.phone || 'N/A',
        'Course': e.course_name || 'N/A',
        'Batch': e.batch_name || 'N/A',
        'Date of Enrollment': e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : 'N/A',
        'Payment Status': e.status || 'N/A',
        'Amount Paid (INR)': e.paid_amount || 0
    }));
};
