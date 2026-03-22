import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Save,
  User,
  Clock,
  ChevronDown,
  MapPin,
  Calculator,
  Phone,
  Info,
  BadgeCheck,
  Zap,
  ShieldAlert,
  Lock,
  X,
  History,
  AlertTriangle,
  TimerOff,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMachines, formatDateToLocalISO } from '../../context/MachineContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

export default function FarmerHarvest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const traderId = user?.trader_id || user?.id;
  const { updateMachineStatus, updateMachineRate } = useMachines();
  const [machine, setMachine] = useState(location.state?.machine);
  const [machinesList, setMachinesList] = useState<any[]>([]);
  const passedDate = location.state?.date || formatDateToLocalISO(new Date());

  const [date] = useState(formatDateToLocalISO(new Date()));
  const [farmerName, setFarmerName] = useState('');
  const [farmerMobile, setFarmerMobile] = useState('');
  const [locationName, setLocationName] = useState('');
  const [hours, setHours] = useState<string>('');
  const [startHour, setStartHour] = useState<string>('');
  const [startMin, setStartMin] = useState<string>('');
  const [startPeriod, setStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [endHour, setEndHour] = useState<string>('');
  const [endMin, setEndMin] = useState<string>('');
  const [endPeriod, setEndPeriod] = useState<'AM' | 'PM'>('AM');
  const [rate, setRate] = useState<string>(machine?.per_hour_rate?.toString() || '1200');
  const [fuel, setFuel] = useState<string>('0');
  const [acres, setAcres] = useState<string>('');
  const [farmers, setFarmers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showSettlementLocked, setShowSettlementLocked] = useState(false);
  const [showLifecycleExpired, setShowLifecycleExpired] = useState(false);
  const [showCommitSuccess, setShowCommitSuccess] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  // Settlement & Lifecycle Guards
  useEffect(() => {
    if (!machine) return;

    // 1. Check Settlement Status
    if (machine.is_settled && machine.status !== 'ACTIVE') {
      setShowSettlementLocked(true);
      setShowLifecycleExpired(false);
      return;
    } else {
      setShowSettlementLocked(false);
    }

    // 2. Check 2-Year Lifecycle Limit
    if (machine.registration_date) {
      const regDate = new Date(machine.registration_date);
      const now = new Date();
      const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;

      if (now.getTime() - regDate.getTime() > twoYearsInMs) {
        setShowLifecycleExpired(true);
      } else {
        setShowLifecycleExpired(false);
      }
    }
  }, [machine]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchInitialData = async () => {
      try {
        const farmersRes = await fetch(`${API_BASE_URL}/farmer-settlements?traderId=${traderId}`, { signal: controller.signal });
        const farmersData = await farmersRes.json();
        if (Array.isArray(farmersData)) {
          setFarmers(farmersData.map((f: any) => f.farmerName));
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error("Failed to fetch farmers:", err);
      }
    };
    fetchInitialData();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchMachinesForDate = async () => {
      if (location.state?.machine) return;
      try {
        const machinesRes = await fetch(`${API_BASE_URL}/machines?date=${date}&traderId=${traderId}`, { signal: controller.signal });
        const machinesData = await machinesRes.json();
        if (Array.isArray(machinesData)) {
          setMachinesList(machinesData);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error("Failed to fetch machines for date:", err);
      }
    };
    fetchMachinesForDate();
    return () => controller.abort();
  }, [date, location.state?.machine]);

  // Auto-calculate hours
  useEffect(() => {
    const sH = parseFloat(startHour);
    const sM = parseFloat(startMin) || 0;
    const eH = parseFloat(endHour);
    const eM = parseFloat(endMin) || 0;

    if (!isNaN(sH) && !isNaN(eH)) {
      let s24 = sH === 12 ? (startPeriod === 'AM' ? 0 : 12) : (startPeriod === 'PM' ? sH + 12 : sH);
      const sTotalMins = (s24 * 60) + sM;

      let e24 = eH === 12 ? (endPeriod === 'AM' ? 0 : 12) : (endPeriod === 'PM' ? eH + 12 : eH);
      const eTotalMins = (e24 * 60) + eM;

      let diffMins = eTotalMins - sTotalMins;
      if (diffMins < 0) diffMins += 1440;

      const calcHours = diffMins / 60;
      setHours(calcHours > 0 ? calcHours.toString() : '0');
    }
  }, [startHour, startMin, startPeriod, endHour, endMin, endPeriod]);

  // Registration date for freezing earlier dates
  const minDate = machine?.registration_date ? formatDateToLocalISO(new Date(machine.registration_date)) : '';

  const totalBill = ((parseFloat(hours) || 0) * (Number(rate) || 0));

  const handleSave = async () => {
    if (!machine?.id || !farmerName || !hours || Number(hours) <= 0) {
      setValidationMessage(!machine?.id ? "Strategic Asset Assignment Required" : !farmerName ? "Client Intelligence Identifier Missing" : "Validated Operation Hours Required");
      setShowValidationDialog(true);
      return;
    }

    if ((machine?.is_settled && machine?.status !== 'ACTIVE') || showLifecycleExpired) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/machine-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machine.id,
          farmer_name: farmerName,
          date,
          hours: parseFloat(hours),
          acres: parseFloat(acres) || 0,
          fuel_cost: parseInt(fuel) || 0,
          rate: parseInt(rate) || 0,
          total_amount: totalBill,
          farmer_mobile: farmerMobile,
          location: locationName,
          start_time: startHour ? `${startHour}:${startMin || '00'} ${startPeriod}` : null,
          end_time: endHour ? `${endHour}:${endMin || '00'} ${endPeriod}` : null,
          traderId: traderId
        })
      });

      if (res.ok) {
        setShowCommitSuccess(true);
      } else {
        const err = await res.json();
        setValidationMessage(err.error || "Tactical Synchronization Failed");
        setShowValidationDialog(true);
      }
    } catch (err) {
      console.error("Failed to save entry:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = (!!machine?.is_settled && machine?.status !== 'ACTIVE') || showLifecycleExpired;

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="max-w-6xl mx-auto w-full px-6 pt-8 md:pt-12 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">Harvest <span className="text-primary">Registry</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Deployment Log</p>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-between md:justify-end">
            <div className="flex items-center gap-2 px-4 md:px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-2xl shrink-0 opacity-80">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-slate-400">Date:</span>
              <span className="text-[10px] md:text-[11px] font-black uppercase text-slate-900 dark:text-white ml-1">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
              <input
                type="hidden"
                value={formatDateToLocalISO(new Date())}
              />
            </div>
            {!location.state?.machine ? (
              <div className="relative group">
                <select
                  value={machine?.id || ''}
                  onChange={(e) => {
                    const selected = machinesList.find(m => m.id === e.target.value);
                    setMachine(selected);
                    if (selected) setRate(selected.per_hour_rate?.toString() || '1200');
                  }}
                  className="h-12 md:h-14 px-6 md:px-8 pr-12 bg-primary text-background-dark font-black rounded-2xl text-[10px] md:text-[11px] uppercase tracking-widest outline-none appearance-none cursor-pointer shadow-xl shadow-primary/20 w-full"
                >
                  <option value="" disabled>Select Asset</option>
                  {machinesList.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-background-dark pointer-events-none" />
              </div>
            ) : (
              <div className="px-6 py-3 bg-primary text-background-dark rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]">
                {machine?.name}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 pb-32 overflow-y-auto no-scrollbar transition-all ${isLocked ? 'blur-sm grayscale-[0.5] pointer-events-none opacity-60' : ''}`}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left Section: Farmer & Location */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest">Client Intelligence</h2>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Farmer / Proprietor</label>
                  <input
                    list="farmers-bulk"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder="Search or Register Client"
                    className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-[15px] font-black outline-none transition-all"
                  />
                  <datalist id="farmers-bulk">{farmers.map(f => <option key={f} value={f} />)}</datalist>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Contact Matrix</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={farmerMobile}
                        onChange={(e) => setFarmerMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Phone Number"
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-[15px] font-black outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Territory / Area</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Operational Zone"
                        className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-[15px] font-black outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Middle Section: Time & Metrics */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <h2 className="text-xs font-black uppercase tracking-widest">Temporal Analysis</h2>
                </div>
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Auto-Sync Active
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 ml-2">Deployment Commencement</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input type="number" value={startHour} onChange={(e) => setStartHour(e.target.value)} placeholder="HH" className="h-14 md:h-16 bg-slate-50 dark:bg-white/5 rounded-2xl text-center text-xl font-black focus:ring-2 focus:ring-primary/20 outline-none" />
                      <input type="number" value={startMin} onChange={(e) => setStartMin(e.target.value)} placeholder="MM" className="h-14 md:h-16 bg-slate-50 dark:bg-white/5 rounded-2xl text-center text-xl font-black focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="flex bg-slate-100 dark:bg-white/10 p-1.5 rounded-2xl">
                      {(['AM', 'PM'] as const).map(p => (
                        <button key={p} onClick={() => setStartPeriod(p)} className={`flex-1 sm:flex-none px-5 rounded-xl text-[10px] font-black transition-all ${startPeriod === p ? 'bg-white dark:bg-slate-700 text-primary shadow-sm shadow-black/5' : 'text-slate-400'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 ml-2">Operational Termination</span>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input type="number" value={endHour} onChange={(e) => setEndHour(e.target.value)} placeholder="HH" className="h-14 md:h-16 bg-slate-50 dark:bg-white/5 rounded-2xl text-center text-xl font-black focus:ring-2 focus:ring-primary/20 outline-none" />
                      <input type="number" value={endMin} onChange={(e) => setEndMin(e.target.value)} placeholder="MM" className="h-14 md:h-16 bg-slate-50 dark:bg-white/5 rounded-2xl text-center text-xl font-black focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="flex bg-slate-100 dark:bg-white/10 p-1.5 rounded-2xl">
                      {(['AM', 'PM'] as const).map(p => (
                        <button key={p} onClick={() => setEndPeriod(p)} className={`flex-1 sm:flex-none px-5 rounded-xl text-[10px] font-black transition-all ${endPeriod === p ? 'bg-white dark:bg-slate-700 text-primary shadow-sm shadow-black/5' : 'text-slate-400'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-900 text-white rounded-[32px] overflow-hidden relative">
                  <p className="text-[9px] font-black opacity-40 uppercase tracking-[0.3em] mb-2">Validated Deployment Time</p>
                  <h3 className="text-3xl font-black tracking-tighter relative z-10">
                    {Number(hours) > 0 ? `${Math.floor(Number(hours))} hrs ${Math.round((Number(hours) % 1) * 60)} mins` : "0h 0m"}
                  </h3>
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/20 rounded-full blur-[40px]" />
                </div>
              </div>
            </section>
          </div>

          {/* Right Section: Fiscal Audit & Save */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-white dark:bg-surface-dark p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6 md:mb-8">
                <Calculator className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xs font-black uppercase tracking-widest">Fiscal Computation</h2>
              </div>

              <div className="space-y-6 flex-1">
                <div className="relative">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Acres Processed</label>
                  <input
                    type="number"
                    value={acres}
                    onChange={(e) => setAcres(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-lg font-black outline-none transition-all"
                  />
                </div>

                <div className="relative">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Hourly Tariff</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      placeholder="Rate"
                      className="w-full h-16 pl-14 pr-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-emerald-500/30 rounded-[28px] text-lg font-black text-emerald-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="mt-8 md:mt-12 space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Realization</p>
                    <span className="text-[9px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded-lg">Final Audit</span>
                  </div>
                  <h4 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">₹{totalBill.toLocaleString('en-IN')}</h4>
                  <p className="text-[9px] font-bold text-slate-400 italic">
                    Calculation: {Math.floor(Number(hours))}h {Math.round((Number(hours) % 1) * 60)}m @ ₹{rate}/hr
                  </p>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={submitting}
                className="w-full h-20 mt-12 bg-primary hover:bg-[#22c55e] text-background-dark rounded-[32px] font-black text-lg uppercase tracking-tight shadow-2xl shadow-primary/20 active:scale-5 transition-all flex items-center justify-center gap-1"
              >
                {submitting ? 'Executing...' : <><Save className="w-5 h-5" /> Entry</>}
              </button>
            </section>
          </div>
        </div>

        {/* Protocol Notice */}
        <div className="mt-12 p-6 md:p-8 bg-slate-50 dark:bg-white/5 rounded-[32px] md:rounded-[40px] border border-slate-100 dark:border-white/5">
          <div className="flex items-start gap-5">
            <ShieldCheck className="w-6 h-6 text-primary mt-1 flex-none" />
            <div>
              <p className="text-[10px] md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Institutional Deployment Protocol</p>
              <p className="text-[9px] md:text-xs text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-tight font-medium">
                All harvest entries are synchronized with the PaddyNexus primary ledger. Duration calculations are derived from verified machine meter readings and operational timestamps. Entries are subject to seasonal audit and final yield verification by the fleet oversight department.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Error/Validation In-Page Dialog */}
      <AnimatePresence>
        {showValidationDialog && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowValidationDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-950 rounded-[48px] shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/20 p-10 text-center space-y-6"
            >
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-100 dark:border-red-900/20">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Validation Required</h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{validationMessage}</p>
              </div>

              <button
                onClick={() => setShowValidationDialog(false)}
                className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
              >
                Correct Parameters
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settlement Locked In-Page Dialog */}
      <AnimatePresence>
        {showSettlementLocked && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/30 p-12 text-center space-y-8"
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-8 border border-red-100 dark:border-red-800">
                  <Lock className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Settlement Locked</h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4 px-4 line-clamp-2">
                  This machine has been finalized and settled. New harvest logs are restricted under seasonal protocol.
                </p>
              </div>

              <div className="bg-red-50/50 dark:bg-red-900/10 rounded-3xl p-6 border border-red-50 dark:border-red-900/20 flex items-center gap-4 text-left">
                <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Institutional Lock Active</p>
              </div>

              <button
                onClick={() => navigate(-1)}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Fleet
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lifecycle Expired In-Page Dialog */}
      <AnimatePresence>
        {showLifecycleExpired && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden border border-orange-100 dark:border-orange-900/30 p-12 text-center space-y-8"
            >
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-orange-500 mb-8 border border-orange-100 dark:border-orange-800">
                  <TimerOff className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Lifecycle Expired</h2>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4 px-4">
                  Strategic window exceeded. This machine has surpassed its 2-year operational mandate since registration.
                </p>
              </div>

              <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-3xl p-6 border border-orange-50 dark:border-orange-900/20 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-orange-500" />
                  <p className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">Asset Age: 2+ Years</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Registered: {machine?.registration_date ? new Date(machine.registration_date).toLocaleDateString() : 'Unknown'}</p>
              </div>

              <button
                onClick={() => navigate(-1)}
                className="w-full py-5 bg-orange-600 text-white font-black rounded-3xl text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Review Active Fleet
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Harvest Commit Success Dialog */}
      <AnimatePresence>
        {showCommitSuccess && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-emerald-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/30 p-10 text-center space-y-6"
            >
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100 dark:border-emerald-800">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Entry Committed</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Harvest Log Synchronized</p>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 rounded-[32px] p-6 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</span>
                  </div>
                  <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white">{farmerName}</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                  </div>
                  <span className="text-[11px] font-black uppercase text-slate-900 dark:text-white">{hours} HRS</span>
                </div>
                <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Total</span>
                  </div>
                  <span className="text-lg font-black text-emerald-600 italic">₹{totalBill.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCommitSuccess(false);
                    setFarmerName('');
                    setFarmerMobile('');
                    setHours('');
                    setStartHour('');
                    setStartMin('');
                    setEndHour('');
                    setEndMin('');
                    setAcres('');
                  }}
                  className="flex-1 py-5 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-black rounded-3xl text-[10px] uppercase tracking-widest border border-slate-200 dark:border-white/10 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Add Another
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-5 bg-primary text-background-dark font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Finish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
