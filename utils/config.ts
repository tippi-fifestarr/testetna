import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

/**
 * Configuration values for Decibel trading
 * All values loaded from .env file with fallbacks to documented defaults
 * 
 * Documentation references:
 * - Package address: beginner-setup-guide.md, .env.example:28
 * - Network URLs: placing-your-first-order.mdx:34, api-reference.mdx:37-39
 */

export const config = {
  // Blockchain Configuration
  PACKAGE_ADDRESS: process.env.PACKAGE_ADDRESS || '0xb8a5788314451ce4d2fbbad32e1bad88d4184b73943b7fe5166eab93cf1a5a95',
  FULLNODE_URL: process.env.FULLNODE_URL || 'https://api.netna.staging.aptoslabs.com/v1',
  
  // Account Credentials
  API_WALLET_ADDRESS: process.env.API_WALLET_ADDRESS || '0xb540c13b3aab3966fd4c505bfd3851aed2f9983938ed4e89570a5234db65ff2',
  API_WALLET_PRIVATE_KEY: process.env.API_WALLET_PRIVATE_KEY || '',
  
  // API Configuration
  REST_API_BASE_URL: process.env.REST_API_BASE_URL || 'https://api.netna.aptoslabs.com/decibel',
  WEBSOCKET_URL: process.env.WEBSOCKET_URL || 'wss://api.netna.aptoslabs.com/decibel/ws',
  
  // Optional Configuration
  SUBACCOUNT_ADDRESS: process.env.SUBACCOUNT_ADDRESS || '',
  MARKET_ADDRESS: process.env.MARKET_ADDRESS || '',
  MARKET_NAME: process.env.MARKET_NAME || 'BTC-PERP',
};

/**
 * Validates that all required configuration values are present
 * @throws Error if critical values are missing
 */
export function validateConfig(): void {
  const errors: string[] = [];
  
  if (!config.API_WALLET_PRIVATE_KEY) {
    errors.push('❌ API_WALLET_PRIVATE_KEY is required in .env file');
  }
  
  if (!config.PACKAGE_ADDRESS) {
    errors.push('❌ PACKAGE_ADDRESS is required in .env file');
  }
  
  // Validate private key format (should start with 0x and be 66 characters)
  if (config.API_WALLET_PRIVATE_KEY && !config.API_WALLET_PRIVATE_KEY.startsWith('0x')) {
    errors.push('⚠️ API_WALLET_PRIVATE_KEY should start with 0x');
  }
  
  if (errors.length > 0) {
    console.error('\n🚨 Configuration errors found:\n');
    errors.forEach(error => console.error(error));
    console.error('\n💡 Please check your .env file and ensure all required values are set.\n');
    throw new Error('Configuration validation failed');
  }
}

/**
 * Prints current configuration (with secrets masked)
 */
export function printConfig(): void {
  console.log('\n📋 Current Configuration:');
  console.log('━'.repeat(60));
  console.log(`Package Address:    ${config.PACKAGE_ADDRESS}`);
  console.log(`Fullnode URL:       ${config.FULLNODE_URL}`);
  console.log(`API Wallet:         ${config.API_WALLET_ADDRESS}`);
  console.log(`Private Key:        ${config.API_WALLET_PRIVATE_KEY ? '****' + config.API_WALLET_PRIVATE_KEY.slice(-8) : '❌ NOT SET'}`);
  console.log(`REST API:           ${config.REST_API_BASE_URL}`);
  console.log(`WebSocket:          ${config.WEBSOCKET_URL}`);
  
  if (config.SUBACCOUNT_ADDRESS) {
    console.log(`Subaccount:         ${config.SUBACCOUNT_ADDRESS}`);
  }
  if (config.MARKET_ADDRESS) {
    console.log(`Market:             ${config.MARKET_NAME} (${config.MARKET_ADDRESS})`);
  }
  console.log('━'.repeat(60) + '\n');
}