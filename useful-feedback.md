# Decibel Documentation Feedback & Fixes

**Status:** Ready for Review  
**Date:** 2025-01-27  
**Context:** Based on building a complete end-to-end TypeScript starter kit ([`testetna`](.)) and analyzing the official Java example.

---

## 1. Executive Summary

Successfully built a working "Quick Win" implementation that goes from zero to a placed order on the Netna staging network. However, achieving this required discovering critical infrastructure details (faucet, unrestricted minting, chain ID) that are currently missing or incorrect in the official documentation.

## 2. Critical Blockers

These issues prevent a user from even starting.

### A. Netna Faucet Not Documented
**Issue:** Users need APT for gas fees, but the [docs](https://docs.decibel.trade/quickstart/overview) don't explain how to get it on the Netna staging network (and what the difference is between the different nets, and how the aptos-sdk / cli / decibel-ts-sdk work).
**Reality:** There is a private faucet available.
**Reference Implementation:** See [`src/0-fund-wallet.ts`](src/0-fund-wallet.ts) for working faucet code.
**Recommended Update:** Add a "Funding Your Account" section to the [Quickstart docs](https://docs.decibel.trade/quickstart/overview). 

**Faucet Details:**
- URL: `https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app`
- Method: `POST /mint?amount=10000000000&address={ADDRESS_WITHOUT_0x}`

### B. USDC Minting Undocumented
**Issue:** Users need USDC collateral to trade, but minting functions are not documented in the [official docs](https://docs.decibel.trade).
**Reality:**
- `usdc::restricted_mint` exists (250 limit)
- `usdc::mint` exists (unlimited, recommended for testing)
**Reference Implementation:** See [`src/3-mint-usdc.ts`](src/3-mint-usdc.ts) for working mint code.
**Recommended Update:** Document the `usdc::mint` function for testnet collateral in the transactions section.

### C. USDC Metadata Derivation
**Issue:** The `deposit_to_subaccount_at` function requires a `asset_metadata` address, but [docs only show a placeholder](https://docs.decibel.trade/transactions/account-management/deposit) `"0x456...def"` with no explanation of how to derive it.

**Reality:** This address can be derived deterministically using `createObjectAddress` from `@aptos-labs/ts-sdk`, similar to how market addresses and subaccount addresses are derived (see [Transactions Overview - Helper Functions](https://docs.decibel.trade/transactions/overview#helper-functions)).

**Reference Implementation:** See [`src/4-deposit-usdc.ts`](src/4-deposit-usdc.ts#L65-L78) for working code that derives the USDC metadata address.

**Recommended Update:** Add a "Get USDC Metadata Address" helper function example in the [deposit guide](https://docs.decibel.trade/transactions/account-management/deposit), matching the pattern used for market addresses.

```typescript
import { AccountAddress, createObjectAddress } from "@aptos-labs/ts-sdk";

// Derive USDC metadata address deterministically
// Formula: SHA3-256(packageAddress + "USDC" + 0xFE)
const usdcMetadataAddress = createObjectAddress(
  AccountAddress.fromString(PACKAGE_ADDRESS),
  new TextEncoder().encode("USDC")
);

// Use this as the asset_metadata argument in deposit_to_subaccount_at
```

## 3. Documentation Gaps & Inaccuracies

### A. Chain ID
- **Docs say:** `chainId: 204` (in [configuration examples](https://docs.decibel.trade/typescript-sdk/configuration#custom-config-example))
- **Reality:** Netna staging chain ID changes periodically (currently **206**, but was **205**). Hardcoded values break when the network resets.
- **Validation:** The [Java example](https://github.com/kent-white/java-example/) uses `chain.id=205` and fails with `BAD_CHAIN_ID` error when run, confirming this issue.
- **Recommendation:** Update examples to use auto-detection (`Network.CUSTOM` without explicit ID) and/or note that the ID changes and should be queried from the network.

### B. Subaccount Helper
- **Docs:** [`create-subaccount` guide](https://docs.decibel.trade/transactions/account-management/create-subaccount) doesn't mention how to get the address after creation.
- **Reality:** A helper `getPrimarySubaccountAddr` exists (documented in [Transactions Overview](https://docs.decibel.trade/transactions/overview#get-primary-subaccount-address) but not linked).
- **Reference Implementation:** See [`utils/client.ts`](utils/client.ts#L84-L98) for working implementation.
- **Recommendation:** Link to the helper method in the [`create-subaccount` guide](https://docs.decibel.trade/transactions/account-management/create-subaccount).

### C. Complete Workflow
- **Docs:** Individual transaction examples ([Place Order](https://docs.decibel.trade/transactions/order-management/place-order), [Deposit](https://docs.decibel.trade/transactions/account-management/deposit), etc.) are isolated.
- **Reality:** Users need a connected flow: `Fund APT -> Create Subaccount -> Mint USDC -> Deposit USDC -> Place Order`.
- **Reference Implementation:** See [`testetna/src/`](src/) for a complete working example:
  - [`0-fund-wallet.ts`](src/0-fund-wallet.ts) - Fund APT
  - [`2-create-subaccount.ts`](src/2-create-subaccount.ts) - Create subaccount
  - [`3-mint-usdc.ts`](src/3-mint-usdc.ts) - Mint USDC
  - [`4-deposit-usdc.ts`](src/4-deposit-usdc.ts) - Deposit USDC
  - [`5-place-order.ts`](src/5-place-order.ts) - Place order
- **Recommendation:** Add a "Complete Workflow" guide connecting these steps to the [Quickstart section](https://docs.decibel.trade/quickstart/overview).

## 4. Proposed Documentation Updates

### Update: [`placing-your-first-order.mdx`](https://docs.decibel.trade/quickstart/placing-your-first-order)

**Add Prerequisites Section:**

```markdown
### Prerequisites

Before placing an order, you need:
1. **APT for Gas:** Use the Netna Faucet:
   `curl -X POST 'https://faucet-dev-netna-us-central1-410192433417.us-central1.run.app/mint?amount=10000000000&address=YOUR_ADDRESS'`
2. **USDC Collateral:** Mint testnet USDC:
   - Function: `0x...::usdc::mint`
   - Arguments: `[recipient_address, amount]`
3. **Trading Subaccount:** Create one using `dex_accounts::create_new_subaccount`.
4. **Deposit:** Move USDC to your subaccount using `dex_accounts::deposit_to_subaccount_at`.
```

### Update: [`deposit.mdx`](https://docs.decibel.trade/transactions/account-management/deposit)

**Add Metadata Derivation Example:**

Add a new "Get USDC Metadata Address" helper section (similar to the "Get Market Address" pattern in [Transactions Overview](https://docs.decibel.trade/transactions/overview#get-market-address)):

```typescript
import { AccountAddress, createObjectAddress } from "@aptos-labs/ts-sdk";

function getUsdcMetadataAddress(packageAddress: string): AccountAddress {
  return createObjectAddress(
    AccountAddress.fromString(packageAddress),
    new TextEncoder().encode("USDC")
  );
}

// Use in deposit transaction:
const usdcMetadata = getUsdcMetadataAddress(PACKAGE_ADDRESS);
```

Then update the example to use this helper instead of the placeholder `"0x456...def"`.

## 5. Technical Insights from Java Example

The official [Java example](https://github.com/kent-white/java-example/) served as a useful reference to build the typescript quick-win.

1.  **Unrestricted Mint:** It uses `usdc::mint` (unlimited) instead of `restricted_mint` (250 cap). 
    - Java implementation: [`DecibelTransactions.java`](https://github.com/kent-white/java-example/blob/main/src/main/java/com/decibel/DecibelTransactions.java#L25-L65) calls `usdc::mint`
    - TypeScript implementation: [`src/3-mint-usdc.ts`](src/3-mint-usdc.ts) for implementation.
2.  **Automated Setup:** It implements a "one-click" setup that funds, mints, and deposits automatically. 
    - Java implementation: [`InputUtils.java`](https://github.com/kent-white/java-example/blob/main/src/main/java/com/decibel/InputUtils.java#L41-L81) shows the complete automated flow
    - We replicated this pattern in [`testetna`](.)
3.  **Address Derivation:** It explicitly shows the SHA3-256 derivation logic for subaccounts and assets. 
    - Java implementation: [`DecibelUtils.java`](https://github.com/kent-white/java-example/blob/main/src/main/java/com/decibel/DecibelUtils.java#L64-L101) shows both `getPrimarySubaccountAddr()` and `createObjectAddress()` with SHA3-256
    - TypeScript implementation: See [`utils/client.ts`](utils/client.ts#L48-L82) for implementation.

## 6. Next Steps

1.  **Update Docs:** Apply the fixes above to [`etna/docs`](../etna/docs).
2.  **Publish Starter Kit:** The [`testetna`](.) repo is now a valid "Reference Implementation" for TypeScript users.

