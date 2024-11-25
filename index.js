const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Rcon } = require('rcon-client');
const { status } = require('minecraft-server-util');
const express = require('express');
const app = express();
const startBot = async () => {
 

    app.get('/', (req, res) => {
      res.send('Bot is running!');
    });

    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

    // Gunakan auth state berbasis file
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // Menampilkan QR Code di terminal
    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: false });
        }

        if (connection === 'close') {
            console.log('Connection closed. Reconnecting...');
            startBot();
        } else if (connection === 'open') {
            console.log('Connection opened.');
        }
    });

    // Menyimpan sesi saat terjadi perubahan
    sock.ev.on('creds.update', saveCreds);

    // Respon otomatis saat menerima pesan
    sock.ev.on('messages.upsert', async (message) => {
        const msg = message.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        console.log(`Pesan dari ${from}: ${text}`);

        // Balasan otomatis
        if (text.toLowerCase() === 'halo') {
            await sock.sendMessage(from, { text: 'Hai, ada yang bisa saya bantu?' });
        }

        if (text.toLowerCase() === '/player') {
            async function connectRcon() {
                const rcon = new Rcon({
                    host: 'hcr-1.heppyhost.my.id',
                    port: 25716,   
                    password: 'syaizz23@@@@@@@@' 
                });
                await rcon.connect();
                return rcon;
            }

            const rcon = await connectRcon();
            const response = await rcon.send('list');

            // Ekstrak nama pemain dari hasil response
            const players = response.match(/:\s*(.*)/);
            if (players && players[1]) {
                const playerList = players[1].split(',').map((name, index) => `${index + 1}. ${name.trim()}`).join('\n');

                const statusMessage = `players online:\n${playerList}`;

                sock.sendMessage(from, {
                    text: statusMessage,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Player Online',
                            body: 'Project-Z',
                            thumbnailUrl: 'https://telegra.ph/file/8e62f86c2cbed714f27c4.jpg',
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                });
            } else {
                sock.sendMessage(id, {
                    text: 'No players online.',
                    contextInfo: {
                        externalAdReply: {
                            title: 'Player Online',
                            body: 'Project-Z',
                            thumbnailUrl: 'https://telegra.ph/file/8e62f86c2cbed714f27c4.jpg',
                            mediaType: 1,
                            showAdAttribution: true
                        }
                    }
                });
            }
        }
        if (text.toLowerCase() === '/status') {


const serverIP = 'hcr-1.heppyhost.my.id';
const serverPort = 25662; 
try {
const response = await status(serverIP, serverPort, { timeout: 5000 });

let txt = `📊 *server status* 📊

*server:* 🟢 online
*version:* ${response.version.name}
*players:* ${response.players.online}/${response.players.max}
*latency:* ${response.roundTripLatency} ms`
sock.sendMessage(from,  {
    text: txt,
      contextInfo: {
                externalAdReply: {
title: 'status server',
body: 'project-z',
thumbnailUrl: 'https://telegra.ph/file/8e62f86c2cbed714f27c4.jpg',
mediaType: 2,
showAdAttribution: false
}}}, {})
} catch(e) {

let txt = `
📊 *server status* 📊
*server:* 🔴 offline
`
sock.sendMessage(id,  {
    text: txt,
      contextInfo: {
                externalAdReply: {
title: 'status server',
body: 'project-z',
thumbnailUrl: 'https://telegra.ph/file/8e62f86c2cbed714f27c4.jpg',
mediaType: 1,
renderLargerThumbnail: true,
showAdAttribution: true
}}}, {})
}
        }
    });
};

startBot();
