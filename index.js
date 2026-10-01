
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("✅ BOT WHATSAPP CONNECTÉ !");
    }

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;

      if (code !== DisconnectReason.loggedOut) {
        console.log("🔄 Reconnexion...");
        startBot();
      } else {
        console.log("❌ WhatsApp déconnecté.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const message = messages[0];

    if (!message.message) return;
    if (message.key.fromMe) return;

    const texte =
      message.message.conversation ||
      message.message.extendedTextMessage?.text ||
      "";

    if (texte.toLowerCase() === "bonjour") {
      await sock.sendMessage(message.key.remoteJid, {
        text: "👋 Bonjour ! Je suis ton bot WhatsApp."
      });
    }

    if (texte.toLowerCase() === "menu") {
      await sock.sendMessage(message.key.remoteJid, {
        text: "📋 MENU\n\n1️⃣ Bonjour\n2️⃣ Aide\n3️⃣ Infos"
      });
    }
  });
}

startBot();
