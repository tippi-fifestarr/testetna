# Decibel "First Quick Win" Setup Guide for Beginners

**Welcome, future Decibel trader!** 🎯

This guide will walk you through placing your first order on Decibel, querying its status, and watching live updates come in. You'll learn what's happening at each step and why.

**Last Updated:** 2025-11-19

---

## Meet Alex, the API Beginner 👋

**Who is Alex?**
- Comfortable writing code (JavaScript/TypeScript)
- Has built web apps before
- Never traded using APIs
- Doesn't know much about blockchain
- Wants to understand what's happening, not just copy-paste

**Alex's Learning Journey:**
Today, Alex will learn:
- ✅ What blockchain transactions are (vs regular API calls)
- ✅ How to format prices properly for trading
- ✅ What a subaccount is and why it matters
- ✅ How orders move through their lifecycle
- ✅ The difference between polling and WebSockets
- ✅ How to see their order update in real-time

**Alex's Goal:**
Go from zero → successful order → live status updates in ~2 hours

---

## Core Concepts (Learn Through Alex's Journey) 📚

### 1️⃣ Blockchain Transaction vs REST API Call

**Alex asks:** "Wait, I thought this was an API? Why am I signing transactions?"

**The Answer:**
Decibel uses BOTH:

- **Blockchain Transactions** (for changing state)
  - 💡 Like: Placing orders, creating accounts, moving money
  - 🔐 Require your private key to sign
  - ⏱️ Take a few seconds to confirm
  - 💰 Cost a tiny gas fee (paid in APT)
  - 🔗 Recorded permanently on the blockchain
  - Think of it like: "Writing to a public ledger"

- **REST API Calls** (for reading state)
  - 💡 Like: Checking order status, getting market data
  - 🔓 No private key needed (usually)
  - ⚡ Instant responses
  - 🆓 Free (no gas fees)
  - Think of it like: "Reading from a database"

**Example Flow:**
```
You → "Place order" → Blockchain Transaction → Order recorded on-chain
You → "Check order status" → REST API → Get current state
```

### 2️⃣ What is a Subaccount? 🏦

**Alex asks:** "I have my wallet address. Why do I need another account?"

**The Answer:**
Your wallet (like `0x123abc...`) is your main account. A **subaccount** is a trading-specific account that:
- 📊 Holds your positions and orders
- 🔒 Keeps your trading separate from your main wallet
- 🎯 Can have multiple (for different strategies)
- 🛡️ Adds a layer of organization and safety

Think of it like:
- **Main wallet** = Your bank account
- **Subaccount** = A brokerage account linked to your bank

**You must create a subaccount before placing orders!**

### 3️⃣ Order Lifecycle (Birth to Death) 🌱

Your order goes through stages:

```
1. CREATED → You submit the transaction
   ↓
2. PENDING → Transaction is being confirmed (~2-5 seconds)
   ↓
3. OPEN → Order is on the orderbook, waiting for a match
   ↓
4a. FILLED → Someone traded with you! 🎉
OR
4b. CANCELLED → You cancelled it or it expired ❌
```

**Status you'll see:**
- `Open` - Waiting to be filled
- `Partial` - Some filled, some waiting
- `Filled` - Completely done!
- `Cancelled` - Stopped before filling

### 4️⃣ Price/Size Formatting (The Tricky Part) 🔢

**Alex asks:** "I want to buy 1 BTC at $50,000. Why can't I just send that?"

**The Answer:**
Blockchains don't understand decimals well. So Decibel uses **integer math**.

**Human thinks:** `price = 50000.50, size = 1.5`

**Blockchain needs:** `price = 5000050000000, size = 1500000000`

**The conversion:**
```javascript
// Step 1: Get market config (tells you the precision)
const market = await getMarket('BTC-PERP');
// market.px_decimals = 6 (for prices)
// market.sz_decimals = 9 (for sizes)

// Step 2: Convert to "chain units"
const chainPrice = 50000.50 * (10 ** 6);  // 50000500000
const chainSize = 1.5 * (10 ** 9);  // 1500000000
```

**Why this matters:**
- ❌ Wrong: Order rejected or weird fills
- ✅ Right: Order works perfectly

**Don't worry!** We'll provide helper functions.

### 5️⃣ WebSocket vs Polling (Getting Updates) 📡

**Alex asks:** "How do I know when my order fills?"

**Two ways:**

**Option 1: Polling (The Old Way)**
```javascript
// Check every 5 seconds
setInterval(async () => {
  const status = await checkOrderStatus();
  console.log(status);
}, 5000);
```
- ❌ Slow (5 second delay)
- ❌ Wastes API calls
- ✅ Simple to understand

**Option 2: WebSocket (The Modern Way)**
```javascript
// Server pushes updates to you instantly
ws.onmessage = (update) => {
  console.log("Order updated!", update);
};
```
- ✅ Instant notification
- ✅ Efficient
- ⚠️ Slightly more complex

**We'll use WebSockets** because they're more fun and professional!

---

## 💡 Getting Your Subaccount Address (The Documented Way)

**Alex asks:** "After I create a subaccount, how do I get its address?"

**The Answer:**
This is actually well-documented! Here's the proper approach:

```typescript
// ✅ The Documented Way to Get Subaccount Address

// Step 1: Create subaccount (blockchain transaction)
const createTx = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${PACKAGE}::dex_accounts::create_new_subaccount`,
    typeArguments: [],
    functionArguments: [],
  },
});

const signedTx = aptos.transaction.sign({ signer: account, transaction: createTx });
const pendingTx = await aptos.transaction.submit.simple({
  transaction: createTx,
  senderAuthenticator: signedTx,
});

// Wait for the transaction to confirm
await aptos.waitForConfirmation({ transactionHash: pendingTx.hash });

// Step 2: Retrieve the address via API (✅ This is the documented method!)
const response = await fetch(
  `https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?owner=${userAddress}`
);
const subaccounts = await response.json();

// Your newly created subaccount will be in the array
const subaccountAddr = subaccounts[0].subaccount_address;

console.log("✅ Subaccount created:", subaccountAddr);
```

**Why this works:**
- 📖 **Documented**: See [`openapi.json:1095-1130`](etna/docs/api-reference/openapi.json:1095)
- ✅ **Official API**: Uses the `/api/v1/subaccounts` endpoint
- 🎯 **Simple**: Just call the API after transaction confirms
- 💯 **Reliable**: Returns all your subaccounts with their addresses

**What you get back:**
```json
[
  {
    "subaccount_address": "0x123abc...",
    "primary_account_address": "0x456def...",
    "is_primary": true,
    "is_active": true,
    "custom_label": null
  }
]
```

**This is NOT a workaround** - it's the proper, documented way! 🎉

---

## Quick Assessment: Can We Do This? 🔍

Let's check what we have vs what we need:

### ✅ What We Have (Good News!)

| Item | Status | Notes |
|------|--------|-------|
| API Documentation | ✅ Complete | Comprehensive guides available |
| TypeScript SDK | ✅ Available | `@aptos-labs/ts-sdk` |
| REST API Endpoints | ✅ Working | `/api/v1/orders`, `/api/v1/markets` |
| WebSocket Server | ✅ Active | `wss://api.netna.aptoslabs.com/decibel/ws` |
| Code Examples | ✅ Provided | TypeScript and Python samples |

### ⚠️ What We Need (Action Required)

| Item | Status | Solution |
|------|--------|----------|
| Package Address | ⚠️ Missing | Need from Decibel team (shown as `{package}`) |
| Subaccount Address | ⚠️ Requires workaround | Can fetch via API after creation |
| Order ID Extraction | ⚠️ Complex | Use `client_order_id` instead |
| API Key Usage | ❓ Unclear | Generated but docs unclear on usage |

### 🎯 Confidence Levels

**Step 1: Place Order** → 75% Confidence
- ✅ Know the transaction structure
- ✅ Have formatting helpers
- ⚠️ Need package address
- 💡 Workaround: Use client_order_id for tracking

**Step 2: Query Status** → 90% Confidence  
- ✅ REST endpoint well documented
- ✅ Can query by client_order_id
- ✅ Response format clear

**Step 3: WebSocket Updates** → 80% Confidence
- ✅ Connection process documented
- ✅ Message format clear
- ❓ Authentication might be needed (unclear)

**Overall: We can definitely get SOMETHING working!** 🚀

---

## Prerequisites Checklist 📋

Before starting, Alex needs:

### ✅ Already Have These

- [ ] **API Key** from https://app.decibel.trade/api
  - Visit the site
  - Connect your wallet
  - Click "Create API Wallet"
  - Save the credentials securely

- [ ] **Private Key** for your wallet
  - ⚠️ **SECURITY WARNING:** Never share or commit this!
  - ⚠️ Only use on testnet/devnet for learning
  - 💡 Format: `0x123abc...` (64 hex characters)

- [ ] **APT Tokens** for gas fees
  - 💡 Each transaction costs ~0.001 APT
  - 💡 Need at least 0.1 APT to start
  - ⚠️ Get from faucet (if testnet) or exchange
  - 🎯 **Purpose:** APT is ONLY for paying blockchain transaction fees (gas)

- [ ] **Testnet USDC** for trading collateral
  - 💰 **Purpose:** USDC is your actual trading collateral (margin for positions)
  - 📊 **Requirement:** You MUST have USDC deposited to place orders
  - 🔧 **How to get:** Mint via [`restricted_mint`](etna/move/perp/sources/test/usdc.move:142) function
  - ⚠️ **Limit:** 250 USDC maximum per account ([`usdc.move:37`](etna/move/perp/sources/test/usdc.move:37))
  - 📝 **Documentation:** Deposit process at [`deposit.mdx:10`](etna/docs/transactions/account-management/deposit.mdx:10)

### ⚠️ Need to Get These

- [ ] **Package Address**
  - ⚠️ Currently shown as `{package}` in docs
  - 📧 **ACTION:** Request from Decibel team
  - 📝 Will receive something like: `0xabc123...::dex_accounts`

- [ ] **Market Address**
  - ✅ Can get from API: `/api/v1/markets`
  - 💡 Pick a market (e.g., BTC-PERP, ETH-PERP)
  - Will receive: `0xmarket123...`

### ❓ May Need These

- [ ] **Subaccount Address**
  - 🔧 Create via transaction (we'll do this)
  - 🔍 Retrieve via API: `/api/v1/subaccounts`
  - 💡 Format: `0xsubaccount...`

---

## Action Steps Todo List 📝

### Phase 1: Project Setup (20 min)

- [ ] **Create project folder**
  ```bash
  mkdir decibel-first-win
  cd decibel-first-win
  npm init -y
  ```

- [ ] **Install dependencies**
  ```bash
  npm install @aptos-labs/ts-sdk ws dotenv typescript ts-node @types/node @types/ws
  ```

- [ ] **Create `.env` file** with credentials
  ```env
  PRIVATE_KEY=0x...
  PACKAGE_ADDRESS=0x... # Get from Decibel
  ```

- [ ] **Test Aptos connection**
  - Run basic connection script
  - Verify wallet balance
  - Confirm network access

### Phase 2: Get Required Addresses (15 min)

- [ ] **Get package address** (awaiting from Decibel)
  - 📧 Email/Slack the team
  - 📝 Add to `.env` file

- [ ] **Fetch available markets from API**
  ```bash
  curl https://api.netna.aptoslabs.com/decibel/api/v1/markets | jq
  ```

- [ ] **Pick a market to trade**
  - 💡 Recommended: Start with BTC-PERP or ETH-PERP
  - 📝 Note the `market_addr`

### Phase 2.5: Mint Testnet USDC (15 min)

- [ ] **Mint testnet USDC for trading collateral**
  - 🔧 **Function:** [`{package}::usdc::restricted_mint`](etna/move/perp/sources/test/usdc.move:142)
  - 💰 **Amount:** Up to 250 USDC (250_000000 in 6 decimals)
  - ⚠️ **Limit:** 250 USDC per account maximum ([`usdc.move:37`](etna/move/perp/sources/test/usdc.move:37))
  - 📝 This is testnet-only; production requires real USDC

- [ ] **Verify USDC balance**
  - Check your USDC balance after minting
  - Confirm you have sufficient collateral for trading

- [ ] **Understand the difference**
  - 💡 APT = Gas fees (blockchain transaction costs)
  - 💰 USDC = Trading collateral (margin for positions)
  - 📊 You need BOTH to trade successfully

### Phase 3: Account Setup (30 min)

- [ ] **Create subaccount** (blockchain transaction)
  - Submit `create_new_subaccount` transaction
  - Wait for confirmation
  - Get transaction hash

- [ ] **Extract subaccount address** (use API endpoint)
  - ❌ Option A: Parse transaction events (complex, not well documented)
  - ✅ Option B: Call `/api/v1/subaccounts?owner=YOUR_ADDRESS` (✅ RECOMMENDED - well documented in [`openapi.json`](etna/docs/api-reference/openapi.json:1095))
  - This is the proper, documented way to retrieve your subaccount address
  - 📝 Save the address from the API response

- [ ] **Verify subaccount exists**
  - Query via API
  - Confirm it's linked to your wallet

### Phase 3.5: Deposit USDC to Subaccount (20 min)

- [ ] **Get USDC metadata address**
  - 📝 **Function:** [`{package}::usdc::metadata()`](etna/move/perp/sources/test/usdc.move:126)
  - This returns the USDC fungible asset metadata object
  - Needed as parameter for deposit function

- [ ] **Deposit USDC to your subaccount**
  - 🔧 **Function:** [`{package}::dex_accounts::deposit_to_subaccount_at`](etna/docs/transactions/account-management/deposit.mdx:10)
  - **Parameters:**
    - `signer` - Your account
    - `subaccount_address` - From Phase 3
    - `asset_metadata` - USDC metadata object address
    - `amount` - Amount in smallest units (e.g., 100_000000 = 100 USDC with 6 decimals)
  - 📖 **Documentation:** [`deposit.mdx:32-37`](etna/docs/transactions/account-management/deposit.mdx:32)

- [ ] **Verify deposit successful**
  - Check subaccount balance via API
  - Confirm USDC is available as collateral
  - 💡 **Critical:** You CANNOT place orders without USDC collateral ([`deposit.mdx:36`](etna/docs/transactions/account-management/deposit.mdx:36))

### Phase 4: Place First Order (15 min)

- [ ] **Format price/size correctly**
  - Get market config (decimals, tick size)
  - Use helper functions
  - Validate before submitting

- [ ] **Build order transaction**
  - Use `place_order_to_subaccount` function
  - Include all required parameters
  - Add `client_order_id` for tracking

- [ ] **Submit and get transaction hash**
  - Sign transaction
  - Submit to blockchain
  - Wait for confirmation

- [ ] **Extract client_order_id**
  - 💡 We set this ourselves!
  - Use format: `order-${Date.now()}`

### Phase 5: Query Order Status (10 min)

- [ ] **Use REST API to query by client_order_id**
  ```bash
  GET /api/v1/orders?market_address=...&user_address=...&client_order_id=...
  ```

- [ ] **Parse response**
  - Check `status` field
  - Read `remaining_size`
  - Understand current state

- [ ] **Understand order status**
  - Open? Still waiting
  - Filled? Success! 🎉
  - Cancelled? Try again

### Phase 6: WebSocket Live Updates (20 min)

- [ ] **Connect to WebSocket**
  - Open connection to `wss://...`
  - Handle `onopen` event

- [ ] **Subscribe to order updates**
  - Send subscribe message
  - Include your user address
  - Wait for confirmation

- [ ] **Handle incoming messages**
  - Parse JSON
  - Filter for your orders
  - Log updates

- [ ] **See your order update in real-time**
  - 🎉 Watch status changes live!
  - 📊 See fills happen instantly

---

## Boilerplate Code Structure 🗂️

Here's how Alex should organize the project:

```
decibel-first-win/
├── .env                         # ⚠️ Credentials - NEVER COMMIT!
├── .gitignore                   # Protect your secrets
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── README.md                   # Your notes
├── src/
│   ├── 1-setup.ts              # ✅ Test connection
│   ├── 2-create-subaccount.ts  # 🏦 Create trading account
│   ├── 3-place-order.ts        # 📊 Place your first order
│   ├── 4-query-order.ts        # 🔍 Check order status
│   └── 5-websocket-updates.ts  # 📡 Live updates
└── utils/
    ├── client.ts               # 🔧 Aptos client setup
    ├── formatting.ts           # 🔢 Price/size helpers
    └── config.ts               # ⚙️ Constants and env vars
```

**Why this structure?**
- 📁 Each file = one step of the journey
- 🔢 Numbered = run in order
- 🛠️ Utils = reusable helpers
- 📖 Easy to understand and debug

---

## Boilerplate Code Snippets 💻

### File: `.env`

```env
# ⚠️ SECURITY WARNING: NEVER commit this file!
# Add .env to your .gitignore

# Your wallet private key (from Aptos wallet)
PRIVATE_KEY=0x1234567890abcdef...

# Package address (get from Decibel team)
# Currently shown as {package} in docs
PACKAGE_ADDRESS=0x... # TODO: Get from Decibel

# Network endpoints
FULLNODE_URL=https://api.netna.staging.aptoslabs.com/v1
API_BASE_URL=https://api.netna.aptoslabs.com/decibel
WEBSOCKET_URL=wss://api.netna.aptoslabs.com/decibel/ws
```

### File: `.gitignore`

```
# Keep secrets safe!
.env
node_modules/
dist/
*.log

# IDE
.vscode/
.idea/
```

### File: `package.json`

```json
{
  "name": "decibel-first-win",
  "version": "1.0.0",
  "description": "First order on Decibel - Learning Project",
  "scripts": {
    "setup": "ts-node src/1-setup.ts",
    "create-subaccount": "ts-node src/2-create-subaccount.ts",
    "place-order": "ts-node src/3-place-order.ts",
    "query-order": "ts-node src/4-query-order.ts",
    "watch-orders": "ts-node src/5-websocket-updates.ts"
  },
  "dependencies": {
    "@aptos-labs/ts-sdk": "^1.0.0",
    "dotenv": "^16.0.0",
    "ws": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/ws": "^8.0.0",
    "ts-node": "^10.0.0",
    "typescript": "^5.0.0"
  }
}
```

### File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*", "utils/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Full Code Examples

See the continuation below for complete, runnable code examples for each step of the journey!

---

## Next Steps After Setup 🚀

### When You Get the Missing Values

1. **Got Package Address?**
   - Add to `.env` as `PACKAGE_ADDRESS`
   - Run `npm run setup` to verify
   - Proceed to create subaccount

2. **Got Subaccount Address?**
   - Note it down (you'll need it for orders)
   - Hardcode it in `3-place-order.ts`
   - Or better: fetch dynamically from API

3. **Got Market Address?**
   - From `curl /api/v1/markets`
   - Pick your favorite market
   - Update `3-place-order.ts`

### Testing Each Phase Independently

**Phase 1: Connection Test**
```bash
npm run setup
# Should see: ✅ Connected, balance displayed
```

**Phase 2: Subaccount Creation**
```bash
npm run create-subaccount
# Should see: ✅ Transaction hash, instructions to get address
```

**Phase 3: Place Order**
```bash
# First: Update SUBACCOUNT_ADDRESS and MARKET_ADDRESS in 3-place-order.ts
npm run place-order
# Should see: ✅ Order placed, client_order_id shown
```

**Phase 4: Query Order**
```bash
# Update CLIENT_ORDER_ID in 4-query-order.ts
npm run query-order
# Should see: Order status (Open, Filled, etc.)
```

**Phase 5: Live Updates**
```bash
npm run watch-orders
# Should see: WebSocket connected, order updates streaming
```

---

## Common Issues and Debugging Tips 🔍

### Issue: "Insufficient balance for gas fees"

**Problem:** Not enough APT in account

**Solution:**
```bash
# Check balance
npm run setup

# Get APT from faucet (if testnet)
# Or buy from exchange (if mainnet)
```

### Issue: "Package address not found"

**Problem:** `PACKAGE_ADDRESS` not set in `.env`

**Solution:**
1. Email Decibel team for package address
2. Add to `.env` file
3. Restart script

### Issue: "Subaccount not created"

**Problem:** Transaction failed or address not retrieved

**Solution:**
```bash
# Check transaction on explorer
# Or query API:
curl "https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?user_address=YOUR_ADDRESS"
```

### Issue: "Order rejected - invalid price"

**Problem:** Price not formatted correctly

**Solution:**
- Make sure you're using the formatting helpers
- Check market config (decimals, tick size)
- Round to valid tick size

### Issue: "WebSocket connection closed"

**Problem:** Connection dropped or authentication failed

**Solution:**
```javascript
// Add reconnection logic
ws.onclose = () => {
  console.log('Reconnecting in 5s...');
  setTimeout(connectWebSocket, 5000);
};
```

### Issue: "Can't find my order"

**Problem:** Using wrong client_order_id or order not confirmed yet

**Solution:**
1. Wait 5-10 seconds after placing order
2. Check the `client_order_id` you set
3. Verify market_address and user_address are correct

### Issue: "Insufficient collateral" or "Margin requirement not met"

**Problem:** No USDC deposited in your subaccount

**Solution:**
1. **Mint testnet USDC** (if you haven't)
   - Function: [`{package}::usdc::restricted_mint`](etna/move/perp/sources/test/usdc.move:142)
   - Max amount: 250 USDC (250_000000 with 6 decimals)
   
2. **Deposit USDC to subaccount**
   - Function: [`{package}::dex_accounts::deposit_to_subaccount_at`](etna/docs/transactions/account-management/deposit.mdx:10)
   - Required parameters:
     - Your subaccount address
     - USDC metadata object
     - Amount to deposit
   
3. **Verify the deposit**
   ```bash
   # Check your subaccount balance via API
   curl "https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?owner=YOUR_ADDRESS"
   ```

**Remember:** APT is for gas fees, USDC is for trading collateral. You need BOTH!

---

## Where to Ask for Help 💬

**Decibel Resources:**
- 📖 Documentation: [Official Docs](https://docs.decibel.trade)
- 💬 Discord: Join the Decibel community
- 🐦 Twitter: @DecibelTrade for updates

**When Asking for Help:**
Include:
1. ✅ What you're trying to do
2. ✅ Error message (full text)
3. ✅ Transaction hash (if applicable)
4. ✅ Code snippet (relevant part)
5. ❌ DON'T share your private key!

**Example Good Question:**
```
"I'm trying to place my first order but getting 'invalid price' error.

Error: Transaction simulation failed
Code: INVALID_PRICE

Market: BTC-PERP
Price: 50000.5
Size: 1.0
Market config: px_decimals=6, tick_size=500000

Transaction hash: 0xabc123...

What am I doing wrong?"
```

---

## Success Checklist ✨

By the end of this guide, Alex should be able to:

- [x] ✅ Understand blockchain transactions vs API calls
- [x] ✅ Create and manage an Aptos account
- [x] ✅ Format prices and sizes correctly
- [x] ✅ Create a subaccount for trading
- [x] ✅ Place an order on Decibel
- [x] ✅ Query order status via REST API
- [x] ✅ Receive real-time updates via WebSocket
- [x] ✅ Debug common issues independently
- [x] ✅ Know where to find help

**Congratulations! 🎉**

You've gone from zero to your first Decibel order. This foundation will help you build more sophisticated trading strategies.

---

## What's Next? 🎯

Now that you've mastered the basics:

1. **Explore Advanced Orders**
   - Stop-loss and take-profit orders
   - TWAP (Time-Weighted Average Price) orders
   - Bulk order placement

2. **Build a Trading Bot**
   - Use WebSocket for live market data
   - Implement a simple strategy
   - Add risk management

3. **Monitor Your Positions**
   - Track P&L in real-time
   - Set up alerts
   - Build a dashboard

4. **Optimize Your Code**
   - Use the official TypeScript SDK
   - Implement better error handling
   - Add logging and monitoring

**Keep Learning!** 📚

The Decibel documentation has guides for all of these topics. You now have the foundation to understand them.

---

## Appendix: Quick Reference 📋

### Key Endpoints

```bash
# REST API Base
https://api.netna.aptoslabs.com/decibel

# WebSocket
wss://api.netna.aptoslabs.com/decibel/ws

# Fullnode
https://api.netna.staging.aptoslabs.com/v1
```

### Essential API Calls

```bash
# Get markets
GET /api/v1/markets

# Get order status
GET /api/v1/orders?market_address=...&user_address=...&client_order_id=...

# Get subaccounts
GET /api/v1/subaccounts?user_address=...
```

### WebSocket Topics

```javascript
// Order updates
{ "Subscribe": { "topic": "order_updates:YOUR_ADDRESS" } }

// Market prices
{ "Subscribe": { "topic": "all_market_prices" } }
```

### Transaction Functions

```typescript
// Create subaccount
`${package}::dex_accounts::create_new_subaccount`

// Place order
`${package}::dex_accounts::place_order_to_subaccount`
```

---

**Happy Trading! 🚀**

Remember: Start small, learn continuously, and never risk more than you can afford to lose.