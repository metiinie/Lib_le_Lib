import React, { useState, useEffect } from 'react';
import { telemetryService, TelemetryMetric } from '../services/telemetry.service';
import { useToast } from '../context/ToastContext';
import { Activity, RefreshCw, AlertCircle, CheckCircle2, Zap, Gauge, Server, ShieldCheck } from 'lucide-react';
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {endpoint.split(' ')[0]}
            </h3>
            <p className="text-lg font-extrabold text-slate-100 truncate max-w-[200px]" title={endpoint.split(' ')[1]}>
              {endpoint.split(' ')[1]}
            </p>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-slate-400">Budget: {budget}ms</span>
          </div>
        </div>

        <div className="z-10 mt-auto flex items-end justify-between">
          {hasData ? (
            <div>
              <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">p95 Latency</p>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-4xl font-black font-mono tracking-tighter ${isExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {metric.p95}
                </span>
                <span className="text-slate-400 font-bold text-sm">ms</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">p95 Latency</p>
              <span className="text-2xl font-black font-mono text-slate-600">N/A</span>
            </div>
          )}

          {hasData && (
            <div className={`p-2.5 rounded-xl flex items-center justify-center shadow-inner ${isExceeded ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
              {isExceeded ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
          )}
        </div>

        {/* Decorative background blur */}
        <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none ${isExceeded ? 'bg-rose-500' : hasData ? 'bg-emerald-500' : 'bg-slate-500'}`} />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
          <h2 className="text-base font-bold text-slate-100">API Endpoint Latency & SLA Telemetry</h2>
        </div>

        <button
          onClick={loadMetrics}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Metric Cards with Bottom Accent Borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-emerald-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Overall Avg p95 Latency</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {loading ? '...' : (metrics.length > 0 ? `${(metrics.reduce((acc, m) => acc + m.p95, 0) / metrics.length).toFixed(0)}ms` : '0ms')}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-indigo-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Monitored Endpoints</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">{loading ? '...' : metrics.length}</p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 flex items-center justify-center shadow-sm">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-cyan-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">SLA Violations</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight">
              {loading ? '...' : metrics.filter(m => BUDGETS[m.endpoint] && m.p95 > BUDGETS[m.endpoint]).length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-cyan-500/30 text-cyan-400 bg-cyan-500/10 flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl border-b-4 border-b-blue-500 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-400 tracking-wide">Total Request Samples</p>
            <p className="text-3xl font-extrabold text-slate-100 tracking-tight font-mono">
              {loading ? '...' : metrics.reduce((acc, m) => acc + m.count, 0).toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl border border-blue-500/30 text-blue-400 bg-blue-500/10 flex items-center justify-center shadow-sm">
            <Gauge className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Critical Endpoint Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Object.entries(BUDGETS).map(([endpoint, budget]) => renderMetricCard(endpoint, budget))}
      </div>

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h2 className="text-base font-bold text-slate-100">Full Telemetry Breakdown</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Last 1,000 requests per endpoint</span>
        </div>

        {loading ? (
          <TableSkeleton rows={3} columns={6} />
        ) : metrics.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Activity className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-400">No telemetry data recorded yet.</p>
            <p className="text-xs text-slate-600 mt-1">Interact with the app to generate metrics.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Endpoint</th>
                <th className="p-4">p95 (ms)</th>
                <th className="p-4">Average (ms)</th>
                <th className="p-4">Min (ms)</th>
                <th className="p-4">Max (ms)</th>
                <th className="p-4 pr-6 text-right">Sample Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {metrics.map((item) => (
                <tr key={item.endpoint} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 pl-6">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg">
                      {item.endpoint}
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-200">
                    {item.p95}
                  </td>
                  <td className="p-4 font-mono text-slate-400">{item.avg}</td>
                  <td className="p-4 font-mono text-emerald-400 font-semibold">{item.min}</td>
                  <td className="p-4 font-mono text-rose-400 font-semibold">{item.max}</td>
                  <td className="p-4 pr-6 text-right font-mono text-slate-400 font-bold">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
