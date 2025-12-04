# Decibel Trading Starter Kit

A complete, working reference implementation for programmatic trading on Decibel.

**Goal:** Get a bot running on testnet in < 5 minutes, then teach you how to customize it.

## Part 1: The "Quick Win" (Relax Mode) 🚫🧠

Follow these steps exactly to get your first trade running.

### 1. Prerequisites
- [ ] **Node.js 18+** installed
- [ ] **Petra Wallet** browser extension installed (recommended, but optional thanks to Aptos Connect)
- [ ] **Git** installed
- [ ] [**Aptos CLI** (recommended)](https://aptos.dev/build/cli#-install-the-aptos-cli)

### 2. Get Your Credentials
1.  Go to [Decibel App (Staging)](https://app.decibel.trade/api).
2.  Connect your Petra Wallet or "Continue with Google."
3.  Click **"Create API Wallet"**.
![Create API Wallet Example](./create-api-wallet.png)
4.  **Copy the Private Key** immediately (you only see it once).

### 3. Configure the Project
Run these commands in your terminal:

```bash
# Clone the repo (probably should host it on aptos/decibel)
git clone https://github.com/tippi-fifestarr/testetna/ 
cd starter-kit

# Install dependencies
npm install

# Create env file
cp .env.example .env
```

Open `.env` and paste your credentials:
```env
API_WALLET_PRIVATE_KEY=0xYOUR_COPIED_KEY_HERE
API_WALLET_ADDRESS=0xYOUR_WALLET_ADDRESS_HERE
```

### 4. Run the "Quick Win"
This script handles everything: funding (via private faucet), account creation, minting USDC, depositing, and placing a trade. It's running the scripts in `src/`.

```bash
npm run quick-win
```

**If you see "🎉 Order Placement Complete!", congratulations. The code works.**

---

## Part 2: Make It Yours (Brain On) 🧠✅

Now that you have a working baseline, here is how to adapt this code for your actual strategy.

### How to Trade a Different Market
Open [`src/4-place-order.ts`](./src/4-place-order.ts).
Find the "Configuration" section (Line 47).

**Change this:**
```typescript
const marketName = config.MARKET_NAME || 'BTC-PERP';
```

**To this (example):**
```typescript
const marketName = 'ETH-PERP'; // or SOL-PERP, APT-PERP
```
*Note: Run `npm run setup` to see a list of all available market names.*

### How to Change Your Order Logic
Open [`src/4-place-order.ts`](./src/4-place-order.ts).
Find the "Order Parameters" section.

**Change this:**
```typescript
const userPrice = 50000;
const userSize = 0.001;
const isBuy = true;
```

**To your own logic:**
```typescript
// Example: A simple moving average bot might look like this
const userPrice = calculatedMovingAverage;
const userSize = riskManagementSize;
const isBuy = signal === 'BULLISH';
```

### How to Use a Different Account
If you want to use a specific subaccount (e.g., for a different strategy):
1.  Create a new one: `npm run create-subaccount`
2.  Update your `.env` file with the new `SUBACCOUNT_ADDRESS`.
3.  Run `npm run deposit-usdc` to fund it.

See the [source folder](./src/) for all the scripts `quick-win` is running, such as [3-deposit-usdc](./src/3-deposit-usdc.ts) (used above). 

---

## Part 3: Mental Model & Architecture 🏗️

Trading on Decibel has specific mechanics that differ from CEXs. Here are 3 key concepts for API traders.

### 1. The Two-Wallet Model
Decibel uses a standard separation of concerns:

*   **Main Wallet (Petra):** Holds APT for gas fees.
*   **Subaccount:** Holds USDC for trading collateral.

**Flow:** Main Wallet -> Create Subaccount -> Deposit USDC -> Trade.

### 2. Async Execution (The Queue)
Decibel is an on-chain CLOB.
*   **CEX:** `response = placeOrder()` -> Returns "Filled".
*   **Decibel:** `response = placeOrder()` -> Returns "Transaction Hash" (Ticket to the Queue).

**Implication:** Execution is asynchronous. The REST response confirms *submission*, not *fill*. Use the WebSocket stream for deterministic execution updates.
*   [See WebSocket Docs](https://docs.decibel.trade/api-reference/websockets/orderupdate)

### 3. "Lazy" Continuous Funding
*   **Traditional:** You pay funding every 8 hours.
*   **Decibel:** Funding ticks every second (continuous accrual).
*   **The Mechanic:** You only "pay" (settle) when you modify or close the position.
*   **Risk:** Your `Unrealized PnL` includes this accrued funding debt. Watch it closely to avoid liquidation.
*   [See Position Management Docs](https://docs.decibel.trade/architecture/perps/position-management)

### 4. Reduce-Only Logic
Decibel implements strict "Close First" logic.
*   **The Mechanic:** A Reduce-Only order will never flip your position (e.g. Long 1 -> Short 1). It caps execution at your current size.
*   **Benefit:** Prevents accidental exposure when closing positions aggressively.
*   [See Order Management Docs](https://docs.decibel.trade/transactions/overview)

### 5. Bulk Orders (Unique Optimization)
For Market Makers and HFTs:
*   **The Mechanic:** You can update multiple orders in a single transaction.
*   **Benefit:** Massive gas savings and atomic updates for spread management.
*   [See Bulk Order Docs](https://docs.decibel.trade/transactions/order-management/place-bulk-order)

---

## Part 4: What's Next? 🚀

1.  **Monitor Risk:** Build a script to track `Unrealized PnL` + `Accrued Funding` to avoid liquidation.
2.  **Market Making:** Use `src/6-websocket-updates.ts` to listen to the orderbook and place Maker orders.
3.  **Explore Order Types:** Look into `Post-Only` and `Reduce-Only` params in the API docs for advanced control.

### Resources
*   [Official Documentation](https://docs.decibel.trade)
*   [Discord Community](https://discord.com/invite/decibel)
*   [Netna Faucet (Staging)](https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app)
