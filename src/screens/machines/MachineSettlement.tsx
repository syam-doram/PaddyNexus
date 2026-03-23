import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Tractor, ChevronRight, AlertCircle, Calendar, Search, Download, Filter, FileStack, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

interface MachineSettlementData {
  id: string;
  name: string;
  model: string;
  totalEarnings: number;
  totalAdvances: number;
  netBalance: number;
  status: string;
  is_settled: number;
  operator?: string;
  totalHours?: number;
  per_hour_rate?: number;
  settled_at?: string;
  activeDates?: string[];
  totalDealerCommission?: number;
}

export default function MachineSettlement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [activeYear, setActiveYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState('');
  const [settlements, setSettlements] = useState<MachineSettlementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBulkReport, setShowBulkReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'outstanding' | 'settled'>('outstanding');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');


  const years = useMemo(() => {
    const startYear = 2024;
    const endYear = currentYear + 1;
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).reverse();
  }, [currentYear]);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const tId = user?.trader_id || user?.id;
      let url = `${API_BASE_URL}/machine-settlements?year=${activeYear}`;
      if (tId) url += `&traderId=${tId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSettlements(data);
      }
    } catch (err) {
      console.error("Failed to fetch settlements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [activeYear]);

  const filteredSettlements = useMemo(() => {
    return settlements
      .filter(s => activeTab === 'outstanding' ? !s.is_settled : s.is_settled)
      .filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.operator || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.model.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [settlements, searchQuery, activeTab]);

  const stats = useMemo(() => {
    return filteredSettlements.reduce((acc, curr) => ({
      earnings: acc.earnings + curr.totalEarnings,
      advances: acc.advances + curr.totalAdvances,
      commissions: acc.commissions + (curr.totalDealerCommission || 0),
      balance: acc.balance + curr.netBalance
    }), { earnings: 0, advances: 0, commissions: 0, balance: 0 });
  }, [filteredSettlements]);



  return (
    <div className="relative flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="px-4 lg:px-6 pt-6 lg:pt-12 pb-4 lg:pb-6">
          {/* Header Top Section */}
          <div className="flex items-center justify-between mb-4 lg:mb-8">
            <div className="flex items-center gap-3 lg:gap-4">
               <button onClick={() => navigate(-1)} className="p-2 lg:p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 transition-colors">
                 <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
               </button>
               <div>
                  <h1 className="text-xl lg:text-3xl font-black tracking-tighter uppercase leading-none">Fleet <span className="text-primary">Settlements</span></h1>
                  <p className="hidden md:block text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Ledger Management</p>
               </div>
            </div>
          </div>

          {/* Compressed Mobile Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
             <div className="w-full sm:flex-1 flex gap-2 lg:gap-4 overflow-x-auto no-scrollbar py-1">
                {years.map(y => (
                  <button
                    key={y}
                    onClick={() => setActiveYear(y)}
                    className={`px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl lg:rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeYear === y 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                    }`}
                  >
                    {y}
                  </button>
                ))}
             </div>
             
             <div className="flex items-center gap-2 lg:gap-4 w-full sm:w-auto">
                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl shrink-0">
                   <button onClick={() => setViewMode('grid')} className={`p-2 lg:p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}><FileStack className="w-3.5 h-3.5" /></button>
                   <button onClick={() => setViewMode('list')} className={`p-2 lg:p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}><Filter className="w-3.5 h-3.5 rotate-90" /></button>
                   <button onClick={() => setViewMode('timeline')} className={`p-2 lg:p-2.5 rounded-lg transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400'}`}><TrendingUp className="w-3.5 h-3.5 rotate-90" /></button>
                </div>
                
                <div className="relative group flex-1 sm:w-48 lg:w-72">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                   <input 
                     type="text"
                     placeholder="Search..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl py-2.5 lg:py-3.5 pl-9 pr-4 text-[10px] font-bold focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                   />
                </div>
             </div>
          </div>

          {/* Compressed Stats Cardiovascular Strip */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mt-4 p-4 lg:p-6 bg-slate-100 dark:bg-white/5 rounded-[24px] lg:rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-4 lg:gap-12 sm:items-center w-full lg:w-auto">
                  <div className="flex bg-white dark:bg-slate-800 p-0.5 rounded-xl shadow-sm w-full sm:w-auto overflow-x-auto no-scrollbar shrink-0">
                      {(['outstanding', 'settled'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 sm:flex-none px-6 lg:px-10 py-2 lg:py-2.5 rounded-lg text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab 
                              ? 'bg-primary text-background-dark shadow-md' 
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                  </div>
                  
                  <div className="flex flex-1 justify-around sm:justify-start gap-6 lg:gap-12 px-2">
                      <div className="shrink-0">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">Position</p>
                          <p className="text-sm lg:text-xl font-black text-slate-900 dark:text-white leading-none">
                             ₹{(activeTab === 'outstanding' ? stats.balance : stats.earnings).toLocaleString('en-IN')}
                          </p>
                      </div>
                      <div className="shrink-0 sm:border-l border-slate-200 dark:border-white/10 sm:pl-6 lg:pl-12">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">Revenue</p>
                          <p className="text-sm lg:text-xl font-black text-primary leading-none">₹{stats.earnings.toLocaleString()}</p>
                      </div>
                      <div className="hidden md:block shrink-0 border-l border-slate-200 dark:border-white/10 pl-6 lg:pl-12">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5 opacity-60">Status</p>
                          <p className="text-[9px] font-black text-slate-900 dark:text-white leading-none uppercase">
                             {filteredSettlements.filter(s => !s.is_settled).length} OUT / {filteredSettlements.filter(s => s.is_settled).length} SET
                          </p>
                      </div>
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">

                    <button 
                        onClick={() => setShowBulkReport(true)}
                        className="flex-1 lg:flex-none px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg shrink-0"
                    >
                        <FileStack className="w-3.5 h-3.5" /> 
                        <span>Summary Report</span>
                    </button>
              </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-12 pb-32">
        <div className="w-full">
            {viewMode === 'timeline' ? (
                <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-white/5">
                                    <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 p-6 text-left border-r border-slate-200 dark:border-white/10 min-w-[200px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet Unit</p>
                                    </th>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <th key={i} className="p-6 text-center border-r border-slate-100 dark:border-white/5 min-w-[150px]">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {new Date(activeYear, i).toLocaleDateString('en-US', { month: 'short' })}
                                            </p>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSettlements.map((s) => (
                                    <tr key={s.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                        <td className="sticky left-0 z-20 bg-white dark:bg-surface-dark p-6 border-r border-slate-200 dark:border-white/10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Tractor className="w-4 h-4" /></div>
                                                <p className="text-[11px] font-black uppercase tracking-tight truncate">{s.name}</p>
                                            </div>
                                        </td>
                                        {Array.from({ length: 12 }, (_, monthIdx) => {
                                            const monthStart = new Date(activeYear, monthIdx, 1);
                                            const monthEnd = new Date(activeYear, monthIdx + 1, 0);
                                            const daysInMonth = monthEnd.getDate();
                                            return (
                                                <td key={monthIdx} className="p-4 border-r border-slate-50 dark:border-white/5">
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                                                            const dateStr = `${activeYear}-${String(monthIdx + 1).padStart(2, '0')}-${String(dayIdx + 1).padStart(2, '0')}`;
                                                            const isActive = s.activeDates?.includes(dateStr);
                                                            return (
                                                                <div 
                                                                    key={dayIdx} 
                                                                    title={dateStr}
                                                                    className={`w-2 h-2 rounded-[2px] ${isActive ? 'bg-primary shadow-sm shadow-primary/40' : 'bg-slate-100 dark:bg-white/5 opacity-40'}`} 
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div className="col-span-full py-40 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Settlement Data...</p>
                            </div>
                        ) : filteredSettlements.length > 0 ? (
                            filteredSettlements.map((s, i) => (
                                viewMode === 'grid' ? (
                                <motion.div 
                                    layout
                                    key={s.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-slate-100 dark:border-white/5 hover:border-primary/20 hover:shadow-2xl transition-all shadow-sm flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-[28px] flex items-center justify-center group-hover:bg-primary group-hover:text-background-dark transition-all duration-500">
                                                <Tractor className="w-8 h-8" />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">{s.name}</h4>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {s.model} • {s.operator || 'Standby'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black tracking-widest uppercase border ${
                                            s.is_settled 
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xl' 
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                            {s.is_settled ? 'FINALIZED' : 'ACTIVE LEDGER'}
                                        </div>
                                    </div>

                                    {s.is_settled && s.settled_at && (
                                        <div className="mb-6 px-6 py-3 bg-slate-900/5 dark:bg-white/5 rounded-2xl flex items-center justify-between border border-dashed border-slate-200 dark:border-white/10">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Settled On</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                {new Date(s.settled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5 transition-all">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Performance</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">{s.totalHours || 0}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Hrs Logged</p>
                                            </div>
                                        </div>
                                        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-transparent group-hover:border-slate-100 dark:group-hover:border-white/5 transition-all">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Contract Rate</p>
                                            <div className="flex items-baseline gap-2">
                                                <p className="text-xl font-black tracking-tighter text-primary">₹{s.per_hour_rate || 0}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">/ Hr</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-8">
                                        {[
                                            { label: 'GROSS YIELD', val: s.totalEarnings, col: 'text-slate-900 dark:text-white', bg: 'bg-emerald-500/5' },
                                            { label: 'ADVANCES', val: s.totalAdvances, col: 'text-red-500', bg: 'bg-red-500/5' },
                                            { label: 'NET BALANCE', val: s.netBalance, col: 'text-primary', bg: 'bg-primary/5' }
                                        ].map((m, idx) => (
                                            <div key={idx} className={`p-4 ${m.bg} rounded-3xl border border-transparent flex flex-col justify-center`}>
                                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{m.label}</p>
                                                <p className={`text-sm font-black tracking-tighter ${m.col}`}>₹{m.val.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>


                                    
                                    <button 
                                        onClick={() => navigate(`/machine-settlement/${s.id}?year=${activeYear}`)}
                                        className="mt-4 w-full py-4 bg-primary text-background-dark rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg"
                                    >
                                        Settle & Audit <ChevronRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                                ) : (
                                <motion.div
                                    layout
                                    key={s.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 shadow-sm"
                                >
                                    <div className="flex items-center gap-6 w-full sm:w-auto">
                                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-background-dark transition-all duration-300 shrink-0">
                                            <Tractor className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 sm:w-48">
                                            <h4 className="text-sm lg:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{s.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.model}</p>
                                                {s.is_settled && s.settled_at && (
                                                    <span className="text-[7px] font-black text-primary uppercase tracking-[0.2em] bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                        SETTLED: {new Date(s.settled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {s.is_settled === 1 && (
                                            <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-slate-900 dark:bg-white/10 rounded-full w-fit">
                                                <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                                                <span className="text-[8px] font-black text-white dark:text-slate-300 uppercase tracking-widest">
                                                    Session Finalized for ₹{s.netBalance.toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 py-4 sm:py-0 px-0 sm:px-4 lg:px-8 border-y sm:border-y-0 sm:border-x border-slate-100 dark:border-white/10">
                                        <div className="text-left sm:text-center">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white">₹{s.totalEarnings.toLocaleString()}</p>
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Comms</p>
                                            <p className="text-sm font-black text-slate-400">₹{(s.totalDealerCommission || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid</p>
                                            <p className="text-sm font-black text-red-500">₹{s.totalAdvances.toLocaleString()}</p>
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                              {s.is_settled ? 'Final' : 'Dues'}
                                            </p>
                                            <p className={`text-sm font-black ${s.is_settled ? 'text-slate-900' : 'text-primary'}`}>
                                              ₹{s.netBalance.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-left sm:text-center">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Usage</p>
                                            <p className="text-sm font-black text-slate-400">{s.totalHours || 0} Hrs</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                        <button 
                                           onClick={() => navigate(`/machine-settlement/${s.id}?year=${activeYear}`)}
                                           className="px-8 py-4 bg-primary text-background-dark rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                        >
                                           View Audit <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                                )
                            ))
                        ) : (
                            <div className="col-span-full py-40 text-center">
                                <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                <h4 className="text-xl font-black text-slate-300 uppercase tracking-tight mb-2">No Ledger Data</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust filters or search criteria</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
      </main>

       {/* Bulk Report Modal - Premium Desktop View */}
       <AnimatePresence>
         {showBulkReport && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6 bg-[#0F172A]/90 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.95, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 50 }} className="w-full max-w-4xl bg-white dark:bg-[#1E293B] rounded-[32px] lg:rounded-[56px] h-[90vh] lg:h-[85vh] flex flex-col shadow-2xl overflow-hidden relative border border-white/10">
               <div className="p-6 lg:p-10 border-b border-slate-100 dark:border-white/5 shrink-0 bg-slate-900 text-white flex justify-between items-end">
                 <div>
                    <span className="text-[8px] lg:text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1 lg:mb-2 block">
                       {activeTab === 'outstanding' ? 'Executive Outstanding Summary' : 'Executive Settlement Archive'}
                    </span>
                    <h3 className="text-xl lg:text-4xl font-black uppercase tracking-tighter">
                       {activeYear} {activeTab === 'outstanding' ? 'Pending Dues' : 'Finalized'}
                    </h3>
                 </div>
                 <div className="flex gap-2 lg:gap-4">
                     <button className="h-10 w-10 lg:h-14 lg:w-14 bg-white/10 rounded-xl lg:rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all"><Download className="w-4 h-4 lg:w-6 lg:h-6" /></button>
                     <button onClick={() => setShowBulkReport(false)} className="h-10 w-10 lg:h-14 lg:w-14 bg-white/10 rounded-xl lg:rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all text-white/40 hover:text-white"><X className="w-5 h-5 lg:w-7 lg:h-7" /></button>
                 </div>
               </div>
 
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-6 lg:px-10 py-4 lg:py-8 bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                  <div className="p-4 lg:p-6 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-white/5">
                     <p className="text-[8px] lg:text-[10px] font-black uppercase opacity-40 mb-1 lg:mb-2">Total Yield</p>
                     <p className="text-xl lg:text-3xl font-black text-emerald-500">₹{stats.earnings.toLocaleString()}</p>
                  </div>
                  <div className="p-4 lg:p-6 border-b sm:border-b-0 sm:border-r border-slate-100 dark:border-white/5">
                     <p className="text-[8px] lg:text-[10px] font-black uppercase opacity-40 mb-1 lg:mb-2">Advance Liability</p>
                     <p className="text-xl lg:text-3xl font-black text-red-500">₹{stats.advances.toLocaleString()}</p>
                  </div>
                  <div className="p-4 lg:p-6">
                     <p className="text-[8px] lg:text-[10px] font-black uppercase opacity-40 mb-1 lg:mb-2">Net Distribution</p>
                     <p className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white">₹{stats.balance.toLocaleString()}</p>
                  </div>
               </div>
 
               <div className="flex-1 overflow-auto p-4 lg:p-10 no-scrollbar">
                 <div className="min-w-[600px] lg:min-w-0">
                  <table className="w-full">
                      <thead>
                          <tr className="text-left py-4 border-b border-slate-100 dark:border-white/10">
                              <th className="pb-6 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Asset</th>
                              <th className="pb-6 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                              <th className="pb-6 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Gross Income</th>
                              <th className="pb-6 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Paid Out</th>
                              <th className="pb-6 text-[8px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Net Dues</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                         {filteredSettlements.map(s => (
                             <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                 <td className="py-6 pr-4">
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors"><Tractor className="w-5 h-5" /></div>
                                         <div>
                                             <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{s.name}</p>
                                             <p className="text-[8px] font-bold text-slate-400 uppercase">{s.model}</p>
                                         </div>
                                     </div>
                                 </td>
                                 <td className="py-6">
                                     <span className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase ${s.is_settled ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-emerald-50 text-emerald-600'}`}>
                                         {s.is_settled ? 'Settled' : 'Active'}
                                     </span>
                                 </td>
                                 <td className="py-6 text-right text-xs font-black">₹{s.totalEarnings.toLocaleString()}</td>
                                 <td className="py-6 text-right text-xs font-black text-red-500">₹{s.totalAdvances.toLocaleString()}</td>
                                 <td className="py-6 text-right text-sm font-black text-slate-900 dark:text-white">₹{s.netBalance.toLocaleString()}</td>
                             </tr>
                         ))}
                     </tbody>
                  </table>
                 </div>
               </div>
 
               <div className="p-6 lg:p-10 shrink-0 bg-slate-50 dark:bg-black/20 flex justify-end">
                 <button 
                   onClick={() => setShowBulkReport(false)}
                   className="w-full lg:w-auto px-8 lg:px-12 py-4 lg:py-5 bg-slate-900 dark:bg-white text-white dark:text-background-dark rounded-2xl lg:rounded-[24px] text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] lg:tracking-[0.3em] shadow-xl active:scale-95 transition-all"
                 >
                   Close Data Summary
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}
