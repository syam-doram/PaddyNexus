import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, ChevronDown, Plus, Tractor, User, Shield, BadgeCheck, Phone, IndianRupee, Info } from 'lucide-react';
import { motion } from 'motion/react';

import { useMachines, Machine } from '../../context/MachineContext';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';
import Modal from '../../components/common/Modal';

interface Operator {
  id: string;
  name: string;
}

export default function AddMachine() {
  const navigate = useNavigate();
  const { addMachine } = useMachines();
  const { user } = useAuth();
  const location = useLocation();
  const passedDate = location.state?.date || new Date().toLocaleDateString('en-CA');

  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [operator, setOperator] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerNumber, setOwnerNumber] = useState('');
  const [perHourRate, setPerHourRate] = useState('1200');
  
  const [operators, setOperators] = useState<Operator[]>([]);
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
    const fetchOperators = async () => {
      try {
        let url = `${API_BASE_URL}/operators`;
        if (user?.id) url += `?traderId=${user.id}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setOperators(data);
        }
      } catch (err) {
        console.error("Failed to fetch operators:", err);
      }
    };
    fetchOperators();
  }, [user]);

  const handleAddMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !model) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Missing Information',
        message: 'Please fill in at least the Machine Name and Model to proceed.'
      });
      return;
    }

    setModalConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Register Asset?',
      message: `You are about to register "${name}" (${model}) into the fleet. Confirm all details are correct.`,
      onConfirm: submitForm
    });
  };

  const submitForm = async () => {
    const newMachine: Machine = {
      id: `m-${Date.now()}`,
      name,
      model,
      status: 'IDLE',
      statusColor: 'bg-blue-50 text-blue-600',
      hours: "0 Hours",
      acres: '0 Acres',
      operator: operator || 'Not Assigned',
      operatorColor: operator ? 'text-[#00c853]' : 'text-slate-500',
      image: "", 
      owner_name: ownerName,
      owner_mobile: ownerNumber,
      per_hour_rate: parseInt(perHourRate) || 1200,
      registration_date: passedDate
    };

    await addMachine(newMachine);
    navigate('/trader/entries');
  };

  return (
    <div className="relative flex h-screen w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      <Modal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="max-w-5xl mx-auto w-full px-6 pt-8 md:pt-12 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">Register <span className="text-primary">Asset</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Fleet Expansion Protocol</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl self-start sm:self-auto">
            <BadgeCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Season: {new Date().getFullYear()}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="max-w-5xl mx-auto w-full p-4 md:p-6 pb-32">
          <form onSubmit={handleAddMachine} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Visuals & Core Info */}
              <div className="lg:col-span-5 space-y-6">
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group aspect-square lg:aspect-auto lg:h-[400px] bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[48px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all overflow-hidden"
                  >
                      <div className="w-20 h-20 bg-primary text-background-dark rounded-[28px] flex items-center justify-center mb-4 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tight">Upload Asset Photo</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Visual ID Verification</p>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
                  </motion.div>
  
                  <div className="bg-white dark:bg-surface-dark p-8 rounded-[40px] border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
                      <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600">
                          <Plus className="w-7 h-7" />
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registration Date</p>
                          <p className="text-lg font-black uppercase tracking-tight">
                          {new Date(passedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                      </div>
                  </div>
  
                  <div className="p-8 bg-slate-900 dark:bg-slate-800 rounded-[40px] text-white">
                      <div className="flex items-center gap-3 mb-6">
                          <Info className="w-5 h-5 text-primary" />
                          <h4 className="text-xs font-black uppercase tracking-widest">Fleet Guidelines</h4>
                      </div>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed">
                          Ensure all technical specifications match the physical asset. Registered machines are automatically enrolled in the seasonal maintenance schedule.
                      </p>
                  </div>
              </div>
  
              {/* Right Column: Form Fields */}
              <div className="lg:col-span-7 space-y-8">
                  <section className="bg-white dark:bg-surface-dark p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 dark:border-white/5 shadow-sm space-y-6 md:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                              <label htmlFor="machineName" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                  <Tractor className="w-3.5 h-3.5 text-primary" /> Asset Nickname
                              </label>
                              <input
                                  id="machineName"
                                  name="machineName"
                                  type="text"
                                  value={name}
                                  onChange={e => setName(e.target.value)}
                                  placeholder="e.g. Asset-Alpha"
                                  className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-[15px] font-black focus:outline-none transition-all"
                              />
                          </div>
                          <div className="space-y-3">
                              <label htmlFor="machineModel" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                  <Shield className="w-3.5 h-3.5 text-primary" /> Technical Model
                              </label>
                              <input
                                  id="machineModel"
                                  name="machineModel"
                                  type="text"
                                  value={model}
                                  onChange={e => setModel(e.target.value)}
                                  placeholder="e.g. Industrial Model X"
                                  className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-[15px] font-black focus:outline-none transition-all"
                              />
                          </div>
                      </div>
  
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                              <label htmlFor="ownerName" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                  <User className="w-3.5 h-3.5 text-primary" /> Proprietor Name
                              </label>
                              <input
                                  id="ownerName"
                                  name="ownerName"
                                  type="text"
                                  value={ownerName}
                                  onChange={e => setOwnerName(e.target.value)}
                                  placeholder="Full Name"
                                  className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-[15px] font-black focus:outline-none transition-all"
                              />
                          </div>
                          <div className="space-y-3">
                              <label htmlFor="ownerNumber" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                  <Phone className="w-3.5 h-3.5 text-primary" /> Contact Matrix
                              </label>
                              <input
                                  id="ownerNumber"
                                  name="ownerNumber"
                                  type="tel"
                                  value={ownerNumber}
                                  onChange={e => {
                                      const val = e.target.value.replace(/\D/g, ''); 
                                      if (val.length <= 10) setOwnerNumber(val);
                                  }}
                                  maxLength={10}
                                  placeholder="Phone No."
                                  className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-[15px] font-black focus:outline-none transition-all"
                              />
                          </div>
                      </div>
  
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                              <label htmlFor="perHourRate" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                  <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Operational Tariff / Hr
                              </label>
                              <input
                                  id="perHourRate"
                                  name="perHourRate"
                                  type="number"
                                  value={perHourRate}
                                  onChange={e => setPerHourRate(e.target.value)}
                                  placeholder="₹ 1,200"
                                  className="w-full h-16 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-emerald-500/30 rounded-[28px] text-2xl font-black text-emerald-600 focus:outline-none transition-all"
                              />
                          </div>
                          <div className="space-y-3">
                              <label htmlFor="operatorSelect" className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                                  <BadgeCheck className="w-3.5 h-3.5 text-primary" /> Operator Name
                              </label>
                              <div className="relative">
                                  <select
                                      id="operatorSelect"
                                      name="operatorSelect"
                                      value={operator}
                                      onChange={e => setOperator(e.target.value)}
                                      className="w-full h-16 px-6 pr-12 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-[28px] text-[15px] font-black focus:outline-none transition-all appearance-none cursor-pointer"
                                  >
                                      <option value="" disabled hidden>Select Operator</option>
                                      <option value="Not Assigned">Standby Mode</option>
                                      {operators.map(op => (
                                        <option key={op.id} value={op.name}>{op.name}</option>
                                      ))}
                                  </select>
                                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                              </div>
                          </div>
                      </div>
  
                      <div className="pt-6">
                          <button
                              type="submit"
                              className="w-full h-20 bg-primary hover:bg-[#22c55e] text-background-dark rounded-[32px] font-black text-xl uppercase tracking-tighter flex items-center justify-center gap-4 transition-all shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
                          >
                              <Plus className="w-7 h-7 stroke-[3]" />
                              Confirm Asset Registration
                          </button>
                      </div>
                  </section>
              </div>
          </form>
        </div>
      </main>
    </div>
  );
}
