import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Tractor, Search, ArrowLeft, Fuel, Gauge, 
  Settings, ShieldCheck, AlertCircle, TrendingUp, IndianRupee,
  Clock, MapPin
} from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';

interface Machine {
  id: string;
  name: string;
  model: string;
  status: string;
  operator: string;
  per_hour_rate: number;
  totalHours: number;
  totalAcres: number;
  totalAdvanceAmount: number;
  is_settled_year: number;
}

export default function TraderFleet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const traderId = user?.id;
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'settled'>('all');

  useEffect(() => {
    const fetchFleet = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/machines?includeSettled=true&traderId=${traderId}`);
        if (res.ok) {
          const data = await res.json();
          setMachines(data);
        }
      } catch (err) {
        console.error("Fleet fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFleet();
  }, []);

  const filteredMachines = machines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.operator.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && m.is_settled_year === 0) ||
                         (filter === 'settled' && m.is_settled_year === 1);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="relative h-full flex flex-col w-full bg-background-light dark:bg-background-dark font-display">
      <header className="px-5 lg:px-6 pt-5 lg:pt-12 pb-3 lg:pb-6 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl z-40 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-3 lg:gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-primary transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-[9px] lg:text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1 flex items-center gap-1.5 lg:gap-2">
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-emerald-500 rounded-full animate-pulse" />
              Strategic Intelligence
            </p>
            <h2 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">Fleet Oversight</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
                {(['all', 'active', 'settled'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 opacity-60'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
            <div className="w-[1px] h-8 bg-slate-200 dark:bg-white/10 hidden md:block" />
            <button className="p-3 bg-primary rounded-2xl text-background-dark shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <Tractor className="w-5 h-5" />
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 lg:px-6 pt-6 pb-32 no-scrollbar">
        {/* Search Bar */}
        <div className="relative mb-8 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search fleet by identifier or commander..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-16 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 rounded-[32px] pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Grid Assets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMachines.map((machine, idx) => (
                <motion.div
                  key={machine.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all overflow-hidden group"
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-colors ${machine.is_settled_year ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-background-dark'}`}>
                          <Tractor className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{machine.model}</p>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{machine.name}</h3>
                        </div>
                      </div>
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${machine.is_settled_year ? 'bg-slate-100 dark:bg-white/5 text-slate-400' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                        {machine.is_settled_year ? 'Settled' : 'Active'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100/50 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Operational Hrs</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-slate-900 dark:text-white">{(machine.totalHours || 0).toFixed(1)}</span>
                            <Gauge className="w-3.5 h-3.5 text-primary opacity-40" />
                        </div>
                      </div>
                      <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100/50 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Deployment Rate</p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-black text-emerald-500">₹{machine.per_hour_rate}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">/hr</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-white/5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary/40" /> Commander
                            </span>
                            <span className="text-slate-900 dark:text-white uppercase">{machine.operator || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-rose-500/40" /> Coverage
                            </span>
                            <span className="text-slate-900 dark:text-white">{(machine.totalAcres || 0).toFixed(1)} <span className="text-[9px] text-slate-400 uppercase">Acres</span></span>
                        </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-white/5 px-8 py-5 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Yield Allocation</span>
                     </div>
                     <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">₹{(((machine.totalHours || 0) * (machine.per_hour_rate || 0)) / 1000).toFixed(1)}K</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredMachines.length === 0 && (
                <div className="col-span-full py-20 bg-white dark:bg-surface-dark rounded-[40px] border-2 border-dashed border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-12 h-12 text-slate-200 dark:text-white/10 mb-4" />
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">No Assets Detected</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Try adjusting your search or intelligence filters</p>
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
