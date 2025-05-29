const fetch = require("node-fetch");
const config = require("./config");

class TelegramService {
    constructor() {
        this.botToken = config.TELEGRAM_BOT_TOKEN;
        this.chatId = config.TELEGRAM_CHAT_ID;
    }

    async sendAlert(message) {
        if (!this.botToken || !this.chatId) {
            console.warn("Token ou Chat ID do Telegram não configurados. Alerta não enviado.");
            return;
        }
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        try {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: message,
                    parse_mode: "Markdown" // Opcional: para formatar a mensagem
                })
            });
            console.log("Alerta Telegram enviado.");
        } catch (error) {
            console.error(`[TelegramService] Erro ao enviar alerta: ${error.message}`);
        }
    }
}

module.exports = new TelegramService();