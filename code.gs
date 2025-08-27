const SHEET_NAME = "Signups";
const TEMPLATE_ID = "12hjfxHro23H38bS1gs0OuB-UEHmq8_6JflMCY8-h9Rw"; // ganti ID Google Docs Template kamu
// const FOLDER_ID = "";  // opsional, biar semua hasil disimpan di folder tertentu


// === SAVE + QR + EMAIL ===
function saveSignupWithQR(payload) {
  if (!payload.name || !payload.role || !payload.docId || !payload.docName) {
    throw new Error("Field mandatory not completed.");
  }

  const userEmail = Session.getActiveUser().getEmail();
  if (!userEmail) {
    throw new Error("Tidak bisa ambil email Google, cek setting Web App deployment.");
  }

  const timestamp = new Date();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);

  const recordId = Utilities.getUuid();

  // simpan row dasar
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
    payload.ccEmail || '',
    '' // kolom link dokumen, nanti diisi
  ]);

  const webAppUrl = ScriptApp.getService().getUrl();
  const detailUrl = `${webAppUrl}?id=${recordId}`;

  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" 
               + encodeURIComponent(detailUrl);
  const qrBlob = UrlFetchApp.fetch(qrUrl).getBlob().setName(`qr_${Date.now()}.png`);

  // === GENERATE DOC FROM TEMPLATE ===
  const docResult = createDocFromTemplate({
    id: recordId,
    name: payload.name,
    email: userEmail,
    role: payload.role,
    docId: payload.docId,
    docName: payload.docName,
    date: timestamp
  }, qrBlob);


  // update baris terakhir dengan URL dokumen
  const lastRow = sh.getLastRow();
  sh.getRange(lastRow, 11).setValue(docResult.docUrl);

  // === EMAIL ===
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
      <p><b>Generated Document:</b> <a href="${docResult.docUrl}">Open Document</a></p>
    `,
    inlineImages: { qr: qrBlob }
  });

  return { ok: true, id: recordId, qrUrl, detailUrl, docUrl: docResult.docUrl };
}

// === GENERATE DOC FROM TEMPLATE ===
function createDocFromTemplate(data, qrBlob) {
  const template = DriveApp.getFileById(TEMPLATE_ID);
  const folder = FOLDER_ID ? DriveApp.getFolderById(FOLDER_ID) : DriveApp.getRootFolder();

  const copy = template.makeCopy(`Signature_${data.name}_${Date.now()}`, folder);
  const doc = DocumentApp.openById(copy.getId());
  const body = doc.getBody();

  // Replace text placeholders
  body.replaceText("{{ID}}", data.id);
  body.replaceText("{{Name}}", data.name);
  body.replaceText("{{Email}}", data.email);
  body.replaceText("{{Role}}", data.role);
  body.replaceText("{{DocId}}", data.docId);
  body.replaceText("{{DocName}}", data.docName);
  body.replaceText("{{Date}}", new Date(data.date).toLocaleString());

  // Sisipkan QR di bagian akhir dokumen (atau bisa ganti {{QR}} placeholder)
  if (body.findText("{{QR}}")) {
  const el = body.findText("{{QR}}").getElement();
  el.asText().setText(""); // hapus placeholder
  // Sisipkan QR dan atur ukurannya
  const qrImage = el.getParent().insertInlineImage(0, qrBlob);
  qrImage.setWidth(96).setHeight(96); 
} else {
  body.appendParagraph("Digital Signature QR:");
  const qrImage = body.appendImage(qrBlob);
  qrImage.setWidth(96).setHeight(96); 
}

  doc.saveAndClose();

  return {
    docId: doc.getId(),
    docUrl: doc.getUrl()
  };
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

// === DOWNLOAD QR ===
function doGetDownload(e) {
  const id = e.parameter.id;
  if (!id) {
    return ContentService.createTextOutput("Missing ID");
  }

  // Cari record di sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  const data = sh.getDataRange().getValues();
  const rows = data.slice(1);
  const record = rows.find(r => r[0] === id);

  if (!record) {
    return ContentService.createTextOutput("Record not found");
  }

  // Buat ulang QR Blob berdasarkan detail URL
  const webAppUrl = ScriptApp.getService().getUrl();
  const detailUrl = `${webAppUrl}?id=${record[0]}`;
  const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data="
               + encodeURIComponent(detailUrl);

  const qrBlob = UrlFetchApp.fetch(qrUrl).getBlob()
                 .setName(`qr_${record[0]}.png`);

  // Kembalikan blob sebagai download
  return HtmlService.createHtmlOutput(
    `<script>
       const link = document.createElement("a");
       link.href = "data:image/png;base64,${Utilities.base64Encode(qrBlob.getBytes())}";
       link.download = "qr_${record[0]}.png";
       link.click();
       window.close();
     </script>`
  );
}
