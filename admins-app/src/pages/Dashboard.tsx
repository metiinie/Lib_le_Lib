import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersService } from '../services/users.service';
import {
  Users,
  ShieldCheck,
  Flag,
  Stethoscope,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  Server,
  Zap,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  BarChart3,
  PieChart,
  Eye,
  EyeOff,
  Cpu,
  Building,
  UserCheck2,
  UserMinus,
  Smartphone
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { role = 'member', user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    verificationOfficers: 0,
    moderators: 0,
    healthProfessionals: 0,
    admins: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filter toolbar state
  const [selectedDesk, setSelectedDesk] = useState('all');
  const [hideCards, setHideCards] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCardId, setActiveCardId] = useState<number | null>(5); // Default Supervisors/Q&A as active filled card like in image

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

  // Exact 8-card grid layout matching reference image with bottom colored borders and square icon boxes
  const metricCards = [
    {
      id: 1,
      title: 'Black List Apps',
      value: '64',
      icon: Zap,
      accentColor: 'cyan',
      bottomBorder: 'border-b-cyan-500',
      iconBox: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
      visible: true,
    },
    {
      id: 2,
      title: 'Exam Centers',
      value: loading ? '...' : (stats.totalUsers > 0 ? stats.totalUsers.toString() : '30'),
      icon: Building,
      accentColor: 'amber',
      bottomBorder: 'border-b-amber-500',
      iconBox: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      visible: true,
    },
    {
      id: 3,
      title: 'Secondary Admins',
      value: loading ? '...' : (stats.moderators || '1').toString(),
      icon: UserCheck2,
      accentColor: 'rose',
      bottomBorder: 'border-b-rose-400',
      iconBox: 'border-rose-400/30 text-rose-400 bg-rose-500/10',
      visible: true,
    },
    {
      id: 4,
      title: 'Center Admins',
      value: loading ? '...' : (stats.verificationOfficers || '2').toString(),
      icon: UserCheck,
      accentColor: 'blue',
      bottomBorder: 'border-b-blue-500',
      iconBox: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      visible: true,
    },
    {
      id: 5,
      title: 'Supervisors',
      value: '2',
      icon: ShieldCheck,
      accentColor: 'emerald',
      bottomBorder: 'border-b-emerald-500',
      iconBox: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/20',
      activeFilled: true, // Soft-filled background matching supervisor card in reference image
      visible: true,
    },
    {
      id: 6,
      title: 'Invigilators',
      value: '4',
      icon: UserMinus,
      accentColor: 'amber',
      bottomBorder: 'border-b-amber-500',
      iconBox: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
      visible: true,
    },
    {
      id: 7,
      title: 'App Installers',
      value: '36',
      icon: Activity,
      accentColor: 'rose',
      bottomBorder: 'border-b-rose-400',
      iconBox: 'border-rose-400/30 text-rose-400 bg-rose-500/10',
      visible: true,
    },
    {
      id: 8,
      title: 'Devices',
      value: '12',
      icon: Smartphone,
      accentColor: 'blue',
      bottomBorder: 'border-b-blue-500',
      iconBox: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
      visible: true,
    },
  ];

  // Table status rows matching exact layout in image
  const queueStatusRows = [
    {
      id: 1,
      status: 'Not Started',
      countBadge: '5087',
      progress: 100,
      percent: '100%',
      barColor: 'bg-amber-500',
      pillStyle: 'bg-amber-400 text-slate-950 font-bold',
      countStyle: 'bg-amber-500 text-slate-950 font-bold',
    },
    {
      id: 2,
      status: 'Ready',
      countBadge: '0',
      progress: 0,
      percent: '0%',
      barColor: 'bg-blue-500',
      pillStyle: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold',
      countStyle: 'bg-blue-600 text-white font-bold',
    },
    {
      id: 3,
      status: 'Online',
      countBadge: '142',
      progress: 75,
      percent: '75%',
      barColor: 'bg-emerald-500',
      pillStyle: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold',
      countStyle: 'bg-emerald-600 text-white font-bold',
    },
    {
      id: 4,
      status: 'Offline',
      countBadge: '18',
      progress: 15,
      percent: '15%',
      barColor: 'bg-slate-600',
      pillStyle: 'bg-slate-800 text-slate-400 border border-slate-700 font-bold',
      countStyle: 'bg-slate-700 text-slate-300 font-bold',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & Toolbar Bar (Inspiration Style) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Dropdown selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <select
              value={selectedDesk}
              onChange={(e) => setSelectedDesk(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Course Exam Code</option>
              <option value="verification">Verification Desk</option>
              <option value="moderation">Safety Moderation</option>
              <option value="health">Medical Q&A Desk</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">Exam Center</option>
              <option value="center1">Center Addis</option>
              <option value="center2">Center Dire</option>
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

      {/* Metric Stat Cards (2 Rows of 4 Cards with Bottom Colored Borders & Square Outlined Icons) */}
      {!hideCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards
            .filter((c) => c.visible)
            .map((card) => {
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

                  {/* Square Outlined Icon Box (Matching Reference Image) */}
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${card.iconBox} shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Candidate Status Section with Vertical Accent Bar Pill & Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Candidate Status Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* Header with Thick Vertical Green/Cyan Accent Bar Pill */}
          <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Vertical Green Accent Pill Bar from Reference Image */}
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Candidate Status
                <span className="text-xs font-normal text-slate-500 flex items-center gap-1 ml-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live • just now
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
                  <th className="p-4">Status</th>
                  <th className="p-4 w-52">Progress</th>
                  <th className="p-4 pr-6 text-center">Percent</th>
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

        {/* Right Column (1 Col): Candidate Status in Percent Donut / Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-400" />
                Candidate Status in Percent
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
                {/* Golden Amber Slice (Not Started) 60% */}
                <path
                  className="text-amber-400"
                  strokeDasharray="60, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Blue Slice (Ready) 20% */}
                <path
                  className="text-blue-500"
                  strokeDasharray="20, 100"
                  strokeDashoffset="-60"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Emerald Green Slice (Online) 15% */}
                <path
                  className="text-emerald-500"
                  strokeDasharray="15, 100"
                  strokeDashoffset="-80"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Slate Gray Slice (Offline) 5% */}
                <path
                  className="text-slate-600"
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
                <span className="text-2xl font-extrabold text-slate-100">5,247</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidates</span>
              </div>
            </div>

            {/* Legend Breakdown List matching reference image */}
            <div className="space-y-2.5 mt-6 pt-4 border-t border-slate-800 text-xs font-semibold">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-slate-200">Not Started</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-200">Ready</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-200">Online</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-slate-600" />
                <span className="text-slate-200">Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
