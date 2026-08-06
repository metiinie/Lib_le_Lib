import React, { useState, useEffect } from 'react';
import { telemetryService, TelemetryMetric } from '../services/telemetry.service';
import { useToast } from '../context/ToastContext';
import { Activity, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { TableSkeleton } from '../components/ui/TableSkeleton';

const BUDGETS: Record<string, number> = {
  'POST /swipes': 200,
  'POST /messages': 1000,
  'GET /discovery/feed': 500,
};

export const TelemetryDesk: React.FC = () => {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<TelemetryMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await telemetryService.getMetrics();
      setMetrics(data || []);
    } catch (err: any) {
      showToast('Error', 'Failed to load telemetry metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderMetricCard = (endpoint: string, budget: number) => {
    const metric = metrics.find(m => m.endpoint === endpoint);
    const hasData = !!metric;
    const isExceeded = hasData && metric.p95 > budget;

    return (
      <div key={endpoint} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between h-48">
        <div className="flex justify-between items-start z-10">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {endpoint.split(' ')[0]}
            </h3>
            <p className="text-xl font-bold text-slate-100 truncate max-w-[200px]" title={endpoint.split(' ')[1]}>
              {endpoint.split(' ')[1]}
            </p>
          </div>
          <div className="bg-slate-950 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1.5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-400">Budget: {budget}ms</span>
          </div>
        </div>

        <div className="z-10 mt-auto flex items-end justify-between">
          {hasData ? (
            <div>
              <p className="text-sm text-slate-500 mb-1">p95 Latency</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold font-mono tracking-tighter ${isExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {metric.p95}
                </span>
                <span className="text-slate-400 font-semibold">ms</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500 mb-1">p95 Latency</p>
              <span className="text-2xl font-bold font-mono text-slate-600">N/A</span>
            </div>
          )}

          {hasData && (
            <div className={`p-2 rounded-xl flex items-center justify-center ${isExceeded ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isExceeded ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
          )}
        </div>

        {/* Decorative background blur */}
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${isExceeded ? 'bg-rose-500' : hasData ? 'bg-emerald-500' : 'bg-slate-500'}`} />
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Activity className="w-7 h-7 text-indigo-400" />
            Performance Budget Telemetry
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time monitoring of p95 API latency for critical path endpoints against predefined budgets.
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(BUDGETS).map(([endpoint, budget]) => renderMetricCard(endpoint, budget))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mt-8">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">Full Telemetry Breakdown</h2>
          <p className="text-xs text-slate-400 mt-1">Detailed rolling metrics for the last 1,000 requests per endpoint.</p>
        </div>

        {loading ? (
          <TableSkeleton rows={3} columns={6} />
        ) : metrics.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No telemetry data recorded yet.</p>
            <p className="text-xs mt-1">Interact with the app to generate metrics.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">Endpoint</th>
                <th className="p-4">p95 (ms)</th>
                <th className="p-4">Average (ms)</th>
                <th className="p-4">Min (ms)</th>
                <th className="p-4">Max (ms)</th>
                <th className="p-4 pr-6">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {metrics.map((item) => (
                <tr key={item.endpoint} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 pl-6">
                    <span className="font-mono text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded">
                      {item.endpoint}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-200">
                    {item.p95}
                  </td>
                  <td className="p-4 font-mono text-slate-400">{item.avg}</td>
                  <td className="p-4 font-mono text-emerald-400/70">{item.min}</td>
                  <td className="p-4 font-mono text-rose-400/70">{item.max}</td>
                  <td className="p-4 pr-6 font-mono text-slate-500">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
