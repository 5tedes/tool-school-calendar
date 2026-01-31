# Google Sheets Integration Setup

Follow these steps to connect your calendar to Google Sheets for persistent storage.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it something like "School Calendar Events"

## Step 2: Set Up the Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete any code in the editor
3. Copy the entire contents of `google-apps-script.js` from this repository
4. Paste it into the Apps Script editor
5. Click the **Save** icon (or Ctrl+S)
6. Name the project (e.g., "School Calendar API")

## Step 3: Deploy the Web App

1. In the Apps Script editor, click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: School Calendar API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. If prompted, authorize the app by clicking through the permissions
6. **Copy the Web App URL** (it looks like `https://script.google.com/macros/s/xxx/exec`)

## Step 4: Configure the Calendar

1. Open `index.html` in a text editor
2. Find this line near the top of the `<script>` section:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'PASTE_YOUR_WEB_APP_URL_HERE';
   ```
3. Replace `PASTE_YOUR_WEB_APP_URL_HERE` with your Web App URL
4. Save the file
5. Commit and push to GitHub

## Step 5: Initialize with Sample Data (Optional)

To populate your Google Sheet with the existing calendar events:

1. In the Apps Script editor, select the function `initializeSampleData` from the dropdown
2. Click **Run**
3. This will add all the current events to your Google Sheet

## How It Works

- **Loading events**: When you open the calendar, it fetches events from your Google Sheet
- **Adding events**: When you add an event through the form, it saves to the Google Sheet
- **Editing in Sheets**: You can edit events directly in Google Sheets - just refresh the calendar to see changes
- **Offline fallback**: If the Sheet is unavailable, the calendar uses built-in fallback data

## Google Sheet Columns

The script expects these columns in your "Events" sheet:

| Column | Description | Example |
|--------|-------------|---------|
| date | Event date (YYYY-MM-DD) | 2026-02-03 |
| time | Time range (optional) | 12:37 - 13:55 |
| endDate | End date for multi-day events (optional) | 2026-02-05 |
| title | Event description | Mathematics Test 3 |
| category | Event category | test, holiday, assignment, exam, project, homework, other |

## Troubleshooting

**"Could not connect to Google Sheets"**
- Check that your Web App URL is correct
- Make sure the deployment is set to "Anyone" for access
- Try redeploying the Apps Script

**Events not saving**
- Check the browser console for errors
- Verify the Apps Script has the correct permissions

**Changes in Sheets not appearing**
- Click the "Refresh" button on the calendar
- Changes require a page refresh to appear
