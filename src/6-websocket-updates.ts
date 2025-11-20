/**
 * Step 6: Watch Live Order Updates via WebSocket
 * 
 * This script:
 * 1. Connects to Decibel WebSocket server
 * 2. Subscribes to your order updates
 * 3. Displays real-time order state changes
 * 
 * Documentation:
 * - WebSocket URL: asyncapi.json:12-17
 * - Subscribe format: asyncapi.json:1310-1320
 * - Order updates channel: asyncapi.json:99-112
 */

import WebSocket from 'ws';
import { config } from '../utils/config';

async function main() {
  console.log('📡 Connecting to WebSocket for Live Updates\n');
  
  console.log(`WebSocket URL: ${config.WEBSOCKET_URL}`);
  console.log(`User Address:  ${config.API_WALLET_ADDRESS}\n`);
  
  // Create WebSocket connection
  const ws = new WebSocket(config.WEBSOCKET_URL);
  
  // Handle connection open
  ws.on('open', () => {
    console.log('✅ WebSocket connected!\n');
    
    // Subscribe to order updates for this user
    const subscribeMessage = {
      Subscribe: {
        topic: `order_updates:${config.API_WALLET_ADDRESS}`
      }
    };
    
    console.log('📨 Subscribing to order updates...');
    console.log(`   Topic: order_updates:${config.API_WALLET_ADDRESS}\n`);
    
    ws.send(JSON.stringify(subscribeMessage));
  });
  
  // Handle incoming messages
  ws.on('message', (data: WebSocket.Data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Check if this is a subscription confirmation
      if (message.success !== undefined) {
        if (message.success) {
          console.log('✅ Subscription confirmed!');
          console.log(`   ${message.message}\n`);
          console.log('━'.repeat(80));
          console.log('👂 Listening for order updates...');
          console.log('   (Place an order in another terminal to see updates)');
          console.log('   Press Ctrl+C to stop');
          console.log('━'.repeat(80) + '\n');
        } else {
          console.error('❌ Subscription failed:', message.message);
        }
        return;
      }
      
      // Check if this is an order update
      if (message.topic && message.topic.startsWith('order_updates:')) {
        console.log('\n' + '═'.repeat(80));
        console.log('🔔 ORDER UPDATE RECEIVED');
        console.log('═'.repeat(80));
        
        const timestamp = new Date().toISOString();
        console.log(`Time: ${timestamp}\n`);
        
        if (message.order) {
          const { status, details, order } = message.order;
          
          console.log(`Status:           ${status}`);
          console.log(`Details:          ${details || '(none)'}\n`);
          
          if (order) {
            console.log('Order Details:');
            console.log(`  Client Order ID: ${order.client_order_id}`);
            console.log(`  Order ID:       ${order.order_id}`);
            console.log(`  Market:         ${order.market}`);
            console.log(`  Type:           ${order.order_type}`);
            console.log(`  Side:           ${order.is_buy ? 'BUY' : 'SELL'}`);
            console.log(`  Price:          $${order.price?.toLocaleString() || 'N/A'}`);
            console.log(`  Original Size:  ${order.orig_size}`);
            console.log(`  Remaining:      ${order.remaining_size}`);
            console.log(`  Filled:         ${order.orig_size - order.remaining_size}`);
            
            // Status-specific messages
            if (status === 'Filled') {
              console.log('\n🎉 ORDER FILLED! Trade executed successfully!');
            } else if (status === 'Open') {
              console.log('\n📋 Order is now OPEN on the orderbook');
            } else if (status === 'PartiallyFilled') {
              console.log('\n⏳ Order PARTIALLY FILLED - watching for more fills...');
            } else if (status === 'Cancelled') {
              console.log('\n❌ Order CANCELLED');
            }
          }
        }
        
        console.log('═'.repeat(80) + '\n');
      }
      
      // Print any other messages for debugging
      else {
        console.log('📨 Message received:');
        console.log(JSON.stringify(message, null, 2));
        console.log();
      }
      
    } catch (error) {
      console.error('Error parsing message:', error);
      console.log('Raw message:', data.toString());
    }
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    console.error('\nCheck:');
    console.error('  1. WEBSOCKET_URL is correct in .env');
    console.error('  2. Network connection and firewall settings');
    console.error('  3. Server is online and accessible\n');
  });
  
  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log(`\n🔌 WebSocket closed`);
    console.log(`   Code: ${code}`);
    console.log(`   Reason: ${reason.toString() || '(none)'}\n`);
    
    if (code !== 1000) {
      console.log('💡 Connection closed unexpectedly. You can:');
      console.log('   1. Run this script again to reconnect');
      console.log('   2. Check your network connection');
      console.log('   3. Verify the server is online\n');
    } else {
      console.log('✅ Connection closed normally\n');
    }
  });
  
  // Keep the script running
  console.log('🔗 Connection initiated...\n');
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});