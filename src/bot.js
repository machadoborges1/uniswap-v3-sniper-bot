const { ethers } = require("ethers");
const config = require("./services/config");
const telegramService = require("./services/telegram");
const UniswapService = require("./services/uniswap");
const factoryABI = require("../abi/abi.factory.json"); 

class SniperBot {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.NODE_RPC_URL);
        this.wsProvider = null; 
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.uniswapService = new UniswapService(this.signer, this.provider);

        this.factoryContract = null; 

        this.botState = {
            isPoolBought: false,
            boughtTokenAddress: null,
            boughtAmount: null,
            boughtPrice: null 
        };

        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectTimeout = 5000; 
    }

    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    async connectWebSocket() {
        if (this.wsProvider) {
            this.wsProvider._websocket.terminate(); 
        }

        this.wsProvider = new ethers.WebSocketProvider(process.env.NODE_WS_URL);
        this.factoryContract = new ethers.Contract(config.FACTORY_ADDRESS, factoryABI, this.wsProvider);

        this.factoryContract.on("PoolCreated", this.handlePoolCreation.bind(this));

        this.wsProvider._websocket.on("open", () => {
            this.log("WebSocket conectado. Aguardando eventos de criação de pool...");
            this.reconnectAttempts = 0; 
        });

        this.wsProvider._websocket.on("close", (code, reason) => {
            this.log(`WebSocket desconectado. Código: ${code}, Razão: ${reason.toString()}`);
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                this.log(`Tentando reconectar em ${this.reconnectTimeout / 1000}s... Tentativa ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                setTimeout(() => this.connectWebSocket(), this.reconnectTimeout);
            } else {
                this.log("Limite de tentativas de reconexão atingido. Encerrando bot.");
                telegramService.sendAlert("Limite de tentativas de reconexão do WebSocket atingido. Bot encerrado.");
                process.exit(1);
            }
        });

        this.wsProvider._websocket.on("error", (err) => {
            this.log(`Erro no WebSocket: ${err.message}`);
            this.wsProvider._websocket.terminate(); 
        });
    }

    async handlePoolCreation(token0Address, token1Address, fee, tickSpacing, poolAddress) {
        this.log("\n--- Novo Pool Detectado ---");
        this.log(`Token0: ${token0Address}`);
        this.log(`Token1: ${token1Address}`);
        this.log(`Fee: ${fee}`);
        this.log(`Pool Address: ${poolAddress}`);
        this.log("--------------------------");

        // Verifica se já compramos algo ou se já estamos processando outro pool
        if (this.botState.isPoolBought) {
            this.log("Já realizamos uma compra. Ignorando novo pool.");
            return;
        }

        const isTargetToken0 = token0Address.toLowerCase() === config.TARGET_TOKEN_ADDRESS.toLowerCase();
        const isTargetToken1 = token1Address.toLowerCase() === config.TARGET_TOKEN_ADDRESS.toLowerCase();

        // Apenas consideramos pools do token alvo com WETH
        const isWETH0 = token0Address.toLowerCase() === config.WETH_ADDRESS.toLowerCase();
        const isWETH1 = token1Address.toLowerCase() === config.WETH_ADDRESS.toLowerCase();

        const isRelevantPool = (isTargetToken0 && isWETH1) || (isTargetToken1 && isWETH0);

        if (!isRelevantPool) {
            this.log("Pool não relevante (não é com o TOKEN_ADDRESS e WETH). Ignorando.");
            return;
        }

        this.log(`Pool relevante detectado: ${poolAddress}. Tentando comprar...`);
        this.botState.isPoolBought = true; // Sinaliza que estamos tentando comprar

        const tokenInAddress = isWETH0 ? token0Address : token1Address; // WETH
        const tokenOutAddress = isTargetToken0 ? token0Address : token1Address; // Token alvo

        // APROVAR WETH
        const approved = await this.uniswapService.approveToken(tokenInAddress, config.AMOUNT_TO_BUY);
        if (!approved) {
            this.log(`Falha na aprovação do WETH para o pool ${poolAddress}.`);
            telegramService.sendAlert(`🚨 Falha na aprovação do WETH para compra no pool ${poolAddress}.`);
            this.botState.isPoolBought = false; // Permite que o bot tente outro pool
            return;
        }

        // EXECUTAR SWAP
        const amountReceived = await this.uniswapService.executeSwapExactInputSingle(
            tokenInAddress,
            tokenOutAddress,
            config.AMOUNT_TO_BUY,
            fee
        );

        if (amountReceived) {
            this.botState.boughtTokenAddress = tokenOutAddress;
            this.botState.boughtAmount = amountReceived;
            this.botState.boughtPrice = config.AMOUNT_TO_BUY / amountReceived; 

            this.log(`✅ Compra realizada com sucesso no pool ${poolAddress}. Recebido: ${ethers.formatUnits(amountReceived, 18)} de ${tokenOutAddress}`);
            telegramService.sendAlert(`✅ Compra realizada!\nPool: [${poolAddress}](https://etherscan.io/address/${poolAddress})\nToken: ${tokenOutAddress}\nQuantidade: ${ethers.formatUnits(amountReceived, 18)}\nTX de compra: [Link](https://etherscan.io/tx/${this.uniswapService.lastTxHash || "0x..."})`);
        } else {
            this.log(`❌ Swap falhou para o pool ${poolAddress}.`);
            telegramService.sendAlert(`❌ Swap falhou para o pool ${poolAddress}.`);
            this.botState.isPoolBought = false; 
        }
    }

    async checkStopLoss() {
        if (!this.botState.boughtTokenAddress || !this.botState.boughtAmount || !this.botState.boughtPrice) {
            return;
        }

        try {
            const tokenContract = await this.uniswapService.getERC20ContractReadOnly(this.botState.boughtTokenAddress);
            const currentBalance = await tokenContract.balanceOf(config.WALLET_ADDRESS);

            if (currentBalance < this.botState.boughtAmount) {
                this.log(`⚠️ Saldo atual do token (${ethers.formatUnits(currentBalance, 18)}) é menor que a quantidade comprada (${ethers.formatUnits(this.botState.boughtAmount, 18)}). Possível venda manual ou perda.`);
            }

            const stopLossThreshold = this.botState.boughtAmount - (this.botState.boughtAmount * BigInt(Math.floor(config.STOP_LOSS_PERCENT))) / BigInt(100);

            this.log(`[StopLoss] Saldo atual (${ethers.formatUnits(currentBalance, 18)}) | Limite stop-loss (${ethers.formatUnits(stopLossThreshold, 18)})`);

            if (currentBalance < stopLossThreshold) {
                this.log("🔥 Stop-loss atingido! Venda manual ou implementação de venda automática necessária.");
                telegramService.sendAlert(`🔥 Stop-loss atingido para ${this.botState.boughtTokenAddress}!\nSaldo atual: ${ethers.formatUnits(currentBalance, 18)}\nPreço de compra aproximado: ${ethers.formatUnits(this.botState.boughtPrice, 18)} WETH/TOKEN. Venda recomendada!`);
            }
        } catch (err) {
            this.log(`Erro no checkStopLoss: ${err.message}`);
        }
    }

    async start() {
        this.log("Iniciando Sniper Bot...");
        await this.connectWebSocket();

        setInterval(() => {
            this.checkStopLoss();
        }, 60000);
    }
}

module.exports = SniperBot;