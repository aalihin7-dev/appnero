const express = require('express');
const { WAConnection, MessageType, Mimetype } = require('@whiskeysockets/baileys');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

const conn = new WAConnection();

// Load session file if it exists
if (fs.existsSync('./auth_info.json')) {
    conn.loadAuthInfo('./auth_info.json');
}

conn.on('qr', qr => {
    // QR code is generated for initial authentication
    console.log('Scan the QR code to log in:');
    console.log(qr);
});

conn.on('open', () => {
    // Connection successful
    console.log('Connected to WhatsApp!');
    // Save session info
    const authInfo = conn.base64AuthInfo();
    fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t'));
});

// API endpoint to send WhatsApp notification
app.post('/api/send-whatsapp', async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Phone number and message are required.' });
    }

    try {
        await conn.sendMessage(phone + '@s.whatsapp.net', message, MessageType.text);
        res.status(200).json({ success: true, message: 'Notification sent successfully.' });
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        res.status(500).json({ success: false, error: 'Failed to send message.' });
    }
});

// Start the server and connect to WhatsApp
const startServer = async () => {
    await conn.connect();
    app.listen(port, () => {
        console.log(`Server is listening on http://localhost:${port}`);
    });
};

startServer();
