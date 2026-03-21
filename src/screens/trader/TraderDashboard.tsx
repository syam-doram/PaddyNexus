import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Tractor, Sprout, TrendingUp, Users, Package, Clock, ArrowUpRight, IndianRupee, Bell, Search, History, Newspaper, Factory } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/apiConfig';

interface MarketRate {
  id: string;
  paddy_type: string;
  price_per_quintal: number;
  date: string;
  description?: string;
}

export default function TraderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [marketRates, setMarketRates] = useState<MarketRate[]>([]);
  const [stats, setStats] = useState({
    totalBags: 0,
    totalLots: 0,
    totalAcres: 0,
    activeMachines: 0,
    loadingLots: 0
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        let lotUrl = `${API_BASE_URL}/lot-stages`;
        let machineUrl = `${API_BASE_URL}/machines?includeSettled=true`;
        
        const tId = user?.trader_id || user?.id;
        if (tId) {
          lotUrl += `?traderId=${tId}`;
          machineUrl += `&traderId=${tId}`;
        }

        const [lotsRes, machinesRes] = await Promise.all([
          fetch(lotUrl),
          fetch(machineUrl)
        ]);
        
        let lotsList = [];
        let machinesList = [];

        if (lotsRes.ok) lotsList = await lotsRes.json();
        if (machinesRes.ok) machinesList = await machinesRes.json();

        const activeMachines = machinesList.filter((m: any) => m.is_settled_year === 0);
        const loadingLots = lotsList.filter((l: any) => l.stage === 'LOADING' || l.stage === 'LOADED' || l.stage === 'IN TRANSIT');
        const totalBags = lotsList.reduce((acc: number, curr: any) => acc + (curr.bags || 0), 0);
        const totalAcres = machinesList.reduce((acc: number, curr: any) => acc + (curr.totalAcres || 0), 0);

        setStats({
          totalBags,
          totalLots: lotsList.length,
          totalAcres,
          activeMachines: activeMachines.length,
          loadingLots: loadingLots.length
        });
      } catch (err) {
        console.error("Dashboard stats fetch error:", err);
      }
    };

    const fetchMarket = async () => {
      try {
        let url = `${API_BASE_URL}/paddy-market`;
        const tId = user?.trader_id || user?.id;
        if (tId) {
          url += `?traderId=${tId}`;
        }
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const latest = data.reduce((acc: any, curr: any) => {
            if (!acc[curr.paddy_type]) acc[curr.paddy_type] = curr;
            return acc;
          }, {});
          setMarketRates(Object.values(latest));
        }
      } catch (err) {
        console.error("Market fetch error:", err);
      }
    };

    fetchSummary();
    fetchMarket();
  }, [user]);

  return (
    <div className="relative h-full flex flex-col w-full bg-background-light dark:bg-background-dark font-display">
      <header className="px-5 lg:px-8 pt-5 lg:pt-10 pb-3 lg:pb-6 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl z-40 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="relative cursor-pointer group" onClick={() => navigate('/profile')}>
            <div className="absolute inset-0 bg-emerald-500 rounded-xl md:rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop" 
              alt="Profile" 
              className="w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-xl md:rounded-2xl border-2 border-white dark:border-white/10 shadow-xl object-cover relative z-10" 
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 bg-emerald-500 rounded-full border-2 border-[#F8FAFC] dark:border-background-dark z-20 shadow-sm" />
          </div>
          <div>
            <p className="text-[8px] md:text-[9px] lg:text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1 flex items-center gap-1.5 lg:gap-2">
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-emerald-500 rounded-full animate-pulse" />
              Strategic Partner
            </p>
            <h2 className="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">Trader Hub</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button className="p-2 md:p-2.5 lg:p-3 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-emerald-500 transition-all shadow-sm">
            <Search className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button className="relative p-2 md:p-2.5 lg:p-3 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-emerald-500 transition-all shadow-sm">
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 md:w-2 md:h-2 bg-rose-500 rounded-full border-2 border-white dark:border-background-dark" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 lg:px-8 pt-4 lg:pt-10 pb-32 lg:pb-24 no-scrollbar max-w-[1600px] mx-auto w-full">

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 items-start">
            
            <div className="lg:col-span-2 space-y-8">
                {/* Essential Stats Grid */}
                 <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6">
                   <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="bg-primary p-4 md:p-6 rounded-[24px] md:rounded-[32px] text-background-dark shadow-xl shadow-primary/20 relative overflow-hidden group"
                   >
                     <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                         <Package className="w-20 md:w-24 h-20 md:h-24" />
                     </div>
                     <div className="relative z-10 flex justify-between items-start mb-4 md:mb-6">
                       <div className="p-2 md:p-3 bg-background-dark/10 rounded-xl md:rounded-2xl">
                         <Package className="w-5 h-5 md:w-6 md:h-6" />
                       </div>
                       <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 opacity-40" />
                     </div>
                     <p className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter mb-1">{stats.totalBags.toLocaleString()}</p>
                     <p className="text-[8px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-widest opacity-60">Total Bags</p>
                   </motion.div>
 
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: 0.1 }}
                     className="bg-white dark:bg-surface-dark p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden group"
                   >
                     <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform text-primary">
                         <TrendingUp className="w-20 md:w-24 h-20 md:h-24" />
                     </div>
                     <div className="relative z-10 flex justify-between items-start mb-4 md:mb-6">
                       <div className="p-2 md:p-3 bg-primary/10 rounded-xl md:rounded-2xl text-primary">
                         <Users className="w-5 h-5 md:w-6 md:h-6" />
                       </div>
                       <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                     </div>
                     <p className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{stats.totalLots}</p>
                     <p className="text-[8px] md:text-[10px] lg:text-[11px] font-black uppercase tracking-widest text-slate-400">Total Lots</p>
                   </motion.div>
                 </div>

                {/* Operations Section */}
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <div className="w-2 h-8 bg-primary rounded-full" />
                    Active Operations
                  </h2>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                     {/* Machine Card */}
                     <div 
                       onClick={() => navigate('/trader/fleet')}
                       className="bg-white dark:bg-surface-dark p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all cursor-pointer group"
                     >
                       <div className="flex items-center gap-4 md:gap-5 mb-5 md:mb-6">
                         <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-50 dark:bg-orange-500/10 rounded-[20px] md:rounded-[24px] flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                           <Tractor className="w-7 h-7 md:w-8 md:h-8" />
                         </div>
                         <div>
                           <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Machine Fleet</h3>
                           <div className="flex items-center gap-1.5 mt-0.5">
                             <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full animate-pulse" />
                             <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.activeMachines} Active Units</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center justify-between pt-5 md:pt-6 border-t border-slate-50 dark:border-white/5">
                         <span className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">{stats.totalAcres.toFixed(1)} Acres Done</span>
                         <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-primary transition-colors" />
                       </div>
                     </div>
 
                     {/* Paddy Card */}
                     <div 
                       onClick={() => navigate('/trader/logs')}
                       className="bg-white dark:bg-surface-dark p-5 md:p-6 rounded-[28px] md:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all cursor-pointer group"
                     >
                       <div className="flex items-center gap-4 md:gap-5 mb-5 md:mb-6">
                         <div className="w-14 h-14 md:w-16 md:h-16 bg-green-50 dark:bg-green-500/10 rounded-[20px] md:rounded-[24px] flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                           <Sprout className="w-7 h-7 md:w-8 md:h-8" />
                         </div>
                         <div>
                           <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Paddy Logs</h3>
                           <div className="flex items-center gap-1.5 mt-0.5">
                             <Clock className="w-3.5 h-3.5 text-slate-300" />
                             <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats.loadingLots} In Transit</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex items-center justify-between pt-5 md:pt-6 border-t border-slate-50 dark:border-white/5">
                         <span className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">Active Pipeline</span>
                         <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-slate-300 group-hover:text-primary transition-colors" />
                       </div>
                     </div>
                   </div>
                </div>
            </div>

            {/* Side Panel: Management */}
            <div className="mt-8 lg:mt-0 space-y-8">
                <div className="bg-slate-900 rounded-[32px] md:rounded-[40px] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden min-h-[400px] md:min-h-[500px] flex flex-col">
                    <div className="relative z-10 flex-1">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                                Market Watch
                            </h2>
                            <Newspaper className="w-4 h-4 md:w-5 md:h-5 text-white/20" />
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            {marketRates.length > 0 ? marketRates.map((rate) => (
                                <div key={rate.id} className="p-4 md:p-5 bg-white/5 hover:bg-white/10 rounded-2xl md:rounded-3xl border border-white/5 transition-all group">
                                    <div className="flex items-center justify-between mb-2 md:mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 md:w-10 md:h-10 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <Sprout className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-tight leading-none mb-1">{rate.paddy_type}</p>
                                                <p className="text-[7px] md:text-[8px] font-bold text-white/40 uppercase tracking-widest leading-none">{rate.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm md:text-base font-black text-primary leading-none mb-1">₹{rate.price_per_quintal.toLocaleString()}</p>
                                            <p className="text-[7px] md:text-[8px] font-black text-white/20 uppercase tracking-widest">Rate / Qtl</p>
                                        </div>
                                    </div>
                                    {rate.description && (
                                        <p className="text-[8px] md:text-[9px] font-medium text-white/40 leading-relaxed line-clamp-2 px-1">
                                            {rate.description}
                                        </p>
                                    )}
                                </div>
                            )) : (
                                <div className="py-12 md:py-20 text-center">
                                    <Clock className="w-8 h-8 md:w-10 md:h-10 text-white/5 mx-auto mb-4" />
                                    <p className="text-[8px] md:text-[10px] font-black text-white/20 uppercase tracking-widest">Awaiting Market Update</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/5">
                             <div className="grid grid-cols-2 gap-3 md:gap-4">
                                <button className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl text-center group">
                                    <Users className="w-4 h-4 md:w-5 md:h-5 text-white/40 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                    <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/40">Teams</p>
                                </button>
                                <button className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl text-center group">
                                    <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-white/40 mx-auto mb-2 group-hover:text-primary transition-colors" />
                                    <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/40">Audit</p>
                                </button>
                             </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 md:mt-10 relative z-10">
                         <div className="p-4 md:p-5 bg-primary/10 rounded-[20px] md:rounded-3xl border border-primary/20 text-center">
                             <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest mb-1">Intelligence Scoped</p>
                             <p className="text-[10px] md:text-xs font-bold opacity-60">Session {new Date().getFullYear()}</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
