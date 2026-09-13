/**
 * SnagUp Technologies - Google Sheets Database Adapter (Step 2 Foundation)
 * 
 * Provides a structured, safe data access layer to Google Sheets API v4.
 * Uses Google Service Account authentication via environment variables.
 * 
 * IMPORTANT:
 * - This module is currently a foundation layer; active backend routes still use MySQL.
 * - Does NOT accept raw SQL or provide a fake SQL parser.
 * - Uses in-memory TTL caching (10s) to prevent Google Sheets API 429 rate limit errors.
 * - Uses a write serialization queue (mutex) for mutation requests.
 * - Sheet row numbers are NEVER used as application IDs; unique stable IDs are generated.
 */

const { google } = require('googleapis');
const crypto = require('crypto');

// Whitelist of allowed operational sheet names
const ALLOWED_SHEETS = new Set([
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
]);

// Simple In-Memory TTL Cache
const DEFAULT_TTL_MS = 10000; // 10 seconds
const cacheStore = new Map(); // key: sheetName -> { data: Array, expiresAt: number }

// Async Write Serialization Queue (Mutex) to protect against concurrent write race conditions
class WriteQueue {
  constructor() {
    this.queue = Promise.resolve();
  }

  enqueue(task) {
    this.queue = this.queue.then(task, task);
    return this.queue;
  }
}

const globalWriteQueue = new WriteQueue();

/**
 * Validates whether a sheet name is permitted.
 * @param {string} sheetName 
 */
function validateSheetName(sheetName) {
  if (!sheetName || typeof sheetName !== 'string') {
    throw new Error('Sheet name must be a non-empty string.');
  }
  if (!ALLOWED_SHEETS.has(sheetName)) {
    throw new Error(`Sheet name '${sheetName}' is not in the allowed operational sheets whitelist.`);
  }
}

/**
 * Initializes and returns the Google Sheets API client using environment variables.
 * Supports private key newline normalization safely without logging secrets.
 */
function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    throw new Error(
      'Google Sheets configuration incomplete. Please define GOOGLE_SPREADSHEET_ID, ' +
      'GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in environment variables.'
    );
  }

  // Normalize escaped newlines from environment strings
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  return {
    sheets: google.sheets({ version: 'v4', auth }),
    spreadsheetId
  };
}

/**
 * Generates a stable, unique ID for entities.
 * Ensures IDs are independent of sheet row indices.
 * @returns {string} Unique ID string
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * Clears the in-memory cache for a given sheet (or all sheets if none specified).
 * @param {string} [sheetName] 
 */
function invalidateCache(sheetName) {
  if (sheetName) {
    cacheStore.delete(sheetName);
  } else {
    cacheStore.clear();
  }
}

/**
 * Fetches all rows from a sheet tab as JavaScript objects mapped to row 1 headers.
 * Uses 10-second TTL cache to prevent API rate limit breaches.
 * 
 * @param {string} sheetName 
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<Array<Object>>}
 */
async function getRows(sheetName, forceRefresh = false) {
  validateSheetName(sheetName);

  const now = Date.now();
  if (!forceRefresh && cacheStore.has(sheetName)) {
    const cached = cacheStore.get(sheetName);
    if (cached.expiresAt > now) {
      return cached.data;
    }
  }

  const { sheets, spreadsheetId } = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A1:ZZ`
  });

  const rows = response.data.values || [];
  if (rows.length === 0) {
    cacheStore.set(sheetName, { data: [], expiresAt: now + DEFAULT_TTL_MS });
    return [];
  }

  const headers = rows[0].map(h => String(h).trim());
  const objects = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const obj = {};
    headers.forEach((header, index) => {
      if (header) {
        obj[header] = row[index] !== undefined ? row[index] : '';
      }
    });

    // Attach row index metadata internally for update/delete matching (not exposed as public ID)
    Object.defineProperty(obj, '__rowIndex', {
      value: i + 1, // 1-indexed row number in Google Sheets
      writable: true,
      enumerable: false, // Hidden from Object.keys() / JSON.stringify()
      configurable: true
    });

    objects.push(obj);
  }

  cacheStore.set(sheetName, { data: objects, expiresAt: now + DEFAULT_TTL_MS });
  return objects;
}

/**
 * Returns matching rows based on a filter object or custom evaluation function.
 * 
 * @param {string} sheetName 
 * @param {Object|Function} filter 
 * @returns {Promise<Array<Object>>}
 */
async function findMany(sheetName, filter) {
  const rows = await getRows(sheetName);
  if (!filter) return rows;

  if (typeof filter === 'function') {
    return rows.filter(filter);
  }

  return rows.filter(row => {
    return Object.entries(filter).every(([key, value]) => String(row[key]) === String(value));
  });
}

/**
 * Returns the first matching row based on a filter object or custom function.
 * 
 * @param {string} sheetName 
 * @param {Object|Function} filter 
 * @returns {Promise<Object|null>}
 */
async function findOne(sheetName, filter) {
  const matches = await findMany(sheetName, filter);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Inserts a new record object into a sheet.
 * Auto-generates a unique stable `id` if missing.
 * Serialized via write queue and invalidates sheet cache.
 * 
 * @param {string} sheetName 
 * @param {Object} data 
 * @returns {Promise<Object>} Inserted object
 */
async function insertRow(sheetName, data) {
  validateSheetName(sheetName);

  return globalWriteQueue.enqueue(async () => {
    const { sheets, spreadsheetId } = getSheetsClient();

    // Fetch existing header row
    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`
    });

    let headers = (headerRes.data.values && headerRes.data.values[0])
      ? headerRes.data.values[0].map(h => String(h).trim())
      : [];

    const record = { ...data };
    if (!record.id) {
      record.id = generateId();
    }
    if (!record.created_at) {
      record.created_at = new Date().toISOString();
    }

    // Ensure 'id' is in headers if empty sheet
    if (headers.length === 0) {
      headers = Object.keys(record);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] }
      });
    }

    // Construct ordered row values corresponding to headers
    const rowValues = headers.map(h => (record[h] !== undefined && record[h] !== null ? record[h] : ''));

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowValues] }
    });

    invalidateCache(sheetName);
    return record;
  });
}

/**
 * Updates an existing record identified by its stable `id`.
 * Serialized via write queue and invalidates sheet cache.
 * 
 * @param {string} sheetName 
 * @param {string|number} id 
 * @param {Object} updateData 
 * @returns {Promise<Object>} Updated object
 */
async function updateRow(sheetName, id, updateData) {
  validateSheetName(sheetName);

  return globalWriteQueue.enqueue(async () => {
    const rows = await getRows(sheetName, true);
    const existing = rows.find(r => String(r.id) === String(id));

    if (!existing) {
      throw new Error(`Record with ID '${id}' not found in sheet '${sheetName}'.`);
    }

    const rowIndex = existing.__rowIndex;
    const { sheets, spreadsheetId } = getSheetsClient();

    const headerRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!1:1`
    });
    const headers = (headerRes.data.values && headerRes.data.values[0])
      ? headerRes.data.values[0].map(h => String(h).trim())
      : [];

    const updatedRecord = { ...existing, ...updateData, id };
    if (updatedRecord.updated_at !== undefined) {
      updatedRecord.updated_at = new Date().toISOString();
    }

    const rowValues = headers.map(h => (updatedRecord[h] !== undefined && updatedRecord[h] !== null ? updatedRecord[h] : ''));

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [rowValues] }
    });

    invalidateCache(sheetName);
    return updatedRecord;
  });
}

/**
 * Deletes a row identified by its stable `id` by clearing cell values.
 * Serialized via write queue and invalidates sheet cache.
 * 
 * @param {string} sheetName 
 * @param {string|number} id 
 * @returns {Promise<{ success: boolean, id: string|number }>}
 */
async function deleteRow(sheetName, id) {
  validateSheetName(sheetName);

  return globalWriteQueue.enqueue(async () => {
    const rows = await getRows(sheetName, true);
    const existing = rows.find(r => String(r.id) === String(id));

    if (!existing) {
      throw new Error(`Record with ID '${id}' not found in sheet '${sheetName}'.`);
    }

    const rowIndex = existing.__rowIndex;
    const { sheets, spreadsheetId } = getSheetsClient();

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A${rowIndex}:ZZ${rowIndex}`
    });

    invalidateCache(sheetName);
    return { success: true, id };
  });
}

/**
 * Returns total count of data rows in a sheet tab.
 * @param {string} sheetName 
 * @returns {Promise<number>}
 */
async function countRows(sheetName) {
  const rows = await getRows(sheetName);
  return rows.length;
}

module.exports = {
  ALLOWED_SHEETS: Array.from(ALLOWED_SHEETS),
  getRows,
  findOne,
  findMany,
  insertRow,
  updateRow,
  deleteRow,
  countRows,
  invalidateCache,
  generateId
};
