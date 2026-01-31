// Google Apps Script - Copy this entire code into your Google Sheet's Apps Script editor
// Instructions:
// 1. Open your Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Delete any existing code and paste this entire file
// 4. Click Deploy > New deployment
// 5. Select "Web app" as the type
// 6. Set "Execute as" to "Me" and "Who has access" to "Anyone"
// 7. Click Deploy and copy the Web App URL
// 8. Paste the URL into your index.html where it says PASTE_YOUR_WEB_APP_URL_HERE

const SHEET_NAME = 'Events';

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  // Set CORS headers
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    if (method === 'GET') {
      const events = getEvents();
      output.setContent(JSON.stringify({ success: true, events: events }));
    } else if (method === 'POST') {
      const data = JSON.parse(e.postData.contents);

      if (data.action === 'add') {
        const newEvent = addEvent(data.event);
        output.setContent(JSON.stringify({ success: true, event: newEvent }));
      } else if (data.action === 'delete') {
        deleteEvent(data.rowIndex);
        output.setContent(JSON.stringify({ success: true }));
      } else if (data.action === 'update') {
        updateEvent(data.rowIndex, data.event);
        output.setContent(JSON.stringify({ success: true }));
      } else {
        output.setContent(JSON.stringify({ success: false, error: 'Unknown action' }));
      }
    }
  } catch (error) {
    output.setContent(JSON.stringify({ success: false, error: error.toString() }));
  }

  return output;
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Add headers
    sheet.getRange(1, 1, 1, 6).setValues([['date', 'time', 'endDate', 'title', 'category', 'rowIndex']]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }

  return sheet;
}

function getEvents() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  const events = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0]) { // Has a date
      const event = {
        date: formatDate(row[0]),
        title: row[3] || '',
        category: row[4] || 'other',
        rowIndex: i + 2 // Sheet row number (1-indexed, skip header)
      };

      if (row[1]) {
        event.time = row[1].toString();
      }

      if (row[2]) {
        event.endDate = formatDate(row[2]);
      }

      events.push(event);
    }
  }

  return events;
}

function formatDate(dateValue) {
  if (!dateValue) return '';

  // If it's already a string in YYYY-MM-DD format, return it
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  // If it's a Date object, format it
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Try to parse as date
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Fall through
  }

  return dateValue.toString();
}

function addEvent(event) {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  const newRow = lastRow + 1;

  sheet.getRange(newRow, 1, 1, 5).setValues([[
    event.date || '',
    event.time || '',
    event.endDate || '',
    event.title || '',
    event.category || 'other'
  ]]);

  event.rowIndex = newRow;
  return event;
}

function deleteEvent(rowIndex) {
  const sheet = getOrCreateSheet();
  sheet.deleteRow(rowIndex);
}

function updateEvent(rowIndex, event) {
  const sheet = getOrCreateSheet();
  sheet.getRange(rowIndex, 1, 1, 5).setValues([[
    event.date || '',
    event.time || '',
    event.endDate || '',
    event.title || '',
    event.category || 'other'
  ]]);
}

// Function to initialize sheet with sample data (optional - run manually once)
function initializeSampleData() {
  const sheet = getOrCreateSheet();

  // Clear existing data (except header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clear();
  }

  // Add sample events
  const sampleEvents = [
    ['2026-02-03', '', '', 'First Semester Progress Reports', 'other'],
    ['2026-02-05', '12:37 - 13:55', '', '1D/1E GFL (beginners) Test 1', 'test'],
    ['2026-02-10', '09:31 - 10:49', '', 'Safer Internet Day - Presentation (Year 1 Pupils)', 'other'],
    ['2026-02-11', '12:37 - 13:55', '', '1D Mathematics Test 3', 'test'],
    ['2026-02-12', '07:45 - 11:09', '', 'Normal Lessons', 'other'],
    ['2026-02-12', '11:10 - 13:00', '', '"Tsiknopempti" Event - No Extended Day Programme', 'other'],
    ['2026-02-13', '12:39 - 13:39', '', '1D History Test', 'test'],
    ['2026-02-18', '09:31 - 10:16', '', '1D Science Test 1 (Second Semester)', 'test'],
    ['2026-02-19', '11:09 - 12:27', '', '1D English Reading Test - Katerina X.', 'test'],
    ['2026-02-23', '', '', 'Public Holiday (Green Monday)', 'holiday'],
    ['2026-02-24', '', '', 'Half Term', 'holiday'],
    ['2026-02-27', '07:54 - 08:30', '', '1B/1D Cyprus History Test 1', 'test'],
    ['2026-03-11', '12:37 - 13:55', '', '1D Mathematics In Class Assignment', 'assignment'],
    ['2026-03-13', '19:30 - 23:59', '', 'School Play', 'other'],
    ['2026-03-16', '', '2026-03-20', 'Science Activities Week & Earth Week Eco Week', 'other'],
    ['2026-03-19', '07:53 - 09:11', '', '1D French Test - G.Savva', 'test'],
    ['2026-03-24', '09:31 - 10:49', '', 'School Celebration (25th March & 1st April)', 'other'],
    ['2026-03-25', '', '', 'Public Holiday (Greek Independence Day)', 'holiday'],
    ['2026-03-26', '11:09 - 12:27', '', '1D English Literature Alternative Assessment - Katerina X.', 'test'],
    ['2026-03-30', '07:45 - 13:55', '', 'PSHE/Clubs 5th Session - No Extended Day Programme', 'other'],
    ['2026-03-31', '12:37 - 13:55', '', '1D/1E GFL (beginners) Test 2', 'test'],
    ['2026-04-01', '', '', 'Public Holiday (Cyprus National Day)', 'holiday'],
    ['2026-04-03', '07:45 - 13:00', '', 'Excursion - No Extended Day Programme', 'other'],
    ['2026-04-20', '', '', 'Return to School - Normal Lessons', 'other'],
    ['2026-04-23', '', '', 'School Holiday (Archbishop\'s Name Day)', 'holiday'],
    ['2026-04-24', '07:54 - 08:30', '', '1B/1D Cyprus History Assignment Deadline', 'assignment'],
    ['2026-04-29', '09:31 - 10:10', '', '1D Science Test 2', 'test'],
    ['2026-05-01', '', '', 'Public Holiday (Labour Day)', 'holiday'],
    ['2026-05-04', '', '2026-05-08', 'STEAM Week - Globeducate Event', 'other'],
    ['2026-05-05', '12:37 - 13:55', '', '1D/1E GFL Project Presentations', 'project'],
    ['2026-05-06', '11:09 - 12:27', '', '1D English Language Project Presentations - Katerina X.', 'project'],
    ['2026-05-06', '12:37 - 13:55', '', '1D Maths Test 4', 'test'],
    ['2026-05-07', '11:09 - 12:27', '', '1D English Language Project Presentations - Katerina X.', 'project'],
    ['2026-05-19', '', '', 'Robotics Challenge (EIB Monceau) - Globeducate Event', 'other'],
    ['2026-05-22', '07:45 - 15:45', '', 'Last Day of Lessons', 'other'],
    ['2026-05-25', '', '2026-06-08', 'Final Exams', 'exam'],
    ['2026-06-01', '', '', 'Public Holiday (Holy Spirit)', 'holiday'],
    ['2026-06-11', '', '', 'School Holiday (Apostle Varnava)', 'holiday'],
    ['2026-06-15', '', '2026-06-19', 'Revision Lessons for Re-examinees', 'exam'],
    ['2026-06-22', '', '2026-06-23', 'Re-exams', 'exam'],
    ['2026-06-26', '19:00 - 23:59', '', 'End of Year Awards and Graduation Ceremony', 'other']
  ];

  sheet.getRange(2, 1, sampleEvents.length, 5).setValues(sampleEvents);

  return 'Initialized ' + sampleEvents.length + ' events';
}
