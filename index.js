const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Rcon } = require('rcon-client');
const { status } = require('minecraft-server-util');
const express = require('express');
const path = require('path');

const app = express();

// Konfigurasi bot WhatsApp
let sock;
const startBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(path.resolve(__dirname, 'session'));
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Event handler
    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            console.log('QR Code untuk login:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            console.log('Connection closed. Reconnecting...');
            startBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (message) => {
        const msg = message.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        console.log(`Pesan dari ${from}: ${text}`);

        if (text.toLowerCase() === 'halo') {
            await sock.sendMessage(from, { text: 'Hai, ada yang bisa saya bantu?' });
        }

        if (text.toLowerCase() === '/player') {
            try {
                const rcon = new Rcon({
                    host: 'hcr-1.heppyhost.my.id',
                    port: 25716,
                    password: 'syaizz23@@@@@@@@',
                });
                await rcon.connect();
                const response = await rcon.send('list');

                const players = response.match(/:\s*(.*)/);
                const playerList = players && players[1]
                    ? players[1]
                          .split(',')
                          .map((name, index) => `${index + 1}. ${name.trim()}`)
                          .join('\n')
                    : 'No players online.';

                await sock.sendMessage(from, {
                    text: `Players online:\n${playerList}`,
                });
            } catch (e) {
                await sock.sendMessage(from, { text: 'Failed to retrieve player list.' });
            }
        }

        if (text.toLowerCase() === '/status') {
            const serverIP = 'hcr-1.heppyhost.my.id';
            const serverPort = 25662;

            try {
                const response = await status(serverIP, serverPort, { timeout: 5000 });

                const txt = `📊 *server status* 📊\n\n*server:* 🟢 online\n*version:* ${response.version.name}\n*players:* ${response.players.online}/${response.players.max}\n*latency:* ${response.roundTripLatency} ms`;

                await sock.sendMessage(from, { text: txt });
            } catch (e) {
                await sock.sendMessage(from, { text: 'Server is offline.' });
            }
        }
    });
};

// Mulai bot
startBot();

// Endpoint utama untuk memastikan Vercel tetap aktif
app.get('/', (req, res) => {
    res.send('Bot WhatsApp is running.');
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

module.exports = app;
