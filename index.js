const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const cors = require('cors');

const app = express();
const port = 3000;
const host = '0.0.0.0';

// Middleware
app.use(express.json());
app.use(cors());

let sock = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    
    sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.ubuntu('Chrome'), // Menyamarkan sebagai browser Chrome di Ubuntu
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            console.log("------------------------------------------------");
            console.log("       pindai QR code ini dengan WhatsApp      ");
            console.log("------------------------------------------------");
            qrcode.generate(qr, { small: true });
        }
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus: ', lastDisconnect.error, ', mencoba menghubungkan kembali: ', shouldReconnect);
            if(shouldReconnect) {
                connectToWhatsApp();
            }
        } else if(connection === 'open') {
            console.log('✅ Koneksi WhatsApp berhasil dibuka!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

app.post('/send-notification', async (req, res) => {
    const { name, phone, fileName } = req.body;
    // Ganti dengan nomor WA tim Anda, diawali dengan 62
    const teamPhoneNumber = '6281272658090'; 

    if (!sock || sock.ws.readyState !== 1) { // Periksa apakah koneksi benar-benar terbuka
        console.error('Koneksi WhatsApp belum siap atau terputus.');
        return res.status(503).json({ success: false, message: 'Layanan notifikasi sedang tidak tersedia. Coba lagi nanti.' });
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

app.listen(port, host, () => {
    console.log(`🚀 Server notifikasi berjalan di http://${host}:${port}`);
    connectToWhatsApp();
});

