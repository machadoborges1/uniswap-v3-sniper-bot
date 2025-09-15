# Uniswap V3 Sniper Bot

This project is a Node.js sniper bot for Uniswap V3. It detects new liquidity pools and executes instant purchases, with basic stop-loss monitoring and Telegram alerts.

---

## Key Features

*   **New Pool Detection:** Monitors the Uniswap V3 Factory in real-time.
*   **Automatic Purchase:** Buys a target token in relevant pools (typically WETH/TARGET_TOKEN).
*   **Flexible Configuration:** Configurable parameters via `.env` (addresses, slippage, etc.).
*   **Stop-Loss Monitoring:** Alerts if the purchased token balance falls below the threshold (automatic selling not implemented).
*   **Telegram Alerts:** Notifications about status, purchases, and stop-loss triggers.
*   **Robust Reconnection:** Handles WebSocket disconnections gracefully.

---

## Prerequisites

*   **Node.js:** v16 or higher.
*   **npm:** Node Package Manager.
*   **RPC/WebSocket Provider:** An Infura account or similar service (for `.env`).
*   **Ethereum Wallet:** With ETH (for gas) and WETH (for purchases).
*   **Telegram:** Bot Token and Chat ID (Optional).

---

## Configuration

1.  **Clone the Repository:**

    ```bash
    git clone https://github.com/machadoborges1/uniswap-v3-sniper-bot.git
    cd uniswap-v3-sniper-bot
    ```

2.  **Install Dependencies:**

    ```bash
    npm install
    ```

3.  **Create and Configure your `.env` File:**
    Use the provided `.env.example` as a guide.

4.  **ABI Files:**
    The required ABI files (`abi.router.json`, `abi.factory.json`, `abi.erc20.json`) are located in the `abi/` folder.

---

## Usage

1.  **Start the Bot:**

    ```bash
    node src/index.js
    ```

2.  The bot will start monitoring the blockchain and log activities to the console.

---

## Dependencies

*   `dotenv`: Loads environment variables.
*   `ethers`: Interacts with the Ethereum blockchain.
*   `node-fetch`: Makes HTTP requests (for Telegram).
*   `@uniswap/sdk-core`, `@uniswap/v3-sdk`, `@uniswap/v3-periphery`: Uniswap V3 SDK tools.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

## Important Disclaimer

**⚠️ RISK DISCLAIMER:** This bot operates in a highly volatile and extremely risky environment, which may result in **total loss of funds**.

*   **This is not financial advice.** For educational and demonstration purposes only.
*   **Network Risks:** Network congestion, gas spikes, and chain reorganizations (reorgs) can affect transactions.
*   **Rug Pulls:** Newly launched tokens are highly susceptible to scams.
*   **Slippage:** Price volatility may cause execution beyond your set slippage tolerance.

**USE THIS BOT AT YOUR OWN RISK.** The developers are not responsible for any financial losses incurred.
