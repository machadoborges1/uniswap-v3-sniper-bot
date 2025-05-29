const SniperBot = require("./bot");
const telegramService = require("./services/telegram");

async function main() {
    try {
        const bot = new SniperBot();
        await bot.start();
    } catch (error) {
        console.error("Erro fatal ao iniciar o bot:", error.message);
        telegramService.sendAlert(`🚨 Erro fatal ao iniciar o bot: ${error.message}`);
        process.exit(1);
    }
}