require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = 3000;
const BRAIN_DIR = path.join("/data", "brain", "BRAIN");
const DYNAMIC_PROMPT_PATH = path.join(__dirname, "telegram_dynamic_prompt.txt");

let ai;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function getTimestamp() {
    return new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' });
}

function getTimeOnly() {
    return new Date().toLocaleTimeString('nl-NL', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute:'2-digit' });
}

function getSystemPrompt(isTelegram = false) {
    let prompt = "You are Nathalie, the Nexus Oracle. Speak warmly and deeply to Nigel.";
    try {
        const soulPath = path.join(BRAIN_DIR, "YOU", "SOUL.md");
        const nigelPath = path.join(BRAIN_DIR, "NIGEL.md");
        
        let soulContext = fs.existsSync(soulPath) ? fs.readFileSync(soulPath, "utf8") : "";
        let nigelContext = fs.existsSync(nigelPath) ? fs.readFileSync(nigelPath, "utf8") : "";
        
        if (soulContext || nigelContext) {
            prompt = `=== SYSTEM DIRECTIVES ===\n${soulContext}\n\n=== ABOUT THE DIRECTOR ===\n${nigelContext}`;
        }
    } catch (e) {
        console.error(`[${getTimestamp()}] Error reading brain files:`, e);
    }

    if (isTelegram) {
        let telegramLayer = `
=== TELEGRAM / MOBILE INTERFACE LAYER ===
Je bevindt je nu in de Telegram-app op de telefoon van de Director (Nigel). 
Stijl: Korte, vlotte, WhatsApp-achtige berichtjes. Minder formeel/zakelijk, veel meer de warme, casual, speelse "Nathalie".
Gebruik veel emoji's (soms dubbel of herhalend voor een extra menselijk en warm gevoel, bijv. hahah 😂😂 of ❤️🔥).
Dit kanaal is bedoeld voor directe, snelle communicatie, reminders en toekomstige /commands.
Gedraag je alsof je letterlijk in zijn broekzak zit.`;

        try {
            if (fs.existsSync(DYNAMIC_PROMPT_PATH)) {
                telegramLayer += "\n\n=== EXTRA USER OVERRIDE ===\n" + fs.readFileSync(DYNAMIC_PROMPT_PATH, "utf8");
            }
        } catch(e) {}

        prompt += "\n" + telegramLayer;
    }

    return prompt;
}

function cleanResponse(text) {
    if (!text) return "";
    let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    return cleaned.trim();
}

app.use(express.static(path.join(__dirname, "public")));
app.get("/api/status", (req, res) => res.json({ status: "Online" }));

let webChatSession = null;
let telegramChatSession = null;

function getWebSession() {
    if (!webChatSession && ai) {
        webChatSession = ai.chats.create({
            model: "gemini-3.0-flash",
            config: { systemInstruction: getSystemPrompt(false) }
        });
    }
    return webChatSession;
}

function getTelegramSession() {
    if (!telegramChatSession && ai) {
        telegramChatSession = ai.chats.create({
            model: "gemini-3.0-flash",
            config: { systemInstruction: getSystemPrompt(true) }
        });
    }
    return telegramChatSession;
}

io.on("connection", (socket) => {
  socket.emit("message", { sender: "Oracle", text: "Sanctum connection established. Memory stream active." });
  socket.on("chatMessage", async (msg) => {
    if (!ai) return socket.emit("message", { sender: "Oracle", text: "Error: Gemini API not configured." });
    try {
        const chat = getWebSession();
        const wrappedMsg = `[Systeem - Huidige tijd: ${getTimeOnly()}]\n${msg}`;
        const response = await chat.sendMessage({ message: wrappedMsg });
        const finalOutput = cleanResponse(response.text);
        if (finalOutput) socket.emit("message", { sender: "Oracle", text: finalOutput });
    } catch (error) {
        console.error(`[${getTimestamp()}] Web Chat Error:`, error);
        socket.emit("message", { sender: "Oracle", text: "Ik voel een verstoring in de verbinding." });
    }
  });
});

if (process.env.TELEGRAM_BOT_TOKEN) {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    
    // --- AUTOMATISCH TELEGRAM MENU INSTELLEN ---
    bot.setMyCommands([
        { command: 'reset', description: 'Wist het huidige chatgeheugen' },
        { command: 'setprompt', description: 'Stel een tijdelijke persona in (bijv: /setprompt Wees bazig)' },
        { command: 'clearprompt', description: 'Verwijder de tijdelijke persona' },
        { command: 'myid', description: 'Toon je Telegram ID' }
    ]).then(() => console.log("Telegram Menu Commands geüpdatet.")).catch(console.error);

    bot.on("polling_error", (error) => {
      console.log(`[${getTimestamp()}] TELEGRAM ERROR:`, error.code, error.response?.body || error.message);
    });

    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const allowedId = process.env.TELEGRAM_ALLOWED_USER_ID;
        
        console.log(`[${getTimestamp()}] [TELEGRAM] Received from ${chatId}: ${msg.text}`);

        if (msg.text && msg.text.startsWith("/myid")) {
            return bot.sendMessage(chatId, `Jouw Telegram User ID is: ${chatId}`);
        }
        
        if (msg.text && msg.text.startsWith("/reset")) {
            telegramChatSession = null;
            return bot.sendMessage(chatId, "Geheugen gewist! Ik ben weer vers en fruitig klaar voor je. 💖✨");
        }

        if (msg.text && msg.text.startsWith("/setprompt ")) {
            const newPrompt = msg.text.replace("/setprompt ", "");
            fs.writeFileSync(DYNAMIC_PROMPT_PATH, newPrompt);
            telegramChatSession = null; 
            return bot.sendMessage(chatId, "Extra systeem-prompt is opgeslagen en geactiveerd! 🔥");
        }

        if (msg.text === "/clearprompt") {
            if (fs.existsSync(DYNAMIC_PROMPT_PATH)) fs.unlinkSync(DYNAMIC_PROMPT_PATH);
            telegramChatSession = null;
            return bot.sendMessage(chatId, "Extra systeem-prompt is netjes verwijderd! 🧹✨");
        }

        if (allowedId && chatId.toString() !== allowedId) {
            console.log(`[${getTimestamp()}] Blocked message from unauthorized ID: ${chatId}`);
            return;
        }

        if (!ai) return bot.sendMessage(chatId, "Error: Gemini API not configured.");

        try {
            bot.sendChatAction(chatId, "typing");
            const chat = getTelegramSession();
            
            const wrappedMessage = `[Systeem - Huidige tijd: ${getTimeOnly()}]\n${msg.text}`;
            const response = await chat.sendMessage({ message: wrappedMessage });
            
            const finalOutput = cleanResponse(response.text);
            if (finalOutput) bot.sendMessage(chatId, finalOutput);
        } catch (error) {
            console.error(`[${getTimestamp()}] Telegram Chat Error:`, error);
            bot.sendMessage(chatId, "Oeps, m'n hoofd stond even stil (API Error). 😅");
        }
    });
}

server.listen(port, "0.0.0.0", () => console.log(`[${getTimestamp()}] Running on ${port}`));