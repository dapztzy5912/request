const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = 3000;

const TELEGRAM_BOT_TOKEN = "8046810663:AAEDKWWGJeCA6us-g0j7RuZniHlKxSLqgSw";
const TELEGRAM_USER_ID = "7333629874"; 

const requestFile = path.join(__dirname, "requests.json");

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "form.html"));
});

app.post("/api/request", async (req, res) => {
    const { pesan, waktu } = req.body;
    const data = { pesan, waktu };

    let list = [];
    if (fs.existsSync(requestFile)) {
        list = JSON.parse(fs.readFileSync(requestFile));
    }
    list.push(data);
    fs.writeFileSync(requestFile, JSON.stringify(list, null, 2));

    const text = `Woi Bang Ada Yang Request Nih:\n\nPesan: ${pesan}\nWaktu: ${waktu}`;
    
    try {
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_USER_ID,
            text
        });
        res.sendStatus(200);
    } catch (error) {
        console.error("Error sending to Telegram:", error);
        res.sendStatus(500);
    }
});

app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    const message = req.body.message;
    if (!message || !message.text) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text;

    if (text === "/cekrequest") {
        let responseText = "Daftar Request:\n\n";

        if (fs.existsSync(requestFile)) {
            const list = JSON.parse(fs.readFileSync(requestFile));

            if (list.length === 0) {
                responseText = "Belum ada data request.";
            } else {
                list.forEach((item, index) => {
                    responseText += `${index + 1}. ${item.pesan}\n   Waktu: ${item.waktu}\n\n`;
                });
            }
        } else {
            responseText = "File request tidak ditemukan.";
        }

        await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: chatId,
            text: responseText
        });
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});