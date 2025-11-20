# Recommended Fixes for Official Decibel Documentation

Based on building a complete working implementation and comparing with the Java example, here are critical gaps and errors in the official Decibel documentation that should be fixed.

## Critical Issues

### 1. Netna Staging Faucet Not Documented

**Problem:**  
No documentation on how to fund accounts on Netna staging network (`api.netna.staging.aptoslabs.com`). Users cannot proceed with any transactions without APT for gas fees.

**Current State:**  
- [`placing-your-first-order.mdx`](../etna/docs/quickstart/placing-your-first-order.mdx) mentions needing APT but doesn't explain how to get it on staging
- No faucet URL provided for Netna staging network
- Users are blocked from testing

**Fix Needed:**  
Add to [`placing-your-first-order.mdx`](../etna/docs/quickstart/placing-your-first-order.mdx) around line 16 (after "You need APT in your account"):

```markdown
### Getting APT on Netna Staging

For testing on Netna staging network, use the Netna faucet:

**Faucet URL:** `https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app`

**Request APT:**
```bash
curl -X POST 'https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=YOUR_ADDRESS_WITHOUT_0x'
```

This provides 100 APT (10,000,000,000 octas), sufficient for hundreds of transactions.

**Note:** The faucet may have rate limits. If your request fails, wait a few minutes and try again.
```

**Impact:** CRITICAL - Without this, new users literally cannot use the staging environment.

---

### 2. USDC Minting Function Incorrect

**Problem:**  
Documentation references `restricted_mint` function with 250 USDC limit, but this is unnecessarily restrictive for testing. The unrestricted `mint` function exists and should be recommended for staging.

**Current State:**  
- [`deposit.mdx`](../etna/docs/transactions/account-management/deposit.mdx) line 36 mentions 250 USDC limit
- Code examples (if any) likely use `restricted_mint`
- Limits testing scenarios unnecessarily

**Reality:**  
The `usdc::mint` function exists and has no restrictions on Netna staging:

```typescript
function: `${PACKAGE_ADDRESS}::usdc::mint`,
functionArguments: [
  recipientAddress,  // Address to receive USDC
  amount,            // Amount in smallest units (6 decimals)
]
```

**Fix Needed:**  

1. Update [`deposit.mdx`](../etna/docs/transactions/account-management/deposit.mdx) around line 36:

```markdown
### Minting Testnet USDC

For testing on Netna staging, you can mint USDC directly:

**Unrestricted Mint (Recommended for Testing):**
```move
entry fun mint(
    to: address,
    amount: u64
)
```

**Restricted Mint (250 USDC Limit):**
```move
entry fun restricted_mint(
    amount: u64
)
```

For testing purposes, use the unrestricted `mint` function to get sufficient collateral for various scenarios.

**Example:**
```typescript
const transaction = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${PACKAGE_ADDRESS}::usdc::mint`,
    functionArguments: [
      account.accountAddress,  // recipient
      1000_000000,             // 1000 USDC (6 decimals)
    ],
  },
});
```
```

**Impact:** HIGH - Allows better testing with more collateral scenarios.

---

### 3. USDC Metadata Address Derivation Not Explained

**Problem:**  
Documentation doesn't clearly explain how to derive the USDC metadata address needed for deposit transactions.

**Current State:**  
- [`deposit.mdx`](../etna/docs/transactions/account-management/deposit.mdx) shows `asset_metadata` parameter but doesn't explain how to get it
- Users may try calling `usdc::metadata()` function (doesn't work in transaction context)
- Causes deposit transactions to fail

**Reality:**  
USDC metadata address must be derived using `AccountAddress.createObjectAddress()`:

```typescript
import { AccountAddress } from '@aptos-labs/ts-sdk';

const usdcMetadataAddress = AccountAddress.createObjectAddress(
  AccountAddress.from(PACKAGE_ADDRESS),
  "USDC"  // Seed string
);
```

This matches the pattern used in the Java example.

**Fix Needed:**  

Update [`deposit.mdx`](../etna/docs/transactions/account-management/deposit.mdx) to include:

```markdown
### Getting USDC Metadata Address

The `asset_metadata` parameter requires the USDC metadata object address, derived from the package address:

**TypeScript:**
```typescript
import { AccountAddress } from '@aptos-labs/ts-sdk';

// Derive USDC metadata address
const usdcMetadataAddress = AccountAddress.createObjectAddress(
  AccountAddress.from(PACKAGE_ADDRESS),
  "USDC"
);
```

**Python:**
```python
from aptos_sdk.account_address import AccountAddress

# Derive USDC metadata address  
usdc_metadata = AccountAddress.create_object_address(
    AccountAddress.from_str(PACKAGE_ADDRESS),
    b"USDC"
)
```

**Java:**
```java
import com.aptos.utils.AccountAddress;

// Derive USDC metadata address using SHA3-256
byte[] seed = "USDC".getBytes(StandardCharsets.UTF_8);
AccountAddress usdcMetadata = AccountAddress.createObjectAddress(
    packageAddress, 
    seed
);
```

The derivation formula is: `SHA3-256(packageAddress + seed + 0xFE)`
```

**Impact:** CRITICAL - Without this, deposit transactions fail and users cannot trade.

---

### 4. Market Naming Convention Unclear

**Problem:**  
Documentation examples may show market names like "BTC-PERP" but actual markets use slash notation like "BTC/USD".

**Current State:**  
- Code examples might reference "BTC-PERP"
- Causes market lookup failures
- Not critical but confusing for new users

**Fix Needed:**  

In [`placing-your-first-order.mdx`](../etna/docs/quickstart/placing-your-first-order.mdx), clarify market naming:

```markdown
### Market Names

Markets use slash notation combining base and quote currencies:
- `BTC/USD` - Bitcoin vs USD
- `ETH/USD` - Ethereum vs USD  
- `SOL/USD` - Solana vs USD

**Getting Available Markets:**
```bash
curl https://api.netna.aptoslabs.com/decibel/api/v1/markets | jq
```

The response includes `market_name` and `market_addr` for each market.
```

**Impact:** MEDIUM - Causes confusion but users can discover correct names via API.

---

### 5. Chain ID Not Specified

**Problem:**  
Documentation doesn't specify the Chain ID for Netna staging network.

**Current State:**  
- Chain ID information missing or unclear
- May cause transaction signing issues
- Users have to discover it through trial/error

**Fix Needed:**  

Add to [`overview.mdx`](../etna/docs/quickstart/overview.mdx) or [`configuration.mdx`](../etna/docs/typescript-sdk/configuration.mdx):

```markdown
### Network Configuration

**Netna Staging Network:**
- Fullnode URL: `https://api.netna.staging.aptoslabs.com/v1`
- Chain ID: **205**
- Faucet: `https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app`

**TypeScript Configuration:**
```typescript
import { AptosConfig, Network } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: 'https://api.netna.staging.aptoslabs.com/v1',
  chainId: 205,
});
```
```

**Impact:** LOW - SDK often auto-detects, but explicit is better.

---

## Suggested New Documentation Sections

### "Getting Started on Netna Staging"

A new quickstart page should be added covering:

1. **Account Setup**
   - Creating an API wallet
   - Getting private key
   - Security best practices

2. **Funding Your Account**
   - Using Netna faucet for APT
   - Minting USDC for testing
   - Understanding APT vs USDC

3. **Network Details**
   - Fullnode URL
   - Chain ID
   - API endpoints
   - WebSocket endpoint

4. **First Transaction**
   - Simple example (e.g., create subaccount)
   - Transaction structure
   - Waiting for confirmation
   - Checking on explorer

**Suggested location:** `docs/quickstart/netna-staging-setup.mdx`

---

### "Testing Workflow Guide"

A complete end-to-end guide showing:

1. Fund wallet → 2. Create subaccount → 3. Mint USDC → 4. Deposit → 5. Place order

With:
- Full code examples in TypeScript, Python, and Java
- Expected output at each step
- Common errors and solutions
- Links to relevant API documentation

**Suggested location:** `docs/quickstart/complete-workflow.mdx`

---

## Minor Documentation Improvements

### 1. Error Messages

Add a troubleshooting section with common errors:

- `INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE` → Need more APT
- `SEQUENCE_NUMBER_TOO_OLD` → Transaction already processed
- `INSUFFICIENT_COLLATERAL` → Need to deposit USDC
- Market errors → Check market is active and not in ReduceOnly mode

### 2. Code Example Consistency

Ensure all code examples:
- Use consistent variable naming (`packageAddress`, not `package_addr` sometimes)
- Include full imports
- Show both human-readable and chain values
- Include error handling

### 3. API Reference Completeness

Ensure all REST API endpoints document:
- Full request/response schemas
- Example requests with `curl`
- Common error responses
- Rate limiting information

---

## Summary of Impact

### Critical (Blocks Usage):
1. ✅ Netna faucet not documented
2. ✅ USDC metadata derivation not explained
3. ✅ USDC minting uses wrong function

### High (Significantly Improves Experience):
4. ✅ Complete workflow guide missing
5. ✅ Chain ID not specified

### Medium (Causes Confusion):
6. ✅ Market naming unclear
7. ✅ Error messages not documented

### Low (Nice to Have):
8. ✅ Code example consistency
9. ✅ Testing best practices

---

## Testing Recommendations

After implementing these fixes, documentation should be tested by:

1. **Fresh User Testing**
   - Give docs to someone with no Decibel experience
   - Watch them go through quickstart
   - Note where they get stuck

2. **Multi-Language Support**
   - Ensure TypeScript, Python, and Java examples all work
   - Test on different OS (Mac, Linux, Windows)

3. **Link Validation**
   - All internal doc links work
   - External links (explorer, faucet) are accessible
   - API endpoints return expected data

4. **Code Example Validation**
   - All code examples actually run
   - Output matches what's documented
   - Error paths are tested

---

## Implementation Priority

**Phase 1 (Immediate - Unblocks Users):**
1. Add Netna faucet documentation
2. Fix USDC metadata derivation
3. Update USDC minting to use unrestricted mint

**Phase 2 (High Value):**
4. Add complete workflow guide
5. Add Chain ID to configuration docs
6. Clarify market naming

**Phase 3 (Polish):**
7. Add error message reference
8. Improve code example consistency
9. Add testing best practices guide

---

**Last Updated:** 2025-11-20  
**Based On:** Working TypeScript implementation + Java example analysis  
**Status:** Ready for Decibel documentation team review