# Digital Signature WebApp (Google Apps Script)

Aplikasi **Digital Signature** berbasis **Google Apps Script** dengan integrasi Google Sheets, QR Code, dan Email.  
User submit tanda tangan digital → simpan ke Sheet → generate QR → kirim email → halaman detail untuk verifikasi.

---

## Fitur
- Form input (Index.html) dengan modal feedback.
- Simpan data ke Google Sheet (`Signups`).
- ID unik (UUID) per record.
- QR Code otomatis (link ke halaman detail).
- Email notifikasi dengan QR inline (+ CC opsional).
- Halaman detail (Detail.html) + **klik QR auto-download**.
- UI responsif (TailwindCSS + Boxicons).

---

## Struktur Project

📁 Digital-Signature-WebApp
├── Codes.gs # Backend (Sheets, Email, Routing)
├── Index.html # Form submit tanda tangan
├── Detail.html # Halaman detail signature + QR
└── README.md


---

## Persiapan & Setup

1. **Buat Spreadsheet** dengan nama sheet: **`Signups`**.
2. **Apps Script Editor** (Extensions → Apps Script):
   - Tambahkan file `Codes.gs`, `Index.html`, `Detail.html`.
   - Paste kode dari project ini.
3. **Enable Layanan** yang dipakai:
   - SpreadsheetApp, HtmlService, ContentService (default).
   - **MailApp** (kirim email).
   - **UrlFetchApp** (ambil QR dari API).
   - (Opsional) **DriveApp** jika nanti mau simpan QR ke Drive.
4. **Deploy Web App**  
   - *Execute as:* **Me (developer)**  
   - *Who has access:* **Anyone in your domain** (disarankan), atau **Anyone** bila publik.  
   > Catatan: `Session.getActiveUser().getEmail()` hanya mengembalikan email jika akses *tidak* publik (harus minimal internal domain).

---

## Skema Spreadsheet

Sheet: **`Signups`** (header di baris pertama)

| Col | Field        | Keterangan                          |
|-----|--------------|-------------------------------------|
| A   | recordId     | UUID unik                           |
| B   | timestamp    | Tanggal submit                      |
| C   | name         | Nama signer                         |
| D   | email        | Email Google (active user)          |
| E   | role         | Peran signer                        |
| F   | docId        | ID dokumen                          |
| G   | docName      | Nama dokumen                        |
| H   | ip           | IP (opsional)                       |
| I   | ua           | User-Agent (browser)                |
| J   | ccEmail      | Email CC (opsional)                 |

---

## Alur Kerja

1. User membuka **Index.html**, mengisi: *Name, Role, Document ID, Document Name, CC Email (opsional)*.
2. Front-end memanggil `google.script.run.saveSignupWithQR(payload)`.
3. Backend:
   - Generate **UUID**.
   - Simpan baris ke **Sheet**.
   - Bentuk **detailUrl** (`?id=<UUID>`).
   - Generate **QR** (via `api.qrserver.com`) → ambil blob.
   - Kirim **email** berisi detail + QR inline.
4. User menerima email. Scan/klik QR → buka **Detail.html**.
5. **Detail.html** menampilkan info + **klik QR untuk download**.

---

## Konfigurasi UI / CDN

- **Tailwind (CDN runtime)**  
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
- **Boxicons (CDN yang benar)**
  ```html
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
