import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, ArrowLeft, ArrowUpRight, Calendar, MapPin, Building2, Clock, CheckCircle2, TrendingUp, Filter, Activity, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

interface Lot {
  id: string;
  name: string; // Driver Name
  type: string;
  weight: string;
  date: string;
  stage: string;
  paymentStatus: string;
  mill_name?: string;
  load_area?: string;
  bags?: number;
  avg_bag_weight?: number;
  rate?: number;
  vehicle_type?: string;
  settled_at?: string;
  dealer_commission?: number;
}

export default function TraderLogs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'transit' | 'mill' | 'quality' | 'settled'>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        let url = `${API_BASE_URL}/lot-stages`;
        if (user?.id) url += `?traderId=${user.id}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          // Sort by date descending
          setLots(Array.isArray(data) ? data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []);
        }
      } catch (err) {
        console.error("Logs fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLots = lots.filter(l => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         l.mill_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'transit') return matchesSearch && (l.stage === 'LOADING' || l.stage === 'LOADED' || l.stage === 'IN TRANSIT');
    if (filter === 'mill') return matchesSearch && l.stage === 'DELIVERED TO MILL';
    if (filter === 'quality') return matchesSearch && l.stage === 'QUALITY CHECK';
    if (filter === 'settled') return matchesSearch && (l.stage === 'PAID' || l.paymentStatus === 'PAID');
    return matchesSearch;
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PAID': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'DELIVERED TO MILL': return 'text-violet-500 bg-violet-500/10 border-violet-500/20';
      case 'QUALITY CHECK': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background-light dark:bg-background-dark font-display overflow-hidden">
      {/* Header */}
      <header className="px-5 lg:px-8 pt-6 lg:pt-10 pb-6 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl z-40 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Logistics Intelligence
              </p>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                Paddy <span className="text-primary">Logs</span>
              </h1>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Logs</p>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">{lots.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Volume</p>
              <p className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tight">
                {lots.reduce((acc, l) => acc + (parseFloat(l.weight) || 0), 0).toFixed(0)}T
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by lot ID, mill, or driver..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none shadow-sm"
            />
          </div>
          <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl h-14 overflow-x-auto no-scrollbar">
            {(['all', 'transit', 'mill', 'quality', 'settled'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`flex-1 px-5 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-white dark:bg-slate-800 text-primary shadow-lg shadow-black/5' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-8 no-scrollbar pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Payload Records...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredLots.map((lot, idx) => (
                <motion.div
                  key={lot.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                          <Package className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1.5">{lot.vehicle_type || 'Transport Unit'}</h3>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lot.type}</span>
                             <div className="w-1 h-1 bg-slate-300 rounded-full" />
                             <span className="text-[10px] font-bold text-primary">#{lot.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                       <div className={`px-4 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${getStageColor(lot.stage)}`}>
                         <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                         {lot.stage}
                       </div>
                    </div>

                    <div className="space-y-4">
                       {/* Logistics Data */}
                       <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                         <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <Activity className="w-3 h-3" /> Batch Count
                            </p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{lot.bags || 0} Bags</p>
                         </div>
                         <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <TrendingUp className="w-3 h-3 text-emerald-400" /> Tonnage
                            </p>
                            <p className="text-sm font-black text-slate-900 dark:text-white">{lot.weight}</p>
                         </div>
                         <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 col-span-2 lg:col-span-1">
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                              <IndianRupee className="w-3 h-3" /> Dealer Comm.
                            </p>
                            <p className="text-sm font-black text-primary">₹ {((lot.bags || 0) * (lot.dealer_commission || 0)).toLocaleString()}</p>
                         </div>
                       </div>

                       {/* Location Details */}
                       <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Origin</p>
                               <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase truncate">{lot.load_area || 'Not Indexed'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center text-violet-500">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                               <p className="text-[10px] font-bold text-slate-900 dark:text-white uppercase truncate">{lot.mill_name || 'In Transit'}</p>
                            </div>
                          </div>
                       </div>

                       {/* Metadata */}
                       <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5">
                          <div className="flex items-center gap-2">
                             <Calendar className="w-3.5 h-3.5 text-slate-400" />
                             <span className="text-[9px] font-bold text-slate-500">{lot.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <Clock className="w-3.5 h-3.5 text-slate-400" />
                             <span className="text-[9px] font-bold text-slate-500">{lot.settled_at ? 'SETTLED' : 'ACTIVE'}</span>
                          </div>
                       </div>
                    </div>

                    <button 
                      onClick={() => navigate('/lotdetails', { state: { lot } })}
                      className="w-full mt-6 h-12 bg-slate-900 dark:bg-primary text-white dark:text-background-dark rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all group/btn"
                    >
                      Audit Lot Payload
                      <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {!loading && filteredLots.length === 0 && (
              <div className="col-span-full py-20 bg-white dark:bg-surface-dark rounded-[40px] border border-slate-100 dark:border-white/5 text-center px-10">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Search className="w-10 h-10 text-slate-300" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">No Payload Logs</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                   The logistics registry is empty for the current intelligence configuration.
                 </p>
                 <button 
                  onClick={() => {setSearchQuery(''); setFilter('all');}}
                  className="mt-8 px-8 py-3 bg-primary text-background-dark rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                 >
                   Reset Global Watch
                 </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
