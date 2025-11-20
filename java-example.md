# Java Example Analysis

## Repository Overview
- **Source:** https://github.com/tippi-fifestarr/java-example.git
- **Purpose:** Official Decibel DEX Java SDK example demonstrating order submission
- **SDK Used:** [Japtos SDK](https://github.com/aptos-labs/japtos) v1.1.7
- **Structure:** Maven project with single-order and bulk-order bot examples

## 🔥 CRITICAL DISCOVERY: Working Funding Solution!

### The Java Example Solves Our Funding Problem!

**What we were missing:**
- Our TypeScript implementation is blocked because we can't fund accounts on the "staging" network
- No public faucet for `api.netna.staging.aptoslabs.com` 
- Cannot proceed with any transactions (0 APT balance)

**What the Java example reveals:**
- ✅ **Private Netna faucet exists!**
- ✅ **Unrestricted USDC minting available!**
- ✅ **Fully automated account setup!**

---

## Key Findings

### 1. Network & Configuration ⭐ CRITICAL

**Network Used:** Netna Staging (Aptos Labs internal testnet)

**Fullnode URL:** `https://api.netna.staging.aptoslabs.com/v1`
- This is the SAME URL we're using ✅
- It's NOT devnet, NOT testnet, NOT mainnet
- It's an Aptos Labs internal staging environment

**Chain ID:** **205** 
- ⚠️ **CRITICAL:** Our `.env` doesn't specify chain ID
- ⚠️ Our `PROBLEMS.md` incorrectly mentions 204
- **Fix needed:** Add `CHAIN_ID=205` to our `.env`

**Package Address:** `0xb8a5788314451ce4d2fbbad32e1bad88d4184b73943b7fe5166eab93cf1a5a95`
- Matches our configuration ✅

**Trading API URL:** `https://api.netna.aptoslabs.com/decibel`
- Matches our configuration ✅

**USDC Address:** `0x26a76cae6a96ad084c7d5d9ca3e890b4e14f617d7bda6c8f45fdf9f20aa1c49b`
- Derived from package address with seed "USDC"
- We weren't using this in our TypeScript code

---

### 2. Funding Solution ⭐⭐⭐ CRITICAL

#### APT Funding (Gas Fees)

**Faucet URL:** 
```
https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app
```

**Endpoint:**
```
POST /mint?amount=10000000000&address={ADDRESS_WITHOUT_0x}
```

**Amount:** 10,000,000,000 octas = **100 APT**

**Implementation in Java:**
```java
// DecibelUtils.java:28-59
public static void fundAccountFromFaucet(AccountAddress address) throws IOException {
    String urlString = String.format("%s/mint?amount=10000000000&address=%s", 
        FAUCET_URL, address.toHexString().replace("0x", ""));
    
    URL url = new URL(urlString);
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    conn.setRequestMethod("POST");
    conn.setFixedLengthStreamingMode(0);
    conn.setDoOutput(true);
    
    // Empty body required for POST
    try (OutputStream os = conn.getOutputStream()) {
        os.flush();
    }
    // ... error handling
}
```

**How to use in TypeScript:**
```typescript
async function fundFromFaucet(address: string) {
  // Remove 0x prefix
  const addr = address.replace('0x', '');
  const url = `https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=${addr}`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: '', // Empty body
  });
  
  if (!response.ok) {
    throw new Error(`Faucet failed: ${response.status}`);
  }
}
```

#### USDC Funding (Trading Collateral)

**🔥 MAJOR DIFFERENCE:** The Java example uses **unrestricted USDC minting!**

**Java uses:**
```java
// DecibelTransactions.java:25-65
moduleId = new ModuleId(packageAddress, new Identifier("usdc"));
function: "mint"  // NOT restricted_mint!
arguments: [toAddr, amount]  // NO 250 USDC limit!
```

**Our TypeScript currently uses:**
```typescript
function: `${PACKAGE_ADDRESS}::usdc::restricted_mint`
// This has a 250 USDC limit per account
```

**Fix for TypeScript:**
```typescript
// Switch from restricted_mint to mint
function: `${PACKAGE_ADDRESS}::usdc::mint`,
functionArguments: [
  toAddress,      // address to mint to
  amount,         // amount in chain units (6 decimals)
]
```

---

### 3. Workflow Sequence

The Java example follows this automated sequence in `InputUtils.initializeAccount()`:

```
1. Load private key from config OR generate new Ed25519Account
   ↓
2. Fund account from Netna faucet (100 APT)
   ↓ Wait 3 seconds for blockchain confirmation
3. Mint USDC (100 USDC via unrestricted mint)
   ↓ Transaction: {package}::usdc::mint
4. Calculate primary subaccount address
   ↓ seed = "decibel_dex_primary"
   ↓ SHA3-256(accountAddress + seed + 0xFE)
5. Calculate USDC asset address
   ↓ seed = "USDC"  
   ↓ SHA3-256(packageAddress + seed + 0xFE)
6. Deposit USDC to subaccount (50 USDC)
   ↓ Transaction: {package}::dex_accounts::deposit_to_subaccount_at
7. Ready to trade! ✅
```

**All of this happens automatically** when you run the Java example without a private key configured.

---

### 4. API Usage

**REST API:**
- ✅ Used for fetching market configurations
- ✅ Used for getting bulk order sequence numbers
- **Endpoint:** `GET /api/v1/markets` - Returns all markets with tick/lot sizes
- **Endpoint:** `GET /api/v1/bulk_orders?user={subaccount}&market={market}` - Returns current bulk orders

**WebSocket:**
- ❌ NOT used in the Java example
- The examples are transaction-focused, not real-time data

**Authentication:**
- ❌ No API authentication needed
- All operations use on-chain transactions signed by private key
- REST API queries are public (no auth headers)

---

## Critical Differences from Our TypeScript Implementation

| Aspect | Our TypeScript | Java Example | Impact |
|--------|---------------|--------------|--------|
| **Network** | staging (correct) | staging (correct) | ✅ Same |
| **Chain ID** | ❌ Not set | ✅ 205 | **Must fix!** |
| **APT Funding** | ❌ No solution | ✅ Netna faucet | **BLOCKED** |
| **USDC Minting** | `restricted_mint` (250 limit) | `mint` (unlimited) | **Limited** |
| **Package Address** | ✅ Correct | ✅ Correct | ✅ Same |
| **Automation** | ❌ Manual steps | ✅ Fully automated | **UX issue** |
| **Subaccount Derivation** | ❓ Unknown | ✅ SHA3-256 with seed | **Need to verify** |

---

## Solutions to Our Problems

### Problem 1: Cannot fund staging network ⭐ SOLVED!

**Our Issue (from PROBLEMS.md):**
```
CRITICAL BLOCKER: "Staging" Network Has No Public Faucet
- Network URL: api.netna.staging.aptoslabs.com/v1
- Staging faucet: No public faucet exists
- Account status: 0.0000 APT, cannot proceed
```

**Java Solution:**
Private Netna faucet at:
```
https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app
```

**Fix for TypeScript:**

Create `src/utils/faucet.ts`:
```typescript
export async function fundFromNetnaFaucet(address: string): Promise<void> {
  const addr = address.replace('0x', '');
  const url = `https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=${addr}`;
  
  console.log('Requesting 100 APT from Netna faucet...');
  
  const response = await fetch(url, {
    method: 'POST',
    body: '',
  });
  
  if (!response.ok) {
    throw new Error(`Faucet request failed: ${response.status}`);
  }
  
  console.log('✅ Faucet funding requested (100 APT)');
  console.log('   Waiting 3 seconds for confirmation...');
  await new Promise(resolve => setTimeout(resolve, 3000));
}
```

Add to `src/1-setup.ts`:
```typescript
import { fundFromNetnaFaucet } from '../utils/faucet';

// After checking balance, if low:
if (aptBalance < 0.01) {
  console.log('🚰 Funding account from Netna faucet...');
  await fundFromNetnaFaucet(account.accountAddress.toString());
}
```

### Problem 2: USDC restricted to 250 limit

**Our Issue:**
Using `restricted_mint` which has 250 USDC maximum per account

**Java Solution:**
Uses unrestricted `mint` function:
```java
function: "{package}::usdc::mint"
arguments: [address, amount]  // No limit!
```

**Fix for TypeScript:**

Update `src/2.5-mint-usdc.ts`:
```typescript
// BEFORE (limited):
function: `${config.PACKAGE_ADDRESS}::usdc::restricted_mint`,
functionArguments: [chainAmount],

// AFTER (unlimited):
function: `${config.PACKAGE_ADDRESS}::usdc::mint`,
functionArguments: [
  account.accountAddress,  // to_address
  chainAmount,             // amount
],
```

### Problem 3: Missing Chain ID

**Our Issue:**
No `CHAIN_ID` set in `.env`, may cause transaction issues

**Java Solution:**
Explicitly sets `chain.id=205` in config

**Fix for TypeScript:**

Add to `.env`:
```bash
# Chain ID for Netna staging network
CHAIN_ID=205
```

Update config validation in `utils/config.ts`:
```typescript
export const config = {
  // ... existing config
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '205'),
};
```

### Problem 4: Manual multi-step process

**Our Issue:**
User must manually run 6 separate scripts in sequence

**Java Solution:**
Single command does everything:
1. Generate account (if needed)
2. Fund with faucet
3. Mint USDC
4. Deposit to subaccount
5. Place order

**Fix for TypeScript:**

Create `src/0-auto-setup.ts`:
```typescript
/**
 * Automated Setup Script
 * Mimics Java example's automatic account initialization
 */

import { fundFromNetnaFaucet } from '../utils/faucet';
// ... other imports

async function autoSetup() {
  console.log('🤖 Automated Account Setup\n');
  
  const aptos = createAptosClient();
  const account = createAccount();
  
  console.log(`Account: ${account.accountAddress}\n`);
  
  // Step 1: Fund with APT
  console.log('Step 1: Funding with APT from Netna faucet...');
  await fundFromNetnaFaucet(account.accountAddress.toString());
  
  // Step 2: Mint USDC
  console.log('Step 2: Minting 100 USDC...');
  // ... mint transaction
  
  // Step 3: Create/verify subaccount
  console.log('Step 3: Setting up subaccount...');
  // ... subaccount creation
  
  // Step 4: Deposit USDC
  console.log('Step 4: Depositing 50 USDC to subaccount...');
  // ... deposit transaction
  
  console.log('\n✅ Account fully funded and ready to trade!');
}
```

---

## Code Examples from Java

### 1. Primary Subaccount Address Derivation

```java
// DecibelUtils.java:64-80
public static AccountAddress getPrimarySubaccountAddr(AccountAddress accountAddress) {
    byte[] seed = "decibel_dex_primary".getBytes(StandardCharsets.UTF_8);
    
    // Create object address using SHA3-256 hash
    // Format: sha3-256(address + seed + 0xFE)
    MessageDigest digest = MessageDigest.getInstance("SHA3-256");
    digest.update(accountAddress.toBytes());
    digest.update(seed);
    digest.update((byte) 0xFE); // Object address marker
    
    byte[] hash = digest.digest();
    return AccountAddress.fromBytes(hash);
}
```

**TypeScript equivalent needed:**
```typescript
import { sha3_256 } from '@noble/hashes/sha3';

export function getPrimarySubaccountAddress(accountAddress: string): string {
  const seed = new TextEncoder().encode('decibel_dex_primary');
  const addressBytes = AccountAddress.from(accountAddress).toUint8Array();
  
  // SHA3-256(address + seed + 0xFE)
  const data = new Uint8Array(addressBytes.length + seed.length + 1);
  data.set(addressBytes, 0);
  data.set(seed, addressBytes.length);
  data[addressBytes.length + seed.length] = 0xFE; // Object marker
  
  const hash = sha3_256(data);
  return '0x' + Buffer.from(hash).toString('hex');
}
```

### 2. Market Configuration with Tick/Lot Rounding

```java
// MarketConfig.java:75-83
public long priceToTickInteger(long priceInt, boolean ceil) {
    if (ceil) {
        // Round up to next tick
        return tickSize * ((Math.max(priceInt, 1) - 1) / tickSize + 1);
    } else {
        // Round down to previous tick
        return tickSize * (priceInt / tickSize);
    }
}

public long sizeToLotInteger(long sizeInt) {
    // Always round up for sizes to ensure minimum lot size
    return lotSize * ((Math.max(sizeInt, 1) - 1) / lotSize + 1);
}
```

**This is important for order placement:**
- Prices must be multiples of `tick_size`
- Sizes must be multiples of `lot_size`
- Bids round down, asks round up (for better fills)

### 3. Bulk Order Sequence Management

```java
// DecibelUtils.java:108-165
public static long getBulkOrderSequenceNumber(
        String tradingApiUrl,
        AccountAddress subaccountAddr,
        AccountAddress marketAddr) throws IOException {
    
    String urlString = String.format("%s/api/v1/bulk_orders?user=0x%s&market=0x%s",
        tradingApiUrl,
        subaccountAddr.toHexString().replace("0x", ""),
        marketAddr.toHexString().replace("0x", ""));

    // ... fetch and parse JSON
    
    if (root.isArray() && root.size() > 0) {
        long currentSeqNum = root.get(0).path("sequence_number").asLong(-1);
        if (currentSeqNum >= 0) {
            return currentSeqNum + 1;  // Next sequence number
        }
    }
    
    return 0;  // No bulk order exists yet
}
```

**Key insight:** Bulk orders use monotonic sequence numbers to prevent conflicts.

---

## Recommended Changes to Our TypeScript Implementation

### Priority 1: Critical Blockers (Do First!)

1. **Add Netna Faucet Integration**
   - Create `utils/faucet.ts` with `fundFromNetnaFaucet()` function
   - URL: `https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app`
   - Test with `curl -X POST 'https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address={YOUR_ADDRESS_WITHOUT_0x}'`

2. **Add Chain ID to Configuration**
   - Add `CHAIN_ID=205` to `.env`
   - Update config validation
   - Use in transaction building

3. **Switch to Unrestricted USDC Mint**
   - Change from `usdc::restricted_mint` to `usdc::mint`
   - Update function arguments to include recipient address
   - Remove 250 USDC limit

### Priority 2: Improvements (Do Soon)

4. **Create Automated Setup Script**
   - Combine all setup steps into one script
   - Match Java example's ease of use
   - File: `src/0-auto-setup.ts`

5. **Add Subaccount Address Derivation**
   - Implement SHA3-256 based derivation
   - Match Java's `getPrimarySubaccountAddr()` logic
   - Verify against on-chain data

6. **Implement Market Config Helpers**
   - Price rounding to valid ticks
   - Size rounding to valid lots
   - Fetch from API like Java example

### Priority 3: Quality of Life (Nice to Have)

7. **Add Bulk Order Support**
   - Implement sequence number management
   - Match Java's bulk order bot functionality

8. **Improve Error Messages**
   - Match Java's helpful error context
   - Add network-specific troubleshooting

9. **Update Documentation**
   - Explain Netna staging network clearly
   - Document the faucet URL
   - Show difference between restricted/unrestricted mint

---

## Testing Plan

### Step 1: Test Faucet (CRITICAL)
```bash
# Test the Netna faucet works
curl -X POST 'https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=b540c13b3aab3966fdf4c505bfd3851aed2f9983938ed4e89570a5234db65ff2'

# Check balance after 3 seconds
curl 'https://api.netna.staging.aptoslabs.com/v1/accounts/0xb540c13b3aab3966fdf4c505bfd3851aed2f9983938ed4e89570a5234db65ff2'
```

### Step 2: Test Unrestricted USDC Mint
```typescript
// Create test script with:
function: `${PACKAGE_ADDRESS}::usdc::mint`,
functionArguments: [
  account.accountAddress,
  1000_000000,  // 1000 USDC (way over 250 limit!)
],
```

### Step 3: Test Subaccount Derivation
```typescript
// Verify our derivation matches on-chain
const derived = getPrimarySubaccountAddress(account.accountAddress);
// Compare with Java example's result
```

### Step 4: Run Automated Setup
```bash
npm run auto-setup
# Should complete all steps without manual intervention
```

---

## Java Example Strengths to Learn From

1. **Automatic Funding:** No manual faucet visits needed
2. **Single Command:** One script does everything
3. **Better USDC:** Unrestricted mint for testing
4. **Market Configs:** Fetches tick/lot sizes from API
5. **Bulk Orders:** Interactive bot with sequence management
6. **Clear Logging:** Excellent progress indicators
7. **Error Handling:** Graceful fallbacks (e.g., faucet failures)

---

## Summary: What We Learned

### 🎯 The Big Wins

1. **Netna Faucet Discovered!** 
   - URL: `https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app`
   - Gives 100 APT per request
   - Solves our critical funding blocker

2. **Unrestricted USDC Exists!**
   - Function: `{package}::usdc::mint`
   - No 250 USDC limit
   - Better for testing

3. **Chain ID Confirmed!**
   - Netna staging = Chain ID 205
   - Must be set in configuration

### 🔧 What to Fix in Our Code

1. Integrate Netna faucet for APT funding
2. Switch from `restricted_mint` to `mint` for USDC
3. Add `CHAIN_ID=205` to `.env`
4. Implement subaccount address derivation
5. Create automated setup script
6. Add market config fetching and price/size rounding

### 📚 What's the Same (Good!)

1. ✅ Package address correct
2. ✅ Network URL correct  
3. ✅ Trading API URL correct
4. ✅ Transaction structure matches
5. ✅ Workflow sequence is compatible

---

## Next Steps for TypeScript Implementation

1. **Immediate** (Unblock development):
   ```bash
   # Test faucet manually first
   curl -X POST 'https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=b540c13b3aab3966fdf4c505bfd3851aed2f9983938ed4e89570a5234db65ff2'
   ```

2. **Today** (Code changes):
   - Create `utils/faucet.ts`
   - Update `2.5-mint-usdc.ts` to use unrestricted mint
   - Add `CHAIN_ID=205` to `.env`

3. **This Week** (Full parity):
   - Implement automated setup script
   - Add subaccount derivation
   - Test end-to-end flow

4. **Nice to Have**:
   - Bulk order support
   - Market config helpers
   - Better error messages

---

## Repository Structure Notes

```
java/
├── pom.xml                           # Maven config, Japtos SDK 1.1.7
├── README.md                         # Excellent documentation
└── src/main/
    ├── java/com/decibel/
    │   ├── OrderExample.java         # Single order submission
    │   ├── BulkOrderExample.java     # Interactive bulk bot
    │   ├── DecibelTransactions.java  # Transaction builders
    │   ├── DecibelUtils.java         # 🌟 FAUCET + address derivation
    │   ├── InputUtils.java           # 🌟 AUTO SETUP logic
    │   └── MarketConfig.java         # Tick/lot rounding
    └── resources/
        └── config.properties.example # Network configuration
```

**Most important files for our needs:**
1. `DecibelUtils.java` - Has the faucet URL and derivation logic
2. `InputUtils.java` - Shows the complete automated setup flow
3. `config.properties.example` - Confirms chain ID and URLs

---

**Last Updated:** 2025-11-20  
**Analysis Status:** Complete ✅  
**Blocking Issues Resolved:** YES 🎉