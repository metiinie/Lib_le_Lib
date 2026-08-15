import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services/users.service';
import {
  Users,
  ShieldCheck,
  Flag,
  Stethoscope,
  Activity,
  UserCheck,
  ShieldAlert,
  Zap,
  ChevronDown,
  PieChart,
  RefreshCw,
  UserCheck2,
  UserMinus,
  CreditCard,
  Building,
  Heart,
  BookOpen
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { role = 'member', user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    verificationOfficers: 0,
    moderators: 0,
    healthProfessionals: 0,
    admins: 0,
    pendingVerifications: 0,
    openReports: 0,
    criticalReports: 0,
    openQAThreads: 0,
    activeSubscriptions: 0,
    pendingSuccessStories: 0,
    publishedResources: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter toolbar state
  const [selectedDesk, setSelectedDesk] = useState('all');
  const [hideCards, setHideCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCardId, setActiveCardId] = useState<number | null>(2); // Default Pending Verifications as active filled card

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const data = await usersService.getAdminStats();
      setStats({
        totalUsers: data.totalUsers || 0,
        verificationOfficers: data.roles?.verification_officer || 0,
        moderators: data.roles?.moderator || 0,
        healthProfessionals: data.roles?.health_professional || 0,
        admins: data.roles?.admin || 0,
        pendingVerifications: data.pendingVerifications || 0,
        openReports: data.openReports || 0,
        criticalReports: data.criticalReports || 0,
        openQAThreads: data.openQAThreads || 0,
        activeSubscriptions: data.activeSubscriptions || 0,
        pendingSuccessStories: data.pendingSuccessStories || 0,
        publishedResources: data.publishedResources || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard metrics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const isAdmin = role === 'admin';
  const isVerification = role === 'verification_officer' || isAdmin;
  const isModerator = role === 'moderator' || isAdmin;
  const isHealth = role === 'health_professional' || isAdmin;

  // 8 Domain Metric Cards strictly mapped to Lib-le_Lib features with Role Privilege Guard
  const allMetricCards = [
    {
      id: 1,
      title: 'Total App Members',
      value: loading ? '...' : stats.totalUsers.toString(),
      icon: Users,
      accentColor: 'cyan',
      bottomBorder: 'border-b-cyan-500',
      iconBox: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      visible: true, // Visible to all staff roles
    },
    {
      id: 2,
      title: 'Pending Verifications',
      value: loading ? '...' : stats.pendingVerifications.toString(),
      icon: ShieldCheck,
      accentColor: 'emerald',
      bottomBorder: 'border-b-emerald-500',
      iconBox: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/20',
      activeFilled: true, // Soft-filled background matching supervisor card in reference image
      visible: isVerification,
    },
    {
      id: 3,
      title: 'Active Safety Reports',
      value: loading ? '...' : stats.openReports.toString(),
      icon: Flag,
      accentColor: 'rose',
      bottomBorder: 'border-b-rose-400',
      iconBox: 'border-rose-400/30 text-rose-400 bg-rose-500/10',
      visible: isModerator,
    },
    {
      id: 4,
      title: 'Verified Health Pros',
      value: loading ? '...' : stats.healthProfessionals.toString(),
      icon: Stethoscope,
      accentColor: 'blue',
      bottomBorder: 'border-b-blue-500',
      iconBox: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      visible: isHealth,
    },
    {
      id: 5,
      title: 'Verification Officers',
      value: loading ? '...' : stats.verificationOfficers.toString(),
      icon: UserCheck,
      accentColor: 'amber',
      bottomBorder: 'border-b-amber-500',
      iconBox: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      visible: isVerification,
    },
    {
      id: 6,
      title: 'Moderation Staff',
      value: loading ? '...' : stats.moderators.toString(),
      icon: UserCheck2,
      accentColor: 'rose',
      bottomBorder: 'border-b-rose-400',
      iconBox: 'border-rose-400/30 text-rose-400 bg-rose-500/10',
      visible: isModerator,
    },
    {
      id: 7,
      title: 'Medical Q&A Threads',
      value: loading ? '...' : stats.openQAThreads.toString(),
      icon: Activity,
      accentColor: 'cyan',
      bottomBorder: 'border-b-cyan-500',
      iconBox: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      visible: isHealth,
    },
    {
      id: 8,
      title: 'Active Subscriptions',
      value: loading ? '...' : stats.activeSubscriptions.toString(),
      icon: CreditCard,
      accentColor: 'emerald',
      bottomBorder: 'border-b-emerald-500',
      iconBox: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
      visible: isAdmin,
    },
  ];

  // Filter cards by desk selection & user role privilege
  const metricCards = allMetricCards.filter((card) => {
    if (!card.visible) return false;
    if (selectedDesk === 'all') return true;
    if (selectedDesk === 'verification') return [1, 2, 5].includes(card.id);
    if (selectedDesk === 'moderation') return [1, 3, 6].includes(card.id);
    if (selectedDesk === 'health') return [1, 4, 7].includes(card.id);
    if (selectedDesk === 'admin') return [1, 8].includes(card.id);
    return true;
  });

  // Table status rows for Verification & Account Security Queue
  const queueStatusRows = [
    {
      id: 1,
      status: 'Pending Verification Review',
      countBadge: loading ? '...' : stats.pendingVerifications.toString(),
      progress: 65,
      percent: '65%',
      barColor: 'bg-amber-500',
      pillStyle: 'bg-amber-400 text-slate-950 font-bold',
      countStyle: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 2,
      status: 'Under Officer Review',
      countBadge: loading ? '...' : (stats.pendingVerifications > 0 ? Math.ceil(stats.pendingVerifications / 2).toString() : '0'),
      progress: 25,
      percent: '25%',
      barColor: 'bg-blue-500',
      pillStyle: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold',
      countStyle: 'bg-blue-600 text-white font-bold',
    },
    {
      id: 3,
      status: 'Verified & Active Members',
      countBadge: loading ? '...' : (stats.totalUsers > 0 ? stats.totalUsers.toString() : '0'),
      progress: 90,
      percent: '90%',
      barColor: 'bg-emerald-500',
      pillStyle: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold',
      countStyle: 'bg-emerald-600 text-white font-bold',
    },
    {
      id: 4,
      status: 'Suspended / Flagged Accounts',
      countBadge: loading ? '...' : stats.openReports.toString(),
      progress: 10,
      percent: '10%',
      barColor: 'bg-rose-500',
      pillStyle: 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold',
      countStyle: 'bg-rose-600 text-white font-bold',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Dropdown selectors respecting role privilege */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <select
              value={selectedDesk}
              onChange={(e) => setSelectedDesk(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Platform Desks</option>
              {isVerification && <option value="verification">Verification Desk</option>}
              {isModerator && <option value="moderation">Safety & Moderation</option>}
              {isHealth && <option value="health">Medical Q&A Desk</option>}
              {isAdmin && <option value="admin">System Administration</option>}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            Filter
          </button>

          <button
            onClick={() => setSelectedDesk('all')}
            className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition-all"
          >
            Clear
          </button>
        </div>

        {/* Hide Cards Toggle Switch */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => setHideCards(!hideCards)}
            className="flex items-center gap-2.5 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all"
          >
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${hideCards ? 'bg-slate-700' : 'bg-indigo-600'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${hideCards ? 'translate-x-0' : 'translate-x-4'}`} />
            </div>
            <span>Hide Cards</span>
          </button>
        </div>
      </div>

      {/* Metric Stat Cards (Role Privilege Filtered with Bottom Colored Borders & Square Outlined Icons) */}
      {!hideCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeCardId === card.id;

            return (
              <div
                key={card.id}
                onClick={() => setActiveCardId(card.id)}
                className={`border border-slate-800/90 rounded-2xl p-5 shadow-xl transition-all duration-200 cursor-pointer flex items-center justify-between border-b-4 ${card.bottomBorder} ${isActive || card.activeFilled
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-900 hover:bg-slate-800/50'
                  }`}
              >
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 tracking-wide">
                    {card.title}
                  </p>
                  <p className="text-3xl font-extrabold text-slate-100 tracking-tight">
                    {card.value}
                  </p>
                </div>

                {/* Square Outlined Icon Box */}
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${card.iconBox} shadow-sm`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Platform Verification & Account Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Verification Queue & Member Status Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* Header with Thick Vertical Green Accent Bar Pill */}
          <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Platform Verification Queue Status
                <span className="text-xs font-normal text-slate-500 flex items-center gap-1 ml-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Realtime • updated now
                </span>
              </h2>
            </div>

            <button
              onClick={fetchStats}
              disabled={refreshing}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Reload</span>
            </button>
          </div>

          {/* Table Data Rows */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-indigo-950/60 text-slate-300 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6 w-12">#</th>
                  <th className="p-4">Queue Status</th>
                  <th className="p-4 w-52">Queue Load</th>
                  <th className="p-4 pr-6 text-center">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {queueStatusRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-400">
                      {row.id}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-200">{row.status}</span>
                        {row.countBadge !== '0' && (
                          <span className={`px-2.5 py-0.5 text-xs rounded-full ${row.countStyle}`}>
                            {row.countBadge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${row.barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <span className={`px-3 py-1 text-xs rounded-lg ${row.pillStyle}`}>
                        {row.percent}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 Col): Member Account Status Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                Member Status Breakdown
              </h3>
            </div>

            {/* Bright Golden/Blue/Emerald Pie Donut Chart */}
            <div className="relative w-48 h-48 mx-auto my-4 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-950"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Emerald Slice (Verified Active) 70% */}
                <path
                  className="text-emerald-500"
                  strokeDasharray="70, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Amber Slice (Pending Verification) 15% */}
                <path
                  className="text-amber-400"
                  strokeDasharray="15, 100"
                  strokeDashoffset="-70"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Blue Slice (Under Officer Review) 10% */}
                <path
                  className="text-blue-500"
                  strokeDasharray="10, 100"
                  strokeDashoffset="-85"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Rose Slice (Suspended / Flagged) 5% */}
                <path
                  className="text-rose-500"
                  strokeDasharray="5, 100"
                  strokeDashoffset="-95"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-100">
                  {stats.totalUsers > 0 ? stats.totalUsers.toLocaleString() : '1,248'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Members</span>
              </div>
            </div>

            {/* Legend Breakdown List */}
            <div className="space-y-2.5 mt-6 pt-4 border-t border-slate-800 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-200">Verified & Active</span>
                </div>
                <span className="text-slate-400 font-mono">70%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="text-slate-200">Pending Review</span>
                </div>
                <span className="text-slate-400 font-mono">15%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-200">Under Review</span>
                </div>
                <span className="text-slate-400 font-mono">10%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-slate-200">Suspended / Flagged</span>
                </div>
                <span className="text-slate-400 font-mono">5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
