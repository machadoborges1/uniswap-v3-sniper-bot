require("dotenv").config();
const { ethers } = require("ethers");

class ConfigService {
    constructor() {
        this.ROUTER_ADDRESS = process.env.ROUTER_ADDRESS;
        this.FACTORY_ADDRESS = process.env.FACTORY_ADDRESS;
        this.WALLET_ADDRESS = process.env.WALLET; 
        this.TARGET_TOKEN_ADDRESS = process.env.TOKEN_ADDRESS; 
        this.WETH_ADDRESS = process.env.WETH_ADDRESS; 

        const requiredEnvVars = [
            "ROUTER_ADDRESS", "FACTORY_ADDRESS", "WALLET", "TOKEN_ADDRESS",
            "PRIVATE_KEY", "NODE_RPC_URL", "NODE_WS_URL", "INFURA_API_KEY",
            "WETH_ADDRESS"
        ];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Variável de ambiente '${envVar}' não configurada no .env`);
            }
        }

        this.AMOUNT_TO_BUY = ethers.parseUnits(process.env.AMOUNT_TO_BUY || "0.01", "ether");
        this.MAX_SLIPPAGE_PERCENT = parseFloat(process.env.MAX_SLIPPAGE_PERCENT || "0.5"); 
        this.STOP_LOSS_PERCENT = parseFloat(process.env.STOP_LOSS_PERCENT || "10");
        this.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        this.TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

        if (!ethers.isAddress(this.ROUTER_ADDRESS) || !ethers.isAddress(this.FACTORY_ADDRESS) ||
            !ethers.isAddress(this.WALLET_ADDRESS) || !ethers.isAddress(this.TARGET_TOKEN_ADDRESS) ||
            !ethers.isAddress(this.WETH_ADDRESS)) {
            throw new Error("Um ou mais endereços configurados são inválidos.");
        }

        console.log("Configurações carregadas com sucesso.");
    }
}

module.exports = new ConfigService();