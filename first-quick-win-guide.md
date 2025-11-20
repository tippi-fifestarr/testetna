# Decibel "First Quick Win" Workflow Guide

**Goal:** Place an order, query its status via REST API, and receive real-time updates via WebSocket

**Last Updated:** 2025-11-19

---

## Table of Contents
1. [Prerequisites & Setup](#prerequisites--setup)
2. [Step 1: Placing an Order](#step-1-placing-an-order)
3. [Step 2: Querying Order Status via REST API](#step-2-querying-order-status-via-rest-api)
4. [Step 3: Getting Order Updates via WebSocket](#step-3-getting-order-updates-via-websocket)
5. [Complete Example Workflow](#complete-example-workflow)
6. [Documentation Gaps & Unknowns](#documentation-gaps--unknowns)

---

## Prerequisites & Setup

### What IS Documented ✅

**API Key Generation:**
- **Location:** [`placing-your-first-order.mdx:13-14`](etna/docs/quickstart/placing-your-first-order.mdx:13)
- **URL:** https://app.decibel.trade/api
- **Process:** Visit the URL, connect wallet, click "Create API Wallet"

**Private Key Requirements:**
- **Location:** [`placing-your-first-order.mdx:15`](etna/docs/quickstart/placing-your-first-order.mdx:15)
- Private key needed for signing transactions
- Security warning: Never expose in client-side code or version control

**Gas Fees:**
- **Location:** [`authenticated-requests.mdx:35-38`](etna/docs/quickstart/authenticated-requests.mdx:35)
- Requires APT in account for transaction gas fees
- Transaction fails without sufficient balance

**USDC Collateral:**
- **Location:** [`deposit.mdx:36`](etna/docs/transactions/account-management/deposit.mdx:36)
- USDC required as trading collateral (margin) for positions
- Must be deposited to subaccount before placing orders
- Mint testnet USDC via [`restricted_mint`](etna/move/perp/sources/test/usdc.move:142) (250 USDC limit per account)
- Deposit via [`deposit_to_subaccount_at`](etna/docs/transactions/account-management/deposit.mdx:10)

**Base URLs:**
- **REST API:** `https://api.netna.aptoslabs.com/decibel` ([`api-reference.mdx:37`](etna/docs/quickstart/api-reference.mdx:37))
- **WebSocket:** `wss://api.netna.aptoslabs.com/decibel` ([`api-reference.mdx:39`](etna/docs/quickstart/api-reference.mdx:39))
- **Fullnode URL:** `https://api.netna.staging.aptoslabs.com/v1` ([`placing-your-first-order.mdx:34`](etna/docs/quickstart/placing-your-first-order.mdx:34))

**Package Address:**
- **Location:** [`placing-your-first-order.mdx:33`](etna/docs/quickstart/placing-your-first-order.mdx:33)
- Shown as `{package}` placeholder in examples

### What is UNKNOWN ❓

1. **API Key Usage:** How is the API key from app.decibel.trade/api actually used? The docs mention generating it but never show where to include it in requests

2. **Authentication Method:** The "authenticated requests" section describes transaction signing but doesn't mention HTTP authentication headers

3. **Package Address Value:** The actual package address value is shown as `{package}` placeholder - not the real address

### What is NOT FOUND IN DOCS ⚠️

1. **API Key Integration:** Where/how to use the generated API key
3. **Rate Limits:** No mention of API rate limits
4. **Error Handling:** No comprehensive error code documentation
5. **Network Selection:** Unclear if this is testnet, devnet, or mainnet

### In-Between Steps Not Explicitly Documented 💡

1. **CRITICAL STEP: Getting USDC Collateral**
   - Must mint testnet USDC before trading
   - Function: [`{package}::usdc::restricted_mint`](etna/move/perp/sources/test/usdc.move:142)
   - Limit: 250 USDC per account ([`usdc.move:37`](etna/move/perp/sources/test/usdc.move:37))

2. Need to create a subaccount before placing orders (mentioned in warning at [`placing-your-first-order.mdx:178-182`](etna/docs/quickstart/placing-your-first-order.mdx:178))

3. **CRITICAL STEP: Depositing USDC to Subaccount**
   - Must deposit USDC to subaccount before placing orders
   - Function: [`{package}::dex_accounts::deposit_to_subaccount_at`](etna/docs/transactions/account-management/deposit.mdx:10)
   - Required for margin/collateral ([`deposit.mdx:36`](etna/docs/transactions/account-management/deposit.mdx:36))

4. Need to get market address from `/v1/markets` endpoint before placing order

---

## Step 1: Placing an Order

### What IS Documented ✅

**Transaction Function:**
- **Location:** [`place-order.mdx:9-11`](etna/docs/transactions/order-management/place-order.mdx:9)
- **Function:** `{package}::dex_accounts::place_order_to_subaccount`
- **Entry Point:** `is_entry: true` - can be called directly

**Required Parameters:**
- **Location:** [`place-order.mdx:44-61`](etna/docs/transactions/order-management/place-order.mdx:44)
- `signer` - The account signer
- `subaccount` - The subaccount object address
- `market` - The PerpMarket object address
- `price` - Order price (u64, with decimal precision)
- `size` - Order size (u64, with decimal precision)
- `is_buy` - True for buy, false for sell
- `time_in_force` - 0=GoodTillCanceled, 1=PostOnly, 2=ImmediateOrCancel
- `is_reduce_only` - Whether order can only reduce position size

**Optional Parameters:**
- `client_order_id` - Client-assigned order ID (Option<String>)
- `stop_price` - Optional stop price (Option<u64>)
- `tp_trigger_price` - Take-profit trigger price (Option<u64>)
- `tp_limit_price` - Take-profit limit price (Option<u64>)
- `sl_trigger_price` - Stop-loss trigger price (Option<u64>)
- `sl_limit_price` - Stop-loss limit price (Option<u64>)
- `builder_addr` - Builder/referrer address (Option<address>)
- `builder_fee` - Builder fee in basis points (Option<u64>)

**Transaction Building Process:**
- **Location:** [`placing-your-first-order.mdx:52-75`](etna/docs/quickstart/placing-your-first-order.mdx:52)
- Uses Aptos SDK: `@aptos-labs/ts-sdk` (TypeScript) or `aptos-sdk` (Python)
- Process:
  1. Create account from private key
  2. Initialize Aptos client with network config
  3. Build transaction with `aptos.transaction.build.simple()`
  4. Sign transaction with `aptos.transaction.sign()`
  5. Submit transaction with `aptos.transaction.submit.simple()`
  6. Wait for confirmation with `aptos.waitForTransaction()`

**Price/Size Formatting:**
- **Location:** [`formatting-prices-sizes.mdx`](etna/docs/transactions/overview/formatting-prices-sizes.mdx)
- Prices and sizes use decimal precision
- Must be rounded to tick_size and lot_size multiples
- Market configuration provides: `px_decimals`, `sz_decimals`, `tick_size`, `lot_size`, `min_size`

**Example Code:**
- **TypeScript:** [`placing-your-first-order.mdx:23-96`](etna/docs/quickstart/placing-your-first-order.mdx:23)
- **Python:** [`placing-your-first-order.mdx:99-154`](etna/docs/quickstart/placing-your-first-order.mdx:99)

### What is UNKNOWN ❓

1. **Transaction Hash Extraction:** How to extract the order ID from the transaction response
2. **Event Parsing:** How to parse transaction events to get order details
3. **Order ID Format:** What format is the order_id (string, number, etc.)
4. **Transaction Timing:** Average confirmation time for orders

### What is NOT FOUND IN DOCS ⚠️

1. **Order ID Retrieval:** How to get the order_id after placing the order (needed for Step 2)
2. **Transaction Event Structure:** What events are emitted when placing an order
3. **Client Order ID Format:** Any restrictions on client_order_id format
4. **Error Responses:** What errors can occur during order placement (on-chain)
5. **Gas Cost Estimates:** Typical gas costs for order placement

### In-Between Steps Not Explicitly Documented 💡

**CRITICAL STEP: Creating a Subaccount**
- **Location:** [`create-subaccount.mdx`](etna/docs/transactions/account-management/create-subaccount.mdx)
- **Function:** `{package}::dex_accounts::create_new_subaccount`
- **Process:**
  ```typescript
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${PACKAGE}::dex_accounts::create_new_subaccount`,
      typeArguments: [],
      functionArguments: [],
    },
  });
  ```
- **✅ SOLUTION: Getting the subaccount address after creation**
  - After the transaction confirms, call the API endpoint: `GET /api/v1/subaccounts?owner=YOUR_ADDRESS`
  - **Documentation:** [`openapi.json:1095-1130`](etna/docs/api-reference/openapi.json:1095)
  - Returns array of subaccounts with their addresses
  - Your newly created subaccount will be the latest in the list

**CRITICAL STEP: Getting Market Configuration**
- Need to call `/api/v1/markets` to get:
  - `market_addr` - Required for order placement
  - `px_decimals`, `sz_decimals` - Required for price/size formatting
  - `tick_size`, `lot_size`, `min_size` - Required for validation
- **Location:** [`openapi.json:748-771`](etna/docs/api-reference/openapi.json:748)

**CRITICAL STEP: Formatting Price and Size**
- Must convert decimal values to chain units BEFORE submitting transaction
- **Location:** [`formatting-prices-sizes.mdx:259-315`](etna/docs/transactions/overview/formatting-prices-sizes.mdx:259)
- Process:
  1. Round price to valid tick size
  2. Round size to valid lot size
  3. Convert to chain units (multiply by 10^decimals)

**Example Market Config to Order Flow:**
```typescript
// 1. Get market config
const markets = await fetch('https://api.netna.aptoslabs.com/decibel/api/v1/markets').then(r => r.json());
const market = markets.find(m => m.market_name === 'BTC-PERP');

// 2. Format price and size
const userPrice = 50000.5;
const userSize = 1.5;
const roundedPrice = roundToValidPrice(userPrice, market); // Uses tick_size
const roundedSize = roundToValidOrderSize(userSize, market); // Uses lot_size, min_size
const chainPrice = roundedPrice * (10 ** market.px_decimals);
const chainSize = roundedSize * (10 ** market.sz_decimals);

// 3. Place order with formatted values
// ... transaction code ...
```

---

## Step 2: Querying Order Status via REST API

### What IS Documented ✅

**Get Single Order Endpoint:**
- **Location:** [`openapi.json:866-1001`](etna/docs/api-reference/openapi.json:866)
- **Endpoint:** `GET /api/v1/orders`
- **Base URL:** `https://api.netna.aptoslabs.com/decibel`

**Query Parameters:**
- `market_address` (required) - Market address (string)
- `user_address` (required) - User account address (string)
- `order_id` (optional) - Order ID (provide either this OR client_order_id)
- `client_order_id` (optional) - Client order ID (provide either this OR order_id)

**Response Schema:**
- **Location:** [`openapi.json:922-997`](etna/docs/api-reference/openapi.json:922)
- Returns `OrderUpdate` object containing:
  - `status` - Order status string
  - `details` - Additional details string
  - `order` - Full `OrderDto` object

**OrderDto Fields:**
- **Location:** [`openapi.json:2216-2349`](etna/docs/api-reference/openapi.json:2216)
- `parent` - Parent order address
- `market` - Market address
- `client_order_id` - Client order ID
- `order_id` - System order ID
- `status` - Order status
- `order_type` - Order type (Limit, Market, etc.)
- `trigger_condition` - Trigger condition
- `order_direction` - Direction (Open Long, Close Short, etc.)
- `orig_size` - Original size
- `remaining_size` - Remaining unfilled size
- `price` - Order price
- `is_buy` - Boolean buy flag
- `is_reduce_only` - Reduce only flag
- `details` - Additional details
- `transaction_version` - Transaction version
- `unix_ms` - Timestamp in milliseconds

**Response Examples:**
- **Location:** [`openapi.json:924-996`](etna/docs/api-reference/openapi.json:924)
- Cancelled order example
- Filled order example
- NotFound example

**Example Request:**
```bash
curl -X GET "https://api.netna.aptoslabs.com/decibel/api/v1/orders?market_address=0xmarket123...&user_address=0x123...&order_id=12345"
```

### What is UNKNOWN ❓

1. **Order ID from Transaction:** How to extract order_id from the transaction response in Step 1
2. **Authentication Required?:** Does this endpoint require authentication headers?
3. **Response Time:** How quickly is the order available after transaction confirmation?

### What is NOT FOUND IN DOCS ⚠️

1. **Order State Transitions:** Complete list of possible order status values
2. **Polling Frequency:** Recommended polling frequency for order status
3. **Authentication Headers:** Whether API key or other auth is needed
4. **Error Responses:** HTTP error codes and their meanings for this endpoint

### In-Between Steps Not Explicitly Documented 💡

**Getting Order ID from Transaction:**
The docs show placing an order returns a transaction hash but don't show how to:
1. Parse transaction events to extract the order_id
2. Alternative: Use client_order_id set during placement to query instead

**Suggested Flow:**
```typescript
// Option 1: Extract from transaction events (NOT DOCUMENTED)
const executedTx = await aptos.waitForTransaction({ transactionHash: pendingTransaction.hash });
// UNKNOWN: How to parse events to get order_id

// Option 2: Use client_order_id (RECOMMENDED WORKAROUND)
const clientOrderId = `my-order-${Date.now()}`;
// Include in place_order_to_subaccount call
// Then query with:
const response = await fetch(
  `https://api.netna.aptoslabs.com/decibel/api/v1/orders?` +
  `market_address=${marketAddr}&` +
  `user_address=${userAddr}&` +
  `client_order_id=${clientOrderId}`
);
```

---

## Step 3: Getting Order Updates via WebSocket

### What IS Documented ✅

**WebSocket Server:**
- **Location:** [`asyncapi.json:12-17`](etna/docs/api-reference/asyncapi.json:12)
- **URL:** `wss://api.netna.aptoslabs.com/decibel/ws`
- **Protocol:** WebSocket (ws)

**Order Update Channel:**
- **Location:** [`asyncapi.json:99-112`](etna/docs/api-reference/asyncapi.json:99)
- **Channel:** `order_updates:{userAddr}`
- **Description:** Order update for a specific user

**Subscribe Message Format:**
- **Location:** [`asyncapi.json:1310-1320`](etna/docs/api-reference/asyncapi.json:1310)
- Send JSON message:
  ```json
  {
    "Subscribe": {
      "topic": "order_updates:0x123..."
    }
  }
  ```

**Alternative WebSocket Example:**
- **Location:** [`api-reference.mdx:52-66`](etna/docs/quickstart/api-reference.mdx:52)
- Shows subscribing to `all_market_prices` topic
- Connection and message handling example

**Order Update Message Schema:**
- **Location:** [`asyncapi.json:489-531`](etna/docs/api-reference/asyncapi.json:489)
- **Message Type:** `OrderUpdateMessage`
- **Payload:** `OrderUpdateResponse`
  - `topic` - The topic string
  - `order` - Full `OrderUpdate` object (same as REST API response)

**Order Update Example:**
- **Location:** [`asyncapi.json:498-530`](etna/docs/api-reference/asyncapi.json:498)
```json
{
  "topic": "order_updates:0x1234...",
  "order": {
    "status": "Filled",
    "details": "",
    "order": {
      "parent": "0x00...",
      "market": "0xabcdef...",
      "client_order_id": "historical_order_456",
      "order_id": "45679",
      "status": "Filled",
      "order_type": "Market",
      "orig_size": 2.0,
      "remaining_size": 0.0,
      "price": 49500.0,
      "is_buy": false,
      "transaction_version": 12345680,
      "unix_ms": 1699565000000
    }
  }
}
```

**Subscribe Response:**
- **Location:** [`asyncapi.json:1768-1783`](etna/docs/api-reference/asyncapi.json:1768)
- Server responds with:
  ```json
  {
    "success": true/false,
    "message": "Human-readable message"
  }
  ```

### What is UNKNOWN ❓

1. **Authentication:** Does WebSocket connection require authentication?
2. **Connection Lifecycle:** How to handle reconnection?
3. **Heartbeat/Ping:** Is there a keep-alive mechanism?
4. **Order History:** Does the channel send historical orders on subscription or only new updates?

### What is NOT FOUND IN DOCS ⚠️

1. **Connection Authentication:** No mention of auth tokens, headers, or query params for WS connection
2. **Error Handling:** WebSocket error codes and handling
3. **Unsubscribe Process:** How to properly unsubscribe from a topic
4. **Connection Limits:** Max connections per user/IP
5. **Message Rate:** How frequently updates are sent
6. **Reconnection Strategy:** Best practices for handling disconnections

### In-Between Steps Not Explicitly Documented 💡

**Complete WebSocket Flow:**
```javascript
// 1. Establish connection (DOCUMENTED)
const ws = new WebSocket("wss://api.netna.aptoslabs.com/decibel/ws");

// 2. Wait for connection (NOT EXPLICITLY DOCUMENTED)
ws.onopen = () => {
  console.log("Connected");
  
  // 3. Subscribe to order updates (DOCUMENTED)
  ws.send(JSON.stringify({
    Subscribe: {
      topic: `order_updates:${userAddress}`
    }
  }));
};

// 4. Handle subscription response (SCHEMA DOCUMENTED, FLOW NOT)
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // First message is subscription confirmation
  if (data.success !== undefined) {
    console.log("Subscription:", data.message);
    return;
  }
  
  // Subsequent messages are order updates
  if (data.topic && data.topic.startsWith('order_updates:')) {
    console.log("Order Update:", data.order);
  }
};

// 5. Error handling (NOT DOCUMENTED)
ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

// 6. Reconnection (NOT DOCUMENTED)
ws.onclose = () => {
  console.log("Connection closed");
  // Reconnection strategy?
};
```

---

## Complete Example Workflow

### Documented Workflow (Combining All Steps)

```typescript
import { Aptos, AptosConfig, Ed25519Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";

// Configuration
const PACKAGE = "{package}"; // UNKNOWN: Actual value
const FULLNODE_URL = "https://api.netna.staging.aptoslabs.com/v1";
const API_BASE = "https://api.netna.aptoslabs.com/decibel";
const WS_URL = "wss://api.netna.aptoslabs.com/decibel/ws";

// Setup
const privateKey = "0x...";
const account = new Ed25519Account({
  privateKey: new Ed25519PrivateKey(privateKey),
});

const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: FULLNODE_URL,
});
const aptos = new Aptos(aptosConfig);

// ========================================
// STEP 0.25: Mint Testnet USDC (REQUIRED)
// ========================================
// Reference: etna/move/perp/sources/test/usdc.move:142
const mintAmount = 250_000000; // 250 USDC (6 decimals)

const mintTx = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${PACKAGE}::usdc::restricted_mint`,
    typeArguments: [],
    functionArguments: [mintAmount],
  },
});

const mintAuth = aptos.transaction.sign({
  signer: account,
  transaction: mintTx,
});

const mintPending = await aptos.transaction.submit.simple({
  transaction: mintTx,
  senderAuthenticator: mintAuth,
});

await aptos.waitForTransaction({ transactionHash: mintPending.hash });
console.log("✅ Minted 250 USDC for trading collateral");

// ========================================
// STEP 0.5: Create Subaccount (REQUIRED)
// ========================================
const createSubaccountTx = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${PACKAGE}::dex_accounts::create_new_subaccount`,
    typeArguments: [],
    functionArguments: [],
  },
});

const subaccountAuth = aptos.transaction.sign({
  signer: account,
  transaction: createSubaccountTx,
});

const subaccountPending = await aptos.transaction.submit.simple({
  transaction: createSubaccountTx,
  senderAuthenticator: subaccountAuth,
});

await aptos.waitForTransaction({ transactionHash: subaccountPending.hash });

// ✅ Get subaccount address via API (the documented way)
const subaccountsResponse = await fetch(
  `${API_BASE}/api/v1/subaccounts?owner=${account.accountAddress.toString()}`
);
const subaccounts = await subaccountsResponse.json();
const subaccountAddr = subaccounts[0].subaccount_address; // Your newly created subaccount

// ========================================
// STEP 0.75: Deposit USDC to Subaccount (REQUIRED)
// ========================================
// Reference: etna/docs/transactions/account-management/deposit.mdx:10

// First, get USDC metadata address
// Reference: etna/move/perp/sources/test/usdc.move:126
const usdcMetadataAddr = `${PACKAGE}::usdc::metadata()`; // This returns the metadata object address

const depositAmount = 200_000000; // Deposit 200 USDC (keep 50 for later)

const depositTx = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${PACKAGE}::dex_accounts::deposit_to_subaccount_at`,
    typeArguments: [],
    functionArguments: [
      subaccountAddr,       // subaccount_address
      usdcMetadataAddr,     // asset_metadata (USDC)
      depositAmount,        // amount in smallest units
    ],
  },
});

const depositAuth = aptos.transaction.sign({
  signer: account,
  transaction: depositTx,
});

const depositPending = await aptos.transaction.submit.simple({
  transaction: depositTx,
  senderAuthenticator: depositAuth,
});

await aptos.waitForTransaction({ transactionHash: depositPending.hash });
console.log("✅ Deposited 200 USDC to subaccount as collateral");

// ========================================
// STEP 1: Get Market Configuration (REQUIRED)
// ========================================
const marketsResponse = await fetch(`${API_BASE}/api/v1/markets`);
const markets = await marketsResponse.json();
const market = markets.find(m => m.market_name === 'BTC-PERP');

// Format price and size
function roundToValidPrice(price: number, market: any): number {
  if (price === 0) return 0;
  const denormalizedPrice = price * (10 ** market.px_decimals);
  const roundedPrice = Math.round(denormalizedPrice / market.tick_size) * market.tick_size;
  return Math.round(roundedPrice) / (10 ** market.px_decimals);
}

function roundToValidOrderSize(size: number, market: any): number {
  if (size === 0) return 0;
  const normalizedMinSize = market.min_size / (10 ** market.sz_decimals);
  if (size < normalizedMinSize) return normalizedMinSize;
  const denormalizedSize = size * (10 ** market.sz_decimals);
  const roundedSize = Math.round(denormalizedSize / market.lot_size) * market.lot_size;
  return Math.round(roundedSize) / (10 ** market.sz_decimals);
}

const userPrice = 50000.5;
const userSize = 1.5;
const formattedPrice = roundToValidPrice(userPrice, market);
const formattedSize = roundToValidOrderSize(userSize, market);
const chainPrice = Math.floor(formattedPrice * (10 ** market.px_decimals));
const chainSize = Math.floor(formattedSize * (10 ** market.sz_decimals));

// ========================================
// STEP 2: Place Order
// ========================================
const clientOrderId = `order-${Date.now()}`; // Generate unique ID

const orderTx = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${PACKAGE}::dex_accounts::place_order_to_subaccount`,
    typeArguments: [],
    functionArguments: [
      subaccountAddr,
      market.market_addr,
      chainPrice,
      chainSize,
      true, // is_buy
      0, // time_in_force (GoodTillCanceled)
      false, // is_reduce_only
      clientOrderId, // client_order_id
      null, // stop_price
      null, // tp_trigger_price
      null, // tp_limit_price
      null, // sl_trigger_price
      null, // sl_limit_price
      null, // builder_addr
      null, // builder_fee
    ],
  },
});

const orderAuth = aptos.transaction.sign({
  signer: account,
  transaction: orderTx,
});

const orderPending = await aptos.transaction.submit.simple({
  transaction: orderTx,
  senderAuthenticator: orderAuth,
});

const executedTx = await aptos.waitForTransaction({
  transactionHash: orderPending.hash,
});

console.log("Order placed! Transaction:", executedTx.hash);

// UNKNOWN: How to extract order_id from transaction events
// Using client_order_id as workaround

// ========================================
// STEP 3: Query Order Status via REST API
// ========================================
const orderStatusUrl = new URL(`${API_BASE}/api/v1/orders`);
orderStatusUrl.searchParams.append('market_address', market.market_addr);
orderStatusUrl.searchParams.append('user_address', account.accountAddress.toString());
orderStatusUrl.searchParams.append('client_order_id', clientOrderId);

const orderStatusResponse = await fetch(orderStatusUrl.toString());
const orderStatus = await orderStatusResponse.json();

console.log("Order Status:", orderStatus);

// ========================================
// STEP 4: Real-time Updates via WebSocket
// ========================================
const ws = new WebSocket(WS_URL);

ws.onopen = () => {
  console.log("WebSocket connected");
  
  // Subscribe to order updates
  ws.send(JSON.stringify({
    Subscribe: {
      topic: `order_updates:${account.accountAddress.toString()}`
    }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Subscription confirmation
  if (data.success !== undefined) {
    console.log("Subscription:", data.message);
    return;
  }
  
  // Order update
  if (data.topic?.startsWith('order_updates:')) {
    console.log("Real-time Order Update:", data.order);
    
    // Check if it's our order
    if (data.order.order.client_order_id === clientOrderId) {
      console.log("Our order updated:", data.order.status);
      
      if (data.order.status === "Filled") {
        console.log("Order filled!");
        ws.close();
      }
    }
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("WebSocket closed");
};
```

---

## Documentation Gaps & Unknowns

### SOLVED ✅

1. **Subaccount Address Retrieval** (Previously Unknown - Now Documented!)
   - ✅ **SOLUTION**: Call `/api/v1/subaccounts?owner=YOUR_ADDRESS` after creating subaccount
   - ✅ **Documentation**: [`openapi.json:1095-1130`](etna/docs/api-reference/openapi.json:1095)
   - ✅ Returns array of `SubaccountDto` objects with `subaccount_address` field
   - ✅ This is the official, documented approach (not a workaround)

### CRITICAL GAPS ⚠️

1. **Order ID Extraction** (Still Unknown)

2. **Actual Package Address**
   - All examples use `{package}` placeholder
   - Real value needed for transactions

3. **API Key Usage**
   - Generated at app.decibel.trade/api but never shown how to use
   - Unknown if needed for REST API or WebSocket

### HIGH-PRIORITY GAPS 🔴

1. **Transaction Event Parsing**
   - Structure of events emitted by `place_order_to_subaccount`
   - How to extract order details from events

2. **WebSocket Authentication**
   - Whether WS connection requires auth
   - How to authenticate if required

3. **Error Handling**
   - Complete list of error codes and meanings
   - On-chain vs off-chain errors

4. **Order Status Values**
   - Complete list of possible status values
   - State transition diagram

### MEDIUM-PRIORITY GAPS 🟡

1. **Network Information**
   - Is this testnet, devnet, or mainnet?
   - Faucet for test APT/USDC?

2. **Rate Limits**
   - REST API rate limits
   - WebSocket message rate limits

3. **Best Practices**
   - Recommended polling frequency for REST API
   - WebSocket reconnection strategy
   - Error retry logic

4. **Gas Cost Estimates**
   - Typical gas costs for common operations
   - How to estimate before submission

### LOW-PRIORITY GAPS 🟢

1. **Additional Features**
   - How to set up notifications beyond WebSocket
   - Advanced order types usage examples

2. **Performance Optimization**
   - Batch transaction submission
   - Optimized transaction building (referenced but not fully documented)

---

## Recommended Next Steps for Documentation

### To Complete the "First Quick Win" Workflow:

1. **Add Subaccount Address Retrieval Section**
   - Document how to get subaccount address after creation
   - Either from transaction events or REST API call

2. **Add Order ID Extraction Guide**
   - Show how to parse transaction events
   - Document event structure for order placement

3. **Provide Real Package Address**
   - Replace `{package}` with actual value
   - Or provide environment-specific values

4. **Clarify API Key Usage**
   - If needed for REST/WS, show where to include it
   - If not needed, remove the generation step

5. **Add Complete Error Reference**
   - HTTP error codes for REST API
   - On-chain error codes
   - WebSocket error codes

6. **Add Order Status Reference**
   - Complete list of status values
   - State transition diagram
   - Expected timing for transitions

### Additional Recommendations:

1. **Create E2E Tutorial**
   - Complete working example from start to finish
   - Include all prerequisite steps
   - Show actual values (not placeholders)

2. **Add Troubleshooting Section**
   - Common errors and solutions
   - Debug techniques
   - FAQ

3. **Provide SDK Utilities**
   - Helper functions for common tasks
   - Event parsing utilities
   - Price/size formatting library

---

## Summary

### What Works Well ✅

- Basic transaction structure is well documented
- Price/size formatting has detailed documentation
- WebSocket schema is comprehensive
- REST API OpenAPI spec is detailed
- **USDC Collateral Requirement** is documented:
  - Minting via [`restricted_mint`](etna/move/perp/sources/test/usdc.move:142)
  - Depositing via [`deposit_to_subaccount_at`](etna/docs/transactions/account-management/deposit.mdx:10)
  - Collateral requirement noted in [`deposit.mdx:36`](etna/docs/transactions/account-management/deposit.mdx:36)

### What Needs Work ⚠️

- Missing critical connection points between steps
- Placeholder values instead of real examples
- Unclear authentication model
- Event parsing not documented
- Subaccount management incomplete

### Quick Win Feasibility

**Current State:** 60% achievable with workarounds
- ✅ Step 1 (Place Order): 80% - works with placeholders and client_order_id
- ⚠️ Step 2 (Query Status): 90% - works with client_order_id workaround
- ⚠️ Step 3 (WebSocket Updates): 70% - may need auth (unknown)

**With Documentation Improvements:** 95% achievable
- Critical gaps filled would make this a smooth first experience
- Recommended to prioritize the CRITICAL and HIGH-PRIORITY gaps above