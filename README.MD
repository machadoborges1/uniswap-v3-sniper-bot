# Bot de Sniper para Uniswap V3

Este projeto é um bot de sniper em Node.js para Uniswap V3. Ele detecta novos pools de liquidez e executa compras instantâneas, com monitoramento básico de stop-loss e alertas via Telegram.

---

## Funcionalidades Principais

* **Detecção de Novos Pools:** Monitora a Uniswap V3 Factory em tempo real.
* **Compra Automática:** Compra um token alvo em pools relevantes (geralmente WETH/TOKEN\_ALVO).
* **Configuração Flexível:** Parâmetros configuráveis via `.env` (endereços, slippage, etc.).
* **Monitoramento de Stop-Loss:** Alerta se o saldo do token comprado cair abaixo do limite (venda automática não implementada).
* **Alertas via Telegram:** Notificações sobre status, compras e stop-loss.
* **Reconexão Robusta:** Lida com desconexões de WebSocket.

---

## Pré-requisitos

* **Node.js:** v16 ou superior.
* **npm:** Gerenciador de pacotes.
* **Provedor RPC/WebSocket:** Conta Infura ou similar (para `.env`).
* **Carteira Ethereum:** Com ETH (gás) e WETH (compras).
* **Telegram:** Bot Token e Chat ID (Opcional).

---

## Configuração

1.  **Clone o Repositório:**

    ```bash
    git clone [https://github.com/machadoborges1/uniswap-v3-sniper-bot.git](https://github.com/machadoborges1/uniswap-v3-sniper-bot.git)
    cd uniswap-v3-sniper-bot
    ```

2.  **Instale as Dependências:**

    ```bash
    npm install
    ```

3.  **Crie e Configure seu Arquivo `.env`:**
    Use `.env.example` como guia.

4.  **Arquivos ABI:**
    Os arquivos ABI necessários (`abi.router.json`, `abi.factory.json`, `abi.erc20.json`) estão na pasta `abi/`.

---

## Como Usar

1.  **Inicie o Bot:**

    ```bash
    node src/index.js
    ```

2.  O bot começará a monitorar a blockchain e registrará as atividades no console.

---

## Dependências

* `dotenv`: Carrega variáveis de ambiente.
* `ethers`: Interação com Ethereum.
* `node-fetch`: Requisições HTTP (para Telegram).
* `@uniswap/sdk-core`, `@uniswap/v3-sdk`, `@uniswap/v3-periphery`: Ferramentas Uniswap V3.

---

## Licença

Este projeto é licenciado sob a [Licença MIT](LICENSE).

---

## Contribuição

Contribuições são bem-vindas!.

---

## Aviso Importante

**⚠️ DISCLAIMER DE RISCO:** Este bot opera em um cenário de alta volatilidade e risco extremo, podendo resultar em **perda total dos fundos**.

* **Não é aconselhamento financeiro.** Apenas para fins educacionais e de demonstração.
* **Riscos da Rede:** Congestionamento, picos de gás e reorgs podem afetar transações.
* **Rug Pulls:** Tokens recém-lançados são suscetíveis a golpes.
* **Slippage:** A variação de preço pode exceder o limite em alta volatilidade.

**USE ESTE BOT POR SUA CONTA E RISCO.** Os desenvolvedores não se responsabilizam por quaisquer perdas financeiras.

---