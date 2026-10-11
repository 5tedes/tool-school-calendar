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

// Year 1 lives in the original 'Events' tab; later years get 'Events-Y2', 'Events-Y3', ...
function getSheetName(year) {
  year = parseInt(year, 10);
  return !year || year === 1 ? 'Events' : 'Events-Y' + year;
}

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
      const events = getEvents(e.parameter.year);
      output.setContent(JSON.stringify({ success: true, year: parseInt(e.parameter.year, 10) || 1, events: events }));
    } else if (method === 'POST') {
      const data = JSON.parse(e.postData.contents);

      if (data.action === 'add') {
        const newEvent = addEvent(data.year, data.event);
        output.setContent(JSON.stringify({ success: true, event: newEvent }));
      } else if (data.action === 'delete') {
        deleteEvent(data.year, data.rowIndex);
        output.setContent(JSON.stringify({ success: true }));
      } else if (data.action === 'update') {
        updateEvent(data.year, data.rowIndex, data.event);
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

function getOrCreateSheet(year) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = getSheetName(year);
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Add headers
    sheet.getRange(1, 1, 1, 6).setValues([['date', 'time', 'endDate', 'title', 'category', 'rowIndex']]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }

  return sheet;
}

function getEvents(year) {
  const sheet = getOrCreateSheet(year);
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

function addEvent(year, event) {
  const sheet = getOrCreateSheet(year);
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

function deleteEvent(year, rowIndex) {
  const sheet = getOrCreateSheet(year);
  sheet.deleteRow(rowIndex);
}

function updateEvent(year, rowIndex, event) {
  const sheet = getOrCreateSheet(year);
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
  const sheet = getOrCreateSheet(1);

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

// Fill the 'Events-Y2' tab with the 2D (2026/27) school calendar (run manually once)
function initializeYear2Data() {
  const sheet = getOrCreateSheet(2);

  // Clear existing data (except header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clear();
  }

  const year2Events = [
    ['2026-09-04', '08:00 - 11:00', '', 'Orientation Day for New Pupils', 'other'],
    ['2026-09-07', '07:45 - 13:55', '', 'First Day at School - Normal Lessons', 'other'],
    ['2026-09-08', '07:53 - 09:11', '', 'Athletic Section Training Starts', 'other'],
    ['2026-09-14', '', '2026-09-18', 'Effective Study Skills Delivery Week', 'other'],
    ['2026-09-14', '14:25 - 15:45', '', 'Extended Day Programme starts (Academic/ Homework Support External Support Lessons, Afternoon Activities)', 'other'],
    ['2026-09-16', '18:30 - 20:00', '', 'Effective Study & School Life Informative Session for Parents/ Guardians of new pupils', 'other'],
    ['2026-09-16', '20:00 - 21:00', '', 'Parents and Guardians Association (PGA) Cocktail for all Parents/ Guardians', 'other'],
    ['2026-09-22', '11:09 - 12:27', '', '2D English Writing Test - D. Gkertsaki', 'test'],
    ['2026-09-25', '13:15 - 13:55', '', 'Class Council Elections', 'other'],
    ['2026-09-26', '09:00 - 13:00', '', 'Beach Cleanup - Eco Schools Event', 'other'],
    ['2026-10-01', '', '', 'Public Holiday (Cyprus Independence Day)', 'holiday'],
    ['2026-10-02', '11:09 - 12:27', '', '2A/2D Mathematics Test 1', 'test'],
    ['2026-10-05', '11:08 - 12:25', '', '2D Science Test 1', 'test'],
    ['2026-10-07', '09:31 - 10:49', '', '2D Computing Test', 'test'],
    ['2026-10-09', '09:31 - 10:49', '', '2X GFL (Beg-Mid) Test 1', 'test'],
    ['2026-10-12', '', '2026-10-16', 'Erasmus Days', 'other'],
    ['2026-10-14', '', '', 'Swimming Gala', 'other'],
    ['2026-10-14', '10:00 - 10:49', '', 'Year 2 Digital Wellbeing Assembly', 'other'],
    ['2026-10-14', '11:09 - 11:48', '', '2D Environmental Science Test 1', 'test'],
    ['2026-10-16', '18:30 - 23:00', '', 'Pascal BBQ', 'other'],
    ['2026-10-20', '07:45 - 13:00', '', 'Excursion - No Extended Day Programme', 'other'],
    ['2026-10-23', '07:45 - 13:55', '', 'PSHE/Clubs (1st Session) - No Extended Day Programme', 'other'],
    ['2026-10-26', '08:32 - 09:11', '', '2D Music Test', 'test'],
    ['2026-10-27', '', '', 'School Celebration of OXI Day', 'other'],
    ['2026-10-28', '', '', 'Public Holiday (OXI Day - Cyprus Schools\' Parade)', 'holiday'],
    ['2026-10-29', '07:31 - 09:11', '', '2B/2D French Test - G.Savva', 'test'],
    ['2026-11-02', '07:53 - 08:24', '', '2D Cyprus History Test', 'test'],
    ['2026-11-04', '', '', 'Outdoor Classroom Day - Globeducate Event', 'other'],
    ['2026-11-05', '', '2026-11-06', 'Mid-Semester Break', 'holiday'],
    ['2026-11-09', '', '2026-11-13', 'Student Leadership Summit (RIS Rome) - Globeducate Event', 'other'],
    ['2026-11-09', '09:31 - 10:49', '', '2X GFL (Beg-Mid) Test 2', 'test'],
    ['2026-11-10', '', '2026-11-13', 'Globeducate Cup (Spain) - Globeducate Event', 'other'],
    ['2026-11-17', '07:45 - 13:00', '', 'Sports Day - No Extended Day Programme', 'other'],
    ['2026-11-20', '11:10 - 12:37', '', '2D English Literature Test - D. Gkertsaki', 'test'],
    ['2026-11-23', '07:45 - 13:55', '', 'PSHE/Clubs (2nd Session) - No Extended Day Programme', 'other'],
    ['2026-11-24', '', '2026-11-27', 'Academic Olympics (EIB Monceau) - Globeducate Event', 'other'],
    ['2026-11-27', '09:31 - 10:49', '', '2X GFL (Beg-Mid) Test 3', 'test'],
    ['2026-11-28', '09:00 - 12:00', '', 'Parents - Teachers Conference', 'other'],
    ['2026-11-30', '', '2026-12-04', 'Globeducate University Week (Week 1) - Globeducate Event', 'other'],
    ['2026-12-11', '', '', 'Last Day of Lessons and Athletic Section Training, Extended Day Programme (Years 1-3)', 'other'],
    ['2026-12-11', '', '2026-12-22', 'First Semester Exams', 'exam'],
    ['2026-12-23', '', '2027-01-06', 'Winter Break', 'holiday'],
    ['2027-01-07', '', '', 'Return to School - Normal Lessons & Athletic Training, Extended Day Programme and Second Semester starts', 'other'],
    ['2027-01-20', '', '', 'First Semester Progress Reports', 'other'],
    ['2027-01-22', '09:00 - 23:59', '', 'The Variety Show', 'other'],
    ['2027-01-25', '', '2027-01-29', 'International Music Festival (Spain) - Globeducate Event', 'other'],
    ['2027-02-01', '', '', 'Arts Competition: Announcement of Results - Globeducate Event', 'other'],
    ['2027-02-05', '', '', 'Globeducate Reads (online) - Globeducate Event', 'other'],
    ['2027-02-09', '07:45 - 13:55', '', 'PSHE/Clubs (3rd Session) - No Extended Day Programme', 'other'],
    ['2027-03-04', '07:45 - 11:09', '', 'Normal Lessons', 'other'],
    ['2027-03-04', '11:09 - 13:00', '', '"Tsiknopempti" Event - No Extended Day Programme', 'other'],
    ['2027-03-08', '', '2027-03-12', 'STEAM Week - Globeducate Event', 'other'],
    ['2027-03-09', '', '2027-03-12', 'Globeducate MUN (Geneva) - Globeducate Event', 'other'],
    ['2027-03-10', '07:45 - 13:55', '', 'PSHE/Clubs (4th Session) - No Extended Day Programme', 'other'],
    ['2027-03-15', '', '', 'Public Holiday (Green Monday)', 'holiday'],
    ['2027-03-16', '', '', 'Mid-Semester Break', 'holiday'],
    ['2027-03-24', '', '', 'School Celebration (25th March & 1st April)', 'other'],
    ['2027-03-25', '', '', 'Public Holiday (Greek Independence Day - Cyprus Schools\' Parade)', 'holiday'],
    ['2027-04-01', '', '', 'Public Holiday (Cyprus National Day)', 'holiday'],
    ['2027-04-12', '07:45 - 13:55', '', 'PSHE/Clubs (5th Session) - No Extended Day Programme', 'other'],
    ['2027-04-16', '19:30 - 23:59', '', 'School Play', 'other'],
    ['2027-04-19', '', '2027-04-24', 'Globeducate University Week (Week 2) - Globeducate Event', 'other'],
    ['2027-04-24', '', '2027-05-09', 'Spring Break', 'holiday'],
    ['2027-05-10', '', '', 'Return to School - Normal Lessons and Athletic Training, Extended Day Programme starts', 'other'],
    ['2027-05-17', '', '2027-05-21', 'ECO Week - Globeducate Event', 'other'],
    ['2027-05-18', '', '', 'Robotics Challenge (EIB Monceau & Online) - Globeducate Event', 'other'],
    ['2027-05-25', '', '2027-05-28', 'Global Olympics (Agora Portals) - Globeducate Event', 'other'],
    ['2027-05-28', '', '', 'Last Day of Lessons and Athletic Section Training, Extended Day Programme', 'other'],
    ['2027-05-31', '', '2027-06-10', 'Final Exams', 'exam'],
    ['2027-06-08', '', '2027-06-10', 'Globeducate Debates (online) - Globeducate Event', 'other'],
    ['2027-06-11', '', '', 'School Holiday (Apostle Varnava)', 'holiday'],
    ['2027-06-14', '08:00 - 12:00', '2027-06-18', 'Revision Lessons for Re-examinees', 'exam'],
    ['2027-06-21', '', '', 'Public Holiday (Holy Spirit)', 'holiday'],
    ['2027-06-22', '08:00 - 10:30', '2027-06-23', 'Re-exams', 'exam'],
    ['2027-06-25', '', '', 'Final Progress Reports (Years 1-5)', 'other'],
    ['2027-06-29', '19:00 - 23:59', '', 'Awards & Graduation Ceremony', 'other']
  ];

  sheet.getRange(2, 1, year2Events.length, 5).setValues(year2Events);

  return 'Initialized ' + year2Events.length + ' events';
}
