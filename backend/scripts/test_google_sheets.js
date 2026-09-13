/**
 * SnagUp Technologies - Google Sheets Connection & Tab Audit Test Script
 * 
 * Safe development-only diagnostic tool.
 * Verifies environment configuration, authenticates with Google Service Account,
 * inspects spreadsheet metadata, and checks presence of required sheet tabs.
 * 
 * SAFE / NON-DESTRUCTIVE:
 * - Does NOT write, update, or delete any sheet data.
 * - Does NOT print credentials, JWT secrets, or private keys.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');

const REQUIRED_TABS = [
  'courses',
  'batches',
  'sessions',
  'batch_materials',
  'enrollments',
  'payments',
  'attendance',
  'certificates',
  'course_modules',
  'course_lessons',
  'lesson_completions',
  'assessments',
  'assessment_questions',
  'assessment_attempts',
  'service_inquiries',
  'course_applications',
  'waitlist',
  'settings',
  'email_logs'
];

async function runGoogleSheetsTest() {
  console.log("==================================================");
  console.log("📊 SNAGUP - GOOGLE SHEETS CONNECTION AUDIT TEST");
  console.log("==================================================\n");

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  console.log("1. Checking Environment Variables...");
  console.log(`   - GOOGLE_SPREADSHEET_ID: ${spreadsheetId ? 'CONFIGURED (' + spreadsheetId.substring(0, 6) + '...)' : '❌ MISSING'}`);
  console.log(`   - GOOGLE_SERVICE_ACCOUNT_EMAIL: ${clientEmail ? 'CONFIGURED (' + clientEmail + ')' : '❌ MISSING'}`);
  console.log(`   - GOOGLE_PRIVATE_KEY: ${privateKey ? 'CONFIGURED ([PRESENT])' : '❌ MISSING'}\n`);

  if (!spreadsheetId || !clientEmail || !privateKey) {
    console.log("--------------------------------------------------");
    console.log("⚠️ GOOGLE SHEETS CREDENTIALS ARE NOT YET CONFIGURED IN .env");
    console.log("--------------------------------------------------");
    console.log("To connect to Google Sheets live:");
    console.log("1. Create a Google Cloud Service Account & download JSON key.");
    console.log("2. Set the following in backend/.env:");
    console.log("   GOOGLE_SPREADSHEET_ID=<your_google_sheet_id>");
    console.log("   GOOGLE_SERVICE_ACCOUNT_EMAIL=<service_account_email>");
    console.log("   GOOGLE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n\"");
    console.log("3. Share your Google Sheet with the Service Account email as Editor.");
    console.log("--------------------------------------------------\n");
    console.log("ℹ️ Static validation completed cleanly. Live API call skipped until credentials are provided.");
    return;
  }

  try {
    privateKey = privateKey.replace(/\\n/g, '\n');

    console.log("2. Authenticating with Google Service Account...");
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    console.log("3. Fetching Spreadsheet Metadata...");
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const title = meta.data.properties.title;
    console.log(`   ✅ Connected successfully! Title: "${title}"\n`);

    console.log("4. Auditing Sheet Tabs...");
    const existingSheets = (meta.data.sheets || []).map(s => s.properties.title);
    const existingSet = new Set(existingSheets);

    const found = [];
    const missing = [];

    REQUIRED_TABS.forEach(tab => {
      if (existingSet.has(tab)) {
        found.push(tab);
      } else {
        missing.push(tab);
      }
    });

    console.log(`   - Found Tabs (${found.length}/${REQUIRED_TABS.length}):`, found.join(', '));
    if (missing.length > 0) {
      console.log(`   - Missing Tabs (${missing.length}):`, missing.join(', '));
      console.log("\n⚠️ ACTION REQUIRED: Please add the missing tab names listed above to your Google Sheet.");
    } else {
      console.log("   ✅ All 19 required operational tabs exist in the spreadsheet!");
    }

    console.log("\n==================================================");
    console.log("✅ GOOGLE SHEETS CONNECTION TEST COMPLETED CLEANLY");
    console.log("==================================================");

  } catch (err) {
    console.error("\n❌ Google Sheets Connection Test Failed:");
    console.error("   Details:", err.message);
    console.log("\nPlease verify that:");
    console.log("1. GOOGLE_SPREADSHEET_ID is correct.");
    console.log("2. The spreadsheet is shared with Editor access to:", clientEmail);
    console.log("3. GOOGLE_PRIVATE_KEY is formatted correctly with newlines.");
  }
}

runGoogleSheetsTest();
