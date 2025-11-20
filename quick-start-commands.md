# Quick Start Commands - Copy & Paste Ready

All commands include documentation references. These are ready to run with your actual values.

---

## 📋 Prerequisites

Before running these commands, make sure you have:
- ✅ Package address: `0xb8a5788314451ce4d2fbbad32e1bad88d4184b73943b7fe5166eab93cf1a5a95`
- ✅ API wallet address: `0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2`
- ✅ Private key (keep secret!)
- ✅ APT for gas fees in your wallet

---

## 1️⃣ Get Available Markets

**Documentation:** [`openapi.json:748-771`](../etna/docs/api-reference/openapi.json:748)

**What it returns:** List of all markets with trading configuration (addresses, decimals, tick sizes)

### Basic Command
```bash
curl https://api.netna.aptoslabs.com/decibel/api/v1/markets
```

### Pretty Formatted (requires jq)
```bash
curl https://api.netna.aptoslabs.com/decibel/api/v1/markets | jq '.'
```

### Get Specific Market (e.g., BTC-PERP)
```bash
curl https://api.netna.aptoslabs.com/decibel/api/v1/markets | jq '.[] | select(.market_name == "BTC-PERP")'
```

### Extract Just Market Addresses
```bash
curl https://api.netna.aptoslabs.com/decibel/api/v1/markets | jq -r '.[] | "\(.market_name): \(.market_addr)"'
```

**Expected Output Fields:**
- `market_addr` - Use this when placing orders
- `market_name` - Human-readable name (e.g., "BTC-PERP")
- `px_decimals` - Price decimal precision (usually 9)
- `sz_decimals` - Size decimal precision (usually 9)
- `tick_size` - Minimum price increment
- `lot_size` - Minimum size increment
- `min_size` - Minimum order size
- `max_leverage` - Maximum allowed leverage

---

## 2️⃣ Check Your Subaccounts

**Documentation:** [`openapi.json:1095-1130`](../etna/docs/api-reference/openapi.json:1095)

**What it returns:** List of your trading subaccounts

### Get Your Subaccounts
```bash
curl "https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?owner=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2"
```

### Pretty Formatted
```bash
curl "https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?owner=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2" | jq '.'
```

### Extract Just Addresses
```bash
curl "https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?owner=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2" | jq -r '.[].subaccount_address'
```

**Expected Response:**
```json
[
  {
    "subaccount_address": "0x...",
    "primary_account_address": "0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2",
    "is_primary": true,
    "is_active": true,
    "custom_label": null
  }
]
```

---

## Phase 3.5: Mint Testnet USDC

**Documentation:** [`usdc.move:142`](../etna/move/perp/sources/test/usdc.move:142)

**What it does:** Mints testnet USDC for trading collateral (250 USDC limit per account)

### TypeScript/SDK Command
```typescript
import { Aptos, AptosConfig, Ed25519Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";

const PACKAGE = "0xb8a5788314451ce4d2fbbad32e1bad88d4184b73943b7fe5166eab93cf1a5a95";
const privateKey = "0x..."; // Your private key
const account = new Ed25519Account({
  privateKey: new Ed25519PrivateKey(privateKey),
});

const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: "https://api.netna.staging.aptoslabs.com/v1",
});
const aptos = new Aptos(aptosConfig);

// Mint 250 USDC (6 decimals)
const mintAmount = 250_000000;

const mintTx = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${PACKAGE}::usdc::restricted_mint`,
    typeArguments: [],
    functionArguments: [mintAmount],
  },
});

const signedTx = aptos.transaction.sign({ signer: account, transaction: mintTx });
const pendingTx = await aptos.transaction.submit.simple({
  transaction: mintTx,
  senderAuthenticator: signedTx,
});

await aptos.waitForTransaction({ transactionHash: pendingTx.hash });
console.log("✅ Minted 250 USDC");
```

**Key Points:**
- **Purpose:** USDC is your trading collateral (different from APT gas fees)
- **Limit:** 250 USDC maximum per account ([`usdc.move:37`](../etna/move/perp/sources/test/usdc.move:37))
- **Format:** 6 decimals (250 USDC = 250_000000)
- **Testnet only:** Production uses real USDC

---

## Phase 4: Deposit USDC to Subaccount

**Documentation:** [`deposit.mdx:10`](../etna/docs/transactions/account-management/deposit.mdx:10)

**What it does:** Deposits USDC to your subaccount for use as trading collateral

### TypeScript/SDK Command
```typescript
import { Aptos, AptosConfig, Ed25519Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";

const PACKAGE = "0xb8a5788314451ce4d2fbbad32e1bad88d4184b73943b7fe5166eab93cf1a5a95";
const privateKey = "0x..."; // Your private key
const subaccountAddr = "0x..."; // From Phase 3

const account = new Ed25519Account({
  privateKey: new Ed25519PrivateKey(privateKey),
});

const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: "https://api.netna.staging.aptoslabs.com/v1",
});
const aptos = new Aptos(aptosConfig);

// Get USDC metadata address (this is a view function call)
// Reference: etna/move/perp/sources/test/usdc.move:126
const usdcMetadataAddr = `${PACKAGE}::usdc::metadata()`;

// Deposit 200 USDC (keeping 50 USDC for other uses)
const depositAmount = 200_000000;

const depositTx = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${PACKAGE}::dex_accounts::deposit_to_subaccount_at`,
    typeArguments: [],
    functionArguments: [
      subaccountAddr,    // subaccount_address
      usdcMetadataAddr,  // asset_metadata (USDC)
      depositAmount,     // amount in smallest units
    ],
  },
});

const signedTx = aptos.transaction.sign({ signer: account, transaction: depositTx });
const pendingTx = await aptos.transaction.submit.simple({
  transaction: depositTx,
  senderAuthenticator: signedTx,
});

await aptos.waitForTransaction({ transactionHash: pendingTx.hash });
console.log("✅ Deposited 200 USDC to subaccount");
```

### Verify Deposit
```bash
# Check subaccount balance via API
curl "https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?owner=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2" | jq
```

**Key Points:**
- **Critical:** You CANNOT place orders without USDC in subaccount ([`deposit.mdx:36`](../etna/docs/transactions/account-management/deposit.mdx:36))
- **Parameters:**
  - `subaccount_address` - Your subaccount from Phase 3
  - `asset_metadata` - USDC metadata object address
  - `amount` - Amount in smallest units (6 decimals)
- **Documentation:** Full details at [`deposit.mdx:32-37`](../etna/docs/transactions/account-management/deposit.mdx:32)

---

## 3️⃣ Query Order Status

**Documentation:** [`openapi.json:866-1001`](../etna/docs/api-reference/openapi.json:866)

**What it returns:** Detailed order information including status and fill details

### By Client Order ID (Recommended)
```bash
curl "https://api.netna.aptoslabs.com/decibel/api/v1/orders?\
market_address=MARKET_ADDRESS_HERE&\
user_address=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2&\
client_order_id=YOUR_CLIENT_ORDER_ID"
```

### By Order ID
```bash
curl "https://api.netna.aptoslabs.com/decibel/api/v1/orders?\
market_address=MARKET_ADDRESS_HERE&\
user_address=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2&\
order_id=ORDER_ID_HERE"
```

**Expected Response:**
```json
{
  "status": "Filled",
  "details": "",
  "order": {
    "market": "0x...",
    "client_order_id": "your-order-id",
    "order_id": "12345",
    "status": "Filled",
    "order_type": "Limit",
    "orig_size": 1.0,
    "remaining_size": 0.0,
    "price": 50000.0,
    "is_buy": true,
    "unix_ms": 1699564800000
  }
}
```

---

## 4️⃣ Get Your Open Orders

**Documentation:** [`openapi.json:773-821`](../etna/docs/api-reference/openapi.json:773)

```bash
curl "https://api.netna.aptoslabs.com/decibel/api/v1/open_orders?\
user=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2&\
limit=100"
```

---

## 5️⃣ Get Your Positions

**Documentation:** [`openapi.json:1367-1435`](../etna/docs/api-reference/openapi.json:1367)

```bash
curl "https://api.netna.aptoslabs.com/decibel/api/v1/user_positions?\
user=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2&\
limit=100"
```

### Filter by Specific Market
```bash
curl "https://api.netna.aptoslabs.com/decibel/api/v1/user_positions?\
user=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2&\
market_address=MARKET_ADDRESS_HERE"
```

---

## 6️⃣ WebSocket Connection Testing

**Documentation:** [`asyncapi.json:12-17`](../etna/docs/api-reference/asyncapi.json:12)

### Using wscat (Install: `npm install -g wscat`)

#### Connect to WebSocket
```bash
wscat -c wss://api.netna.aptoslabs.com/decibel/ws
```

#### Subscribe to Your Order Updates
Once connected, send this JSON message:
```json
{"Subscribe":{"topic":"order_updates:0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2"}}
```

**Documentation:** [`asyncapi.json:1310-1320`](../etna/docs/api-reference/asyncapi.json:1310)

#### Subscribe to All Market Prices
```json
{"Subscribe":{"topic":"all_market_prices"}}
```

**Documentation:** [`asyncapi.json:155-162`](../etna/docs/api-reference/asyncapi.json:155)

### Using curl (One-shot test)
```bash
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     --header "Host: api.netna.aptoslabs.com" \
     --header "Origin: https://api.netna.aptoslabs.com" \
     --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
     --header "Sec-WebSocket-Version: 13" \
     wss://api.netna.aptoslabs.com/decibel/ws
```

---

## 7️⃣ TypeScript/Node.js Setup Commands

**Documentation:** [`installation.mdx:8-18`](../etna/docs/typescript-sdk/installation.mdx:8)

### Create New Project
```bash
mkdir my-decibel-trader
cd my-decibel-trader
npm init -y
```

### Install Decibel SDK (Recommended)
```bash
npm install @decibel/sdk @aptos-labs/ts-sdk zod
npm install -D @types/ws typescript ts-node
```

### Install Basic Aptos SDK (Alternative)
```bash
npm install @aptos-labs/ts-sdk dotenv
npm install -D typescript ts-node @types/node
```

### Initialize TypeScript
```bash
npx tsc --init
```

### Create .env file
```bash
cp .env.example .env
# Then edit .env with your actual values
```

---

## 8️⃣ Verify Your Setup

### Check APT Balance (via fullnode)
```bash
curl -X POST https://api.netna.staging.aptoslabs.com/v1 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getAccountResource",
    "params": [
      "0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2",
      "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    ],
    "id": 1
  }'
```

### Test REST API Connectivity
```bash
curl -I https://api.netna.aptoslabs.com/decibel/api/v1/markets
```

**Expected:** HTTP 200 OK

### Test WebSocket Connectivity
```bash
curl -I wss://api.netna.aptoslabs.com/decibel/ws
```

---

## 9️⃣ Price/Size Formatting Examples

**Documentation:** [`formatting-prices-sizes.mdx:259-315`](../etna/docs/transactions/overview/formatting-prices-sizes.mdx:259)

### Example Market Config
```json
{
  "market_name": "BTC-PERP",
  "px_decimals": 9,
  "sz_decimals": 9,
  "tick_size": 1000000,
  "lot_size": 100000000,
  "min_size": 1000000000
}
```

### Calculating Chain Units (TypeScript)
```typescript
// User wants to buy 1.5 BTC at $50,000.50

// Step 1: Round to valid tick size
const userPrice = 50000.50;
const tickSizeDecimal = 1000000 / (10 ** 9); // 0.001
const roundedPrice = Math.round(userPrice / tickSizeDecimal) * tickSizeDecimal;
// Result: 50000.500

// Step 2: Convert to chain units
const chainPrice = Math.floor(roundedPrice * (10 ** 9));
// Result: 50000500000000

// Step 3: Round size to valid lot size
const userSize = 1.5;
const lotSizeDecimal = 100000000 / (10 ** 9); // 0.1
const roundedSize = Math.round(userSize / lotSizeDecimal) * lotSizeDecimal;
// Result: 1.5

// Step 4: Convert to chain units
const chainSize = Math.floor(roundedSize * (10 ** 9));
// Result: 1500000000
```

---

## 🔟 Common Error Checks

### If Markets API Returns Empty
```bash
# Check if API is accessible
curl -v https://api.netna.aptoslabs.com/decibel/api/v1/markets

# Check for network issues
ping api.netna.aptoslabs.com
```

### If Subaccounts Not Found
```bash
# Verify your wallet address is correct
echo "Your wallet: 0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2"

# Try without query parameter
curl https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts
```

### If WebSocket Won't Connect
```bash
# Test with verbose output
wscat -c wss://api.netna.aptoslabs.com/decibel/ws --verbose

# Check firewall/proxy settings
```

---

## 💡 Pro Tips

### Save API Responses for Reference
```bash
# Markets
curl https://api.netna.aptoslabs.com/decibel/api/v1/markets > markets.json

# Your subaccounts
curl "https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?owner=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2" > subaccounts.json
```

### Create Shell Aliases
```bash
# Add to ~/.bashrc or ~/.zshrc
alias deci-markets='curl https://api.netna.aptoslabs.com/decibel/api/v1/markets | jq'
alias deci-subs='curl "https://api.netna.aptoslabs.com/decibel/api/v1/subaccounts?owner=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2" | jq'
```

### Watch for Order Updates (Live)
```bash
# Install websocat: brew install websocat
echo '{"Subscribe":{"topic":"order_updates:0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2"}}' | \
  websocat wss://api.netna.aptoslabs.com/decibel/ws
```

---

## 📚 Documentation Quick Reference

- **OpenAPI Spec:** [`etna/docs/api-reference/openapi.json`](../etna/docs/api-reference/openapi.json)
- **AsyncAPI Spec:** [`etna/docs/api-reference/asyncapi.json`](../etna/docs/api-reference/asyncapi.json)
- **Quickstart Guide:** [`etna/docs/quickstart/placing-your-first-order.mdx`](../etna/docs/quickstart/placing-your-first-order.mdx)
- **Price Formatting:** [`etna/docs/transactions/overview/formatting-prices-sizes.mdx`](../etna/docs/transactions/overview/formatting-prices-sizes.mdx)
- **TypeScript SDK:** [`etna/docs/typescript-sdk/installation.mdx`](../etna/docs/typescript-sdk/installation.mdx)

---

**All commands are ready to copy and paste!** Just replace placeholder values (MARKET_ADDRESS_HERE, etc.) with actual values from Step 1.