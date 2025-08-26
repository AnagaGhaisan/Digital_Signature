/**
 * 📌 Digital Signature WebApp (Google Apps Script)
 *
 * Aplikasi Digital Signature berbasis Google Apps Script dengan integrasi:
 * - Google Sheets untuk penyimpanan
 * - QR Code generator (api.qrserver.com)
 * - MailApp untuk email konfirmasi
 *
 * 🚀 Fitur:
 *  - Form Input (Index.html) untuk submit tanda tangan digital
 *  - Penyimpanan data ke Google Spreadsheet (Signups sheet)
 *  - UUID unik untuk tiap tanda tangan
 *  - QR Code otomatis (link detail signature)
 *  - Email notifikasi ke user + CC Email opsional
 *  - Halaman detail signature (Detail.html) untuk verifikasi
 *  - Download QR langsung dari halaman detail
 *  - Responsive UI dengan TailwindCSS + Boxicons
 *
 * 📂 Struktur Project:
 *   - Codes.gs       → backend logic
 *   - Index.html     → form submit signature
 *   - Detail.html    → halaman detail signature
 *
 * 📑 Format Data Sheet "Signups":
 *   | Record ID | Timestamp | Name | Email | Role | Doc ID | Doc Name | IP | UA | CC Email |
 *
 * ⚙️ Setup:
 *   1. Buat Google Sheet dengan sheet bernama "Signups"
 *   2. Tambahkan file Codes.gs, Index.html, Detail.html ke Apps Script editor
 *   3. Deploy Web App:
 *        - Execute as: Me (developer)
 *        - Who has access: sesuai kebutuhan (domain/public)
 *   4. Akses link WebApp untuk submit tanda tangan
 *
 * ⚠️ Catatan:
 *   - Session.getActiveUser().getEmail() hanya bekerja jika WebApp internal domain
 *   - <a download> untuk QR mungkin tidak selalu jalan karena cross-origin
 *     → solusi: simpan ke Google Drive atau encode base64
 *
 * 👨‍💻 Author:
 *   Digital Signature - Ivosights
 */
