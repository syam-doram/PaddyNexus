import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Map, IndianRupee, ChevronRight, Plus, CheckCircle2, Tractor, Phone, Play, Pause, AlertCircle, User, Pencil, Check, Banknote, Calendar, X, Trash2, Bell, Gauge } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Machine, useMachines, formatDateToLocalISO } from '../../context/MachineContext';
import { API_BASE_URL } from '../../config/apiConfig';
import { Capacitor } from '@capacitor/core';

export default function MachineLog() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { updateMachineStatus, updateMachineRate, refreshMachines } = useMachines();

  const { machineId } = useParams();
  const passedDate = location.state?.date || formatDateToLocalISO(new Date());
  const isToday = passedDate === formatDateToLocalISO(new Date());

  const [machine, setMachine] = useState<Machine | undefined>(location.state?.machine);
  const [logs, setLogs] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [machineLoading, setMachineLoading] = useState(!machine);
  const [statusChanging, setStatusChanging] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [newRateValue, setNewRateValue] = useState('');
  const [isAdvancesExpanded, setIsAdvancesExpanded] = useState(true);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDescription, setAdvanceDescription] = useState('');
  const [submittingAdvance, setSubmittingAdvance] = useState(false);
  const [advanceDate] = useState(passedDate);

  const fetchMachineData = async (signal?: AbortSignal) => {
    if (!machineId) return;
    try {
      const tId = user?.trader_id || user?.id;
      let url = `${API_BASE_URL}/machines/${encodeURIComponent(machineId)}`;
      if (tId) url += `?traderId=${tId}`;
      const res = await fetch(url, { signal });
      if (res.ok) {
        const data = await res.json();
        setMachine(data);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Failed to fetch machine details:", err);
    } finally {
      if (!signal?.aborted) setMachineLoading(false);
    }
  };

  const fetchLogs = async (signal?: AbortSignal) => {
    const rawId = machine?.id || machineId;
    if (!rawId) return;
    const targetId = rawId.trim().replace(/:.*/, '');
    const tId = user?.trader_id || user?.id;
    try {
      const logsUrl = `${API_BASE_URL}/machine-logs/${encodeURIComponent(targetId)}${tId ? `?traderId=${tId}` : ''}`;
      const advancesUrl = `${API_BASE_URL}/machine-advances/${encodeURIComponent(targetId)}${tId ? `?traderId=${tId}` : ''}`;
      
      const [logsRes, advancesRes] = await Promise.all([
        fetch(logsUrl, { signal }),
        fetch(advancesUrl, { signal })
      ]);

      if (logsRes.ok && advancesRes.ok) {
        const logsData = await logsRes.json();
        const advancesData = await advancesRes.json();
        if (Array.isArray(logsData)) setLogs(logsData);
        if (Array.isArray(advancesData)) setAdvances(advancesData);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Failed to fetch logs or advances:", err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const handleAddAdvance = async () => {
    if (!machine?.id || !advanceAmount) return;
    setSubmittingAdvance(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const fullDateTime = `${advanceDate} ${timeStr}`;

      const res = await fetch(`${API_BASE_URL}/machine-advances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machine.id,
          amount: parseFloat(advanceAmount),
          date: fullDateTime,
          description: advanceDescription,
          traderId: user?.trader_id || user?.id
        })
      });
      if (res.ok) {
        setShowAdvanceModal(false);
        setAdvanceAmount('');
        setAdvanceDescription('');
        fetchLogs();
        refreshMachines();
      }
    } catch (err) {
      console.error("Failed to add machine advance:", err);
    } finally {
      setSubmittingAdvance(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (!machine) {
      fetchMachineData(controller.signal);
    } else {
      setMachineLoading(false);
    }
    fetchLogs(controller.signal);
    return () => controller.abort();
  }, [machineId]);

  const toggleStatus = async () => {
    if (!machine?.id || statusChanging) return;
    setStatusChanging(true);
    const newStatus = machine.status === 'WORKING' ? 'IDLE' : 'WORKING';
    try {
      await updateMachineStatus(machine.id, newStatus);
      setMachine({ ...machine, status: newStatus });
      refreshMachines();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setStatusChanging(false);
    }
  };

  const handleDeleteLog = async (id: number | string) => {
    if (!window.confirm("ARE YOU SURE? This will permanently DELETE this record.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/machine-logs/${id}?traderId=${user?.id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    } catch (err) { console.error(err); }
  };

  const handleDeleteAdvance = async (id: number | string) => {
    if (!window.confirm("Delete this advance payment?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/machine-advances/${id}?traderId=${user?.id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    } catch (err) { console.error(err); }
  };

  const todayStr = passedDate;
  const todayLogs = logs.filter(l => l.date === todayStr);
  const totalTodayHours = todayLogs.reduce((sum, l) => sum + (l.hours !== null ? l.hours : (l.end_reading - l.start_reading)), 0);
  const totalTodayAcres = todayLogs.reduce((sum, l) => sum + (l.acres || 0), 0);
  const totalTodayRev = todayLogs.reduce((sum, l) => sum + (l.total_amount || 0), 0);
  const todayAdvances = advances.filter(a => a.date.startsWith(todayStr));
  const totalTodayAdvances = todayAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);

  const timelineItems = logs
    .filter(l => l.date === todayStr)
    .map(l => ({ ...l, type: 'HARVEST' }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
  const getDisplayImage = (url?: string) => {
    if (!url || url.trim() === "") return null;
    
    const isLocalPlatformPath = 
      url.startsWith('http://localhost') || 
      url.startsWith('capacitor://') || 
      url.includes('_capacitor_file_') ||
      url.startsWith('blob:');
    
    if (isLocalPlatformPath && !Capacitor.isNativePlatform()) {
      return null;
    }
    
    return url;
  };

  const validImageUrl = getDisplayImage(machine?.image);

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-background-dark font-display">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md px-6 pt-12 pb-6 border-b border-slate-100 dark:border-white/5 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Machine <span className="text-primary">Journal</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Deployment Metrics & Daily Logs</p>
            </div>
          </div>
          {(machine?.is_settled !== 1) && (
            <button 
              onClick={() => navigate('/farmer-harvest', { state: { machine, date: passedDate } })} 
              className="px-6 py-3 bg-primary text-background-dark rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
            >
              Farmer Harvest
            </button>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8 items-center">
            <div className="lg:col-span-2 flex items-center gap-4 md:gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 rounded-[28px] md:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-inner">
                {validImageUrl ? (
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[28px] bg-cover bg-center border-2 border-white dark:border-surface-dark shadow-xl shrink-0" style={{ backgroundImage: `url("${validImageUrl}")` }} />
                ) : (
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[28px] bg-white dark:bg-surface-dark flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xl text-slate-300 shrink-0">
                        <Tractor className="w-6 h-6 md:w-10 md:h-10" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none truncate">{machine?.name || 'Harvester'}</h2>
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 mb-2 md:mb-4">{machine?.model}</p>
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <div className={`px-2 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black tracking-widest uppercase border ${machine?.status === 'WORKING' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-primary text-background-dark border-primary/20'}`}>
                            {machine?.status === 'WORKING' ? 'WORKING' : 'IDLE'}
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 text-primary" /> {passedDate}
                        </div>
                    </div>
                </div>
                <div className="shrink-0">
                    <button onClick={toggleStatus} className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[32px] flex items-center justify-center transition-all shadow-2xl ${machine?.status === 'WORKING' ? 'bg-primary shadow-primary/30' : 'bg-emerald-500 shadow-emerald-500/30 text-white'}`}>
                        {statusChanging ? <div className="w-5 h-5 md:w-6 md:h-6 border-4 border-current border-t-transparent rounded-full animate-spin" /> : (
                            machine?.status === 'WORKING' ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current ml-1" />
                        )}
                    </button>
                </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Operator Info</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><User className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-tighter">{machine?.operator || 'No Pilot'}</p>
                            <p className="text-[9px] font-bold text-slate-400">{machine?.owner_name || 'Fleet Owner'}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Hourly Rate</p>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><IndianRupee className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xl font-black tracking-tighter">₹{machine?.per_hour_rate || 1200}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Fixed ROI</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pt-8 pb-32 no-scrollbar">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Stats & Advances */}
            <div className="lg:col-span-4 space-y-8">
                <section className="bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 mb-6 md:mb-8">
                        <div className="w-1.5 md:w-2 h-6 md:h-8 bg-primary rounded-full" />
                        Journal Insights
                     </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        {[
                            { icon: Gauge, val: totalTodayHours.toFixed(1), label: "Today's Runtime (Hrs)", col: 'text-primary' },
                            { icon: Map, val: totalTodayAcres.toFixed(1), label: "Today's Coverage (Ac)", col: 'text-orange-500' },
                            { icon: IndianRupee, val: `₹${totalTodayRev.toLocaleString('en-IN')}`, label: "Potential Yield Today", col: 'text-emerald-500' }
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-4 md:gap-5 p-4 md:p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl md:rounded-3xl border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-colors">
                                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white dark:bg-surface-dark shadow-sm flex items-center justify-center ${s.col} shrink-0`}>
                                    <s.icon className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div>
                                    <p className="text-xl md:text-2xl font-black tracking-tighter leading-none mb-1">{s.val}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-slate-900 rounded-[32px] md:rounded-[40px] p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-1">Financial Dues</h3>
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Advance Payments</p>
                        </div>
                        <button onClick={() => setShowAdvanceModal(true)} className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-background-dark shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all">
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {todayAdvances.map((adv, idx) => (
                            <div key={adv.id || idx} className="p-5 bg-white/5 border border-white/5 rounded-3xl group relative hover:bg-white/10 transition-all">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-xl font-black tracking-tighter">₹{adv.amount}</p>
                                    <button onClick={() => handleDeleteAdvance(adv.id)} className="p-1 opacity-0 group-hover:opacity-100 text-red-400 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{adv.description || 'General Expense'}</p>
                                <div className="absolute top-1/2 -left-1 w-2 h-4 bg-primary rounded-r-lg" />
                            </div>
                        ))}
                        {todayAdvances.length === 0 && (
                            <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-[32px]">
                                <Banknote className="w-10 h-10 text-white/10 mx-auto mb-4" />
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">No payments recorded today</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-end">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Paid Today</p>
                            <p className="text-3xl font-black tracking-tighter">₹{totalTodayAdvances.toLocaleString()}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full border-2 border-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </section>
            </div>

            {/* Right Column: Detailed Logs */}
            <div className="lg:col-span-8 space-y-8 mt-8 lg:mt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 px-2">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
                         Machine Deployment History
                         <span className="text-primary text-[10px] md:text-sm font-bold bg-primary/10 px-3 py-1 rounded-full">{timelineItems.length} Records</span>
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnimatePresence mode="popLayout">
                        {timelineItems.map((log, i) => (
                            <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all flex flex-col group"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-50 dark:bg-slate-900 rounded-[22px] flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.farmer_name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.date}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteLog(log.id)} className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5" /></button>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-10 pb-8 border-b border-slate-50 dark:border-white/5">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Map className="w-4 h-4 text-primary" />
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                                                <p className="text-xs font-black truncate">{log.location || 'Undisclosed'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-blue-500" />
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                                <p className="text-xs font-black">{log.farmer_mobile || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                                                <p className="text-xs font-black">{log.hours} Hrs Active</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Gauge className="w-4 h-4 text-emerald-500" />
                                            <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Coverage</p>
                                                <p className="text-xs font-black">{log.acres} Acres</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex justify-between items-end">
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Final Bill</span>
                                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">₹{log.total_amount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl text-[9px] font-black tracking-widest uppercase border border-emerald-500/20">
                                        Verified Log
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    {timelineItems.length === 0 && machine?.is_settled !== 1 && (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-surface-dark rounded-[40px] border-2 border-dashed border-slate-200 dark:border-white/5">
                            <Tractor className="w-12 h-12 text-slate-200 mx-auto mb-6" />
                            <h4 className="text-xl font-black text-slate-300 uppercase tracking-tighter mb-2">No Active Logs Today</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Asset is currently in standby mode</p>
                            <button 
                                onClick={() => navigate('/farmer-harvest', { state: { machine, date: passedDate } })}
                                className="px-8 py-4 bg-primary text-background-dark rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
                            >
                                Initiate Harvesting
                            </button>
                        </div>
                    )}
                </AnimatePresence>
                </div>
            </div>
        </div>
      </main>

      {/* Advance Modal */}
      <AnimatePresence>
      {showAdvanceModal && machine && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-8">
                <div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">Pay Advance</h3>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">Institutional Disbursement</p>
                </div>
                <button onClick={() => setShowAdvanceModal(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Disbursement Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    <input autoFocus type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="0.00" className="w-full h-16 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] text-2xl font-black focus:border-primary outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Payment Memo</label>
                  <textarea value={advanceDescription} onChange={(e) => setAdvanceDescription(e.target.value)} placeholder="e.g. Operator expense, Repairs..." className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] text-sm font-bold focus:border-primary outline-none transition-all resize-none" />
                </div>
            </div>

            <button disabled={submittingAdvance || !advanceAmount} onClick={handleAddAdvance} className="w-full h-16 bg-primary text-background-dark font-black rounded-[24px] text-xs uppercase tracking-widest mt-10 shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50">
                {submittingAdvance ? 'Finalizing...' : 'Initialize Payment'}
            </button>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
    </div>
  );
}
