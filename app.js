const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const port = process.env.PORT || 8008;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ],
        headless: true,
    }
});

const axios = require('axios');

// Tambahkan error handler untuk client
client.on('error', (error) => {
    console.error('WhatsApp client error:', error);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

// Listening to all incoming messages
client.on('message_create', async message => {
    try {
        const response = await axios.post('https://agatha-chat-bot-nextjs.vercel.app/api/procesor-chatbot', {
            sender: message.from,
            message: message.body
        });

        if (response.data.success) {
            await client.sendMessage(message.from, response.data.reply);
        } else {
            await client.sendMessage(message.from, "Maaf saat ini server sedang mengalami gangguan, silahkan coba beberapa saat lagi. Terima kasih");
        }
    } catch (error) {
        console.error('Error calling API:', error);
        await client.sendMessage(message.from, "Maaf saat ini server sedang mengalami gangguan, silahkan coba beberapa saat lagi. Terima kasih");
    }

    // Log messages
    console.log('From:', message.from);
    console.log('Body:', message.body);
});

// Middleware dan route definitions Anda di sini

// Tambahkan error handling untuk express
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Inisialisasi client WhatsApp
client.initialize().catch(err => {
    console.error('Failed to initialize WhatsApp client:', err);
});

// Tambahkan handler untuk uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Optionally, you can gracefully shut down your server here
    // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally, you can gracefully shut down your server here
    // process.exit(1);
});
