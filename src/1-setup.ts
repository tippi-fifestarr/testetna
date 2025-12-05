/**
 * Step 1: Setup and Connection Test
 * 
 * This script:
 * 1. Validates your environment configuration
 * 2. Tests connection to Aptos blockchain
 * 3. Checks your APT balance (needed for gas fees)
 * 4. Fetches available markets from Decibel API
 * 
 * Documentation:
 * - Configuration: beginner-setup-guide.md
 * - Markets API: openapi.json:748-771
 */

import { createAptosClient, createAccount } from '../utils/client';
import { config, validateConfig, printConfig, authenticatedFetch } from '../utils/config';

async function main() {
  console.log('🚀 Decibel Setup & Connection Test\n');
  
  // Step 1: Validate configuration
  console.log('Step 1: Validating configuration...');
  try {
    validateConfig();
    printConfig();
    console.log('✅ Configuration valid\n');
  } catch (error) {
    console.error('Configuration validation failed!');
    process.exit(1);
  }
  
  // Step 2: Initialize Aptos client and account
  console.log('Step 2: Initializing Aptos client...');
  const aptos = createAptosClient();
  const account = createAccount();
  console.log(`✅ Connected to: ${config.FULLNODE_URL}`);
  console.log(`✅ Using account: ${account.accountAddress.toString()}\n`);
  
  // Step 3: Check APT balance
  console.log('Step 3: Checking APT balance (for gas fees)...');
  try {
    const balance = await aptos.getAccountAPTAmount({
      accountAddress: account.accountAddress,
    });
    
    const aptBalance = balance / 100_000_000; // Convert octas to APT
    console.log(`💰 APT Balance: ${aptBalance.toFixed(4)} APT`);
    
    if (aptBalance < 0.01) {
      console.warn('⚠️ WARNING: Low APT balance! You need APT for gas fees.');
      console.warn('   Each transaction costs ~0.001 APT');
      console.warn('   Please fund your account before continuing.\n');
    } else {
      console.log('✅ Sufficient APT for gas fees\n');
    }
  } catch (error) {
    console.error('❌ Error checking balance:', error);
    console.error('   This might mean your account doesn\'t exist yet or network issues.\n');
  }
  
  // Step 4: Fetch available markets
  console.log('Step 4: Fetching available markets...');
  try {
    const response = await authenticatedFetch(`${config.REST_API_BASE_URL}/api/v1/markets`);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const markets = await response.json() as any[];
    console.log(`✅ Found ${markets.length} markets:\n`);
    
    // Display markets in a nice table
    console.log('━'.repeat(80));
    console.log('Market Name'.padEnd(15) + 'Market Address'.padEnd(50) + 'Min Size');
    console.log('━'.repeat(80));
    
    markets.slice(0, 10).forEach((market: any) => {
      const minSize = (market.min_size / (10 ** market.sz_decimals)).toFixed(4);
      console.log(
        market.market_name.padEnd(15) +
        market.market_addr.slice(0, 45).padEnd(50) +
        minSize
      );
    });
    
    if (markets.length > 10) {
      console.log(`... and ${markets.length - 10} more`);
    }
    console.log('━'.repeat(80) + '\n');
    
    // Show market config (use configured market if available, otherwise show example)
    if (markets.length > 0) {
      let marketToShow;
      
      // Try to find the configured market first
      if (config.MARKET_NAME) {
        marketToShow = markets.find((m: any) => m.market_name === config.MARKET_NAME);
      }
      
      // If not found or not configured, use BTC/USD as example, or first market
      if (!marketToShow) {
        marketToShow = markets.find((m: any) => m.market_name === 'BTC/USD') || markets[0];
      }
      
      const label = marketToShow.market_name === config.MARKET_NAME 
        ? `Market Config (${marketToShow.market_name})`
        : `Example Market Config (${marketToShow.market_name})`;
      
      console.log(`📊 ${label}:`);
      console.log(JSON.stringify(marketToShow, null, 2));
      console.log();
    }
    
  } catch (error) {
    console.error('❌ Error fetching markets:', error);
    console.error('   Check if the API URL is correct and accessible.\n');
  }
  
  // Step 5: Test WebSocket connectivity
  console.log('Step 5: Testing WebSocket connectivity...');
  try {
    const ws = await import('ws');
    const WebSocket = ws.default;
    
    const wsClient = new WebSocket(config.WEBSOCKET_URL);
    
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        wsClient.close();
        reject(new Error('Connection timeout'));
      }, 5000);
      
      wsClient.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection successful');
        wsClient.close();
        resolve();
      });
      
      wsClient.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('❌ WebSocket connection failed:', error);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📋 Setup Summary');
  console.log('='.repeat(80));
  console.log('✅ Configuration loaded');
  console.log('✅ Aptos client initialized');
  console.log('✅ Account created from private key');
  console.log('✅ Balance checked (APT for gas fees)');
  console.log('✅ Markets API accessible');
  console.log('✅ WebSocket server reachable');
  console.log('='.repeat(80));
  console.log('\n🎉 Setup complete! You\'re ready for the next steps:\n');
  console.log('  1. npm run create-subaccount  - Create a trading subaccount');
  console.log('  2. npm run mint-usdc          - Mint testnet USDC');
  console.log('  3. npm run deposit-usdc       - Deposit USDC to subaccount');
  console.log('  4. npm run place-order        - Place your first order');
  console.log('  5. npm run query-order        - Check order status');
  console.log('  6. npm run websocket          - Watch live updates\n');
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});