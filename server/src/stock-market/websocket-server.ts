import { WebSocketServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';

/**
 * Message types for WebSocket communication
 */
interface WSClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  symbols?: string[];
}

interface WSServerMessage {
  type: 'quote' | 'error' | 'pong';
  data?: StockQuote;
  message?: string;
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

/**
 * Client subscription tracking
 */
interface ClientSubscription {
  ws: WebSocket;
  symbols: Set<string>;
  lastPing: number;
}

/**
 * StockWebSocketServer manages real-time stock price updates via WebSocket
 * 
 * Features:
 * - Per-symbol subscription tracking
 * - Heartbeat ping/pong mechanism (30s interval)
 * - Rate limiting (max 100 symbols per client)
 * - Automatic cleanup on client disconnect
 * 
 * Validates: Requirements 3.1, 3.3, 15.6
 */
export class StockWebSocketServer {
  private wss: WebSocketServer;
  private subscriptions: Map<string, Set<WebSocket>>; // symbol -> Set of WebSocket clients
  private clients: Map<WebSocket, ClientSubscription>; // WebSocket -> client info
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly MAX_SYMBOLS_PER_CLIENT = 100;

  constructor(server: HTTPServer, path: string = '/stock-prices') {
    // Use noServer mode and handle upgrade manually for better control
    this.wss = new WebSocketServer({ noServer: true });
    this.subscriptions = new Map();
    this.clients = new Map();

    // Handle upgrade requests on the specified path
    server.on('upgrade', (request, socket, head) => {
      if (request.url === path) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      }
    });

    this.initialize();
  }

  /**
   * Initialize WebSocket server with connection handler
   */
  private initialize(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Start heartbeat mechanism
    this.startHeartbeat();
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket): void {
    // Initialize client subscription tracking
    this.clients.set(ws, {
      ws,
      symbols: new Set(),
      lastPing: Date.now()
    });

    // Set up message handler
    ws.on('message', (data: Buffer) => {
      this.handleMessage(ws, data);
    });

    // Set up close handler for cleanup
    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    // Set up error handler
    ws.on('error', (error: Error) => {
      console.error('[WebSocket] Client error:', error);
      this.handleDisconnect(ws);
    });

    // Set up pong handler for heartbeat
    ws.on('pong', () => {
      const client = this.clients.get(ws);
      if (client) {
        client.lastPing = Date.now();
      }
    });
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(ws: WebSocket, data: Buffer): void {
    try {
      const message: WSClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          if (message.symbols) {
            this.subscribe(ws, message.symbols);
          }
          break;

        case 'unsubscribe':
          if (message.symbols) {
            this.unsubscribe(ws, message.symbols);
          }
          break;

        case 'ping':
          this.sendMessage(ws, { type: 'pong' });
          break;

        default:
          this.sendError(ws, `Unknown message type: ${(message as any).type}`);
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  /**
   * Subscribe a client to symbol updates
   * Implements rate limiting (max 100 symbols per client)
   */
  subscribe(ws: WebSocket, symbols: string[]): void {
    const client = this.clients.get(ws);
    if (!client) {
      this.sendError(ws, 'Client not found');
      return;
    }

    // Check rate limiting
    const totalSymbols = client.symbols.size + symbols.length;
    if (totalSymbols > this.MAX_SYMBOLS_PER_CLIENT) {
      this.sendError(
        ws,
        `Rate limit exceeded. Maximum ${this.MAX_SYMBOLS_PER_CLIENT} symbols per client.`
      );
      return;
    }

    // Add symbols to client's subscription list
    symbols.forEach(symbol => {
      const normalizedSymbol = symbol.toUpperCase();
      client.symbols.add(normalizedSymbol);

      // Add client to symbol's subscriber list
      if (!this.subscriptions.has(normalizedSymbol)) {
        this.subscriptions.set(normalizedSymbol, new Set());
      }
      this.subscriptions.get(normalizedSymbol)!.add(ws);
    });

    console.log(
      `[WebSocket] Client subscribed to ${symbols.length} symbols. Total: ${client.symbols.size}`
    );
  }

  /**
   * Unsubscribe a client from symbol updates
   */
  unsubscribe(ws: WebSocket, symbols: string[]): void {
    const client = this.clients.get(ws);
    if (!client) {
      return;
    }

    symbols.forEach(symbol => {
      const normalizedSymbol = symbol.toUpperCase();
      client.symbols.delete(normalizedSymbol);

      // Remove client from symbol's subscriber list
      const subscribers = this.subscriptions.get(normalizedSymbol);
      if (subscribers) {
        subscribers.delete(ws);
        
        // Clean up empty subscription sets
        if (subscribers.size === 0) {
          this.subscriptions.delete(normalizedSymbol);
        }
      }
    });

    console.log(
      `[WebSocket] Client unsubscribed from ${symbols.length} symbols. Remaining: ${client.symbols.size}`
    );
  }

  /**
   * Broadcast a stock quote to all subscribed clients
   */
  broadcast(symbol: string, quote: StockQuote): void {
    const normalizedSymbol = symbol.toUpperCase();
    const subscribers = this.subscriptions.get(normalizedSymbol);

    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const message: WSServerMessage = {
      type: 'quote',
      data: quote
    };

    const messageStr = JSON.stringify(message);
    let successCount = 0;
    let failCount = 0;

    subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          successCount++;
        } catch (error) {
          console.error(`[WebSocket] Error sending to client:`, error);
          failCount++;
        }
      }
    });

    if (successCount > 0) {
      console.log(
        `[WebSocket] Broadcasted ${normalizedSymbol} to ${successCount} clients${
          failCount > 0 ? ` (${failCount} failed)` : ''
        }`
      );
    }
  }

  /**
   * Handle client disconnect - cleanup subscriptions
   */
  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) {
      return;
    }

    // Remove client from all symbol subscriptions
    client.symbols.forEach(symbol => {
      const subscribers = this.subscriptions.get(symbol);
      if (subscribers) {
        subscribers.delete(ws);
        
        // Clean up empty subscription sets
        if (subscribers.size === 0) {
          this.subscriptions.delete(symbol);
        }
      }
    });

    // Remove client tracking
    this.clients.delete(ws);

    console.log(
      `[WebSocket] Client disconnected. Was subscribed to ${client.symbols.size} symbols.`
    );
  }

  /**
   * Start heartbeat mechanism to detect stale connections
   * Sends ping every 30 seconds and closes connections that don't respond
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = this.HEARTBEAT_INTERVAL * 2; // 60 seconds

      this.clients.forEach((client, ws) => {
        // Check if client is stale (no pong received in 60 seconds)
        if (now - client.lastPing > staleThreshold) {
          console.log('[WebSocket] Terminating stale connection');
          ws.terminate();
          return;
        }

        // Send ping if connection is open
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.ping();
          } catch (error) {
            console.error('[WebSocket] Error sending ping:', error);
          }
        }
      });
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Send a message to a specific client
   */
  private sendMessage(ws: WebSocket, message: WSServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Error sending message:', error);
      }
    }
  }

  /**
   * Send an error message to a specific client
   */
  private sendError(ws: WebSocket, message: string): void {
    this.sendMessage(ws, {
      type: 'error',
      message
    });
  }

  /**
   * Get current subscription statistics
   */
  getStats(): {
    totalClients: number;
    totalSymbols: number;
    subscriptionsBySymbol: Map<string, number>;
  } {
    const subscriptionsBySymbol = new Map<string, number>();
    
    this.subscriptions.forEach((subscribers, symbol) => {
      subscriptionsBySymbol.set(symbol, subscribers.size);
    });

    return {
      totalClients: this.clients.size,
      totalSymbols: this.subscriptions.size,
      subscriptionsBySymbol
    };
  }

  /**
   * Close the WebSocket server and cleanup
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stopHeartbeat();

      // Close all client connections
      this.clients.forEach((_, ws) => {
        ws.close();
      });

      // Close the server
      this.wss.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('[WebSocket] Server closed');
          resolve();
        }
      });
    });
  }
}
