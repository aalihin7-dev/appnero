const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const cors = require('cors'); // Tambahkan library CORS

const app = express();
const port = 3000;
const host = '0.0.0.0'; // --- PERUBAHAN PENTING ---

// Middleware
app.use(express.json());
app.use(cors()); // --- TAMBAHAN PENTING: Mengizinkan koneksi dari domain lain ---

let sock = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            console.log("QR Code diterima, silakan pindai:");
            qrcode.generate(qr, { small: true });
        }
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus karena ', lastDisconnect.error, ', mencoba menghubungkan kembali: ', shouldReconnect);
            if(shouldReconnect) {
                connectToWhatsApp();
            }
        } else if(connection === 'open') {
            console.log('Koneksi WhatsApp berhasil dibuka!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

app.post('/send-notification', async (req, res) => {
    const { name, phone, fileName } = req.body;
    const teamPhoneNumber = '6281272658090'; // Ganti dengan nomor WA tim Anda

    if (!sock) {
        return res.status(500).json({ success: false, message: 'Koneksi WhatsApp belum siap.' });
    }

    try {
        const message = `🔔 *Pesanan Baru Masuk!*\n\n*Nama Pelanggan:* ${name}\n*No. WhatsApp:* ${phone}\n*Nama File:* ${fileName}\n\nMohon segera diproses.`;
        await sock.sendMessage(teamPhoneNumber + '@s.whatsapp.net', { text: message });
        console.log(`Notifikasi terkirim ke ${teamPhoneNumber}`);
        res.status(200).json({ success: true, message: 'Notifikasi berhasil dikirim.' });
    } catch (error) {
        console.error('Gagal mengirim notifikasi:', error);
        res.status(500).json({ success: false, message: 'Gagal mengirim notifikasi.' });
    }
});

app.listen(port, host, () => { // --- PERUBAHAN PENTING ---
    console.log(`Server notifikasi berjalan di http://${host}:${port}`);
    connectToWhatsApp();
});
```

### Cara Memperbarui File di VPS (Langkah-langkah)

1.  **Hubungkan ke VPS Anda** melalui SSH.

2.  **Masuk ke folder proyek:**
    ```bash
    cd appnero
    ```

3.  **Install `cors`:** Kita menambahkan library baru, jadi perlu di-install.
    ```bash
    npm install cors
    ```

4.  **Buka file `index.js` dengan editor teks `nano`:**
    ```bash
    nano index.js
    ```

5.  **Ganti Kode:**
    * Jendela editor `nano` akan terbuka, menampilkan kode lama Anda.
    * Hapus semua kode lama (Anda bisa menggunakan `Ctrl + K` berulang kali).
    * Salin **seluruh isi kode** dari Canvas `Perbaikan Server Notifikasi (VPS)` di atas.
    * Tempelkan ke dalam jendela `nano` (biasanya dengan klik kanan mouse).

6.  **Simpan dan Keluar:**
    * Tekan `Ctrl + X`.
    * Terminal akan bertanya "Save modified buffer?". Ketik `Y` lalu tekan Enter.
    * Terminal akan bertanya "File Name to Write: index.js". Tekan Enter lagi.

7.  **Restart Server dengan PM2:**
    Perintah ini akan memuat ulang server Anda dengan kode yang baru.
    ```bash
    pm2 restart notif-whatsapp
    
