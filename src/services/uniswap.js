const { ethers } = require("ethers");
const routerABI = require("../../abi/abi.router.json");
const erc20ABI = require("../../abi/abi.erc20.json");
const config = require("./config"); 

class UniswapService {
    constructor(signer, provider) {
        this.signer = signer;
        this.provider = provider;
        this.routerContract = new ethers.Contract(config.ROUTER_ADDRESS, routerABI, signer);
    }

    async getERC20Contract(address) {
        return new ethers.Contract(address, erc20ABI, this.signer);
    }

    async getERC20ContractReadOnly(address) {
        return new ethers.Contract(address, erc20ABI, this.provider);
    }

    async approveToken(tokenAddress, amount) {
        const tokenContract = await this.getERC20Contract(tokenAddress);
        try {
            const allowance = await tokenContract.allowance(this.signer.address, config.ROUTER_ADDRESS);
            console.log(`[UniswapService] Allowance atual para ${tokenAddress}: ${ethers.formatUnits(allowance, 18)}`);

            if (allowance >= amount) {
                console.log(`[UniswapService] Aprovação para ${tokenAddress} já é suficiente.`);
                return true;
            }

            const tx = await tokenContract.approve(config.ROUTER_ADDRESS, amount);
            console.log(`[UniswapService] Aprovando ${tokenAddress} - TX: ${tx.hash}`);
            await tx.wait();
            console.log(`[UniswapService] ${tokenAddress} aprovado com sucesso.`);
            return true;
        } catch (err) {
            console.error(`[UniswapService] Erro na aprovação do token ${tokenAddress}:`, err.message);
            return false;
        }
    }

    async executeSwapExactInputSingle(tokenInAddress, tokenOutAddress, amountIn, fee) {
        try {
            const deadline = Math.floor(Date.now() / 1000) + 60 * 5; 

            const slippageFactor = BigInt(Math.floor(config.MAX_SLIPPAGE_PERCENT * 100)); 
            const amountOutMinimum = amountIn - (amountIn * slippageFactor) / BigInt(10000);

            const params = {
                tokenIn: tokenInAddress,
                tokenOut: tokenOutAddress,
                fee: fee, 
                recipient: config.WALLET_ADDRESS,
                deadline: deadline,
                amountIn: amountIn,
                amountOutMinimum: amountOutMinimum,
                sqrtPriceLimitX96: 0 
            };

            const estimatedGas = await this.routerContract.exactInputSingle.estimateGas(params);
            console.log(`[UniswapService] Gás estimado para swap: ${estimatedGas.toString()}`);

            const tx = await this.routerContract.exactInputSingle(params, {
                gasLimit: estimatedGas + BigInt(50000),
            });

            console.log(`[UniswapService] Swap enviado - TX: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`[UniswapService] Swap concluído. Bloco: ${receipt.blockNumber}`);

            let amountOut = BigInt(0);
            for (const log of receipt.logs) {
                try {
                    const parsedLog = this.routerContract.interface.parseLog(log);
                    if (parsedLog && parsedLog.name === "Swap") {
                        if (parsedLog.args.amount0.isNegative() || parsedLog.args.amount1.isNegative()) {
                            amountOut = parsedLog.args.amount0.isNegative() ? parsedLog.args.amount1 : parsedLog.args.amount0;
                        }
                        break;
                    }
                } catch (e) {
                }
            }

            if (amountOut === BigInt(0)) {
                 console.warn("[UniswapService] Não foi possível extrair a quantidade de saída do log do swap.");
                 const tokenOutContract = await this.getERC20ContractReadOnly(tokenOutAddress);
                 const newBalance = await tokenOutContract.balanceOf(config.WALLET_ADDRESS);
                 console.log(`[UniswapService] Saldo de ${tokenOutAddress} após swap: ${newBalance.toString()}`);
                 return newBalance;
            }

            console.log(`[UniswapService] Recebido: ${ethers.formatUnits(amountOut, 18)} tokens (assumindo 18 decimais)`); 
            return amountOut;
        } catch (err) {
            console.error(`[UniswapService] Erro no swap: ${err.message}`);
            if (err.reason) console.error(`Razão do erro: ${err.reason}`);
            if (err.code) console.error(`Código do erro: ${err.code}`);
            if (err.data) console.error(`Dados do erro: ${err.data}`);
            return null;
        }
    }
}

module.exports = UniswapService;