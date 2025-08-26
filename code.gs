const SHEET_NAME = "Signups";

// === SAVE + QR + EMAIL ===
function saveSignupWithQR(payload) {
  if (!payload.name || !payload.role || !payload.docId || !payload.docName) {
    throw new Error("Field mandatory not completed.");
  }

  // Ambil email akun Google yg login
  const userEmail = Session.getActiveUser().getEmail();
  if (!userEmail) {
    throw new Error("Tidak bisa ambil email Google, cek setting Web App deployment.");
  }

  const timestamp = new Date();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);

  // Buat UUID unik untuk record
  const recordId = Utilities.getUuid();

  // Simpan row ke sheet
  sh.appendRow([
    recordId,
    timestamp,
    payload.name,
    userEmail,
    payload.role,
    payload.docId,
    payload.docName,
    payload.ip || '',
    payload.ua || '',
    payload.ccEmail || ''
  ]);

  // URL detail WebApp
  const webAppUrl = ScriptApp.getService().getUrl();
  const detailUrl = `${webAppUrl}?id=${recordId}`;

  // Buat QR Code (isi link detail)
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" 
               + encodeURIComponent(detailUrl);
  const qrBlob = UrlFetchApp.fetch(qrUrl).getBlob().setName(`qr_${Date.now()}.png`);

  // Kirim email
  const recipients = [userEmail];
  if (payload.ccEmail) recipients.push(payload.ccEmail);

  MailApp.sendEmail({
    to: recipients.join(","),
    subject: `Ivosights - Digital Signature for ${payload.name}`,
    htmlBody: `
      <p>Halo <b>${payload.name}</b>,</p>
      <p>Thank you for using digital signature. Below are your details:</p>
      <ul>
        <li><b>Name:</b> ${payload.name}</li>
        <li><b>Email:</b> ${userEmail}</li>
        <li><b>Role:</b> ${payload.role}</li>
        <li><b>Document ID:</b> ${payload.docId}</li>
        <li><b>Document Name:</b> ${payload.docName}</li>
        <li><b>Date:</b> ${timestamp}</li>
      </ul>
      <p><b>Digital Signature (click or scan):</b><br>
      <a href="${detailUrl}"><img src="cid:qr"></a></p>
      <p>Click the QR image or scan it to view your signature online.</p>
    `,
    inlineImages: { qr: qrBlob }
  });

  return { ok: true, id: recordId, qrUrl, detailUrl };
}

// === API POST ===
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const result = saveSignupWithQR(payload);
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// === RENDER WEBAPP (Form atau Detail) ===
function doGet(e) {
  e = e || {};
  const id = e.parameter ? e.parameter.id : null;

  if (id) {
    // DETAIL VIEW
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME);
    const data = sh.getDataRange().getValues();
    const rows = data.slice(1);
    const record = rows.find(r => r[0] === id);

    if (!record) {
      return HtmlService.createHtmlOutput("<h2>Data not found.</h2>");
    }

    const webAppUrl = ScriptApp.getService().getUrl();
    const detailUrl = `${webAppUrl}?id=${record[0]}`;
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" 
                 + encodeURIComponent(detailUrl);

    const detail = {
      id: record[0],
      timestamp: record[1],
      name: record[2],
      email: record[3],
      role: record[4],
      docId: record[5],
      docName: record[6],
      ip: record[7],
      ua: record[8],
      ccEmail: record[9],
      detailUrl,
      qrUrl
    };

    const template = HtmlService.createTemplateFromFile("Detail");
    template.detail = detail;
    return template.evaluate()
      .setTitle("Digital Signature - Ivosights")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.2");

  } else {
    // INDEX FORM
    const template = HtmlService.createTemplateFromFile("Index");
    template.userEmail = Session.getActiveUser().getEmail();
    return template.evaluate()
      .setTitle("Digital Signature - Ivosights")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0, maximum-scale=1.2")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}
