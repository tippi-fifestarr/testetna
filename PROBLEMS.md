# Known Issues & Problems

This file tracks issues discovered during testetna development and their solutions based on firsthand analysis of the working Java example.

**Last Updated:** 2025-11-20 (Updated after Java example analysis)

---

## ✅ SOLVED: Zero APT Balance - Cannot Execute Transactions

**Status:** ✅ **SOLUTION FOUND**

**What happened:** Setup script showed 0.0000 APT balance, blocking all transactions.

**Root Cause:** We are on the **Netna staging network** (Chain ID 205), which is an Aptos Labs internal network. The faucet URL was not documented in the beginner guides, making it impossible to fund accounts.

**Discovery Source:** Found by analyzing the official Java example from Decibel team ([`java/src/main/java/com/decibel/DecibelUtils.java`](java/src/main/java/com/decibel/DecibelUtils.java:23))

**✅ WORKING SOLUTION:**

**Netna Faucet URL:** 
```
https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app
```

**How to use:**
```bash
# Remove 0x prefix from address
curl -X POST "https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=YOUR_ADDRESS_NO_0X"

# Example for address 0xb540c13b3aab3966fdf4c505bfd3851aed2f9983938ed4e89570a5234db65ff2:
curl -X POST "https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=b540c13b3aab3966fdf4c505bfd3851aed2f9983938ed4e89570a5234db65ff2"
```

**What it gives:** 100 APT (10,000,000,000 octas) per request

**Implementation Status:** 
- ❌ Not yet integrated into TypeScript code
- ✅ Solution documented in [`java-example.md`](java-example.md:112-163)
- 🔲 TODO: Create `utils/faucet.ts` utility
- 🔲 TODO: Update `1-setup.ts` to auto-call faucet when balance is low

**Guide improvement needed:**
- Clear instructions on funding the API wallet (separate from main wallet)
- Distinction between Petra wallet (has funds) and API wallet (needs funds)
- Automated faucet call in setup script for Netna staging
- Minimum APT requirement stated upfront (recommend 0.1 APT)
- **CRITICAL:** Document the Netna faucet URL in official onboarding guides

---

## ✅ SOLVED: Restricted USDC Minting (250 Limit)

**Status:** ✅ **BETTER SOLUTION FOUND**

**What happened:** Our TypeScript code uses `usdc::restricted_mint` which has a 250 USDC maximum per account.

**Discovery Source:** Java example uses unrestricted minting ([`java/src/main/java/com/decibel/DecibelTransactions.java`](java/src/main/java/com/decibel/DecibelTransactions.java:25-65))

**✅ WORKING SOLUTION:**

**Current (Limited):**
```typescript
// src/2.5-mint-usdc.ts:55
function: `${PACKAGE_ADDRESS}::usdc::restricted_mint`,
functionArguments: [chainAmount],  // 250 USDC max
```

**Better (Unlimited):**
```typescript
function: `${PACKAGE_ADDRESS}::usdc::mint`,
functionArguments: [
  accountAddress,  // to_address parameter
  chainAmount,     // amount parameter
],
```

**Key Difference:** 
- `restricted_mint(amount)` - 250 USDC limit, mints to caller
- `mint(to_address, amount)` - No limit, can mint to any address

**Implementation Status:**
- ❌ TypeScript still uses `restricted_mint`
- ✅ Solution documented in [`java-example.md`](java-example.md:165-213)
- 🔲 TODO: Update `src/2.5-mint-usdc.ts` to use unrestricted mint

**Guide improvement needed:**
- Explain that `restricted_mint` is for production-like testing (250 USDC cap)
- Document that `mint` is available for unlimited testing on Netna staging
- Show both options with clear use cases for each

---

## ✅ SOLVED: Missing Chain ID Configuration

**Status:** ✅ **CONFIRMED**

**What happened:** Our `.env` file doesn't specify a Chain ID, and comments incorrectly mentioned Chain ID 204.

**Discovery Source:** Java example config ([`java/src/main/resources/config.properties.example`](java/src/main/resources/config.properties.example:7))

**✅ CORRECT VALUE:** 

**Chain ID:** `205`

**Network Details:**
- Name: Netna (staging)
- Type: Aptos Labs internal staging environment
- NOT testnet (that would be different chain ID)
- NOT devnet (that would be different chain ID)
- NOT mainnet (that would be different chain ID)

**Implementation Status:**
- ❌ Not set in `.env` file
- ✅ Value confirmed: 205
- 🔲 TODO: Add `CHAIN_ID=205` to `.env`
- 🔲 TODO: Update config validation to use it

**Guide improvement needed:**
- State upfront: "This guide uses **Netna staging** network (Chain ID 205)"
- Show network-specific faucet command in setup instructions
- Either use explicit `Network.CUSTOM` documentation or explain why it's used
- Add comment in code: `// Netna is Aptos Labs internal staging network (Chain ID 205)`

---

## ⚠️ ACTIVE: Network Ambiguity in Configuration

**Status:** ⚠️ **CLARIFICATION NEEDED**

**What's unclear:** Code uses `Network.CUSTOM` which doesn't clearly indicate we're on Netna staging.

**Current code ([`utils/client.ts`](utils/client.ts)):**
```typescript
const aptosConfig = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: FULLNODE_URL,  // https://api.netna.staging.aptoslabs.com/v1
});
```

**The confusion:**
- `Network.CUSTOM` is generic and doesn't indicate which network
- URL says "staging" but developers might think it's testnet or devnet
- No clear documentation that this is a special internal network
- Beginners won't know which network faucet to use

**Recommendation:**
- Add comment: `// Netna is an Aptos Labs internal staging network (Chain ID 205)`
- Document in README that this is NOT public testnet/devnet
- Explain faucet is private and only accessible via the discovered URL

**Guide improvement needed:**
- State upfront: "This guide uses **NETNA STAGING**, not public testnet"
- Show testnet-specific vs Netna-specific faucet commands
- Either use explicit network constant or document why CUSTOM is appropriate
- Explain difference between Aptos public networks and internal staging

---

## 📚 CLARIFIED: API Wallet vs Subaccount Distinction

**Status:** ✅ **DOCUMENTED**

This is not a bug, but a conceptual distinction that causes confusion for beginners.

**API Wallet:**
- Address: `0xb540c13b3aab3966fdf4c505bfd3851aed2f9983938ed4e89570a5234db65ff2` (example)
- What: Your main Aptos account (created at app.decibel.trade/api)
- Has: Private key (you control it)
- Purpose: Signs transactions, pays gas fees
- Needs: APT for gas fees
- Balance type: APT (for transactions)

**Subaccount:**
- What: A derived trading-specific account
- Created by: Your API wallet via `create_new_subaccount` transaction
- Purpose: Holds trading positions and collateral
- Needs: USDC deposited (for trading margin)
- Balance type: USDC (for trading collateral)

**The relationship:**
```
API Wallet (main account, pays gas)
   ↓ Step 1: Create subaccount (needs APT for gas)
Subaccount (trading account) 
   ↓ Step 2: Deposit USDC (needs APT for gas from API wallet)
Trading collateral ready
   ↓ Step 3: Place orders (needs APT for gas from API wallet)
```

**Key insight:** 
- API wallet pays gas for ALL transactions (including subaccount operations)
- Subaccount holds USDC collateral for trading
- You need BOTH APT (in API wallet) AND USDC (in subaccount) to trade

**Guide improvement needed:**
- Clearly explain this two-account model upfront to avoid confusion
- Diagram showing relationship between API wallet and subaccount
- Emphasize that API wallet ≠ trading wallet (subaccount)
- Explain why this architecture is used (security, flexibility)

---

## ✅ SOLVED: TypeScript Strict Mode Type Errors

**Status:** ✅ **RESOLVED**

**What happened:** When running `npm run setup`, TypeScript strict mode complained about `unknown` types from `response.json()`.

**Error:** `TS18046: 'markets' is of type 'unknown'`

**Root cause:** The guides' `tsconfig.json` example has `"strict": true` which requires explicit type assertions for API responses.

**Impact:** Scripts won't compile/run without type assertions.

**Fix applied:**
```bash
sed -i.bak 's/const markets = await response.json();/const markets = await response.json() as any[];/' src/1-setup.ts
```

**Current code ([`src/1-setup.ts`](testetna/src/1-setup.ts:70)):**
```typescript
const markets = await response.json() as any[];  // Type assertion added
```

**Resolution:** Add type assertions to API response parsing: `const markets = await response.json() as any[];`

**Guide improvement needed:**
- Either show `tsconfig.json` with `"strict": false` for beginners
- Or include `as any[]` type assertions in all code examples
- Document this common TypeScript pitfall in troubleshooting section
- Explain why strict mode is valuable but can be confusing for beginners

---

## ⏳ EXPECTED: TypeScript Compiler Errors Before npm install

**Status:** ⏳ **Normal - Not a bug**

**Error Messages (before `npm install`):**
- `Cannot find module 'dotenv'`
- `Cannot find module '@aptos-labs/ts-sdk'`
- `Cannot find module 'ws'`
- `Cannot find name 'process'` (needs @types/node)

**Solution:** These disappear after running:
```bash
cd testetna
npm install
```

**Packages installed:**
- `@aptos-labs/ts-sdk` - Aptos blockchain SDK
- `dotenv` - Environment variable management
- `ws` - WebSocket client
- `@types/node` - TypeScript definitions for Node.js
- `@types/ws` - TypeScript definitions for ws
- `typescript` - TypeScript compiler
- `ts-node` - TypeScript execution engine

**After `npm install`, all TypeScript errors should disappear.**

---

## 🔧 TODO: Implementation Tasks

Based on Java example analysis, these changes need to be implemented:

### Priority 1: Critical Blockers
1. **Create faucet utility** - `utils/faucet.ts`
   - Implement `fundFromNetnaFaucet(address: string)`
   - Use discovered faucet URL
   - Handle errors gracefully
   - See: [`java-example.md`](java-example.md:112-163)

2. **Add Chain ID to config**
   - Add `CHAIN_ID=205` to `.env`
   - Update `utils/config.ts` to load it
   - Use in transaction building

3. **Update USDC minting**
   - Change `src/2.5-mint-usdc.ts` from `restricted_mint` to `mint`
   - Update function arguments to include recipient address
   - Remove 250 USDC limitation

### Priority 2: Quality Improvements
4. **Auto-fund in setup script**
   - Modify `src/1-setup.ts` to call faucet when APT < 0.01
   - Wait for confirmation before proceeding
   - Match Java example's automated flow

5. **Subaccount derivation**
   - Implement SHA3-256 based derivation
   - Match Java's `getPrimarySubaccountAddr()` logic
   - See: [`java-example.md`](java-example.md:502-525)

6. **Add market config helpers**
   - Price rounding to valid ticks
   - Size rounding to valid lots
   - Fetch from API like Java example

### Priority 3: Documentation
7. **Update README** - Explain Netna network clearly
8. **Update .env comments** - Correct Chain ID from 204 to 205
9. **Add setup guide** - Document faucet usage

---

## 📊 Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Faucet URL | ✅ Found | Not yet integrated in code |
| Chain ID | ✅ Confirmed | Value is 205, not set in .env |
| USDC Mint | ⚠️ Limited | Using restricted (250 max), unlimited available |
| Setup Script | ⚠️ Manual | Warns about low balance, doesn't auto-fund |
| Code vs Java | ❌ Behind | Java has automated flow, we're manual |

---

## 🎯 Quick Verification Steps

To verify the solutions work:

1. **Test Faucet (Priority 1):**
   ```bash
   curl -X POST 'https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=YOUR_ADDRESS_NO_0X'
   
   # Check balance after 3 seconds:
   curl 'https://api.netna.staging.aptoslabs.com/v1/accounts/0xYOUR_ADDRESS'
   ```

2. **Verify Chain ID:**
   ```bash
   # Should see chain_id: "205" in response
   curl 'https://api.netna.staging.aptoslabs.com/v1'
   ```

3. **Test unrestricted USDC mint:**
   - Update `2.5-mint-usdc.ts` per solution above
   - Try minting 1000 USDC (over 250 limit)
   - Should succeed with unrestricted mint

---

## 📚 Reference Documentation

- **Java Example Analysis:** [`java-example.md`](java-example.md)
- **Java Source Code:** [`java/`](java/) directory
- **Working Faucet:** [`DecibelUtils.java:23-59`](java/src/main/java/com/decibel/DecibelUtils.java:23)
- **Unrestricted Mint:** [`DecibelTransactions.java:25-65`](java/src/main/java/com/decibel/DecibelTransactions.java:25)
- **Chain ID Config:** [`config.properties.example:7`](java/src/main/resources/config.properties.example:7)

---

## 🎓 Lessons Learned

1. **Hidden Infrastructure:** Critical infrastructure (faucets, chain IDs) wasn't in beginner docs - only in working code examples
2. **Read the Code:** Official examples (Java) had all the answers that written guides were missing
3. **Test Networks:** "Staging" networks are often private/internal with different tooling than public testnets
4. **Function Variants:** `restricted_mint` vs `mint` - testnet contracts may have multiple versions with different limits
5. **Type Safety:** TypeScript strict mode requires explicit type assertions for JSON parsing

---

## 📋 Setup Order Recommendation

Based on the dependencies, here's the recommended order:

1. ✅ Create project structure (done)
2. ✅ Create all TypeScript files (done)
3. **▶️ Run `npm install`** ← Do this first!
4. Create `.env` file from `.env.example`
5. Fill in your private key in `.env`
6. **Add `CHAIN_ID=205` to `.env`**
7. **Fund account using Netna faucet** (discovered solution)
8. Run the scripts in order

---

## ⚠️ Future Issues to Watch For

### 1. Private Key Not Set
**Symptom:** Script fails with "API_WALLET_PRIVATE_KEY not set"
**Solution:** Add your private key to `.env` file

### 2. Insufficient APT Balance
**Symptom:** Transactions fail with "insufficient balance"
**Solution:** Use Netna faucet (see solved issue above) or ensure you have at least 0.1 APT for gas fees

### 3. Package Address Incorrect
**Symptom:** Transaction fails or can't find functions
**Solution:** Verify `PACKAGE_ADDRESS` in `.env` matches the deployed contract (`0xb8a5788314451ce4d2fbbad32e1bad88d4184b73943b7fe5166eab93cf1a5a95` for Netna)

### 4. API Indexer Lag
**Symptom:** Subaccount not found immediately after creation
**Solution:** Wait 2-5 seconds and try querying again

---

## 📝 Previously Documented Issues (Historical)

### Issue: package.json Not Created Initially

**What happened:** When creating files, package.json creation was denied by user (wanted to read guides first).

**Impact:** npm install failed because package.json didn't exist.

**Resolution:** Created package.json and tsconfig.json after the fact.

**Lesson:** Could have created config files separately or confirmed file creation order with user upfront.

---

## 📢 Development Process Notes

**Files created:** All TypeScript setup files complete
**Ready to test?** YES! After implementing the discovered solutions:
1. Add faucet integration
2. Update to unrestricted USDC mint
3. Set Chain ID 205
4. Test automated flow

**Current state:** Problems identified and solutions found. Implementation pending.
