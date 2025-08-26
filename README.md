/**
 * ==========================================================
 * 📌 Digital Signature WebApp (Google Apps Script)
 * ==========================================================
 * Backend utama untuk sistem Digital Signature:
 * - Menyimpan data ke Google Sheet ("Signups")
 * - Generate UUID unik
 * - Membuat QR Code (api.qrserver.com)
 * - Kirim email notifikasi dengan QR inline
 * - Routing WebApp: Form (Index.html) & Detail (Detail.html)
 *
 * 🚀 Fitur:
 *  - Simpan data signature ke Sheet
 *  - QR Code otomatis + link detail signature
 *  - Email ke user + CC opsional
 *  - API POST endpoint (doPost)
 *  - Render WebApp (doGet)
 *
 * 📑 Struktur Sheet "Signups":
 *   | Record ID | Timestamp | Name | Email | Role | Doc ID | Doc Name | IP | UA | CC Email |
 *
 * ⚙️ Setup:
 *   1. Buat Google Sheet dengan nama sheet: Signups
 *   2. Upload file Codes.gs, Index.html, Detail.html ke Apps Script Editor
 *   3. Deploy as Web App:
 *        - Execute as: Me (developer)
 *        - Who has access: sesuai kebutuhan (domain/public)
 *   4. Bagikan link WebApp ke user
 *
 * ⚠️ Catatan:
 *   - Session.getActiveUser().getEmail() hanya bekerja jika WebApp restricted (internal domain)
 *   - Atribut <a download> untuk QR Code bisa bermasalah di cross-origin
 *     Solusi: simpan QR di Google Drive atau encode base64
 *
 * 👨‍💻 Author:
 *   Digital Signature - Ivosights
 */
