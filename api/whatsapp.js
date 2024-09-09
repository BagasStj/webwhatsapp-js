const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');

let client;

async function initializeWhatsApp() {
  if (!client) {
    client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
        headless: true,
      }
    });

    client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
    });

    client.on('ready', () => {
      console.log('Client is ready!');
    });

    await client.initialize();
  }
}

async function handleIncomingMessage(message) {
  if (message.from != '6285183736396@c.us') {
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

    console.log('From:', message.from);
    console.log('Body:', message.body);
  }
}

module.exports = async (req, res) => {
  try {
    await initializeWhatsApp();
    
    client.on('message_create', handleIncomingMessage);
    
    // Tunggu beberapa detik untuk memproses pesan yang mungkin masuk
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    res.status(200).json({ status: 'WhatsApp client initialized and messages processed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};