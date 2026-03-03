// Test direct de l'API AIS Stream
import { WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.VITE_AISSTREAM_API_KEY;

console.log('🔍 Testing AIS Stream API...');
console.log('API Key:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'NOT FOUND');

if (!API_KEY) {
  console.error('❌ VITE_AISSTREAM_API_KEY not found in .env');
  process.exit(1);
}

const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

let messageCount = 0;
let vesselCount = 0;

ws.on('open', () => {
  console.log('✅ Connected to AIS Stream!');
  
  const subscriptionMessage = {
    APIKey: API_KEY,
    BoundingBoxes: [[[-90, -180], [90, 180]]], // Global
    FilterMessageTypes: ["PositionReport"]
  };
  
  ws.send(JSON.stringify(subscriptionMessage));
  console.log('📡 Subscription sent (global coverage)');
  console.log('⏳ Waiting for messages (will run for 30 seconds)...\n');
});

ws.on('message', (data) => {
  messageCount++;
  
  try {
    const message = JSON.parse(data.toString());
    
    if (message.MessageType === 'PositionReport') {
      vesselCount++;
      const metadata = message.MetaData;
      const position = message.Message.PositionReport;
      
      console.log(`🚢 Vessel #${vesselCount}:`);
      console.log(`   Name: ${metadata.ShipName || 'Unknown'}`);
      console.log(`   MMSI: ${metadata.MMSI}`);
      console.log(`   Type: ${metadata.ShipType || 'Unknown'}`);
      console.log(`   Position: ${position.Latitude.toFixed(4)}°, ${position.Longitude.toFixed(4)}°`);
      console.log(`   Speed: ${position.Sog} knots`);
      console.log('');
    }
  } catch (err) {
    console.error('Error parsing message:', err.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log('\n🔌 Connection closed');
  console.log('   Code:', code);
  console.log('   Reason:', reason.toString() || 'No reason provided');
  console.log('\n📊 Statistics:');
  console.log(`   Total messages: ${messageCount}`);
  console.log(`   Vessels detected: ${vesselCount}`);
  
  if (vesselCount === 0) {
    console.log('\n⚠️  No vessels detected. Possible reasons:');
    console.log('   - API key is invalid');
    console.log('   - No vessels transmitting in the time window');
    console.log('   - Connection closed too quickly');
  } else {
    console.log('\n✅ API is working correctly!');
  }
  
  process.exit(code === 1000 ? 0 : 1);
});

// Run for 30 seconds then close
setTimeout(() => {
  console.log('\n⏱️  30 seconds elapsed - closing connection...');
  ws.close();
}, 30000);
