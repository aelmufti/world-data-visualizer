// Polling service that runs every 60 minutes
import { congressPipeline } from './pipeline.js';

export class CongressPoller {
  private intervalId: NodeJS.Timeout | null = null;
  private pollIntervalMs = 60 * 60 * 1000; // 60 minutes

  async start(): Promise<void> {
    console.log('🗳️  Starting Congress trade poller (60 min interval)');

    // Run immediately on start
    await this.runPoll();

    // Then run every 60 minutes
    this.intervalId = setInterval(() => {
      this.runPoll();
    }, this.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️  Congress trade poller stopped');
    }
  }

  isActive(): boolean {
    return this.intervalId !== null;
  }

  private async runPoll(): Promise<void> {
    try {
      const result = await congressPipeline.runPoll();
      
      if (result.success) {
        console.log(
          `📊 Poll result: ${result.filings} filings, ${result.trades} trades, ${result.alerts} alerts`
        );
        
        if (result.warnings.length > 0) {
          console.warn('⚠️  Warnings:', result.warnings);
        }
      } else {
        console.error('❌ Poll failed:', result.warnings);
      }
    } catch (error) {
      console.error('❌ Poll error:', error);
    }
  }
}

export const congressPoller = new CongressPoller();
