// AIS Stream WebSocket Proxy
// Nécessaire car aisstream.io ne supporte pas les connexions directes depuis le navigateur
import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';

// Connexion partagée à AIS Stream
let sharedAisWs: WebSocket | null = null;
let messageCount = 0;
let isConnecting = false; // 🔧 FIX: flag pour éviter les connexions multiples simultanées
const clients = new Set<WebSocket>();

export function setupAISProxy(server: Server) {
  const wss = new WebSocketServer({ noServer: true });
  const aisPath = '/api/ais-stream';

  const API_KEY = process.env.VITE_AISSTREAM_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ VITE_AISSTREAM_API_KEY not configured');
    return wss;
  }

  // Handle upgrade requests for AIS stream
  server.on('upgrade', (request, socket, head) => {
    if (request.url === aisPath) {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit('connection', clientWs, request);
      });
    }
  });

  // Fonction pour créer/maintenir la connexion partagée à AIS Stream
  function ensureAISConnection() {
    if (sharedAisWs && sharedAisWs.readyState === WebSocket.OPEN) {
      return;
    }

    // 🔧 FIX: utiliser le flag isConnecting au lieu de vérifier readyState
    // car sharedAisWs peut être réassigné pendant que l'ancien est encore en CONNECTING
    if (isConnecting) {
      return;
    }

    isConnecting = true;
    console.log('🔄 Creating shared AIS Stream connection...');

    // 🔧 FIX: référence locale pour éviter le bug de réassignation
    // sharedAisWs peut changer de valeur avant que les événements se déclenchent
    const aisWs = new WebSocket('wss://stream.aisstream.io/v0/stream');
    sharedAisWs = aisWs;
    
    aisWs.on('open', () => {
      console.log('✅ Shared AIS Stream connection established');
      isConnecting = false;

      const subscriptionMessage = {
        APIKey: API_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FilterMessageTypes: ["PositionReport", "ShipStaticData"]
      };
      
      // 🔧 FIX: utiliser aisWs (référence locale) et non sharedAisWs (globale réassignable)
      aisWs.send(JSON.stringify(subscriptionMessage));
      
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

    aisWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.MessageType === "PositionReport") {
          messageCount++;
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

    aisWs.on('error', (err) => {
      console.error('❌ Shared AIS Stream error:', err.message);
      isConnecting = false; // 🔧 FIX: reset flag en cas d'erreur

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'error',
            message: 'AIS Stream connection error'
          }));
        }
      });
    });

    aisWs.on('close', (code, reason) => {
      console.log(`🔌 Shared AIS Stream closed: ${code} ${reason.toString() || 'No reason'}`);
      isConnecting = false; // 🔧 FIX: reset flag à la fermeture

      // N'effacer sharedAisWs que si c'est bien ce socket qui se ferme
      // (évite d'effacer un nouveau socket déjà créé)
      if (sharedAisWs === aisWs) {
        sharedAisWs = null;
      }

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ 
            type: 'closed',
            code,
            reason: reason.toString()
          }));
        }
      });
      
      // Reconnecter après 5 secondes si des clients sont toujours connectés
      if (clients.size > 0) {
        setTimeout(ensureAISConnection, 5000);
      }
    });
  }

  wss.on('connection', (clientWs) => {
    clients.add(clientWs);
    console.log(`👤 Client connected to AIS proxy (${clients.size} total)`);
    
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

    clientWs.on('error', () => {
      clients.delete(clientWs);
    });
  });

  return wss;
}