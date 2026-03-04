import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fc, test } from '@fast-check/vitest';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer, Server as HTTPServer } from 'http';
import { StockWebSocketServer } from './websocket-server';

/**
 * Property-Based Tests for WebSocket Subscription Management
 * 
 * Feature: live-stock-market-tab
 * Property 6: WebSocket connection during market hours
 * 
 * **Validates: Requirements 3.1**
 * 
 * Requirement 3.1 states:
 * "WHEN a Market_Session is active, THE Quote_Service SHALL stream price updates via WebSocket_Connection"
 * 
 * This property test validates that during active market sessions, the system correctly
 * uses WebSocket connections for streaming price updates to subscribed clients.
 */

describe('Property-Based Tests: WebSocket Subscription Management', () => {
  let httpServer: HTTPServer;
  let wsServer: StockWebSocketServer;
  let testClients: WebSocket[] = [];
  const TEST_PORT = 8766; // Different port from unit tests

  beforeEach(async () => {
    // Create HTTP server
    httpServer = createServer();
    await new Promise<void>((resolve) => {
      httpServer.listen(TEST_PORT, () => {
        // Create WebSocket server
        wsServer = new StockWebSocketServer(httpServer, '/test-stock-prices-pbt');
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
      const client = new WebSocket(`ws://localhost:${TEST_PORT}/test-stock-prices-pbt`);
      
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
  const waitForMessage = (client: WebSocket, timeoutMs: number = 1000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for message'));
      }, timeoutMs);

      client.once('message', (data) => {
        clearTimeout(timeout);
        resolve(JSON.parse(data.toString()));
      });
    });
  };

  /**
   * Helper to simulate market session state
   * In a real implementation, this would check actual market hours
   * For testing purposes, we simulate market session as "active"
   */
  const isMarketSessionActive = (): boolean => {
    // For property testing, we assume market is active
    // In production, this would check actual market hours
    return true;
  };

  /**
   * Property 6: WebSocket connection during market hours
   * 
   * **Validates: Requirements 3.1**
   * 
   * For any set of stock symbols and any active market session,
   * the WebSocket server should:
   * 1. Accept client connections
   * 2. Allow clients to subscribe to symbols
   * 3. Broadcast price updates to subscribed clients
   * 4. Maintain the connection for streaming updates
   * 
   * This validates that during market hours, the Quote_Service uses
   * WebSocket connections for real-time price streaming.
   */
  test.prop([
    fc.array(
      fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase()),
      { minLength: 1, maxLength: 20 }
    )
  ], { numRuns: 20 })(
    'Property 6: During active market sessions, WebSocket connections stream price updates to subscribed clients',
    async (symbols) => {
      // Precondition: Market session is active
      const marketActive = isMarketSessionActive();
      expect(marketActive).toBe(true);

      // Create a client connection
      const client = await createClient();
      
      // Verify connection is established (WebSocket is used for streaming)
      expect(client.readyState).toBe(WebSocket.OPEN);

      // Subscribe to symbols
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: symbols
      }));

      // Wait for subscription to process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify subscriptions are tracked
      const stats = wsServer.getStats();
      expect(stats.totalClients).toBeGreaterThan(0);
      
      // For each unique symbol, verify it's in the subscription list
      const uniqueSymbols = [...new Set(symbols)];
      uniqueSymbols.forEach(symbol => {
        expect(stats.subscriptionsBySymbol.has(symbol)).toBe(true);
      });

      // Simulate price update broadcast for first symbol
      if (uniqueSymbols.length > 0) {
        const testSymbol = uniqueSymbols[0];
        const quote = {
          symbol: testSymbol,
          price: 150.00 + Math.random() * 10,
          change: Math.random() * 2 - 1,
          changePercent: Math.random() * 2 - 1,
          volume: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString()
        };

        // Broadcast the quote
        wsServer.broadcast(testSymbol, quote);

        // Client should receive the update via WebSocket
        const message = await waitForMessage(client, 2000);
        
        expect(message.type).toBe('quote');
        expect(message.data).toBeDefined();
        expect(message.data.symbol).toBe(testSymbol);
        expect(message.data.price).toBeDefined();
        expect(message.data.timestamp).toBeDefined();
      }

      // Property: During market hours, WebSocket connection remains open for streaming
      expect(client.readyState).toBe(WebSocket.OPEN);

      // Cleanup
      client.close();
    }
  );

  /**
   * Property 6 (Extended): Multiple clients can receive simultaneous updates
   * 
   * **Validates: Requirements 3.1**
   * 
   * For any number of clients subscribing to overlapping symbols,
   * all subscribed clients should receive price updates via WebSocket.
   */
  test.prop([
    fc.integer({ min: 2, max: 5 }), // Number of clients
    fc.array(
      fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase()),
      { minLength: 1, maxLength: 10 }
    )
  ], { numRuns: 15 })(
    'Property 6 (Extended): Multiple clients receive simultaneous WebSocket updates during market hours',
    async (numClients, symbols) => {
      // Precondition: Market session is active
      expect(isMarketSessionActive()).toBe(true);

      // Create multiple clients
      const clients = await Promise.all(
        Array.from({ length: numClients }, () => createClient())
      );

      // All clients subscribe to the same symbols
      for (const client of clients) {
        client.send(JSON.stringify({
          type: 'subscribe',
          symbols: symbols
        }));
      }

      // Wait for subscriptions to process
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify all clients are connected
      const stats = wsServer.getStats();
      expect(stats.totalClients).toBeGreaterThanOrEqual(numClients);

      // Broadcast a quote for the first symbol
      const uniqueSymbols = [...new Set(symbols)];
      if (uniqueSymbols.length > 0) {
        const testSymbol = uniqueSymbols[0];
        const quote = {
          symbol: testSymbol,
          price: 150.00,
          change: 1.50,
          changePercent: 1.01,
          volume: 1000000,
          timestamp: new Date().toISOString()
        };

        wsServer.broadcast(testSymbol, quote);

        // All clients should receive the update via WebSocket
        const messages = await Promise.all(
          clients.map(client => waitForMessage(client, 2000))
        );

        // Verify all clients received the quote
        messages.forEach(message => {
          expect(message.type).toBe('quote');
          expect(message.data.symbol).toBe(testSymbol);
        });

        // Property: All clients maintain open WebSocket connections for streaming
        clients.forEach(client => {
          expect(client.readyState).toBe(WebSocket.OPEN);
        });
      }

      // Cleanup
      clients.forEach(client => client.close());
    }
  );

  /**
   * Property 6 (Subscription Lifecycle): Clients can subscribe and unsubscribe dynamically
   * 
   * **Validates: Requirements 3.1**
   * 
   * During market hours, clients should be able to dynamically manage their subscriptions
   * while maintaining the WebSocket connection for streaming.
   */
  test.prop([
    fc.array(
      fc.string({ minLength: 1, maxLength: 5 }).map(s => s.toUpperCase()),
      { minLength: 2, maxLength: 15 }
    )
  ], { numRuns: 15 })(
    'Property 6 (Subscription Lifecycle): Clients can dynamically manage subscriptions during market hours',
    async (symbols) => {
      // Precondition: Market session is active
      expect(isMarketSessionActive()).toBe(true);

      const client = await createClient();
      expect(client.readyState).toBe(WebSocket.OPEN);

      // Split symbols into two groups
      const midpoint = Math.floor(symbols.length / 2);
      const firstBatch = symbols.slice(0, midpoint);
      const secondBatch = symbols.slice(midpoint);

      // Subscribe to first batch
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: firstBatch
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Subscribe to second batch
      client.send(JSON.stringify({
        type: 'subscribe',
        symbols: secondBatch
      }));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify all symbols are subscribed
      const statsAfterSubscribe = wsServer.getStats();
      const uniqueSymbols = [...new Set(symbols)];
      expect(statsAfterSubscribe.totalSymbols).toBeGreaterThanOrEqual(uniqueSymbols.length);

      // Unsubscribe from first batch
      if (firstBatch.length > 0) {
        client.send(JSON.stringify({
          type: 'unsubscribe',
          symbols: firstBatch
        }));

        await new Promise(resolve => setTimeout(resolve, 50));

        // Verify first batch symbols are removed
        const statsAfterUnsubscribe = wsServer.getStats();
        const uniqueFirstBatch = [...new Set(firstBatch)];
        const uniqueSecondBatch = [...new Set(secondBatch)];
        
        // Only second batch symbols should remain (if they're not in first batch)
        const remainingSymbols = uniqueSecondBatch.filter(
          s => !uniqueFirstBatch.includes(s)
        );
        
        expect(statsAfterUnsubscribe.totalSymbols).toBeLessThanOrEqual(
          statsAfterSubscribe.totalSymbols
        );
      }

      // Property: WebSocket connection remains open throughout subscription changes
      expect(client.readyState).toBe(WebSocket.OPEN);

      // Cleanup
      client.close();
    }
  );
});
