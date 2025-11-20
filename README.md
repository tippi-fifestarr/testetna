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

Before you start, you need:

- [x] **Node.js 18+** installed
- [x] **API wallet** created at https://app.decibel.trade/api
- [x] **Private key** for your API wallet (keep secret!)
- [x] **Testnet APT** for gas fees (get from faucet)

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

Execute scripts in order:

```bash
# Step 1: Verify setup and connection
npm run setup

# Step 2: Create a trading subaccount
npm run create-subaccount
# ⚠️ Copy the SUBACCOUNT_ADDRESS to your .env file!

# Step 2.5: Mint testnet USDC (250 max)
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
   - Testnet limit: 250 USDC

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

## Documentation References

This project implements workflows from official Decibel documentation:

- **Setup Guide:** [`beginner-setup-guide.md`](beginner-setup-guide.md)
- **Workflow Guide:** [`first-quick-win-guide.md`](first-quick-win-guide.md)
- **Quick Commands:** [`quick-start-commands.md`](quick-start-commands.md)
- **Address Guide:** [`understanding-addresses.md`](understanding-addresses.md)

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

MIT

---

**Happy Trading! 🎉**

Built following official Decibel documentation with complete examples and error handling.