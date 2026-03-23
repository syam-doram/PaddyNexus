import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Tractor, Truck, Plus, ArrowRightLeft, Package, LayoutGrid, Calendar, Filter, ChevronRight, TrendingUp, Building2, Activity } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

export default function Lots() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const stateYear = location.state?.year;
  const [activeMonth, setActiveMonth] = useState('All');
  const [activeYear, setActiveYear] = useState(stateYear || new Date().getFullYear().toString());
  const [activeVehicle, setActiveVehicle] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [dbLots, setDbLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState<number>(user?.commission_rate || 50);

  // Status mapping for consistent styling
  const getStatusStyle = (stage: string) => {
    switch (stage?.toUpperCase()) {
      case 'LOADED':
        return 'bg-slate-100 text-slate-600';
      case 'IN TRANSIT':
        return 'bg-blue-50 text-blue-600';
      case 'DELIVERED TO MILL':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100/50';
      case 'PAYMENT RELEASED':
        return 'bg-orange-50 text-orange-600 border border-orange-100';
      default:
        return 'bg-slate-50 text-slate-400';
    }
  };

  React.useEffect(() => {
    const fetchLots = async () => {
      try {
        let url = `${API_BASE_URL}/lots?year=${activeYear}`;
        if (user?.id) {
          const tId = user?.trader_id || user?.id;
          if (tId) url += `&traderId=${tId}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setDbLots(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching lots:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLots();
  }, []);

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/commissions/${activeYear}`)
      .then(res => res.json())
      .then(data => {
        if (data.bag_rate) setCommissionRate(data.bag_rate);
      })
      .catch(err => console.error("Error fetching commission rate:", err));
  }, [activeYear]);

  const months = ['All', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = ['2023', '2024', '2025', '2026'];

  const allDisplayLots = dbLots.map(lot => {
    const name = lot.name || 'Unknown Driver';
    const vehicle = lot.vehicle_type || 'Tractor';
    const reg = lot.reg_number || '---';
    const mill = lot.mill_name || lot.mill || 'Sunrise Mills Ltd.';
    const bags = lot.bags || 0;
    const commission = bags * (commissionRate);
    const avg_bag_weight = lot.avg_bag_weight ? parseFloat(lot.avg_bag_weight).toFixed(1) : '---'

    return {
      ...lot,
      name,
      vehicle,
      reg,
      mill,
      bags,
      commission,
      statusStyle: getStatusStyle(lot.stage),
      date: lot.date || new Date().toISOString().split('T')[0],
      avg_bag_weight
    };
  });

  const undeliveredCount = dbLots.filter(lot => {
    const stage = lot.stage?.toUpperCase();
    return stage === 'LOADING' || stage === 'LOADED' || stage === 'IN TRANSIT' || !stage;
  }).length;

  const displayLots = allDisplayLots.filter(lot => {
    // Only show lots that are still in early stages (pre-delivery)
    const stage = (lot.stage || '').toUpperCase();
    const isUndelivered = ['LOADING', 'LOADED', 'IN TRANSIT', ''].includes(stage);
    if (!isUndelivered) return false;

    const vehicleMatch = activeVehicle === 'All' ? true : lot.vehicle === activeVehicle;
    if (selectedDate) return vehicleMatch && lot.date === selectedDate;
    const [year, month] = lot.date.split('-');
    const yearMatch = year === activeYear;
    const monthMatch = activeMonth === 'All' ? true : months[parseInt(month)] === activeMonth;
    return vehicleMatch && monthMatch && yearMatch;
  });

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      <div className="mx-auto w-full max-w-[1600px] flex flex-col h-full relative">

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 lg:px-12 py-3 lg:py-5 shrink-0">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-3 lg:gap-6">
              <div>
                <h1 className="text-xl lg:text-2xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">
                  Registry <span className="text-primary">Log</span>
                </h1>
                <p className="text-[10px] lg:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1 lg:mt-1.5">
                  <Activity className="w-3 h-3 lg:w-4 h-4 text-primary animate-pulse" />
                  {displayLots.length} manifests discovered
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4 flex-1 justify-end">
              <div className="relative hidden md:block max-w-sm flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logistics payload..."
                  className="w-full h-11 pl-12 pr-4 bg-slate-100 dark:bg-white/5 border-none rounded-[18px] text-xs font-bold outline-none ring-primary/20 focus:ring-4 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-0 lg:p-12 pb-32 lg:pb-12 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto w-full">

            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* Consolidated Industrial HUD */}
              <div className="bg-white dark:bg-[#0F172A] rounded-none lg:rounded-[32px] p-6 lg:p-8 border-y lg:border border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Period Intelligence */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-[1000] text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Harvest Period</p>
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Temporal Synchronizer</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-100 dark:border-white/5">
                          <select
                            value={activeYear}
                            onChange={(e) => { setActiveYear(e.target.value); setSelectedDate(''); }}
                            className="h-10 px-4 bg-white dark:bg-[#0F172A] rounded-xl text-[11px] font-black border-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                          >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>

                        {!selectedDate && (
                          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 flex-1">
                            {months.map((m) => (
                              <button
                                key={m}
                                onClick={() => setActiveMonth(m)}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all shrink-0 ${activeMonth === m ? 'bg-primary text-background-dark shadow-xl shadow-primary/20 scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fleet Classification (Right-aligned board) */}
                  <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5 pt-8 lg:pt-0 lg:pl-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <Filter className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-[1000] text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Fleet Assets</p>
                        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Logistics Filter</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { id: 'All', icon: LayoutGrid, label: 'ALL' },
                        { id: 'Tractor', icon: Tractor, label: 'TRACTOR' },
                        { id: 'Truck', icon: Truck, label: 'TRUCK' },
                        { id: 'Lorry', icon: ArrowRightLeft, label: 'LORRY' }
                      ].map(v => (
                        <button
                          key={v.id}
                          onClick={() => setActiveVehicle(v.id)}
                          className={`flex flex-col items-center justify-center py-4 rounded-2xl border transition-all duration-300 ${activeVehicle === v.id ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100'}`}
                        >
                          <v.icon className={`w-5 h-5 mb-2 ${activeVehicle === v.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                          <span className="text-[8px] font-black uppercase tracking-tighter leading-none">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Header Section */}
            <div className="flex items-center justify-between mb-8 px-5 lg:px-4">
              <h3 className="text-xl lg:text-2xl font-black tracking-tighter uppercase italic">Registry View <span className="text-slate-400 font-bold ml-2 lg:ml-4 text-[10px] lg:text-sm opacity-50 tracking-normal not-italic">/ {displayLots.length} DISCOVERED</span></h3>
              <div className="flex gap-2">
                <button className="px-6 py-2.5 bg-slate-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-background-dark transition-all">Export CSV</button>
              </div>
            </div>

            {/* Lots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-5 lg:px-0 pb-32">
              {loading ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-80 bg-white dark:bg-surface-dark rounded-[48px] animate-pulse border border-slate-100 dark:border-white/5" />
                ))
              ) : displayLots.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 px-6 text-center bg-white dark:bg-[#0F172A] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-sm">
                  <div className="w-20 h-20 rounded-[32px] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5 shadow-inner">
                    <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">No Manifests Discovered</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[280px] leading-relaxed">
                    The registry is currently empty. Please initiate a new deployment to begin agricultural tracking.
                  </p>
                </div>
              ) : (
                displayLots.map((lot, i) => (
                  <motion.div
                    key={lot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate('/lotdetails', { state: { lot } })}
                    className="group relative bg-white dark:bg-[#0F172A] rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 overflow-hidden cursor-pointer"
                  >
                    {/* Subtle Top Glow */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="p-6">
                      {/* Header: Lot ID & Status */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Manifest</span>
                            <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                              Lot #{lot.id}
                            </h3>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] border shadow-sm transition-transform group-hover:scale-105 ${lot.statusStyle}`}>
                          {lot.stage}
                        </div>
                      </div>

                      {/* Information Board (Logistics & Yield) */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                          <div className="flex items-center gap-2 mb-3">
                            <Truck className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Logistics</span>
                          </div>
                          <p className="text-xs font-black text-slate-700 dark:text-slate-200 truncate mb-1 uppercase tracking-tight">
                            {lot.vehicle}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                            {lot.reg}
                          </p>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-500">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Payload</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-slate-900 dark:text-white italic tracking-tighter">{lot.bags}</span>
                            <span className="text-[8px] font-black text-slate-400">BAGS</span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold text-slate-500">{lot.weight}</span>
                            <span className="text-[7px] font-black text-slate-400 uppercase">Tons</span>
                          </div>
                        </div>
                      </div>

                      {/* Mill & Financial Summary */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="max-w-[120px]">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Destination</p>
                            <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase truncate">
                              {lot.mill}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Commission</span>
                          <div className="flex flex-col items-end">
                            <span className="text-lg font-[1000] text-emerald-500 dark:text-emerald-400 tracking-tighter leading-none italic">
                              ₹{Number(lot.commission || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 tabular-nums mt-1">
                              {lot.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Aesthetic Corner Gradient */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <ChevronRight className="absolute bottom-6 right-6 w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
