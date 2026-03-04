/**
 * WebSocket client for real-time stock price updates
 * Handles connection management, auto-reconnect, and fallback to polling
 * Enhanced with comprehensive error handling and user-friendly messages
 */

import type { WSClientMessage, WSServerMessage, StockQuote } from '../types/stock-market';
import { logError, getErrorMessage, ErrorType } from '../utils/errorHandling';

type MessageHandler = (quote: StockQuote) => void;
type ErrorHandler = (error: string) => void;
type ConnectionHandler = () => void;

interface WebSocketClientOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  pollingInterval?: number;
}

export class StockWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private heartbeatInterval: number;
  private pollingInterval: number;
  
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  
  private subscribedSymbols = new Set<string>();
  private messageHandlers = new Set<MessageHandler>();
  private errorHandlers = new Set<ErrorHandler>();
  private connectHandlers = new Set<ConnectionHandler>();
  private disconnectHandlers = new Set<ConnectionHandler>();
  
  private isPollingMode = false;
  private isConnected = false;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.reconnectInterval = options.reconnectInterval ?? 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 3;
    this.heartbeatInterval = options.heartbeatInterval ?? 30000;
    this.pollingInterval = options.pollingInterval ?? 10000;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.isPollingMode = false;
        this.reconnectAttempts = 0;
        
        // Resubscribe to symbols after reconnection
        if (this.subscribedSymbols.size > 0) {
          this.sendMessage({
            type: 'subscribe',
            symbols: Array.from(this.subscribedSymbols)
          });
        }
        
        // Start heartbeat
        this.startHeartbeat();
        
        // Notify connection handlers
        this.connectHandlers.forEach(handler => handler());
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WSServerMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          logError(error as Error, {
            component: 'StockWebSocketClient',
            action: 'onmessage',
            metadata: { rawData: event.data }
          });
          this.notifyError(getErrorMessage(error as Error, ErrorType.INVALID_DATA));
        }
      };

      this.ws.onerror = (error) => {
        logError('WebSocket connection error', {
          component: 'StockWebSocketClient',
          action: 'onerror'
        });
        this.notifyError(getErrorMessage('WebSocket connection error', ErrorType.NETWORK));
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        
        // Notify disconnect handlers
        this.disconnectHandlers.forEach(handler => handler());
        
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          // Fallback to polling after max reconnect attempts
          this.fallbackToPolling();
        }
      };
    } catch (error) {
      logError(error as Error, {
        component: 'StockWebSocketClient',
        action: 'connect',
        metadata: { url: this.url }
      });
      this.fallbackToPolling();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    this.stopPolling();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  /**
   * Subscribe to stock symbols for real-time updates
   */
  subscribe(symbols: string[]): void {
    symbols.forEach(symbol => this.subscribedSymbols.add(symbol));
    
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'subscribe',
        symbols
      });
    }
  }

  /**
   * Unsubscribe from stock symbols
   */
  unsubscribe(symbols: string[]): void {
    symbols.forEach(symbol => this.subscribedSymbols.delete(symbol));
    
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'unsubscribe',
        symbols
      });
    }
  }

  /**
   * Register a handler for quote messages
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register a handler for errors
   */
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  /**
   * Register a handler for connection events
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  /**
   * Register a handler for disconnection events
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  /**
   * Check if currently connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Check if in polling mode
   */
  isInPollingMode(): boolean {
    return this.isPollingMode;
  }

  /**
   * Get subscribed symbols
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }

  // Private methods

  private sendMessage(message: WSClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleMessage(message: WSServerMessage): void {
    switch (message.type) {
      case 'quote':
        this.messageHandlers.forEach(handler => handler(message.data));
        break;
      case 'error':
        this.notifyError(message.message);
        break;
      case 'pong':
        // Heartbeat acknowledged
        break;
    }
  }

  private notifyError(error: string): void {
    this.errorHandlers.forEach(handler => handler(error));
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, this.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private fallbackToPolling(): void {
    console.log('WebSocket unavailable, falling back to polling mode');
    this.isPollingMode = true;
    
    logError('WebSocket unavailable, using polling mode', {
      component: 'StockWebSocketClient',
      action: 'fallbackToPolling',
      metadata: { 
        reconnectAttempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      }
    });
    
    this.notifyError('Real-time updates unavailable. Using periodic updates instead.');
    this.startPolling();
  }

  private startPolling(): void {
    this.stopPolling();
    
    this.pollingTimer = setInterval(async () => {
      if (this.subscribedSymbols.size === 0) return;
      
      try {
        // Fetch quotes via REST API
        const symbols = Array.from(this.subscribedSymbols);
        const response = await fetch(`/api/quotes?symbols=${symbols.join(',')}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const quotes: StockQuote[] = await response.json();
        quotes.forEach(quote => {
          this.messageHandlers.forEach(handler => handler(quote));
        });
      } catch (error) {
        logError(error as Error, {
          component: 'StockWebSocketClient',
          action: 'startPolling',
          metadata: { symbolCount: this.subscribedSymbols.size }
        });
        this.notifyError(getErrorMessage(error as Error, ErrorType.NETWORK));
      }
    }, this.pollingInterval);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}

// Singleton instance
let stockWebSocketClient: StockWebSocketClient | null = null;

/**
 * Get or create the WebSocket client instance
 */
export function getStockWebSocketClient(): StockWebSocketClient {
  if (!stockWebSocketClient) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/stock-prices';
    stockWebSocketClient = new StockWebSocketClient({
      url: wsUrl,
      reconnectInterval: 5000,
      maxReconnectAttempts: 3,
      heartbeatInterval: 30000,
      pollingInterval: 10000
    });
  }
  return stockWebSocketClient;
}

// Export a simple interface for components
export const stockWebSocket = {
  subscribe: (symbols: string[]) => getStockWebSocketClient().subscribe(symbols),
  unsubscribe: (symbols: string[]) => getStockWebSocketClient().unsubscribe(symbols),
  on: (event: 'quote', handler: MessageHandler) => getStockWebSocketClient().onMessage(handler),
  off: (event: 'quote', handler: MessageHandler) => {
    // Note: The current implementation doesn't support removing specific handlers
    // This is a simplified interface for component usage
  },
  connect: () => getStockWebSocketClient().connect(),
  disconnect: () => getStockWebSocketClient().disconnect(),
};
