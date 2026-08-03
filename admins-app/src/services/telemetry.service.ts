import { api } from './api';

export interface TelemetryMetric {
  endpoint: string;
  p95: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

export const telemetryService = {
  getMetrics: async (): Promise<TelemetryMetric[]> => {
    const res = await api.get('/telemetry/metrics');
    return res.data;
  },
};
