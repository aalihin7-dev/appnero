const express = require('express');
// const cors = require('cors'); // Dihapus karena sudah ditangani oleh Nginx

// Gunakan fetch bawaan Node.js untuk membuat permintaan HTTP
const app = express();
const port = 3000;
const host = '0.0.0.0';

// =================== PENGATURAN WATI ANDA ===================
const WATI_API_ENDPOINT = 'https://live-mt-server.wati.io/1020967/api/v1/sendTemplateMessage';
const WATI_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNjk2MTkyYS1mMWEyLTQyMDQtYmRiYy1jMGU5ZTIxZjA4YWYiLCJ1bmlxdWVfbmFtZSI6ImFhbGloaW43QGdtYWlsLmNvbSIsIm5hbWVpZCI6ImFhbGloaW43QGdtYWlsLmNvbSIsImVtYWlsIjoiYWFsaWhpbjdAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDkvMTMvMjAyNSAxODo0MDo0MyIsInRlbmFudF9pZCI6IjEwMjA5NjciLCJkYl9uYW1lIjoibXQtcHJvZC1UZW5hbnRzIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiQURNSU5JU1RSQVRPUiIsImV4cCI6MjUzNDAyMzAwODAwLCJpc3MiOiJDbGFyZV9BSSIsImF1ZCI6IkNsYXJlX0FJIn0.fr24fRGKgx68tYs3Rmv4P_FRQTVHJDHWGLJD8d1gNLE';
const WATI_TEMPLATE_NAME = 'notif_order';
// ==========================================================

// Middleware
app.use(express.json());
// app.use(cors()); // Dihapus karena sudah ditangani oleh Nginx


app.post('/send-notification', async (req, res) => {
    const { name, phone, fileName } = req.body;
    const teamPhoneNumber = '15558749784'; 

    // Menyiapkan data untuk dikirim ke WATI API
    const requestBody = {
        template_name: WATI_TEMPLATE_NAME,
        broadcast_name: `order_${Date.now()}`,
        parameters: [
            { name: 'name', value: name },
            { name: 'phone', value: phone },
            { name: 'fileName', value: fileName }
        ]
    };

    try {
        const watiUrl = `${WATI_API_ENDPOINT}?whatsappNumber=${teamPhoneNumber}`;
        
        const response = await fetch(watiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('Error dari WATI API:', responseData);
            throw new Error(responseData.message || `Gagal mengirim notifikasi, status: ${response.status}`);
        }

        console.log(`Notifikasi berhasil dikirim ke ${teamPhoneNumber} melalui WATI.`);
        res.status(200).json({ success: true, message: 'Notifikasi berhasil dikirim.' });

    } catch (error) {
        console.error('Gagal menghubungi WATI API:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengirim notifikasi.' });
    }
});


app.listen(port, host, () => {
    console.log(`🚀 Server notifikasi WATI berjalan di http://${host}:${port}`);
});

