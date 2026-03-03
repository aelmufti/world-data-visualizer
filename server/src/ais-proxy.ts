// AIS Stream WebSocket Proxy
// Nécessaire car aisstream.io ne supporte pas les connexions directes depuis le navigateur
import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

// Connexion partagée à AIS Stream
let sharedAisWs: WebSocket | null = null;
let messageCount = 0;
const clients = new Set<WebSocket>();

export function setupAISProxy(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/api/ais-stream'
  });

  console.log('🗺️  AIS WebSocket proxy ready on /api/ais-stream');

  const API_KEY = process.env.VITE_AISSTREAM_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ VITE_AISSTREAM_API_KEY not configured');
    return wss;
  }

  // Fonction pour créer/maintenir la connexion partagée à AIS Stream
  function ensureAISConnection() {
    if (sharedAisWs && sharedAisWs.readyState === WebSocket.OPEN) {
      return; // Déjà connecté
    }

    if (sharedAisWs && sharedAisWs.readyState === WebSocket.CONNECTING) {
      return; // Connexion en cours
    }

    console.log('🔄 Creating shared AIS Stream connection...');
    sharedAisWs = new WebSocket('wss://stream.aisstream.io/v0/stream');
    
    sharedAisWs.on('open', () => {
      console.log('✅ Shared AIS Stream connection established');
      
      const subscriptionMessage = {
        APIKey: API_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]], // Couverture mondiale
        FilterMessageTypes: ["PositionReport", "ShipStaticData"] // Ajouter ShipStaticData pour avoir le type
      };
      
      sharedAisWs!.send(JSON.stringify(subscriptionMessage));
      console.log('📡 Subscription sent to AIS Stream (PositionReport + ShipStaticData)');
      
      // Notifier tous les clients connectés
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'connected',
            message: 'Connected to AIS Stream'
          }));
        }
      });
    });

    sharedAisWs.on('message', (data) => {
      // Compter les messages
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.MessageType === "PositionReport") {
          messageCount++;
          if (messageCount % 100 === 0) {
            console.log(`📊 Received ${messageCount} position reports (${clients.size} clients)`);
          }
        } else if (parsed.MessageType === "ShipStaticData") {
          console.log(`🎯 ShipStaticData received for MMSI ${parsed.MetaData.MMSI}: Type ${parsed.Message.ShipStaticData.Type}`);
        } else if (parsed.MessageType === "StaticDataReport") {
          const reportB = parsed.Message.StaticDataReport.ReportB;
          if (reportB && reportB.Valid && reportB.ShipType !== undefined) {
            console.log(`🎯 StaticDataReport received for MMSI ${parsed.MetaData.MMSI}: Type ${reportB.ShipType}`);
          }
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
      
      // Diffuser à tous les clients connectés
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data.toString());
        }
      });
    });

    sharedAisWs.on('error', (error) => {
      console.error('❌ Shared AIS Stream error:', error.message);
      
      // Notifier tous les clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'error',
            message: 'AIS Stream connection error'
          }));
        }
      });
    });

    sharedAisWs.on('close', (code, reason) => {
      console.log('🔌 Shared AIS Stream closed:', code, reason.toString() || 'No reason');
      
      // Notifier tous les clients
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'closed',
            code,
            reason: reason.toString()
          }));
        }
      });
      
      sharedAisWs = null;
      
      // Reconnecter après 5 secondes si des clients sont toujours connectés
      if (clients.size > 0) {
        console.log('🔄 Reconnecting in 5 seconds...');
        setTimeout(ensureAISConnection, 5000);
      }
    });
  }

  wss.on('connection', (clientWs) => {
    console.log(`👤 Client connected to AIS proxy (${clients.size + 1} total)`);
    
    // Ajouter le client à la liste
    clients.add(clientWs);
    
    // S'assurer que la connexion AIS est active
    ensureAISConnection();
    
    // Si déjà connecté, notifier immédiatement le client
    if (sharedAisWs && sharedAisWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ 
        type: 'connected',
        message: 'Connected to AIS Stream'
      }));
    }

    clientWs.on('close', () => {
      clients.delete(clientWs);
      console.log(`👤 Client disconnected from AIS proxy (${clients.size} remaining)`);
      
      // Si plus aucun client, fermer la connexion AIS après 30 secondes
      if (clients.size === 0) {
        console.log('⏱️  No more clients - will close AIS connection in 30s if no reconnection');
        setTimeout(() => {
          if (clients.size === 0 && sharedAisWs) {
            console.log('🔌 Closing shared AIS connection (no clients)');
            sharedAisWs.close();
            sharedAisWs = null;
          }
        }, 30000);
      }
    });

    clientWs.on('error', (error) => {
      console.error('Client WebSocket error:', error.message);
      clients.delete(clientWs);
    });
  });

  return wss;
}
