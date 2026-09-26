/**
 * Brewed Together · RSVP endpoint (Google Apps Script)
 * Appends every RSVP as a row in the bound Google Sheet.
 *
 * Setup (5 minutes):
 *  1. Create a Google Sheet, e.g. "Abhay & Jyoti RSVPs".
 *  2. Extensions → Apps Script. Replace the default code with this file. Save.
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Authorise, then copy the Web app URL (ends in /exec).
 *  5. Put it in .env as VITE_RSVP_ENDPOINT=<that URL> and rebuild / redeploy the site.
 *
 * After editing this script later, use Deploy → Manage deployments → Edit → New version,
 * otherwise the old code keeps running.
 */

const SHEET_NAME = 'RSVPs'
const HEADERS = ['Submitted at', 'Name', 'Phone', 'Guests', 'Events', 'Note', 'Invite link name']

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.tryLock(10000)
  try {
    const data = JSON.parse(e.postData.contents || '{}')
    const name = String(data.name || '').trim().slice(0, 120)
    if (!name) return json({ ok: false, error: 'Name is required' })

    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME)
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS)

    sheet.appendRow([
      new Date(),
      name,
      String(data.phone || '').slice(0, 30),
      Math.max(1, Math.min(20, Number(data.count) || 1)),
      String(data.events || '').slice(0, 300),
      String(data.note || '').slice(0, 600),
      String(data.invite || '').slice(0, 120),
    ])
    return json({ ok: true })
  } catch (err) {
    return json({ ok: false, error: String(err) })
  } finally {
    lock.releaseLock()
  }
}

// Visiting the URL in a browser shows this, handy to check the deployment is live.
function doGet() {
  return json({ ok: true, message: 'Brewed Together RSVP endpoint is running ☕' })
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
