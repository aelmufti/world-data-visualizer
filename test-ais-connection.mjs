// Test de connexion AIS Stream
import WebSocket from 'ws';

const API_KEY = process.env.AIS_API_KEY || '';

if (!API_KEY) {
  console.error('❌ Error: AIS_API_KEY environment variable is not set');
  console.log('💡 Usage: AIS_API_KEY=your_key_here node test-ais-connection.mjs');
  process.exit(1);
}

console.log('🔍 Testing AIS Stream connection...');
console.log('API Key:', API_KEY.substring(0, 10) + '...');

const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

ws.on('open', () => {
  console.log('✅ WebSocket connected!');
  
  const subscriptionMessage = {
    APIKey: API_KEY,
    BoundingBoxes: [[[-90, -180], [90, 180]]],
    FilterMessageTypes: ["PositionReport"]
  };
  
  console.log('📡 Sending subscription...');
  ws.send(JSON.stringify(subscriptionMessage));
  
  // Close after 5 seconds
  setTimeout(() => {
    console.log('⏱️  Test complete - closing connection');
    ws.close();
    process.exit(0);
  }, 5000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📨 Message received:', message.MessageType || 'Unknown');
    if (message.MessageType === 'PositionReport') {
      console.log('🚢 Ship detected:', message.MetaData?.ShipName || message.MetaData?.MMSI);
    }
  } catch (err) {
    console.log('📨 Raw message:', data.toString().substring(0, 100));
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('🔌 WebSocket closed:', code, reason.toString() || 'No reason');
  
  if (code === 1006) {
    console.log('\n⚠️  Code 1006 means:');
    console.log('   - Invalid API key');
    console.log('   - Server rejected the connection');
    console.log('   - Network/firewall issue');
    console.log('\n💡 Solutions:');
    console.log('   1. Verify API key on https://aisstream.io');
    console.log('   2. Check if key is active');
    console.log('   3. Try regenerating the key');
  }
  
  process.exit(code === 1000 ? 0 : 1);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏱️  Timeout - no connection after 10 seconds');
  ws.close();
  process.exit(1);
}, 10000);
