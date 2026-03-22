import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, SlidersHorizontal, ChevronLeft, ChevronRight, Clock, Map, User, Plus, Banknote, Calendar, Tractor, X, IndianRupee, Bell } from 'lucide-react';
import { Machine, useMachines, formatDateToLocalISO } from '../../context/MachineContext';

export default function MachineList() {
  const navigate = useNavigate();
  const location = useLocation();
  const stateYear = location.state?.year;
  const { machines, refreshMachines } = useMachines();
  const today = new Date();
  
  const initialDate = stateYear && stateYear !== today.getFullYear().toString() 
    ? new Date(`${stateYear}-01-01`) 
    : today;

  const [activeDateStr, setActiveDateStr] = useState(formatDateToLocalISO(initialDate));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'AVAILABLE' | 'WORKING'>('ALL');

  React.useEffect(() => {
    refreshMachines(activeDateStr);
  }, [activeDateStr]);

  const isToday = activeDateStr === formatDateToLocalISO(new Date());


  const displayMonth = new Date(activeDateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const filteredMachines = machines
    .filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.operator || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(m => {
      if (filterType === 'ALL') return true;
      if (filterType === 'AVAILABLE') return !m.dailyHours || Number(m.dailyHours) === 0;
      if (filterType === 'WORKING') return m.dailyHours && Number(m.dailyHours) > 0;
      return true;
    });

  const availableCount = machines.filter(m => !m.dailyHours || Number(m.dailyHours) === 0).length;
  const workingCount = machines.filter(m => m.dailyHours && Number(m.dailyHours) > 0).length;

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-background-dark font-display overflow-hidden">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md px-5 lg:px-6 pt-10 lg:pt-12 pb-4 lg:pb-6 border-b border-slate-100 dark:border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Machine <span className="text-primary italic">Fleet</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Operational Deployment Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button className="p-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/10 rounded-2xl text-slate-400">
                <Bell className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="relative group lg:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search machines or operators..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-4 text-[13px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all shadow-inner" 
                />
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-surface-dark p-2 px-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <input 
                  type="date" 
                  value={activeDateStr}
                  onChange={(e) => setActiveDateStr(e.target.value)}
                  className="bg-transparent border-none text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight focus:ring-0 cursor-pointer p-0"
                />
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 lg:p-10 pb-32 no-scrollbar w-full">
          {/* Availability Insights */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => setFilterType('ALL')}
                className={`p-6 rounded-[2rem] border transition-all text-left ${filterType === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-white/5 text-slate-500 hover:border-primary/30'}`}
              >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Total Fleet</p>
                  <h3 className="text-2xl font-black tracking-tighter">{machines.length} Machines</h3>
              </button>
              <button 
                onClick={() => setFilterType('AVAILABLE')}
                className={`p-6 rounded-[2rem] border transition-all text-left ${filterType === 'AVAILABLE' ? 'bg-emerald-500 text-white border-emerald-500 shadow-xl' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-white/5 text-slate-500 hover:border-emerald-500/30'}`}
              >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Available Today</p>
                  <h3 className="text-2xl font-black tracking-tighter">{availableCount} Units</h3>
              </button>
              <button 
                onClick={() => setFilterType('WORKING')}
                className={`p-6 rounded-[2rem] border transition-all text-left ${filterType === 'WORKING' ? 'bg-orange-500 text-white border-orange-500 shadow-xl' : 'bg-white dark:bg-surface-dark border-slate-100 dark:border-white/5 text-slate-500 hover:border-orange-500/30'}`}
              >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Active Now</p>
                  <h3 className="text-2xl font-black tracking-tighter">{workingCount} Working</h3>
              </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
              <AnimatePresence mode="popLayout">
                  {filteredMachines.length === 0 ? (
                       <div className="col-span-full py-20 text-center bg-white dark:bg-surface-dark rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                          <Tractor className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No deployments on this date</p>
                          <p className="text-[10px] font-bold text-slate-300 mt-2">Check another date or search for a different name</p>
                       </div>
                  ) : (
                      filteredMachines.map((machine, i) => (
                          <motion.div
                              key={machine.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (i % 6) * 0.05 }}
                              className="group bg-white dark:bg-surface-dark rounded-[40px] p-6 shadow-sm border border-slate-100 dark:border-white/5 hover:shadow-2xl hover:border-primary/20 transition-all border-b-4 border-b-transparent hover:border-b-primary"
                          >
                              <div className="flex gap-4 items-start mb-8">
                                  <div className="relative">
                                      {machine.image ? (
                                          <div className="w-[88px] h-[88px] rounded-[28px] bg-cover bg-center shrink-0 border-2 border-slate-100 dark:border-white/5 group-hover:scale-105 transition-transform" style={{ backgroundImage: `url(${machine.image})` }} />
                                      ) : (
                                          <div className="w-[88px] h-[88px] rounded-[28px] bg-slate-50 dark:bg-slate-800 shrink-0 flex items-center justify-center border-2 border-slate-100 dark:border-white/5">
                                              <Tractor className="w-10 h-10 text-slate-300" />
                                          </div>
                                      )}
                                      <div className={`absolute -right-2 -top-2 px-2.5 py-1 rounded-xl text-[8px] font-black tracking-widest uppercase shadow-xl border ${
                                          machine.status === 'WORKING' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-blue-600 text-white border-blue-500'
                                      }`}>
                                          {machine.status}
                                      </div>
                                  </div>
                                  <div className="flex-1 min-w-0 pt-1">
                                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1 truncate">{machine.name}</h3>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{machine.model}</p>
                                      
                                      <div className="flex items-center gap-2">
                                          <div className="flex -space-x-2">
                                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-surface-dark flex items-center justify-center text-primary">
                                                  <User className="w-3 h-3" />
                                              </div>
                                          </div>
                                          <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">{machine.operator || 'Standby'}</span>
                                      </div>
                                  </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 mb-8">
                                  {[
                                      { icon: Clock, val: machine.dailyHours ? Number(machine.dailyHours).toFixed(1) + 'h' : '0h', label: 'Usage', color: 'text-primary' },
                                      { icon: Map, val: machine.dailyAcres || 0, label: 'Acres', color: 'text-orange-500' },
                                      { icon: IndianRupee, val: machine.dailyAdvanceAmount ? (machine.dailyAdvanceAmount / 1000).toFixed(1) + 'k' : '0', label: 'Paid', color: 'text-emerald-500' }
                                  ].map((stat, idx) => (
                                      <div key={idx} className="bg-slate-50 dark:bg-white/5 p-4 rounded-3xl text-center border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-colors">
                                          <stat.icon className={`w-4 h-4 mx-auto mb-2 ${stat.color}`} />
                                          <p className="text-sm font-black tracking-tighter">{stat.val}</p>
                                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                                      </div>
                                  ))}
                              </div>

                               <div className="flex gap-2">
                                   <button 
                                       onClick={() => navigate(`/machine-log/${machine.id}`, { state: { machine, date: activeDateStr } })}
                                       className="w-full h-14 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl lg:rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200/50 dark:border-white/5"
                                   >
                                       Inspect Log
                                   </button>
                               </div>
                          </motion.div>
                      ))
                  )}
              </AnimatePresence>
          </div>
      </main>
    </div>
  );
}
