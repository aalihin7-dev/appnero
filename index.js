const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// PENTING: GANTI DENGAN PATH ASLI KE FILE HTML ANDA
app.use(express.static(path.join(__dirname, '..')));

// Logging untuk koneksi WhatsApp
const logger = pino({ level: 'info' });

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
    
    const sock = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal: true,
        browser: ['Aplikasi Percetakan', 'Safari', '1.0'],
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("Scan QR code berikut:");
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi ditutup. Alasan:', lastDisconnect.error, 'Menghubungkan kembali:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('Koneksi WhatsApp berhasil dibuka!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    return sock;
}

let sock;
connectToWhatsApp().then(socket => {
    sock = socket;
}).catch(err => {
    console.error("Gagal terhubung ke WhatsApp:", err);
});

// Endpoint untuk mengirim pesan WhatsApp
app.post('/api/send-whatsapp', async (req, res) => {
    const { phone, name } = req.body;
    
    // Periksa apakah socket terhubung sebelum mengirim pesan
    if (!sock || !sock.user) {
        return res.status(503).json({ status: 'error', message: 'WhatsApp tidak terhubung.' });
    }

    try {
        const message = `Halo ${name},\n\nTerima kasih telah memesan. Pesanan Anda telah kami terima dan akan segera diproses.`;
        const jid = `${phone}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        console.log(`Pesan terkirim ke ${phone}`);
        res.json({ status: 'success', message: 'Pesan berhasil dikirim!' });
    } catch (e) {
        console.error("Gagal mengirim pesan:", e);
        res.status(500).json({ status: 'error', message: 'Gagal mengirim pesan.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
