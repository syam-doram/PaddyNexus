import React, { useState, useEffect, useMemo, useRef } from 'react';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

import {
  Search,
  Plus,
  Calendar,
  Tractor,
  IndianRupee,
  ShoppingBag,
  X,
  History,
  User,
  AlertCircle,
  Filter,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  FileText,
  RotateCcw,
  Phone
} from 'lucide-react';


interface Advance {
  id: number;
  farmer_name: string;
  amount: number;
  date: string;
  description: string;
}

interface FarmerLot {
  lotId: string;
  bags: number;
  rate: number;
  amountTypes: string[];
  weightCapacities: string[];
  date: string;
  stage: string;
  machine_cost: number;
  machine_id: string | null;
  machine_hours: number;
  machine_rate: number;
  gratuity: number;
  batch_gratuity: number;
  mobile: string;
  paddyType: string;
  loaded_at: string;
  vehicle_type: string;
}

interface FarmerSettlementData {
  farmerName: string;
  totalBags: number;
  grossAmount: number;
  totalMachineCost: number;
  totalMachineHours: number;
  machineLogs: {
    amount: number;
    hours: number;
    date: string;
    machineName: string;
  }[];
  totalAdvances: number;
  totalGratuity: number;
  netBalance: number;
  mobile: string;
  lots: FarmerLot[];
  advances: any[];
}

interface Machine {
  id: string;
  name: string;
  model: string;
}

export default function FarmerSettlement() {
  const { user } = useAuth();

  const [data, setData] = useState<FarmerSettlementData[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerSettlementData | null>(null);
  const [settlingFarmer, setSettlingFarmer] = useState<FarmerSettlementData | null>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [amountTypeTab, setAmountTypeTab] = useState<'All' | 'Spot Cash' | 'Barrow'>('All');
  const [settledFarmers, setSettledFarmers] = useState<Set<string>>(new Set());
  const [settledDates, setSettledDates] = useState<Record<string, string>>({});
  const printRef = useRef<HTMLDivElement>(null);

  const [newAdvance, setNewAdvance] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/farmer-settlements?year=${selectedYear}`;
      if (user?.id) url += `&traderId=${user.id}`;
      const res = await fetch(url);
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Failed to fetch settlements:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlementStatus = async () => {
    try {
      let url = `${API_BASE_URL}/farmer-settlements/status?year=${selectedYear}`;
      if (user?.id) url += `&traderId=${user.id}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.settledFarmers) {
        setSettledFarmers(new Set(json.settledFarmers as string[]));
      }
      if (json.settledDates) {
        setSettledDates(json.settledDates as Record<string, string>);
      }
    } catch (err) {
      console.error("Failed to fetch settlement status:", err);
    }
  };

  const fetchMachines = async () => {
    try {
      let url = `${API_BASE_URL}/machines`;
      if (user?.id) url += `?traderId=${user.id}`;
      const res = await fetch(url);
      const json = await res.json();
      if (Array.isArray(json)) {
        setMachines(json);
      }
    } catch (err) {
      console.error("Failed to fetch machines:", err);
    }
  };

  useEffect(() => {
    fetchSettlements();
    fetchSettlementStatus();
  }, [selectedYear, user]);

  useEffect(() => {
    fetchMachines();
  }, [user]);

  const handleAddAdvance = async () => {
    if ((!selectedFarmer && !settlingFarmer) || !newAdvance.amount) return;
    const targetFarmer = selectedFarmer || settlingFarmer;
    if (!targetFarmer) return;

    try {
      const res = await fetch(`${API_BASE_URL}/farmer-advances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_name: targetFarmer.farmerName,
          amount: parseFloat(newAdvance.amount),
          date: newAdvance.date,
          description: newAdvance.description,
          traderId: user?.id
        })
      });

      if (res.ok) {
        setShowAdvanceModal(false);
        setNewAdvance({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
        fetchSettlements();
      }
    } catch (err) {
      console.error("Failed to add advance:", err);
    }
  };

  const handleUpdateMachineInfo = async (lotId: string, updates: { cost?: number, machineId?: string | null, hours?: number, rate?: number }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/lots/${encodeURIComponent(lotId)}/machine-cost?traderId=${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machine_cost: updates.cost,
          machine_id: updates.machineId,
          machine_hours: updates.hours,
          machine_rate: updates.rate
        })
      });

      if (res.ok) {
        fetchSettlements();
      }
    } catch (err) {
      console.error("Failed to update machine info:", err);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(f => {
      const matchesSearch = f.farmerName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchingLots = f.lots.filter(lot => {
        return amountTypeTab === 'All' || lot.amountTypes.includes(amountTypeTab);
      });

      return matchesSearch && matchingLots.length > 0;
    }).map(f => {
      const filteredLots = f.lots.filter(lot => {
        return amountTypeTab === 'All' || lot.amountTypes.includes(amountTypeTab);
      });

      const grossAmount = filteredLots.reduce((acc, lot) => acc + (lot.bags * lot.rate), 0);
      const totalBags = filteredLots.reduce((acc, lot) => acc + lot.bags, 0);
      const totalGratuity = filteredLots.reduce((acc, lot) => acc + (lot.gratuity || 0) + (lot.batch_gratuity || 0), 0);

      // Total Machine Cost = General Logs (global for year) + Specific Lot Costs (filtered)
      const generalMachineCost = f.totalMachineCost - f.lots.reduce((acc, lot) => acc + (lot.machine_cost || 0), 0);
      const filteredLotMachineCost = filteredLots.reduce((acc, lot) => acc + (lot.machine_cost || 0), 0);
      const totalMachineCost = generalMachineCost + filteredLotMachineCost;

      return {
        ...f,
        lots: filteredLots,
        grossAmount,
        totalBags,
        totalMachineCost,
        totalGratuity,
        netBalance: grossAmount - totalMachineCost - f.totalAdvances - totalGratuity
      };
    });
  }, [data, searchQuery, amountTypeTab]);

  const stats = useMemo(() => {
    const unsettled = filteredData
      .filter(f => !settledFarmers.has(f.farmerName))
      .reduce((acc, curr) => ({
        gross: acc.gross + curr.grossAmount,
        machine: acc.machine + curr.totalMachineCost,
        advances: acc.advances + curr.totalAdvances,
        balance: acc.balance + curr.netBalance,
        bags: acc.bags + curr.totalBags,
        gratuity: acc.gratuity + curr.totalGratuity
      }), { gross: 0, machine: 0, advances: 0, balance: 0, bags: 0, gratuity: 0 });

    const settled = data
      .filter(f => settledFarmers.has(f.farmerName))
      .reduce((acc, curr) => {
        const bags = curr.lots.reduce((a, b) => a + b.bags, 0);
        const gratuity = curr.lots.reduce((a, b) => a + (b.gratuity || 0) + (b.batch_gratuity || 0), 0);
        const netBalance = curr.grossAmount - curr.totalMachineCost - curr.totalAdvances - gratuity;

        return {
          count: acc.count + 1,
          amount: acc.amount + netBalance
        };
      }, { count: 0, amount: 0 });

    return { ...unsettled, ...settled };
  }, [data, filteredData, settledFarmers]);

  const calculateSettlementDetails = (farmer: FarmerSettlementData) => {
    const avgWeight = farmer.lots.length > 0 ?
      farmer.lots.reduce((acc: number, lot: FarmerLot) => {
        const wStr = lot.weightCapacities?.[0] || '75';
        return acc + (parseFloat(wStr) || 75);
      }, 0) / farmer.lots.length : 75;

    const totalBags = farmer.totalBags;
    const avgRate = farmer.lots.length > 0 ?
      farmer.lots.reduce((acc: number, lot: FarmerLot) => acc + lot.rate, 0) / farmer.lots.length : 1200;

    // Deduction for bags: 1kg per bag
    // Money value of deduction = (Bags * 1KG) * (Rate / WeightCapacity)
    const bagWeightDeductionValue = totalBags * 1 * (avgRate / avgWeight);

    const machineCost = farmer.totalMachineCost;
    const advances = farmer.totalAdvances;
    const gratuity = farmer.totalGratuity || 0;

    const totalDetections = machineCost + bagWeightDeductionValue + advances + gratuity;
    const finalPayout = farmer.grossAmount - totalDetections;

    return {
      avgWeight,
      bagWeightDeductionValue,
      totalDetections,
      finalPayout,
      gratuity
    };
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-slate-50 dark:bg-[#020617] font-display">
      {/* Premium Glass Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 pt-12 pb-4 border-b border-slate-200 dark:border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">

            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">Financial Desk</h1>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{selectedYear} Settlements</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
          {years.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${selectedYear === year
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105'
                : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-white/5'
                }`}
            >
              {year}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by farmer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100 dark:bg-slate-950/50 border-none text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner"
          />
        </div>

        {/* Segmented Control Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-[20px]">
          {['All', 'Spot Cash', 'Barrow'].map((type) => (
            <button
              key={type}
              onClick={() => setAmountTypeTab(type as any)}
              className={`flex-1 py-2.5 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${amountTypeTab === type
                ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-32 no-scrollbar">
        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <div className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <IndianRupee className="w-24 h-24" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80">Pending Balance</p>
            <h4 className="text-2xl font-black tracking-tighter">₹{stats.balance.toLocaleString('en-IN')}</h4>
            <div className="mt-3 flex items-center gap-1.5 bg-white/20 w-fit px-2 py-1 rounded-lg">
              <CheckCircle2 className="w-3 h-3" />
              <span className="text-[9px] font-black uppercase">{stats.bags} BAGS</span>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> Gross
            </p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">₹{stats.gross.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-tight">Total receivables</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3 text-rose-500" /> Detections
            </p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">₹{(stats.machine + stats.advances + stats.gratuity).toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-tight">Advances & Charges</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Settled Farmers
            </p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{stats.count}</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-tight">Confirmed Payouts</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Settled Amount
            </p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">₹{stats.amount.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-tight">Total Disbursed</p>
          </div>

          <div className="p-5 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <User className="w-3 h-3 text-blue-500" /> Active Farmers
            </p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{filteredData.length}</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold tracking-tight">In {selectedYear} season</p>
          </div>
        </div>

        <div className="space-y-3 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
          <div className="flex items-center justify-between px-2 mb-2 lg:col-span-full">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Farmer Directory</h3>
            <span className="text-[10px] font-black text-slate-400">{filteredData.length} records</span>
          </div>

          {loading ? (
            <div className="space-y-3 lg:col-span-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-[32px] animate-pulse" />
              ))}
            </div>
          ) : filteredData.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredData.map((farmer, idx) => (
                <motion.div
                  key={farmer.farmerName}
                  layout
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    delay: idx * 0.05,
                    duration: 0.4,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className={`group relative rounded-3xl border transition-all duration-500 ${settledFarmers.has(farmer.farmerName)
                    ? 'bg-slate-50/50 dark:bg-slate-900/40 border-emerald-500/10 grayscale-[0.2] opacity-80 shadow-none'
                    : 'bg-white dark:bg-slate-900/10 border-slate-100 dark:border-white/[0.05] hover:border-emerald-500/10 hover:shadow-2xl hover:shadow-emerald-500/1'
                    }`}
                >
                  {/* Premium Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-full transition-all duration-700 opacity-0 group-hover:opacity-100 ${settledFarmers.has(farmer.farmerName) ? 'bg-emerald-800/30' : 'bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent'
                    }`} />

                  <div className="p-5">
                    {/* Header Section */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="relative">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${settledFarmers.has(farmer.farmerName)
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white'
                          }`}>
                          <User className="w-4 h-4" />
                        </div>
                        {settledFarmers.has(farmer.farmerName) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                            <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                            {farmer.farmerName}
                          </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {farmer.mobile && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-white/5">
                              <Phone className="w-2.5 h-2.5 text-emerald-500" />
                              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 tracking-wider font-mono">{farmer.mobile}</span>
                            </div>
                          )}
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                            {farmer.lots.length} Loads
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Bags</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{farmer.totalBags}</p>
                      </div>
                    </div>

                    {/* Financial Summary Block */}
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <div className="px-3 py-2 rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                          <TrendingUp className="w-2.5 h-2.5 text-emerald-500" /> Gross Billing
                        </p>
                        <p className="text-xs font-black text-slate-900 dark:text-slate-200">₹{farmer.grossAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="px-3 py-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 group-hover:bg-emerald-500 group-hover:border-emerald-500 duration-300">
                        <p className="text-[8px] font-black text-emerald-600/70 dark:text-emerald-400/70 group-hover:text-white/80 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                          <Wallet className="w-2.5 h-2.5" /> Net Balance
                        </p>
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-300 group-hover:text-white transition-colors">₹{farmer.netBalance.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Lot Stages Timeline-style */}
                    {farmer.lots.length > 0 && !settledFarmers.has(farmer.farmerName) && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Active Stages</p>
                          <div className="h-[1px] flex-1 bg-slate-100 dark:bg-white/5" />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {farmer.lots.map(lot => {
                            const stage = lot.stage || 'DELIVERED TO MILL';
                            const colors: Record<string, string> = {
                              'DELIVERED TO MILL': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                              'QUALITY CHECK': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                              'PAYMENT RELEASED': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                              'SETTLED': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
                            };
                            const shortLabel: Record<string, string> = {
                              'DELIVERED TO MILL': 'Mill',
                              'QUALITY CHECK': 'Quality',
                              'PAYMENT RELEASED': 'Paid',
                              'SETTLED': 'Settled',
                            };
                            return (
                              <div key={lot.lotId} className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-wide transition-all duration-300 ${colors[stage] || 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                <div className={`w-1 h-1 rounded-full bg-current`} />
                                <span>L{lot.lotId}: {shortLabel[stage] || stage}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {settledFarmers.has(farmer.farmerName) && settledDates[farmer.farmerName] && (
                      <div className="mb-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          Settled {new Date(settledDates[farmer.farmerName]).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex gap-2.5 mt-2">
                      {settledFarmers.has(farmer.farmerName) ? (
                        <>
                          <button
                            onClick={() => {
                              // Build a print-friendly HTML and open in new window
                              const calc = calculateSettlementDetails(farmer);
                              const netPayout = Math.round(calc.finalPayout);
                              const farmerName = farmer.farmerName;
                              const lotsHtml = farmer.lots.map(lot =>
                                `<tr>
                                  <td style="padding:12px 0">
                                    <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px">
                                      <span style="font-weight:900;font-size:12px">${lot.lotId}</span>
                                      <span style="font-size:8px;font-weight:900;background:#ecfdf5;color:#10b981;padding:2px 6px;border-radius:4px;text-transform:uppercase;letter-spacing:1px">${lot.paddyType || 'PADDY'}</span>
                                    </div>
                                    <div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:2px">${lot.bags} bags @ ₹${lot.rate}</div>
                                    <div style="font-size:9px;color:#94a3b8;font-style:italic">Loaded: ${lot.loaded_at || '---'} • ${lot.vehicle_type || '---'}</div>
                                  </td>
                                  <td style="text-align:right;vertical-align:middle;font-weight:900;font-size:13px">₹${(lot.bags * lot.rate).toLocaleString('en-IN')}</td>
                                </tr>`
                              ).join('');
                              const machineLogsHtml = farmer.machineLogs?.map(log =>
                                `<tr><td style="padding:8px 0">${log.machineName || 'Machine'}<br><span style="font-size:9px;color:#94a3b8">${log.hours}hrs × ₹${Math.round(log.amount / log.hours)}/hr</span></td><td style="text-align:right;vertical-align:middle">-₹${log.amount.toLocaleString('en-IN')}</td></tr>`
                              ).join('') || '';
                              const harvestHtml = farmer.lots.filter(l => (l.machine_hours || 0) > 0).map(lot =>
                                `<tr><td style="padding:8px 0">Harvest - Lot ${lot.lotId}<br><span style="font-size:9px;color:#94a3b8">${lot.machine_hours}hrs × ₹${lot.machine_rate}/hr</span></td><td style="text-align:right;vertical-align:middle">-₹${(lot.machine_hours * lot.machine_rate).toLocaleString('en-IN')}</td></tr>`
                              ).join('');
                              const printHtml = `<!DOCTYPE html><html><head><title>Settlement - ${farmerName}</title><style>
                                     body{font-family:Arial,sans-serif;padding:32px;color:#1a1a1a;max-width:600px;margin:0 auto}
                                     h1{font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px}
                                     h2{font-size:13px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:3px;margin-bottom:24px}
                                     h3{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#64748b;margin:20px 0 8px}
                                     table{width:100%;border-collapse:collapse;margin-bottom:8px}
                                     th{text-align:left;font-size:10px;font-weight:900;text-transform:uppercase;color:#94a3b8;padding:6px 0;border-bottom:1px solid #e2e8f0}
                                     td{font-size:12px;font-weight:700;padding:8px 0;border-bottom:1px solid #f1f5f9}
                                     .divider{border:none;border-top:2px dashed #e2e8f0;margin:16px 0}
                                     .total-row{font-size:14px;font-weight:900}
                                     .net{font-size:24px;font-weight:900;color:#10b981}
                                     .footer{margin-top:40px;font-size:10px;color:#94a3b8;text-align:center}
                                     @media print{.no-print{display:none}}
                                   </style></head><body>
                                     <h1>Settlement Report</h1>
                                     <h2>${farmerName} — ${selectedYear}</h2>
                                     <h3>Lot Breakdown</h3>
                                      <table><thead><tr><th>Lot Details</th><th style="text-align:right">Amount</th></tr></thead><tbody>${lotsHtml}</tbody></table>
                                     <div style="margin-top:10px">
                                       <table style="border-top:1px solid #e2e8f0"><tr class="total-row"><td style="padding-top:12px">Gross Total</td><td style="text-align:right;padding-top:12px">₹${farmer.grossAmount.toLocaleString('en-IN')}</td></tr></table>
                                     </div>
                                     <hr class="divider">
                                     <h3>Deductions</h3>
                                     <table><tbody>
                                       ${machineLogsHtml}${harvestHtml}
                                       <tr><td style="padding:8px 0">Bags Deduction (1kg/bag)</td><td style="text-align:right;vertical-align:middle">-₹${Math.round(calc.bagWeightDeductionValue).toLocaleString('en-IN')}</td></tr>
                                       <tr><td style="padding:8px 0">Financial Advances</td><td style="text-align:right;vertical-align:middle">-₹${farmer.totalAdvances.toLocaleString('en-IN')}</td></tr>
                                       <tr><td style="padding:8px 0">Labour Gratuity</td><td style="text-align:right;vertical-align:middle">-₹${calc.gratuity.toLocaleString('en-IN')}</td></tr>
                                     </tbody></table>
                                     <hr class="divider">
                                     <table><tr><td style="font-size:14px;font-weight:900;padding-top:12px">Net Payout</td><td style="text-align:right;padding-top:12px" class="net">₹${netPayout.toLocaleString('en-IN')}</td></tr></table>
                                     <div class="footer">Generated on ${new Date().toLocaleDateString('en-IN')} • PaddyManager Settlement Report</div>
                                   </body></html>`;
                              const w = window.open('', '_blank', 'width=700,height=900');
                              if (w) { w.document.write(printHtml); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
                            }}
                            className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all border-2 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-white/5 hover:bg-slate-200 flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF Report
                          </button>
                          <button
                            onClick={async () => {
                              await fetch(`${API_BASE_URL}/farmer-settlements/reopen`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ farmer_name: farmer.farmerName, year: selectedYear, traderId: user?.id })
                              });
                              setSettledFarmers(prev => { const n = new Set(prev); n.delete(farmer.farmerName); return n; });
                              setSettledDates(prev => { const n = { ...prev }; delete n[farmer.farmerName]; return n; });
                            }}
                            className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all border-2 bg-amber-500/5 text-amber-600 border-amber-500/20 hover:bg-amber-500/10 flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reopen
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedFarmer(farmer)}
                            className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-white/5 active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" /> Details
                          </button>
                          <button
                            onClick={() => setSettlingFarmer(farmer)}
                            className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-900 shadow-md hover:scale-[1.02] flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settle
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-[32px] flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200 dark:border-slate-800">
                <AlertCircle className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">No results for this selection</p>
            </div>
          )}
        </div>
      </main>

      {/* Settlement Breakdown Sheet */}
      <AnimatePresence>
        {settlingFarmer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettlingFarmer(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[150]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-[48px] z-[151] max-h-[95vh] overflow-y-auto max-w-md mx-auto shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mt-4 mb-8" />
              <div className="px-8 pb-32">
                <header className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">Settlement</h2>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Farmer Payout Breakdown</p>
                  </div>
                  <button onClick={() => setSettlingFarmer(null)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </header>

                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-white/5 rounded-[32px] border border-slate-100 dark:border-white/5">
                    <div className="w-12 h-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-emerald-600">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase leading-none mb-1">{settlingFarmer.farmerName}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{settlingFarmer.totalBags} Bags harvested in {selectedYear}</p>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-950/50 rounded-[40px] p-8 border border-slate-100 dark:border-white/5 space-y-6 shadow-xl">
                    <div className="flex justify-between items-center text-slate-500 uppercase font-black text-[10px] tracking-[0.2em] mb-4">
                      <span>Payment Model</span>
                      <span className="text-emerald-500">{amountTypeTab === 'All' ? 'Consolidated' : amountTypeTab}</span>
                    </div>

                    {/* Financial Rows */}
                    <div className="space-y-4">
                      <div className="mb-4">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">Lot breakdown</p>
                        <div className="space-y-2">
                          {settlingFarmer.lots.map(lot => (
                            <div key={lot.lotId} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">{lot.lotId}</p>
                                  <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{lot.paddyType || 'Paddy'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{lot.bags} Bags @ ₹{lot.rate}</p>
                                  <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tight italic opacity-70">Loaded: {lot.loaded_at || '---'}</p>
                                </div>
                              </div>
                              <p className="text-xs font-black text-slate-900 dark:text-white">₹{(lot.bags * lot.rate).toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-white/5 my-2" />

                      <div className="flex justify-between items-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gross Total</p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">₹{settlingFarmer.grossAmount.toLocaleString('en-IN')}</p>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-white/5 my-2" />

                      <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Detection amount</p>

                      {(() => {
                        const calc = calculateSettlementDetails(settlingFarmer);
                        return (
                          <div className="space-y-3">
                            {/* General Machine Detections */}
                            {settlingFarmer.machineLogs && settlingFarmer.machineLogs.length > 0 && (
                              <div className="p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 space-y-2.5 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Tractor className="w-4 h-4 text-indigo-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">General Machine Detections</span>
                                </div>
                                {settlingFarmer.machineLogs.map((log, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        {log.machineName || 'Machine'}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-medium">
                                        {log.hours} hrs × ₹{Math.round(log.amount / log.hours)}/hr
                                      </p>
                                    </div>
                                    <p className="text-xs font-black text-rose-500">- ₹{log.amount.toLocaleString('en-IN')}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Harvest Machine Detections (Lot-level) */}
                            {settlingFarmer.lots.some(l => (l.machine_hours || 0) > 0) && (
                              <div className="p-3 rounded-xl bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/10 space-y-2.5 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Tractor className="w-4 h-4 text-emerald-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Harvest Machine Detections</span>
                                </div>
                                {settlingFarmer.lots.filter(l => (l.machine_hours || 0) > 0).map((lot, idx) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                                        Lot {lot.lotId}
                                      </p>
                                      <p className="text-[10px] text-slate-500 font-medium">
                                        {lot.machine_hours} hrs × ₹{lot.machine_rate}/hr
                                      </p>
                                    </div>
                                    <p className="text-xs font-black text-rose-500">- ₹{(lot.machine_hours * lot.machine_rate).toLocaleString('en-IN')}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Fallback if no machine detections */}
                            {(!settlingFarmer.machineLogs || settlingFarmer.machineLogs.length === 0) && !settlingFarmer.lots.some(l => (l.machine_hours || 0) > 0) && (
                              <div className="flex justify-between items-center px-1 mb-2">
                                <div className="flex items-center gap-2">
                                  <Tractor className="w-3.5 h-3.5 text-slate-400" />
                                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Machine Hour Detection (0 hrs)</p>
                                </div>
                                <p className="text-xs font-black text-rose-500">- ₹0</p>
                              </div>
                            )}

                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Bags Deduction (1kg/bag)</p>
                              </div>
                              <p className="text-xs font-black text-rose-500">- ₹{Math.round(calc.bagWeightDeductionValue).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Financial Advances</p>
                              </div>
                              <p className="text-xs font-black text-rose-500">- ₹{settlingFarmer.totalAdvances.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Labour Gratuity</p>
                              </div>
                              <p className="text-xs font-black text-rose-500">- ₹{calc.gratuity.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="pt-8 mt-4 border-t-2 border-dashed border-slate-100 dark:border-white/10">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Net Payout</p>
                            <h4 className="text-3xl font-black text-emerald-500 tracking-tighter">₹{Math.round(calculateSettlementDetails(settlingFarmer).finalPayout).toLocaleString('en-IN')}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Status</p>
                            {settledFarmers.has(settlingFarmer.farmerName) ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-lg">
                                <CheckCircle2 className="w-3 h-3" /> SETTLED
                              </span>
                            ) : (
                              <span className="inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-lg">CALCULATED</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={async () => {
                            if (!settlingFarmer) return;
                            await fetch(`${API_BASE_URL}/farmer-settlements/settle`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ farmer_name: settlingFarmer.farmerName, year: selectedYear, traderId: user?.id })
                            });
                            setSettledFarmers(prev => new Set([...prev, settlingFarmer.farmerName]));
                            setSettlingFarmer(null);
                          }}
                          className="flex-1 h-16 rounded-[24px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-xl shadow-black/20 dark:shadow-white/5 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Release Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Bottom Sheet (Profile/History) */}
      <AnimatePresence>
        {selectedFarmer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFarmer(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-[48px] z-[101] max-h-[90vh] overflow-y-auto max-w-md mx-auto shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mt-4 mb-6" />
              <div className="px-8 pb-32">
                <div className="space-y-6">
                  {/* Premium Statement Summary Header */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 p-6 rounded-[40px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
                    <div className="relative z-10 flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Financial Statement</p>
                          <h4 className="text-3xl font-black text-white tracking-tighter">₹{selectedFarmer.netBalance.toLocaleString('en-IN')}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Current Net Balance</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400">
                          <Wallet className="w-6 h-6" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Gross</p>
                          <p className="text-sm font-black text-slate-200">₹{selectedFarmer.grossAmount.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Deductions</p>
                          <p className="text-sm font-black text-rose-400">₹{(selectedFarmer.grossAmount - selectedFarmer.netBalance).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lots Section */}
                  <div>
                    <div className="flex justify-between items-center mb-5 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Harvested Lots</h4>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{selectedFarmer.lots.length} LOTS</span>
                    </div>

                    <div className="space-y-4">
                      {selectedFarmer.lots.map((lot, idx) => (
                        <motion.div
                          key={lot.lotId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + idx * 0.05 }}
                          className="group p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[32px] shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300"
                        >
                          <div className="flex justify-between items-start mb-5">
                            <div className="flex gap-4 items-center">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">{lot.lotId}</h5>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                  <Calendar className="w-2.5 h-2.5" /> {lot.date}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-slate-900 dark:text-white mb-0.5">₹{(lot.bags * lot.rate).toLocaleString('en-IN')}</p>
                              <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{lot.bags} BAGS × ₹{lot.rate}</p>
                            </div>
                          </div>

                          <div className="pl-16 space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                              {lot.amountTypes.map(at => (
                                <span key={at} className="text-[8px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg uppercase tracking-widest text-center">{at}</span>
                              ))}
                            </div>

                            <div className="pt-4 border-t border-dashed border-slate-100 dark:border-white/10">
                              <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2 px-1">Unit Assignment</label>
                              <div className="relative group/select">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/select:scale-110 transition-transform">
                                  <Tractor className="w-4 h-4" />
                                </div>
                                <select
                                  value={lot.machine_id || ''}
                                  onChange={(e) => handleUpdateMachineInfo(lot.lotId, { machineId: e.target.value || null })}
                                  className="w-full h-12 bg-slate-50 dark:bg-white/5 border-none rounded-2xl pl-13 pr-4 text-xs font-black text-slate-700 dark:text-slate-200 shadow-inner focus:ring-2 focus:ring-emerald-500/50 appearance-none transition-all outline-none"
                                >
                                  <option value="">NO MACHINE ASSIGNED</option>
                                  {machines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>
                                  ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                  <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block px-1">Hours</label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    defaultValue={lot.machine_hours}
                                    onBlur={(e) => {
                                      const hours = parseFloat(e.target.value) || 0;
                                      const rate = lot.machine_rate || 0;
                                      handleUpdateMachineInfo(lot.lotId, { hours, cost: hours * rate });
                                    }}
                                    className="w-full h-10 bg-slate-50 dark:bg-white/5 border-none rounded-xl px-3 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block px-1">Rate / Hr</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">₹</span>
                                  <input
                                    type="number"
                                    defaultValue={lot.machine_rate}
                                    onBlur={(e) => {
                                      const rate = parseFloat(e.target.value) || 0;
                                      const hours = lot.machine_hours || 0;
                                      handleUpdateMachineInfo(lot.lotId, { rate, cost: hours * rate });
                                    }}
                                    className="w-full h-10 bg-slate-50 dark:bg-white/5 border-none rounded-xl pl-6 pr-3 text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 transition-all outline-none"
                                    placeholder="1200"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Advances Section */}
                  <div>
                    <div className="flex justify-between items-center mb-5 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                          <History className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Advance History</h4>
                      </div>
                      <button
                        onClick={() => setShowAdvanceModal(true)}
                        className="p-2.5 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20 active:scale-95 hover:bg-orange-600 transition-all group"
                      >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedFarmer.advances.length > 0 ? (
                        <>
                          {selectedFarmer.advances.map((adv, idx) => (
                            <motion.div
                              key={adv._id}

                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + idx * 0.05 }}
                              className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[28px] flex justify-between items-center shadow-sm hover:border-orange-500/20 transition-all duration-300"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/5 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase mb-0.5 tracking-tight">{adv.description || 'GENERIC ADVANCE'}</p>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{adv.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-black text-rose-500 tracking-tighter">- ₹{adv.amount.toLocaleString('en-IN')}</p>
                              </div>
                            </motion.div>
                          ))}
                          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consolidated Advances</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">₹{selectedFarmer.totalAdvances.toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      ) : (
                        <div className="py-12 bg-slate-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800/50 text-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                            <History className="w-6 h-6 text-slate-300 dark:text-slate-700" />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">No financial advances recorded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Advance Modal - Higher Z Index */}
      <AnimatePresence>
        {showAdvanceModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-[340px] bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-8 text-center leading-none">Record Advance</h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="number"
                      value={newAdvance.amount}
                      onChange={(e) => setNewAdvance({ ...newAdvance, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full h-14 pl-12 pr-4 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl font-black text-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={newAdvance.date}
                      onChange={(e) => setNewAdvance({ ...newAdvance, date: e.target.value })}
                      className="w-full h-14 pl-12 pr-4 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl font-black text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <input
                    type="text"
                    value={newAdvance.description}
                    onChange={(e) => setNewAdvance({ ...newAdvance, description: e.target.value })}
                    placeholder="e.g. Fertilizer Support"
                    className="w-full h-14 px-5 bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl font-black text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => setShowAdvanceModal(false)}
                  className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleAddAdvance}
                  className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-orange-500 shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                >
                  Post Pay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
