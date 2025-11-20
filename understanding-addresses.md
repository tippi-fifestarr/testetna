# Understanding Addresses in the Decibel Ecosystem

> **Quick Answer to Your Question:** ❌ No, the "package" address is **NOT** the same as your API wallet address. They are completely different things! Read below to understand why.

---

## 🎯 The Four Types of Addresses (with Simple Analogies)

Think of the Decibel ecosystem like a banking system. Here are the four different "addresses" you need to understand:

### 1. 🏢 **Package Address** (Smart Contract Address)
**What it is:** The address where the Decibel protocol's smart contract code lives on the blockchain

**Analogy:** This is like the **address of the bank building itself** (e.g., "123 Wall Street"). It's where all the bank's rules and systems are located.

**Example:** Something like `0x1234...abcd` (you need to get this from Decibel team)

**Used for:** Telling your code "where is the Decibel trading system located on the blockchain"

---

### 2. 👤 **API Wallet Address**
**What it is:** A special wallet created just for automated trading through the API

**Analogy:** This is like a **special trading-only bank account** that can only do specific things (trade, but can't withdraw money).

**Your API Wallet Addresses:**
- `app.decibel.trade`: [`0x2d9bdf7768c099cf1c33d3b07334745910731116e552cc8f70262bbba994a79b9`](link)
- `testenta`: [`0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2`](link)

**Used for:** This is the address that will actually execute your trades on Decibel

---

### 3. 🔑 **API Wallet Private Key**
**What it is:** The secret key that proves you control the API wallet

**Analogy:** This is like the **password to your trading-only account**. Without it, you can't sign transactions.

**Your Private Key:** You already have this! (Keep it secret!)

**Used for:** Signing transactions in your code to prove you control the API wallet

---

### 4. 💰 **Petra Wallet** (Your Main Account)
**What it is:** Your primary wallet that holds your actual funds

**Analogy:** This is like your **main bank account** where your money lives.

**Your Petra Wallet:** `Primary 0xe106...02f44` (with testnet funds)

**Used for:** 
- Holding your funds
- Creating and funding API wallets
- Signing in to Decibel to create API wallets
- **NOT** used in your trading code

---

## 🔄 How They All Connect: The Relationship

```
┌─────────────────────────────────────────────────────────────┐
│                    DECIBEL BLOCKCHAIN                       │
│                                                             │
│  🏢 Package Address (Smart Contract)                       │
│     "The Decibel protocol lives here"                      │
│     Example: 0x1234...abcd                                 │
│     ↓ This is where your trades are processed              │
└─────────────────────────────────────────────────────────────┘
           ↓
           ↓ Your code connects to the package
           ↓
┌─────────────────────────────────────────────────────────────┐
│  👤 API Wallet Address                                      │
│     "Your trading account"                                  │
│     Your address: 0xb540...65ff2                           │
│     ↓ This wallet executes trades                          │
│                                                             │
│  🔑 API Wallet Private Key                                 │
│     "Password for the trading account"                     │
│     ↓ Used in your code to sign transactions               │
└─────────────────────────────────────────────────────────────┘
           ↑
           ↑ Created by and funded from
           ↑
┌─────────────────────────────────────────────────────────────┐
│  💰 Petra Wallet                                           │
│     "Your main bank account"                               │
│     Your address: 0xe106...02f44                           │
│     - Holds your testnet funds                             │
│     - Used to create API wallet                            │
│     - Used to sign in to Decibel website                   │
│     - NOT used in trading code                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Answering Your Specific Questions

### ❓ "Could package be the wallet address for api wallet?"

**❌ NO!** The package address and API wallet address are completely different:

- **Package Address** = Where the Decibel smart contract code lives (like the bank building's address)
- **API Wallet Address** = Your trading account (like your account number at that bank)

They serve totally different purposes!

### ✅ What You Already Have:

1. **API Wallet Addresses:** 
   - `testenta`: [`0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2`](link)
   - `app.decibel.trade`: [`0x2d9bdf7...94a79b9`](link)

2. **API Wallet Private Key:** ✅ You have this

3. **Petra Wallet with Testnet Funds:** ✅ You have this ([`0xe106...02f44`](link))

### ❓ What You Still Need:

1. **Package Address:** ❌ You need to get this from the Decibel team
   - Ask them: "What is the package address for the Decibel protocol on testnet?"
   - Or check their documentation
   - It might be in their SDK configuration

---

## 📍 Where to Find Each Address

| What | Where to Find It | Status |
|------|------------------|--------|
| 🏢 Package Address | Decibel docs or ask Decibel team | ❓ Need to get this |
| 👤 API Wallet Address | From Decibel dashboard (you have it!) | ✅ `0xb540...65ff2` |
| 🔑 API Wallet Private Key | When you created the API wallet (you have it!) | ✅ Got it |
| 💰 Petra Wallet Address | In your Petra wallet extension | ✅ `0xe106...02f44` |

---

## 🔒 Security Notes: Why This Setup?

### Why Have a Separate API Wallet?

The API wallet has **LIMITED permissions** for safety:

✅ **CAN do:**
- Place trades
- Cancel orders
- Read your positions

❌ **CANNOT do:**
- Withdraw funds from your account
- Transfer funds out
- Access your main Petra wallet

**Why this matters:** If someone somehow gets your API wallet private key, they can mess with your trades, but they **cannot steal your funds**. Your actual money stays safe in your Petra wallet!

### Security Best Practices:

1. **Keep your API wallet private key in your code** (environment variables)
2. **Keep your Petra wallet private key OUT of your code** (never needed for trading)
3. **Only fund your API wallet with what you need for trading**
4. **Your Petra wallet is your "vault"** - keep the bulk of funds there

---

## 🎯 What You Should Do Now

### Step 1: Choose Which API Wallet to Use
For testing, use: **`testenta`** wallet
- Address: [`0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2`](link)

### Step 2: Get the Package Address
**You need this!** Without it, your code won't know where to find Decibel's smart contract.

**How to get it:**
- Option A: Check Decibel's documentation (might be in SDK setup)
- Option B: Ask Decibel team directly: "What's the package address for testnet?"
- Option C: Look in their TypeScript SDK code - it might be hardcoded

### Step 3: Set Up Your Code

Once you have the package address, here's what goes where:

```javascript
// In your code configuration (e.g., .env file or config)

// 1. Package Address (from Decibel team)
PACKAGE_ADDRESS=0x1234...abcd  // ← You need to get this!

// 2. API Wallet Address (you already have)
API_WALLET_ADDRESS=0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2

// 3. API Wallet Private Key (you already have)
API_WALLET_PRIVATE_KEY=your-private-key-here  // KEEP SECRET!

// Note: Petra wallet is NOT used in code!
```

### Step 4: Keep Your Petra Wallet Separate
- Use Petra wallet to manage funds
- Use Petra wallet to sign in to Decibel website
- **DO NOT** put your Petra private key in your trading code
- Your Petra wallet is just for funding - not for executing trades

---

## 📊 Quick Reference Table

| Item | What Is It? | Your Value | Where It's Used |
|------|-------------|------------|-----------------|
| 🏢 Package | Smart contract location | ❓ **Need to get** | In your code config |
| 👤 API Wallet | Trading account address | `0xb540...65ff2` | In your code config |
| 🔑 Private Key | Password for API wallet | ✅ You have it | In your code (secret!) |
| 💰 Petra | Your main funds wallet | `0xe106...02f44` | For funding only |

---

## 🎉 Good News: You're Almost There!

You have **3 out of 4** things you need:
- ✅ API wallet address
- ✅ API wallet private key
- ✅ Petra wallet with funds

You just need:
- ❓ Package address (from Decibel)

Once you get the package address, you'll have everything needed to start trading programmatically!

---

## 💡 Summary

Think of it this way:

1. **Package Address** = The Decibel exchange building
2. **API Wallet** = Your trading desk at that exchange
3. **Private Key** = Your ID badge to access your trading desk
4. **Petra Wallet** = Your safe at home where you keep your money

You send money from your safe (Petra) to fund your trading desk (API wallet), then your trading desk does business at the exchange (Package), using your ID badge (Private Key) to prove it's really you.

**Package ≠ API Wallet** - They're completely different parts of the system!

---

## ❓ Still Confused?

If you're still unsure about something, here are the key takeaways:

1. Package address is the Decibel protocol address (not your wallet)
2. API wallet is your personal trading wallet
3. These are different addresses with different purposes
4. You need both to trade on Decibel
5. Your Petra wallet stays safe and separate from your trading code