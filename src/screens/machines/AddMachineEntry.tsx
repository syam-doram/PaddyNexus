import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronDown, Gauge, IndianRupee, Save, Fuel, User, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMachines } from '../../context/MachineContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';
import Modal from '../../components/common/Modal';

export default function AddMachineEntry() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const traderId = user?.trader_id || user?.id;
  const { updateMachineStatus, refreshMachines } = useMachines();
  const [machine, setMachine] = useState(location.state?.machine);
  const [machinesList, setMachinesList] = useState<any[]>([]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [farmerName, setFarmerName] = useState('');
  const [startReading, setStartReading] = useState<string>('');
  const [endReading, setEndReading] = useState<string>('');
  const [rate, setRate] = useState<string>(machine?.per_hour_rate?.toString() || '1200');
  const [fuel, setFuel] = useState<string>('0');
  const [acres, setAcres] = useState<string>('');
  const [farmers, setFarmers] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const farmersRes = await fetch(`${API_BASE_URL}/farmer-settlements?traderId=${traderId}`);
        const farmersData = await farmersRes.json();
        if (Array.isArray(farmersData)) {
          setFarmers(farmersData.map((f: any) => f.farmerName));
        }
      } catch (err) {
        console.error("Failed to fetch farmers:", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchMachinesForDate = async () => {
      if (location.state?.machine) return;
      try {
        const machinesRes = await fetch(`${API_BASE_URL}/machines?date=${date}&traderId=${traderId}`);
        const machinesData = await machinesRes.json();
        if (Array.isArray(machinesData)) {
          setMachinesList(machinesData);
        }
      } catch (err) {
        console.error("Failed to fetch machines for date:", err);
      }
    };
    fetchMachinesForDate();
  }, [date, location.state?.machine]);

  const totalHours = Math.max(0, (Number(endReading) || 0) - (Number(startReading) || 0));
  const totalBill = totalHours * (Number(rate) || 0);

  const handleSave = () => {
    if (!machine?.id || !farmerName || !startReading || !endReading) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Incomplete Entry',
        message: 'Please ensure Machine, Farmer name, and Meter readings are provided before saving.'
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Confirm Field Entry?',
      message: `Save entry for ${farmerName} on ${machine.name}? Total: ₹${totalBill.toLocaleString('en-IN')}`,
      onConfirm: submitEntry
    });
  };

  const submitEntry = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/machine-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_id: machine.id,
          farmer_name: farmerName,
          date,
          start_reading: parseFloat(startReading),
          end_reading: parseFloat(endReading),
          acres: parseFloat(acres) || 0,
          fuel_cost: parseInt(fuel) || 0,
          rate: parseInt(rate) || 0,
          total_amount: totalBill,
          traderId: traderId
        })
      });

      if (res.ok) {
        await updateMachineStatus(machine.id, 'IDLE');
        navigate('/machine-log', { state: { machine: { ...machine, status: 'IDLE' } } });
      }
    } catch (err) {
      console.error("Failed to save entry:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark font-display">
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <header className="sticky top-0 z-40 flex items-center justify-between px-4 pt-12 pb-3 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="text-slate-900 dark:text-slate-100 w-6 h-6" />
        </button>
        <div className="text-center flex-1 mx-4">
          {!location.state?.machine ? (
            <div className="relative flex items-center justify-center gap-2">
              <select 
                value={machine?.id || ''} 
                onChange={(e) => {
                  const selected = machinesList.find(m => m.id === e.target.value);
                  setMachine(selected);
                  if (selected) setRate(selected.per_hour_rate?.toString() || '1200');
                }}
                className="bg-transparent border-none text-center font-bold text-slate-900 dark:text-white focus:ring-0 appearance-none min-w-[120px]"
              >
                <option value="" disabled className="dark:bg-slate-900">Select Machine</option>
                {machinesList.map(m => (
                  <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-primary pointer-events-none" />
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100">Add Machine Entry</h1>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{machine?.name || 'Harvester'}</p>
            </>
          )}
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="px-5 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Date</label>
              <div className="relative flex items-center">
                <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 pl-3 pr-10 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-sm font-bold" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Calendar className="absolute right-3 text-primary pointer-events-none w-4 h-4" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Acres Cut</label>
              <div className="relative flex items-center">
                <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 pl-3 pr-10 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-sm font-bold" type="number" placeholder="0.0" value={acres} onChange={(e) => setAcres(e.target.value)} />
                <Clock className="absolute right-3 text-primary pointer-events-none w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Farmer / Field</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <User className="text-primary w-4 h-4" />
              </div>
              <input list="farmers-list" value={farmerName} onChange={(e) => setFarmerName(e.target.value)} placeholder="Select or Enter Farmer Name" className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-4 pl-12 pr-4 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-base font-bold" />
              <datalist id="farmers-list">
                {farmers.map(f => <option key={f} value={f} />)}
              </datalist>
            </div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800 mx-5" />

        <div className="px-5 py-6 space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-widest">
            <Gauge className="text-primary w-5 h-5" />
            Meter Reading
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Start</label>
              <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-lg font-black placeholder:text-slate-300" placeholder="000.0" type="number" step="0.1" value={startReading} onChange={(e) => setStartReading(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">End</label>
              <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-lg font-black placeholder:text-slate-300" placeholder="000.0" type="number" step="0.1" value={endReading} onChange={(e) => setEndReading(e.target.value)} />
            </div>
          </div>
          <div className="bg-primary/10 dark:bg-primary/5 rounded-2xl p-4 flex justify-between items-center border border-primary/20">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Total Running Hours</span>
            <span className="text-2xl font-black text-primary">{totalHours.toFixed(1)} hrs</span>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800 mx-5" />

        <div className="px-5 py-6 space-y-6">
          <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 uppercase tracking-widest">
            <IndianRupee className="text-primary w-5 h-5" />
            Operational Costs
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Rate / Hr (₹)</label>
              <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-base font-black" type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Fuel Paid (₹)</label>
              <div className="relative">
                <input className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 px-4 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 focus:ring-2 focus:ring-primary text-base font-black text-red-500" placeholder="0" type="number" value={fuel} onChange={(e) => setFuel(e.target.value)} />
                <Fuel className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/50" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-6 text-white shadow-xl mt-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="flex justify-between items-end mb-2 relative z-10">
              <span className="text-xs text-slate-400 font-black uppercase tracking-widest">Total Earning</span>
              <span className="text-3xl font-black tracking-tighter">₹ {totalBill.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-px bg-slate-700 my-4 relative z-10" />
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 relative z-10">
              <span>Expected Net Profit</span>
              <span className="text-primary">₹ {(totalBill - (Number(fuel) || 0)).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full max-w-md mx-auto bg-background-light dark:bg-background-dark p-6 border-t border-slate-200 dark:border-slate-800 z-20">
        <button onClick={handleSave} disabled={submitting} className="w-full bg-primary hover:bg-green-400 text-slate-900 font-black py-4 px-6 rounded-2xl shadow-xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50">
          {submitting ? 'Saving...' : <><Save className="w-5 h-5" />Save Field Entry</>}
        </button>
      </div>
    </div>
  );
}
