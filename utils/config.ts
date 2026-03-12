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

/**
 * Network presets. NETWORK env var selects which to use.
 * Override individual values in .env if needed.
 */
const NETWORK_PRESETS: Record<string, { packageAddress: string; fullnodeUrl: string; restApiBaseUrl: string; websocketUrl: string }> = {
  testnet: {
    packageAddress: '0xe7da2794b1d8af76532ed95f38bfdf1136abfd8ea3a240189971988a83101b7f',
    fullnodeUrl: 'https://api.testnet.aptoslabs.com/v1',
    restApiBaseUrl: 'https://api.testnet.aptoslabs.com/decibel',
    websocketUrl: 'wss://api.testnet.aptoslabs.com/decibel/ws',
  },
  mainnet: {
    packageAddress: '', // TODO: add mainnet package address when deployed
    fullnodeUrl: 'https://api.mainnet.aptoslabs.com/v1',
    restApiBaseUrl: 'https://api.mainnet.aptoslabs.com/decibel',
    websocketUrl: 'wss://api.mainnet.aptoslabs.com/decibel/ws',
  },
};

const network = process.env.NETWORK || 'testnet';
const preset = NETWORK_PRESETS[network] || NETWORK_PRESETS.testnet;

export const config = {
  // Network
  NETWORK: network,

  // Blockchain Configuration (env overrides preset)
  PACKAGE_ADDRESS: process.env.PACKAGE_ADDRESS || preset.packageAddress,
  FULLNODE_URL: process.env.FULLNODE_URL || preset.fullnodeUrl,

  // Account Credentials
  API_WALLET_ADDRESS: process.env.API_WALLET_ADDRESS || '',
  API_WALLET_PRIVATE_KEY: process.env.API_WALLET_PRIVATE_KEY || '',

  // API Configuration (env overrides preset)
  REST_API_BASE_URL: process.env.REST_API_BASE_URL || preset.restApiBaseUrl,
  WEBSOCKET_URL: process.env.WEBSOCKET_URL || preset.websocketUrl,
  API_BEARER_TOKEN: process.env.API_BEARER_TOKEN || '',

  // Optional Configuration
  SUBACCOUNT_ADDRESS: process.env.SUBACCOUNT_ADDRESS || '',
  MARKET_ADDRESS: process.env.MARKET_ADDRESS || '',
  MARKET_NAME: process.env.MARKET_NAME || 'BTC/USD',
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
  
  // Validate private key format (accepts 0x... or ed25519-priv-0x... formats)
  if (config.API_WALLET_PRIVATE_KEY &&
      !config.API_WALLET_PRIVATE_KEY.startsWith('0x') &&
      !config.API_WALLET_PRIVATE_KEY.startsWith('ed25519-priv-')) {
    errors.push('⚠️ API_WALLET_PRIVATE_KEY should start with 0x or ed25519-priv-0x');
  }
  
  // API Bearer Token is required for REST API calls (get from geomi.dev)
  if (!config.API_BEARER_TOKEN) {
    errors.push('❌ API_BEARER_TOKEN is required in .env file (get from https://geomi.dev)');
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
  console.log(`API Bearer Token:   ${config.API_BEARER_TOKEN ? '****' + config.API_BEARER_TOKEN.slice(-8) : '❌ NOT SET'}`);
  
  if (config.SUBACCOUNT_ADDRESS) {
    console.log(`Subaccount:         ${config.SUBACCOUNT_ADDRESS}`);
  }
  if (config.MARKET_ADDRESS) {
    console.log(`Market:             ${config.MARKET_NAME} (${config.MARKET_ADDRESS})`);
  }
  console.log('━'.repeat(60) + '\n');
}

/**
 * Makes an authenticated fetch request to the Decibel API
 * Automatically includes the Bearer token if API_BEARER_TOKEN is configured
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  
  if (config.API_BEARER_TOKEN) {
    headers.set('Authorization', `Bearer ${config.API_BEARER_TOKEN}`);
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}