const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PORT = 3000;

const TELEGRAM_BOT_TOKEN = "7993567098:AAFZD-0q0oy5iaIQgmA28neKhRqpVxJYqOA";
const TELEGRAM_USER_ID = "7341190291"; 

const requestFile = path.join(__dirname, "requests.json");

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Tambahkan ini untuk JSON parsing

// Fungsi untuk test bot token
async function testBotToken() {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        console.log("✅ Bot Token Valid:", response.data.result.username);
        return true;
    } catch (error) {
        console.error("❌ Bot Token Invalid:", error.response?.data || error.message);
        return false;
    }
}

// Fungsi untuk test user ID
async function testUserId() {
    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_USER_ID,
            text: "🔍 Test pesan dari server - Bot berfungsi dengan baik!"
        });
        console.log("✅ User ID Valid - Test message sent");
        return true;
    } catch (error) {
        console.error("❌ User ID Invalid atau Chat tidak ditemukan:", error.response?.data || error.message);
        return false;
    }
}

// Test koneksi saat server start
async function initializeBot() {
    console.log("🚀 Testing Bot Configuration...");
    
    const tokenValid = await testBotToken();
    if (!tokenValid) {
        console.error("❌ Server akan tetap berjalan, tapi bot tidak akan berfungsi");
        return;
    }
    
    const userIdValid = await testUserId();
    if (!userIdValid) {
        console.error("❌ Server akan tetap berjalan, tapi pesan ke user tidak akan terkirim");
        console.log("💡 Pastikan Anda sudah memulai chat dengan bot terlebih dahulu");
    }
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "form.html"));
});

app.post("/api/request", async (req, res) => {
    console.log("📨 Request received:", req.body);
    
    const { pesan, waktu } = req.body;
    
    // Validasi input
    if (!pesan || !waktu) {
        console.error("❌ Missing required fields:", { pesan: !!pesan, waktu: !!waktu });
        return res.status(400).json({ error: "Pesan dan waktu harus diisi" });
    }
    
    const data = { pesan, waktu };

    // Simpan ke file
    try {
        let list = [];
        if (fs.existsSync(requestFile)) {
            const fileContent = fs.readFileSync(requestFile, 'utf8');
            list = JSON.parse(fileContent);
        }
        list.push(data);
        fs.writeFileSync(requestFile, JSON.stringify(list, null, 2));
        console.log("✅ Data saved to file");
    } catch (error) {
        console.error("❌ Error saving to file:", error);
        return res.status(500).json({ error: "Gagal menyimpan data" });
    }

    // Kirim ke Telegram
    const text = `🔔 *Ada Request Baru!*\n\n` +
                `📝 *Pesan:* ${pesan}\n` +
                `⏰ *Waktu:* ${waktu}\n\n` +
                `_Silakan balas di channel untuk merespons_`;
    
    try {
        console.log("📤 Sending to Telegram...");
        console.log("Bot Token:", TELEGRAM_BOT_TOKEN.substring(0, 10) + "...");
        console.log("User ID:", TELEGRAM_USER_ID);
        console.log("Message length:", text.length);
        
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: TELEGRAM_USER_ID,
            text: text,
            parse_mode: 'Markdown'
        }, {
            timeout: 10000 // 10 detik timeout
        });
        
        console.log("✅ Message sent successfully!");
        console.log("Response:", response.data);
        res.json({ success: true, message: "Pesan berhasil dikirim" });
        
    } catch (error) {
        console.error("❌ Error sending to Telegram:");
        console.error("Status:", error.response?.status);
        console.error("Data:", error.response?.data);
        console.error("Message:", error.message);
        
        // Coba kirim pesan sederhana tanpa markdown
        try {
            console.log("🔄 Trying simple message without markdown...");
            const simpleText = `Ada Request Baru!\n\nPesan: ${pesan}\nWaktu: ${waktu}`;
            
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: TELEGRAM_USER_ID,
                text: simpleText
            });
            
            console.log("✅ Simple message sent successfully!");
            res.json({ success: true, message: "Pesan berhasil dikirim" });
            
        } catch (retryError) {
            console.error("❌ Retry also failed:", retryError.response?.data || retryError.message);
            res.status(500).json({ error: "Gagal mengirim ke Telegram" });
        }
    }
});

app.post(`/webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    console.log("🔗 Webhook received:", req.body);
    
    const message = req.body.message;
    if (!message || !message.text) {
        console.log("⚠️ No message text found");
        return res.sendStatus(200);
    }

    const chatId = message.chat.id;
    const text = message.text;
    
    console.log(`📱 Command received: ${text} from chat: ${chatId}`);

    if (text === "/cekrequest") {
        let responseText = "📋 *Daftar Request:*\n\n";

        try {
            if (fs.existsSync(requestFile)) {
                const fileContent = fs.readFileSync(requestFile, 'utf8');
                const list = JSON.parse(fileContent);

                if (list.length === 0) {
                    responseText = "📭 Belum ada data request.";
                } else {
                    list.forEach((item, index) => {
                        responseText += `${index + 1}. ${item.pesan}\n   ⏰ ${item.waktu}\n\n`;
                    });
                }
            } else {
                responseText = "❌ File request tidak ditemukan.";
            }

            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: responseText,
                parse_mode: 'Markdown'
            });
            
            console.log("✅ Response sent to Telegram");
            
        } catch (error) {
            console.error("❌ Error processing /cekrequest:", error);
            
            // Fallback tanpa markdown
            try {
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    chat_id: chatId,
                    text: "Error: Gagal memproses permintaan"
                });
            } catch (fallbackError) {
                console.error("❌ Fallback also failed:", fallbackError);
            }
        }
    }

    res.sendStatus(200);
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Test endpoint untuk debugging
app.get("/test-bot", async (req, res) => {
    try {
        const botInfo = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        res.json({
            bot: botInfo.data.result,
            userId: TELEGRAM_USER_ID,
            status: "Bot configuration looks good"
        });
    } catch (error) {
        res.status(500).json({
            error: error.response?.data || error.message,
            status: "Bot configuration error"
        });
    }
});

app.listen(PORT, async () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`🔧 Test bot at http://localhost:${PORT}/test-bot`);
    console.log(`❤️ Health check at http://localhost:${PORT}/health`);
    
    // Initialize bot setelah server start
    await initializeBot();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down gracefully...');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
