import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Factory,
  TrendingUp,
  TrendingDown,
  Package,
  Search,
  Filter,
  ChevronRight,
  Building2,
  ArrowLeft,
  Activity,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Receipt,
  MapPin,
  Plus
} from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';

interface MillSummary {
  id: string;
  name: string;
  location: string;
  totalDelivered: number;
  totalPaid: number;
  netBalance: number;
  lastPaymentDate: string;
  status: 'SETTLED' | 'OUTSTANDING' | 'CRITICAL';
  is_settled: number;
  settledLots: number;
  pendingLots: number;
}

export default function MillSettlementList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mills, setMills] = useState<MillSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [activeSeason, setActiveSeason] = useState(`${new Date().getFullYear()} Harvest`);

  useEffect(() => {
    const fetchMills = async () => {
      try {
        setLoading(true);
        let url = `${API_BASE_URL}/mill-settlements?year=${selectedYear}`;
        if (user?.id) url += `&traderId=${user.id}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const mapped: MillSummary[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            location: item.location || 'Unknown',
            totalDelivered: item.totalDeliveredAmount || 0,
            totalPaid: item.totalPaidAmount || 0,
            netBalance: item.netBalance || 0,
            lastPaymentDate: item.lastPaymentDate || '',
            is_settled: item.is_settled || 0,
            settledLots: item.settledLots || 0,
            pendingLots: item.pendingLots || 0,
            status: (item.is_settled || (item.pendingLots === 0 && (item.settledLots || 0) > 0)) ? 'SETTLED' : (item.netBalance > 1000000 ? 'CRITICAL' : 'OUTSTANDING'),
          }));

          // Filter out mills with no lots
          const validMills = mapped.filter(m => (m.settledLots || 0) + (m.pendingLots || 0) > 0);
          setMills(validMills);
        } else {
          setMills([]);
        }
      } catch (err) {
        console.error("Error fetching mill summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMills();
  }, [selectedYear, user]);

  const stats = useMemo(() => {
    // totalSettled should only include amounts from mills that are actually settled for this year
    const totalSettledValue = mills.filter(m => m.is_settled === 1).reduce((sum, m) => sum + m.totalPaid, 0);
    const totalOutstanding = mills.reduce((sum, m) => sum + m.netBalance, 0);
    const totalThroughput = mills.reduce((sum, m) => sum + m.totalDelivered, 0);
    return { totalSettled: totalSettledValue, totalOutstanding, totalThroughput };
  }, [mills]);


  const filteredMills = mills.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)}L`;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#020617]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Factory className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#f8fafc] dark:bg-[#020617] font-display flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">

      {/* Institutional Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5 px-4 md:px-10 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">
                Mill <span className="text-primary">Settlements</span>
              </h1>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 md:mt-1.5 flex items-center gap-2">
                <Activity className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary animate-pulse" />
                Strategic Institutional Audit
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex flex-1 md:flex-none items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-xl md:rounded-2xl h-10 md:h-11 px-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-300 outline-none focus:ring-0 cursor-pointer uppercase tracking-widest flex-1 md:flex-none"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent border-none text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-300 outline-none focus:ring-0 cursor-pointer uppercase tracking-widest flex-1 md:flex-none"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1 md:w-64 lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 md:h-11 pl-10 pr-4 bg-slate-100 dark:bg-white/5 border-none rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </header>

      {/* Main Content Scrollable */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-10 pb-32 md:pb-10 space-y-8 md:space-y-12">

        {/* KPI Intelligence Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">

          <div className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/20 p-6 md:p-10 rounded-3xl md:rounded-[48px] flex flex-col justify-center relative shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
            <div className="absolute top-0 right-0 p-6 md:p-10 opacity-10 group-hover:scale-110 transition-transform duration-500 text-orange-500">
              <Clock className="w-24 h-24 md:w-32 md:h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 text-orange-600 dark:text-orange-400">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] leading-none mb-1">Outstanding Debt</h3>
                  <p className="text-[8px] md:text-[9px] font-bold text-orange-500/60 uppercase tracking-widest">In-Progress Audit</p>
                </div>
              </div>
              <p className="text-3xl md:text-5xl font-[1000] text-orange-600 dark:text-orange-400 tracking-tighter italic leading-none mb-3 md:mb-4">
                {formatCurrency(stats.totalOutstanding)}
              </p>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-orange-500 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-full">{mills.filter(m => m.status !== 'SETTLED').length} Mills</span>
                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Clearance</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-white p-6 md:p-10 rounded-3xl md:rounded-[48px] shadow-2xl relative overflow-hidden group flex flex-col justify-center sm:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <p className="text-[9px] md:text-[10px] font-black text-white/40 dark:text-slate-400 uppercase tracking-[0.3em]">Institutional Throughput</p>
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h4 className="text-3xl md:text-5xl font-[1000] text-primary italic tracking-tighter tabular-nums mb-2 leading-none">
                {formatCurrency(stats.totalThroughput)}
              </h4>
              <p className="text-[9px] md:text-[10px] font-bold text-white/60 dark:text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                <Package className="w-3 h-3" />
                Total Seasonal Manifest Value
              </p>
            </div>
          </div>
        </section>

        {/* Mill Wise List Section */}
        <section className="space-y-6 md:space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
            <div>
              <h2 className="text-xl md:text-2xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter">Mill-Wise Ledger</h2>
              <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed individual settlement status</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-white/5 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-white/5 hover:bg-slate-50 transition-all shadow-sm">Export Statement</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredMills.map((mill, i) => (
              <motion.div
                key={mill.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/mill-settlement/${mill.id}`)}
                className="group bg-white dark:bg-slate-900 rounded-2xl md:rounded-[32px] border border-slate-100 dark:border-white/5 p-5 md:p-6 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div className="p-3 md:p-4 bg-slate-50 dark:bg-white/5 rounded-xl md:rounded-2xl group-hover:bg-primary group-hover:text-background-dark transition-all duration-500 shadow-sm border border-slate-100 dark:border-white/5">
                    <Factory className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest border shadow-sm ${mill.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    mill.status === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                    {mill.status}
                  </div>
                </div>

                <div className="space-y-1 mb-6 md:mb-8">
                  <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">{mill.name}</h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" /> {mill.location}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6 border-t border-slate-50 dark:border-white/5">
                  <div>
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Net Balance</p>
                    <p className={`text-base md:text-lg font-black tracking-tighter leading-none italic ${mill.netBalance > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                      ₹{(mill.netBalance / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Last Payment</p>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase leading-none mt-1">
                      {mill.lastPaymentDate ? mill.lastPaymentDate.split('-').reverse().join('/') : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-dashed border-slate-100 dark:border-white/5">
                  <div>
                    <p className="text-[7px] md:text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-2 md:w-2.5 h-2 md:h-2.5" /> Settled
                    </p>
                    <p className="text-xs md:text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{mill.settledLots}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] md:text-[8px] font-black text-primary uppercase tracking-widest mb-1 leading-none italic">Settled Capital</p>
                    <p className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                      ₹{(mill.totalPaid / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                <div className="mt-4 md:mt-6 flex items-center justify-between">
                  <div className="h-1 md:h-1.5 flex-1 bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden mr-4">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mill.totalDelivered > 0 ? (mill.totalPaid / mill.totalDelivered) * 100 : 0}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
