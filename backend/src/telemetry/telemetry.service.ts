import { Injectable } from '@nestjs/common';

export interface TelemetryMetrics {
  endpoint: string;
  p95: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

@Injectable()
export class TelemetryService {
  private readonly MAX_RECORDS = 1000;
  
  // endpoint => array of durations in ms
  private readonly metrics: Map<string, number[]> = new Map();

  recordMetric(endpoint: string, durationMs: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const records = this.metrics.get(endpoint)!;
    records.push(durationMs);

    // Keep rolling window
    if (records.length > this.MAX_RECORDS) {
      records.shift();
    }
  }

  getMetrics(): TelemetryMetrics[] {
    const results: TelemetryMetrics[] = [];

    for (const [endpoint, records] of this.metrics.entries()) {
      if (records.length === 0) continue;

      const sorted = [...records].sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      
      const p95 = sorted[p95Index];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
      const count = sorted.length;

      results.push({
        endpoint,
        p95: Math.round(p95 * 100) / 100,
        avg: Math.round(avg * 100) / 100,
        min,
        max,
        count,
      });
    }

    return results;
  }
}
