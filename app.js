const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const client = new Client();
const axios = require('axios');

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
            await client.sendMessage(message.from, "Maaf sedang terjadi gangguan di server");
        }
    } catch (error) {
        console.error('Error calling API:', error);
        await client.sendMessage(message.from, "Maaf sedang terjadi gangguan di server");
    }

    // Log messages
    console.log('From:', message.from);
    console.log('Body:', message.body);
});

// Middleware dan route definitions Anda di sini

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
