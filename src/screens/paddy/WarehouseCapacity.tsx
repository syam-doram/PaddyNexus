import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Bell, 
  Info, 
  AlertTriangle, 
  Bug, 
  LayoutList, 
  Plus, 
  ChevronRight, 
  Droplets, 
  Sprout,
  LayoutGrid,
  TrendingUp,
  Activity,
  ShieldCheck,
  Zap
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

interface Silo {
  id: string;
  name: string;
  variety: string;
  bags: number;
  remaining_tons: number;
  capacity_tons: number;
}


export default function WarehouseCapacity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [silos, setSilos] = useState<Silo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSilos();
  }, [user]);

  const fetchSilos = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/silos`;
      if (user?.id) url += `?traderId=${user.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setSilos(data);
    } catch (err) {
      console.error("Failed to fetch silos:", err);
    } finally {
      setLoading(false);
    }
  };

  const capacity = 20000;
  const filled = silos.reduce((acc, s) => acc + (s.bags || 0), 0);
  const usagePercentage = capacity > 0 ? Math.round((filled / capacity) * 100) : 0;

  const getStatus = (progress: number) => {
    if (progress > 85) return { status: 'Critical', color: 'bg-red-500', icon: Zap };
    if (progress > 60) return { status: 'Stable', color: 'bg-yellow-500', icon: Activity };
    if (progress > 30) return { status: 'Optimal', color: 'bg-primary', icon: ShieldCheck };
    return { status: 'Available', color: 'bg-emerald-500', icon: LayoutGrid };
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1600px] flex flex-col h-full relative">
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 lg:px-12 py-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-background-dark transition-all"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">Inventory <span className="text-primary italic">Intelligence</span></h1>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                Live Storage Telemetry & Capacity Auditing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-primary transition-colors">
                <Bell className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button className="hidden sm:flex items-center gap-3 px-6 py-3 bg-primary text-background-dark rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <Plus className="w-4 h-4" />
              Initialize Silo
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-12 overflow-y-auto no-scrollbar pb-32">
            <div className="space-y-12">
                
                {/* Visual Analytics */}
                <section className="bg-white dark:bg-surface-dark p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                        <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0">
                            <svg className="w-full h-full -rotate-90 transform">
                                <circle
                                    cx="50%" cy="50%" r="44%"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    className="text-slate-100 dark:text-white/5"
                                />
                                <motion.circle
                                    cx="50%" cy="50%" r="44%"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    strokeDasharray="100 100"
                                    initial={{ strokeDashoffset: 100 }}
                                    animate={{ strokeDashoffset: 100 - usagePercentage }}
                                    className="text-primary"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white">{usagePercentage}%</span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 md:mt-2">Utilized</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-8 md:space-y-10 w-full">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 italic">Total <span className="text-primary italic">Intelligence</span></h3>
                                <p className="text-xs font-medium text-slate-400 leading-relaxed max-w-md">
                                    Real-time capacity analysis indicates <b>{usagePercentage}%</b> volumetric occupancy across all primary silos. Storage protocol remains stable.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 md:gap-10 border-t border-slate-50 dark:border-white/5 pt-8">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Gross Capacity</p>
                                    <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase whitespace-nowrap">{(capacity / 1000).toFixed(1)}K <span className="text-sm">Bags</span></p>
                                </div>
                                <div className="text-right sm:text-left">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">Available Volume</p>
                                    <p className="text-xl md:text-2xl font-black text-primary tracking-tighter uppercase whitespace-nowrap">{((capacity - filled) / 1000).toFixed(1)}K <span className="text-sm">Bags</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Alerts Column */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Critical System Alerts</h3>
                            <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[9px] font-black uppercase italic tracking-widest">2 Protocol Alerts</span>
                        </div>

                        <div className="space-y-4">
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-orange-500 shadow-xl shadow-orange-500/20 rounded-[32px] p-6 lg:p-8 flex items-start gap-6 relative overflow-hidden"
                            >
                                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                                    <Droplets className="w-7 h-7 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">High Moisture Detection</h4>
                                        <span className="text-[10px] font-black text-white/60">02m AGO</span>
                                    </div>
                                    <p className="text-xs font-bold text-white/80 leading-relaxed">Silo Alpha sensor reporting 14.5% moisture. Activating ventilation protocols.</p>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-slate-900 shadow-xl rounded-[32px] p-6 lg:p-8 border border-white/5 flex items-start gap-6 relative overflow-hidden"
                            >
                                <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shrink-0">
                                    <Bug className="w-7 h-7 text-red-500" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Anomaly Reported</h4>
                                        <span className="text-[10px] font-black text-slate-500">1h AGO</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 leading-relaxed">Pest activity signature detected in Depot Bravo (North Sector). Scanners active.</p>
                                </div>
                                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-slate-900 shadow-xl rounded-[32px] p-6 lg:p-8 border border-white/5 flex items-start gap-6 relative overflow-hidden"
                            >
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                                    <Activity className="w-7 h-7 text-primary" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">System Pulse</h4>
                                        <span className="text-[10px] font-black text-white/40">ONLINE</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed">All silo sensors reporting nominal data flow. No anomalies detected.</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Silos Grid Column */}
                    <div className="lg:col-span-8">
                        <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Silo Inventory Logs</h3>
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black uppercase text-slate-500">Live Grid View</span>
                            </div>
                        </div>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {loading ? (
                                [1,2].map(i => (
                                    <div key={i} className="h-64 bg-white dark:bg-surface-dark rounded-[40px] animate-pulse" />
                                ))
                            ) : silos.length === 0 ? (
                                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
                                    <LayoutGrid className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Silos Initialized</p>
                                </div>
                            ) : silos.map((silo, i) => {
                                const progress = silo.capacity_tons > 0 ? Math.round(((silo.capacity_tons - silo.remaining_tons) / silo.capacity_tons) * 100) : 0;
                                const { status, color, icon: Icon } = getStatus(progress);
                                
                                return (
                                    <motion.div 
                                        key={silo.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm group hover:border-primary/30 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-xl ${progress > 85 ? 'shadow-red-500/20' : 'shadow-primary/20'}`}>
                                                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{silo.name}</h4>
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1 italic">{silo.variety || 'No Variety'}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest italic flex items-center gap-1.5 ${progress > 85 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                                <Circle className="w-1.5 h-1.5 fill-current" />
                                                {status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Inventory Volume</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-white italic">{silo.bags?.toLocaleString() || 0} <span className="text-[10px] text-slate-400">BAGS</span></p>
                                            </div>
                                            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Available Flux</p>
                                                <p className="text-xl font-black text-slate-900 dark:text-white italic">{silo.remaining_tons} Tons</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saturation Metric</p>
                                                <p className="text-sm font-black text-slate-900 dark:text-white">{progress}%</p>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 relative overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                    transition={{ duration: 1.5, delay: 0.5 + (i * 0.1), ease: "circOut" }}
                                                    className={`${color} h-full rounded-full shadow-[0_0_12px_rgba(0,0,0,0.1)]`} 
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </section>
                    </div>
                </div>

                <section className="bg-slate-900 dark:bg-slate-800 rounded-[32px] md:rounded-[40px] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                        <div className="max-w-md">
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">System Criticality Report</h3>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed">
                                Continuous environmental monitoring active. All silo telemetry within operational thresholds. 
                            </p>
                        </div>
                        <div className="px-6 md:px-8 py-3 md:py-4 bg-primary text-background-dark rounded-2xl md:rounded-[24px] text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 whitespace-nowrap text-center">
                            Operational Status: Optimal
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[80px]" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mb-32 blur-[80px]" />
                </section>
            </div>
        </main>

        {/* Floating Action Button for Mobile */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <button className="w-16 h-16 bg-primary text-background-dark rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
                <Plus className="w-8 h-8" strokeWidth={3} />
            </button>
        </div>

      </div>
    </div>
  );
}

function Circle({ className, ...props }: any) {
    return (
        <svg 
            viewBox="0 0 24 24" 
            className={className}
            {...props}
        >
            <circle cx="12" cy="12" r="12" />
        </svg>
    );
}
