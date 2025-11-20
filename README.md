# Decibel Trading - First Quick Win 🚀

A complete, runnable TypeScript project that implements the full "first quick win" workflow on Decibel - from setup to placing orders and watching live updates.

## What This Project Does

This project takes you through **all the critical steps** to start trading on Decibel:

1. ✅ Test connection and check balances
2. ✅ Create a trading subaccount
3. ✅ Mint testnet USDC (trading collateral)
4. ✅ Deposit USDC to your subaccount
5. ✅ Place your first order
6. ✅ Query order status
7. ✅ Watch live WebSocket updates

## Prerequisites

### What You Need

- [x] **Node.js 18+** installed ([Download here](https://nodejs.org/))
- [x] **Petra Wallet** browser extension ([Install here](https://petra.app/))
- [x] **API wallet** created through Decibel (see below)
- [x] **Private key** exported from your API wallet (see below)
- [x] **Testnet APT** for gas fees (automated via faucet)

### Step-by-Step Setup

#### 1. Install Petra Wallet (5 minutes)

**Via Browser Extension:**
1. Visit https://petra.app/
2. Click "Download" and install for your browser (Chrome, Firefox, etc.)
3. Create a new wallet or import existing
4. **Important:** Keep your recovery phrase safe!

#### 2. Create API Wallet & Get Private Key (3 minutes)

**Via Decibel Web App (Required):**
1. Visit https://app.decibel.trade/api
2. Click "Connect Wallet" and select Petra
3. Authorize with Petra (signs a **0-cost transaction** to create API wallet)
4. Click "Create API Wallet"
5. **⚠️ CRITICAL: Copy the private key shown NOW!** It's displayed ONCE and never shown again
6. **Save both values:**
   - **API Wallet Address:** `0x5a9421118b977628a7b19aa3edd9938589837ae9a8aa16ada990deb2ea806251`
   - **Private Key:** `0x84dabc43f41905337xxxxxxxxxxxxxxxxxxxxxx86dc5c1c01f813091535ccc4a`

**Important Notes:**
- The private key is provided BY DECIBEL when you create the API wallet
- It's NOT exported from Petra wallet
- If you lose it, you'll need to create a new API wallet
- **Security:** Never share it or commit to version control!
- The initial creation costs 0 APT (gasless transaction)

#### 3. Optional: Install Aptos CLI (for debugging)

**Not required, but useful for checking balances and debugging:**

```bash
# Install Aptos CLI (see https://aptos.dev/build/cli)
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Verify installation
aptos --version

# Check your API wallet balance
aptos account balance --account YOUR_API_WALLET_ADDRESS
```

**Note:** Petra wallet has a built-in faucet button for testnet/devnet, but you won't need it. The API wallet creation is gasless, and this project automatically funds your wallet via the Netna faucet.

#### 4. Automatic Wallet Funding

**Good news:** This project automatically funds your wallet!

The `npm run fund-wallet` script calls the Netna faucet to get 100 APT for gas fees. No manual faucet interaction needed!

**Optional - Manual check:**
```bash
# Check your current balance (requires Aptos CLI)
aptos account balance --account YOUR_API_WALLET_ADDRESS

# Or via curl
curl "https://api.netna.staging.aptoslabs.com/v1/accounts/YOUR_ADDRESS"
```

### Security Checklist ✅

Before proceeding, verify:
- [ ] Petra wallet installed and recovery phrase saved
- [ ] API wallet created via https://app.decibel.trade/api
- [ ] Private key copied and stored securely (NOT in code!)
- [ ] You understand API wallet ≠ Petra wallet (they're linked but different)
- [ ] Never commit or share your private key

**Understanding the Wallets:**
- **Petra Wallet** = Your main wallet (holds funds, connects to apps)
- **API Wallet** = Trading-only wallet (created from Petra, limited permissions)
- **Private Key** = Password for API wallet (needed for programmatic trading)

## Quick Start

### 1. Install Dependencies

```bash
cd testetna
npm install
```

This installs:
- `@aptos-labs/ts-sdk` - Aptos blockchain SDK
- `dotenv` - Environment variable management
- `ws` - WebSocket client
- TypeScript and type definitions

### 2. Configure Environment

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Then edit `.env` and add your **private key**:

```env
API_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

**Important values already configured:**
- `PACKAGE_ADDRESS` - Decibel smart contract address
- `API_WALLET_ADDRESS` - Your testenta wallet
- `FULLNODE_URL` - Aptos blockchain endpoint
- `REST_API_BASE_URL` - Decibel API endpoint
- `WEBSOCKET_URL` - Decibel WebSocket endpoint

### 3. Run the Workflow

**Option A: Quick Win (Recommended)**

Two-step process to get trading quickly:

```bash
# Step 1: Create subaccount and add to .env
npm run create-subaccount
# ⚠️ Copy the SUBACCOUNT_ADDRESS from output and add to your .env file!

# Step 2: Run the complete workflow
npm run quick-win
```

The `quick-win` script automatically runs:
- Fund wallet with APT (for gas fees)
- Verify setup and connection
- Mint 1000 USDC (test collateral)
- Deposit USDC to subaccount
- Place a test order

**Option B: Step-by-Step**

Execute scripts individually to understand each step:

```bash
# Step 0: Fund wallet from Netna faucet (if needed)
npm run fund-wallet

# Step 1: Verify setup and connection
npm run setup

# Step 2: Create a trading subaccount
npm run create-subaccount
# ⚠️ Copy the SUBACCOUNT_ADDRESS to your .env file!

# Step 2.5: Mint testnet USDC (1000 USDC - unrestricted on Netna)
npm run mint-usdc

# Step 3: Deposit USDC to subaccount
npm run deposit-usdc

# Step 4: Place your first order
npm run place-order
# ⚠️ Save the client_order_id shown!

# Step 5: Query order status
CLIENT_ORDER_ID="order-123..." npm run query-order

# Step 6: Watch live updates
npm run websocket
# Keep this running, place orders in another terminal
```

## Project Structure

```
testetna/
├── package.json              # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── .env.example             # Environment template
├── .env                     # Your credentials (git-ignored)
├── README.md                # This file
├── PROBLEMS.md              # Known issues and solutions
│
├── utils/                   # Utility modules
│   ├── config.ts           # Load and validate configuration
│   ├── client.ts           # Aptos client setup
│   └── formatting.ts       # Price/size formatting helpers
│
└── src/                     # Executable scripts
    ├── 0-fund-wallet.ts    # Fund wallet from Netna faucet
    ├── 1-setup.ts          # Test connection and check balance
    ├── 2-create-subaccount.ts        # Create trading subaccount
    ├── 2.5-mint-usdc.ts    # Mint testnet USDC
    ├── 3-deposit-usdc.ts   # Deposit USDC to subaccount
    ├── 4-place-order.ts    # Place first order
    ├── 5-query-order.ts    # Query order status
    └── 6-websocket-updates.ts        # Live WebSocket updates
```

## Understanding the Steps

### Why Each Step Matters:

1. **Setup (1-setup.ts)**
   - Verifies your configuration is correct
   - Checks APT balance (for gas fees)
   - Fetches available markets

2. **Create Subaccount (2-create-subaccount.ts)**
   - Subaccounts isolate trading from your main wallet
   - Required before placing any orders
   - Retrieved via API after creation

3. **Mint USDC (2.5-mint-usdc.ts)**
   - APT = gas fees (transaction costs)
   - USDC = trading collateral (margin)
   - You need BOTH! This gets you USDC.
   - **Netna staging:** Unrestricted mint (1000 USDC default)
   - Note: Official docs mention 250 limit with `restricted_mint`, but we use unrestricted `mint`

4. **Deposit USDC (3-deposit-usdc.ts)**
   - Moves USDC from main account to subaccount
   - Orders require collateral in the subaccount
   - **Critical:** Can't trade without this!

5. **Place Order (4-place-order.ts)**
   - Creates a limit order on the orderbook
   - Auto-formats price/size to market rules
   - Returns `client_order_id` for tracking

6. **Query Order (5-query-order.ts)**
   - Checks order status via REST API
   - Shows fills, remaining size, etc.

7. **WebSocket Updates (6-websocket-updates.ts)**
   - Real-time order updates as they happen
   - More efficient than polling

## Key Concepts

### APT vs USDC

- **APT**: Pays for blockchain transaction fees (gas)
  - Each transaction costs ~0.001 APT
  - Get from faucet or exchange

- **USDC**: Trading collateral (margin for positions)
  - Required to open positions
  - Get via `mint-usdc` script (testnet only)

### Price and Size Formatting

Blockchains use integers, not decimals. We handle this for you:

```typescript
// You specify:
price = 50000.50
size = 1.5

// We convert to:
chainPrice = 50000500000000  (with px_decimals)
chainSize = 1500000000        (with sz_decimals)
```

The formatting utilities in [`utils/formatting.ts`](utils/formatting.ts) handle:
- Rounding to valid tick sizes
- Rounding to valid lot sizes
- Converting to chain units
- Ensuring minimum size requirements

### Client Order ID

We use `client_order_id` instead of extracting `order_id` from transactions:

- **Why?** Easier to track (you set it yourself)
- **Format:** `order-${Date.now()}`
- **Usage:** Query orders via REST API or WebSocket

## Common Issues

See [`PROBLEMS.md`](PROBLEMS.md) for detailed troubleshooting.

### "Cannot find module" errors

**Solution:** Run `npm install`

These errors are expected before dependencies are installed.

### "API_WALLET_PRIVATE_KEY not set"

**Solution:** Add your private key to `.env`:

```env
API_WALLET_PRIVATE_KEY=0x...
```

### "SUBACCOUNT_ADDRESS not set"

**Solution:** 
1. Run `npm run create-subaccount`
2. Copy the address from output
3. Add to `.env`:

```env
SUBACCOUNT_ADDRESS=0x...
```

### "Insufficient USDC collateral"

**Solution:** Run these in order:
```bash
npm run mint-usdc       # Mint USDC
npm run deposit-usdc    # Deposit to subaccount
```

## Implementation Notes

This implementation includes several improvements discovered through testing and Java example analysis:

### Key Differences from Official Docs

1. **Netna Faucet Integration**
   - Discovered private faucet URL: `https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app`
   - Provides 100 APT for gas fees
   - Not documented in official Decibel docs

2. **Unrestricted USDC Minting**
   - Uses `usdc::mint` instead of `usdc::restricted_mint`
   - No 250 USDC limit on Netna staging
   - Better for testing with more collateral

3. **USDC Metadata Derivation**
   - Uses `createObjectAddress(packageAddr, "USDC")` from Aptos SDK
   - Matches Java example implementation
   - Critical for deposit transactions to work

4. **Market Naming**
   - Markets use format "BTC/USD" not "BTC-PERP"
   - Discovered through API testing
   - Important for order placement

See [`FIXES-FOR-DECIBEL-DOCS.md`](FIXES-FOR-DECIBEL-DOCS.md) for complete list of documentation improvements needed.

## Documentation References

This project implements workflows from official Decibel documentation:

- **Setup Guide:** [`beginner-setup-guide.md`](beginner-setup-guide.md)
- **Workflow Guide:** [`first-quick-win-guide.md`](first-quick-win-guide.md)
- **Quick Commands:** [`quick-start-commands.md`](quick-start-commands.md)
- **Java Example Analysis:** [`java-example.md`](java-example.md)

## Security Notes

⚠️ **Important Security Practices:**

- **Never commit `.env` to version control** (already in `.gitignore`)
- **Keep your private key secret** - never share it
- **This is testnet** - practice here before using real funds
- **API wallet has limited permissions** - can trade but not withdraw

## What's Next?

Once you've completed the workflow:

1. **Explore Advanced Orders**
   - Stop-loss orders
   - Take-profit orders
   - TWAP orders

2. **Build a Trading Bot**
   - Use WebSocket for live data
   - Implement strategies
   - Add risk management

3. **Monitor Positions**
   - Track P&L in real-time
   - Set up alerts
   - Build dashboards

## Getting Help

**Resources:**
- 📖 Official Docs: https://docs.decibel.trade
- 💬 Discord: Join the Decibel community
- 🐦 Twitter: @DecibelTrade

**When asking for help, include:**
1. What you're trying to do
2. Full error message
3. Transaction hash (if applicable)
4. Relevant code snippet
5. ❌ **Never share your private key!**

## License

Don't worry about it.

---

**Happy Trading! 🎉**

Built following official Decibel documentation with complete examples and error handling.