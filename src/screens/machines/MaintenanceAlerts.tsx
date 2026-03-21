import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, AlertTriangle, Droplets, Settings2, Hammer, Bell, Clock, Info, ShieldAlert, History, IndianRupee, Zap, ChevronRight, Gauge } from 'lucide-react';
import { useState } from 'react';

export default function MaintenanceAlerts() {
  const navigate = useNavigate();

  const alerts = [
    { id: '1', title: 'Oil Change Due', description: 'Overdue by 5 hours based on regular intervals.', severity: 'high', type: 'Lubrication' },
    { id: '2', title: 'Air Filter Replacement', description: 'Critical: Engine efficiency may drop.', severity: 'critical', type: 'Filter' },
  ];

  const schedule = [
    { id: '1', title: 'Hydraulic Fluid', nextDue: '1,290 hrs', left: '45 hrs left', progress: 75, icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: '2', title: 'Drive Belt Inspection', nextDue: '1,350 hrs', left: '105 hrs left', progress: 40, icon: Settings2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: '3', title: 'Track Tension', nextDue: '1,400 hrs', left: '155 hrs left', progress: 25, icon: Hammer, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto w-full px-6 pt-12 pb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                   <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Asset <span className="text-primary">Maintenance</span></h1>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lifecycle Management Console</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center gap-3 shadow-xl">
                    <Gauge className="w-5 h-5 text-primary" />
                    <div>
                        <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Fleet Total Hours</p>
                        <p className="text-sm font-black tracking-tighter">1,245.8 HRS</p>
                    </div>
                </div>
                <button className="p-4 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 transition-all text-slate-500">
                    <Settings className="w-6 h-6" />
                </button>
            </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Urgent Alerts & Active Status */}
            <div className="lg:col-span-4 space-y-6">
                <section className="bg-slate-900 text-white p-10 rounded-[48px] overflow-hidden relative group">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                            <h2 className="text-xs font-black uppercase tracking-widest">Active Disruptions</h2>
                        </div>
                        <div className="space-y-4">
                            {alerts.map(alert => (
                                <motion.div 
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-6 rounded-3xl border ${alert.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} backdrop-blur-md`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-black uppercase tracking-tight leading-none">{alert.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${alert.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-background-dark'}`}>
                                            {alert.severity}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">{alert.description}</p>
                                    <button className="w-full py-4 bg-white text-background-dark rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary transition-all">
                                        <Hammer className="w-4 h-4" /> Expedite logs
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                </section>

                <div className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Info className="w-5 h-5 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Diagnostics</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Telemetry Status</span>
                             <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Finalized
                             </span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Overdue</span>
                             <span className="text-[10px] font-black text-red-500 uppercase">02 Procedures</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Schedule & History */}
            <div className="lg:col-span-8 space-y-6">
                <section className="bg-white dark:bg-surface-dark p-10 rounded-[56px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <Clock className="w-6 h-6 text-primary" />
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tighter">Maintenance Pipeline</h2>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheduled Component Servicing</p>
                            </div>
                        </div>
                        <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] px-4 py-2 bg-primary/5 rounded-xl hover:bg-primary/10 transition-all">Expand View</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {schedule.map((item, i) => (
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-[40px] bg-slate-50 dark:bg-white/5 border border-transparent hover:border-slate-100 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all shadow-hover"
                            >
                                <div className={`w-16 h-16 ${item.bg} rounded-3xl flex items-center justify-center ${item.color} mb-8 transition-transform group-hover:scale-110`}>
                                    <item.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tight mb-1">{item.title}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{item.nextDue}</p>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Service Threshold</span>
                                        <span className={item.color}>{item.progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.progress}%` }}
                                            className={`h-full ${item.bg.replace('/10', '')} shadow-lg`}
                                        />
                                    </div>
                                    <p className="text-[8px] font-black text-center text-slate-400 uppercase tracking-[0.2em] pt-2">{item.left}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section className="bg-white dark:bg-surface-dark p-10 rounded-[56px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <History className="w-6 h-6 text-emerald-500" />
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">Operational History</h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Historical Component Audits</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'General System Calibration', date: 'Oct 12, 2023', hours: '1,100 hrs', cost: '120.00', status: 'Completed', icon: Zap },
                            { title: 'Coolant Exchange Protocol', date: 'Aug 05, 2023', hours: '950 hrs', cost: '85.00', status: 'Completed', icon: Droplets }
                        ].map((log, i) => (
                            <div key={i} className="group p-6 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-transparent hover:border-slate-100 dark:hover:border-white/10 flex items-center justify-between transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all">
                                        <log.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{log.title}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.date} • {log.hours}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1 justify-end">
                                            <IndianRupee className="w-3.5 h-3.5" />{log.cost}
                                        </p>
                                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{log.status}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
      </main>
    </div>
  );
}
