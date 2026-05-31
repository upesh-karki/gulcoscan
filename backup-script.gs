/**
 * GlucoScan Backup — Google Apps Script
 *
 * Deploy this as a web app (Deploy → New deployment → Web app).
 * Set "Execute as" to "Me" and "Who has access" to "Anyone".
 *
 * The GlucoScan app will POST readings here, and the script
 * writes them into a Google Sheet that ONLY YOU can see.
 *
 * SETUP:
 * 1. Create a new Google Sheet
 * 2. Add these headers in Row 1:
 *    ID | Timestamp | Value | Tag | Source
 * 3. Extensions → Apps Script → paste this code
 * 4. At the top, set SHEET_ID to your sheet's ID (from the URL)
 * 5. Change SECRET_TOKEN to a random string (this is your API key)
 * 6. Deploy → New deployment → Web app → copy the URL
 * 7. Paste that URL into GlucoScan settings
 */

// ══════════════════════════════════════════════
// CONFIGURE THESE TWO VALUES
// ══════════════════════════════════════════════

// Find this in your Sheet's URL: docs.google.com/spreadsheets/d/{SHEET_ID}/edit
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// Generate a random token — this keeps your sheet private
// Only someone with this token can write to it
const SECRET_TOKEN = 'YOUR_SECRET_TOKEN_HERE';

// ══════════════════════════════════════════════

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);

    // Verify token
    if (params.token !== SECRET_TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();

    // Ensure headers exist
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, 5).setValues([['ID', 'Timestamp', 'Value', 'Tag', 'Source']]);
      sheet.setFrozenRows(1);
    }

    // Write the reading
    sheet.appendRow([
      params.id || new Date().toISOString(),
      params.timestamp || new Date().toISOString(),
      params.value,
      params.tag || '',
      params.source || 'api'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // GET returns all readings — used for restore
  try {
    const token = e.parameter.token;
    if (token !== SECRET_TOKEN) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'ok', readings: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Skip header row
    const readings = data.slice(1).map(row => ({
      id: String(row[0]),
      timestamp: row[1],
      value: typeof row[2] === 'number' ? row[2] : parseInt(row[2], 10),
      tag: row[3] || '',
      source: row[4] || 'sheets'
    }));

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', readings }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
