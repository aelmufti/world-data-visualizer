// Test the AIS proxy connection
import { WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_AISSTREAM_API_KEY;

console.log('🔍 Testing direct connection to AIS Stream...');
console.log('API Key:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'NOT FOUND');

const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

ws.on('open', () => {
  console.log('✅ WebSocket OPEN event fired');
  
  const subscriptionMessage = {
    APIKey: API_KEY,
    BoundingBoxes: [[[-90, -180], [90, 180]]],
    FilterMessageTypes: ["PositionReport"]
  };
  
  console.log('📡 Sending subscription...');
  ws.send(JSON.stringify(subscriptionMessage));
});

ws.on('message', (data) => {
  console.log('📨 Message received:', data.toString().substring(0, 100) + '...');
});

ws.on('error', (error) => {
  console.error('❌ WebSocket ERROR:', error);
});

ws.on('close', (code, reason) => {
  console.log('🔌 WebSocket CLOSE:', code, reason.toString());
  process.exit(0);
});

// Close after 10 seconds
setTimeout(() => {
  console.log('⏱️  Timeout - closing...');
  ws.close();
}, 10000);
