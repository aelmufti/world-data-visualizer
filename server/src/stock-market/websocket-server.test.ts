import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer, Server as HTTPServer } from 'http';
import { StockWebSocketServer } from './websocket-server';

describe('StockWebSocketServer', () => {
  let httpServer: HTTPServer;
  let wsServer: StockWebSocketServer;
  let testClients: WebSocket[] = [];
  const TEST_PORT = 8765;

  beforeEach(async () => {
    // Create HTTP server
    httpServer = createServer();
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT, () => {
        // Create WebSocket server
        wsServer = new StockWebSocketServer(httpServer, '/test-stock-prices');
        resolve();
      });
    });
  });

  afterEach(async () => {
    // Close all test clients
    testClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    testClients = [];

    // Close WebSocket server
    if (wsServer) {
      await wsServer.close();
    }

    // Close HTTP server
    if (httpServer) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  });

  /**
   * Helper function to create a test client
   */
  const createClient = (): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const client = new WebSocket(`ws://localhost:${TEST_PORT}/test-stock-prices`);
      
      client.on('open', () => {
        testClients.push(client);
        resolve(client);
      });

      client.on('error', (error) => {
        reject(error);
      });
    });
  };

  /**
   * Helper function to wait for a message
   */
  const waitForMessage = (client: WebSocket): Promise<any> => {
    return new Promise((resolve) => {
      client.once('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });
  };

  describe('Connection Management', () => {
    it('should accept WebSocket connections', async () => {
      const client = await createClient();
      expect(client.readyState).toBe(WebSocket.OPEN);
    });

    it('should track connected clients', async () => {
      await createClient();
      await createClient();
      
      const stats = wsServer.getStats();
      expect(stats.totalClients).toBe(2);
    });

    it('should cleanup on client disconnect', async () => {
      const client = await createClient();
      
      // Subscribe to a symbol
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL']
      }));

      // Wait a bit for subscription to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Close client
      client.close();

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = wsServer.getStats();
      expect(stats.totalClients).toBe(0);
      expect(stats.totalSymbols).toBe(0);
    });
  });

  describe('Subscription Management', () => {
    it('should handle subscribe messages', async () => {
      const client = await createClient();
      
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL', 'GOOGL']
      }));

      // Wait for subscription to process
      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = wsServer.getStats();
      expect(stats.totalSymbols).toBe(2);
      expect(stats.subscriptionsBySymbol.get('AAPL')).toBe(1);
      expect(stats.subscriptionsBySymbol.get('GOOGL')).toBe(1);
    });

    it('should handle unsubscribe messages', async () => {
      const client = await createClient();
      
      // Subscribe
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL', 'GOOGL', 'MSFT']
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Unsubscribe from one symbol
      client.send(JSON.stringify({
        type: 'unsubscribe',
        symbols: ['GOOGL']
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = wsServer.getStats();
      expect(stats.totalSymbols).toBe(2);
      expect(stats.subscriptionsBySymbol.has('GOOGL')).toBe(false);
      expect(stats.subscriptionsBySymbol.get('AAPL')).toBe(1);
      expect(stats.subscriptionsBySymbol.get('MSFT')).toBe(1);
    });

    it('should normalize symbol names to uppercase', async () => {
      const client = await createClient();
      
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['aapl', 'Googl', 'MSFT']
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = wsServer.getStats();
      expect(stats.subscriptionsBySymbol.has('AAPL')).toBe(true);
      expect(stats.subscriptionsBySymbol.has('GOOGL')).toBe(true);
      expect(stats.subscriptionsBySymbol.has('MSFT')).toBe(true);
    });

    it('should support multiple clients subscribing to same symbol', async () => {
      const client1 = await createClient();
      const client2 = await createClient();
      
      client1.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL']
      }));

      client2.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL']
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = wsServer.getStats();
      expect(stats.subscriptionsBySymbol.get('AAPL')).toBe(2);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce max 100 symbols per client', async () => {
      const client = await createClient();
      
      // Try to subscribe to 101 symbols
      const symbols = Array.from({ length: 101 }, (_, i) => `STOCK${i}`);
      
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols
      }));

      // Wait for error message
      const message = await waitForMessage(client);
      
      expect(message.type).toBe('error');
      expect(message.message).toContain('Rate limit exceeded');
      expect(message.message).toContain('100');
    });

    it('should allow up to 100 symbols per client', async () => {
      const client = await createClient();
      
      // Subscribe to exactly 100 symbols
      const symbols = Array.from({ length: 100 }, (_, i) => `STOCK${i}`);
      
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols
      }));

      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = wsServer.getStats();
      expect(stats.totalSymbols).toBe(100);
    });

    it('should enforce rate limit across multiple subscribe calls', async () => {
      const client = await createClient();
      
      // First subscription: 50 symbols
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: Array.from({ length: 50 }, (_, i) => `STOCK${i}`)
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Second subscription: 51 more symbols (should fail)
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: Array.from({ length: 51 }, (_, i) => `STOCK${i + 50}`)
      }));

      const message = await waitForMessage(client);
      
      expect(message.type).toBe('error');
      expect(message.message).toContain('Rate limit exceeded');
    });
  });

  describe('Broadcasting', () => {
    it('should broadcast quotes to subscribed clients', async () => {
      const client = await createClient();
      
      // Subscribe to AAPL
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL']
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Broadcast a quote
      const quote = {
        symbol: 'AAPL',
        price: 150.00,
        change: 1.50,
        changePercent: 1.01,
        volume: 1000000,
        timestamp: new Date().toISOString()
      };

      wsServer.broadcast('AAPL', quote);

      // Wait for message
      const message = await waitForMessage(client);

      expect(message.type).toBe('quote');
      expect(message.data).toEqual(quote);
    });

    it('should not broadcast to unsubscribed clients', async () => {
      const client = await createClient();
      
      // Subscribe to GOOGL only
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['GOOGL']
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Set up message listener
      let receivedMessage = false;
      client.on('message', () => {
        receivedMessage = true;
      });

      // Broadcast AAPL quote (client is not subscribed)
      wsServer.broadcast('AAPL', {
        symbol: 'AAPL',
        price: 150.00,
        change: 1.50,
        changePercent: 1.01,
        volume: 1000000,
        timestamp: new Date().toISOString()
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedMessage).toBe(false);
    });

    it('should broadcast to multiple subscribed clients', async () => {
      const client1 = await createClient();
      const client2 = await createClient();
      
      // Both subscribe to AAPL
      client1.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL']
      }));

      client2.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL']
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Broadcast quote
      const quote = {
        symbol: 'AAPL',
        price: 150.00,
        change: 1.50,
        changePercent: 1.01,
        volume: 1000000,
        timestamp: new Date().toISOString()
      };

      wsServer.broadcast('AAPL', quote);

      // Both clients should receive the message
      const [message1, message2] = await Promise.all([
        waitForMessage(client1),
        waitForMessage(client2)
      ]);

      expect(message1.type).toBe('quote');
      expect(message1.data).toEqual(quote);
      expect(message2.type).toBe('quote');
      expect(message2.data).toEqual(quote);
    });
  });

  describe('Heartbeat Mechanism', () => {
    it('should respond to ping messages', async () => {
      const client = await createClient();
      
      client.send(JSON.stringify({
        type: 'ping'
      }));

      const message = await waitForMessage(client);
      
      expect(message.type).toBe('pong');
    });

    it('should send periodic pings to clients', async () => {
      const client = await createClient();
      
      // Wait for a ping (should happen within 30 seconds, but we'll use a shorter timeout for testing)
      const pingReceived = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 35000);
        
        client.on('ping', () => {
          clearTimeout(timeout);
          resolve(true);
        });
      });

      expect(pingReceived).toBe(true);
    }, 40000); // 40 second timeout for this test
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON messages', async () => {
      const client = await createClient();
      
      client.send('invalid json {{{');

      const message = await waitForMessage(client);
      
      expect(message.type).toBe('error');
      expect(message.message).toContain('Invalid message format');
    });

    it('should handle unknown message types', async () => {
      const client = await createClient();
      
      client.send(JSON.stringify({
        type: 'unknown_type'
      }));

      const message = await waitForMessage(client);
      
      expect(message.type).toBe('error');
      expect(message.message).toContain('Unknown message type');
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      const client1 = await createClient();
      const client2 = await createClient();
      
      client1.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL', 'GOOGL']
      }));

      client2.send(JSON.stringify({
        type: 'subscribe',
        symbols: ['AAPL', 'MSFT']
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      const stats = wsServer.getStats();
      
      expect(stats.totalClients).toBe(2);
      expect(stats.totalSymbols).toBe(3); // AAPL, GOOGL, MSFT
      expect(stats.subscriptionsBySymbol.get('AAPL')).toBe(2);
      expect(stats.subscriptionsBySymbol.get('GOOGL')).toBe(1);
      expect(stats.subscriptionsBySymbol.get('MSFT')).toBe(1);
    });
  });
});
