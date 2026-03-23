import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  Truck,
  Building2,
  IndianRupee,
  LayoutGrid,
  List,
  MapPin,
  Activity,
  ArrowRight,
  Eye,
  Package,
  CheckCircle2,
  Warehouse,
  Wrench,
  FileText,
  X,
  RotateCcw,
  Wallet,
  CalendarCheck,
  ShieldCheck,
  BadgeCheck,
  Coins,
  TrendingDown,
  TrendingUp,
  User,
  AlertCircle,
  History,
  ShoppingBag,
  Tractor,
  ArrowUpRight,
  Share2,
  Clock,
  Calendar,
  ClipboardCheck,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

// These are the REAL stages from the lots table in the DB
const STAGE_FLOW = [
  { id: 'LOADED', label: 'Loaded', short: 'LOADED', icon: Package, color: 'blue', dateKey: 'loaded_at' },
  { id: 'DELIVERED TO MILL', label: 'Delivered to Mill', short: 'DELIVERED', icon: Truck, color: 'purple', dateKey: 'delivered_at' },
  { id: 'QUALITY CHECK', label: 'Quality Check', short: 'QC', icon: ShieldCheck, color: 'orange', dateKey: 'quality_checked_at' },
  { id: 'PAID', label: 'Payment Released', short: 'RELEASED', icon: Wallet, color: 'emerald', dateKey: 'paid_at' },
  { id: 'SETTLED', label: 'Settled', short: 'SETTLED', icon: BadgeCheck, color: 'emerald', dateKey: 'settled_at' },
];

const STAGE_COLORS: Record<string, { bg: string; light: string; text: string; border: string; btn: string }> = {
  slate: { bg: 'bg-slate-500', light: 'bg-slate-50 dark:bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-500/30', btn: 'bg-slate-700 hover:bg-slate-800 text-white' },
  blue: { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30', btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
  amber: { bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30', btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
  purple: { bg: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/30', btn: 'bg-purple-600 hover:bg-purple-700 text-white' },
  orange: { bg: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/30', btn: 'bg-orange-500 hover:bg-orange-600 text-white' },
  emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30', btn: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
};

const NEXT_ACTION_LABEL: Record<string, string> = {
  'LOADING': 'Loaded',
  'LOADED': 'Delivered to Mill',
  'DELIVERED TO MILL': 'Quality Check',
  'QUALITY CHECK': 'Payment Released',
  'PAID': 'Settle Lot',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'LOADED': { label: 'LOADED', color: 'blue' },
  'DELIVERED TO MILL': { label: 'DELIVERED', color: 'purple' },
  'QUALITY CHECK': { label: 'QC IN PROGRESS', color: 'orange' },
  'PAID': { label: 'PAYMENT RELEASED', color: 'emerald' },
  'SETTLED': { label: 'SETTLED', color: 'emerald' },
};

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

export default function LotStages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [lots, setLots] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [settlingLot, setSettlingLot] = useState<any | null>(null);

  const years = ['2023', '2024', '2025', '2026'];

  useEffect(() => {
    let url = `${API_BASE_URL}/lot-stages`;
    if (user?.id) url += `?traderId=${user.id}`;
    fetch(url)
      .then(res => res.json())
      .then(data => setLots(Array.isArray(data) ? data : []))
      .catch(err => console.error('Error fetching lot-stages:', err));
  }, [user?.id]);
  
  // Only lots that match the stages in our pipeline are "visible" in this screen
  const visibleLots = lots.filter(lot => STAGE_FLOW.some(s => s.id === lot.stage));

  const filteredLots = visibleLots.filter(lot => {
    const matchesSearch =
      (lot.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lot.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lot.load_area || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lot.mill_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = filterStage === 'all' || lot.stage === filterStage;
    const matchesYear = lot.date ? lot.date.startsWith(selectedYear) : true;

    return matchesSearch && matchesStage && matchesYear;
  });

  const calculateLotSettlement = (lot: any) => {
    const bags = Number(lot.bags) || 0;
    const rate = Number(lot.rate) || 1200;
    const weight = 75;

    const grossAmount = bags * rate;
    const bagWeightDeduction = bags * 1 * (rate / weight);
    const labourCost = Number(lot.machine_cost) || 0;
    const traderCommission = bags * (Number(lot.dealer_commission) || 0);

    const totalDeductions = bagWeightDeduction;
    const netPayout = grossAmount - totalDeductions + labourCost + traderCommission;

    return {
      grossAmount,
      bagWeightDeduction,
      labourCost,
      traderCommission,
      totalDeductions,
      netPayout
    };
  };

  const handlePrintPDF = (lot: any) => {
    const calc = calculateLotSettlement(lot);
    const farmerName = lot.name || 'Farmer';
    const releasedDate = lot.settled_at ? new Date(lot.settled_at).toLocaleDateString('en-IN') : 'PENDING';
    const printHtml = `<!DOCTYPE html><html><head><title>Report - ${lot.id}</title><style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:40px;color:#0f172a;max-width:850px;margin:0 auto;line-height:1.4}
      .header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0f172a;padding-bottom:20px;margin-bottom:30px}
      .logo{font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:-1.5px}
      .report-title{font-size:32px;font-weight:900;text-transform:uppercase;margin:40px 0 20px;letter-spacing:-1px;color:#0f172a}
      
      .meta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-bottom:40px;padding:24px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0}
      .meta-item{display:flex;flex-direction:column;gap:4px}
      .meta-label{font-size:10px;font-weight:800;text-transform:uppercase;color:#64748b;letter-spacing:1px}
      .meta-value{font-size:14px;font-weight:700;color:#1e293b}
      
      table{width:100%;border-collapse:collapse;margin:30px 0}
      th{text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;padding:15px;background:#f1f5f9;border-bottom:2px solid #e2e8f0}
      td{padding:15px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600}
      .total-row td{background:#f8fafc;border-top:2px solid #0f172a;font-size:20px;font-weight:900;padding:20px 15px}
      .deduction{color:#ef4444}
      .accent{color:#10b981}
      
      .footer{margin-top:80px;padding-top:30px;border-top:2px solid #f1f5f9;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase}
    </style></head><body>
      <div class="header">
        <div class="logo">PaddyNexus<span class="accent">.</span></div>
        <div style="text-align:right">
          <div style="font-weight:900;font-size:18px">LOT #${lot.id}</div>
          <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase">Settlement ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
        </div>
      </div>

      <div class="report-title">Settlement Report</div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Farmer Name</span>
          <span class="meta-value">${farmerName}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Paddy Type</span>
          <span class="meta-value">${lot.variety || 'Basmati Sella'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Total Bags</span>
          <span class="meta-value">${lot.bags} Bags</span>
        </div>
        
        <div class="meta-item">
          <span class="meta-label">Vehicle Type</span>
          <span class="meta-value">${lot.vehicle_type || 'Truck (Standard)'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Registration ID</span>
          <span class="meta-value">${lot.vehicle_number || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Loaded Date</span>
          <span class="meta-value">${lot.date}</span>
        </div>

        <div class="meta-item">
          <span class="meta-label">Mill Name</span>
          <span class="meta-value">${lot.mill_name || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Mill Contact</span>
          <span class="meta-value">${lot.mill_phone || 'N/A'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Mill Location</span>
          <span class="meta-value">${lot.load_area || 'NELLORE, AP'}</span>
        </div>

        <div class="meta-item">
          <span class="meta-label">Payment Status</span>
          <span class="meta-value" style="color:#10b981">COMPLETED</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Released Date</span>
          <span class="meta-value">${releasedDate}</span>
        </div>
      </div>

      <table>
        <thead><tr><th>Financial Description</th><th style="text-align:right">Amount (INR)</th></tr></thead>
        <tbody>
          <tr><td>Gross Settlement (${lot.bags} Bags × ₹${lot.rate})</td><td style="text-align:right">₹${fmt(calc.grossAmount)}</td></tr>
          <tr><td>Bag Weight Deduction (1kg/bag @ base rate)</td><td style="text-align:right" class="deduction">-₹${fmt(calc.bagWeightDeduction)}</td></tr>
          <tr><td>Labour & Loading Charges</td><td style="text-align:right" class="accent">+₹${fmt(calc.labourCost)}</td></tr>
          <tr><td>Trader Facilitation Commission</td><td style="text-align:right" class="accent">+₹${fmt(calc.traderCommission)}</td></tr>
          <tr class="total-row"><td>Net Settlement Payout</td><td style="text-align:right" class="accent">₹${fmt(calc.netPayout)}</td></tr>
        </tbody>
      </table>

      <div style="margin-top:40px;font-size:12px;color:#64748b;font-style:italic">
        * This is an electronically generated report. Any discrepancies should be reported to the trader within 24 hours of release.
      </div>

      <div class="footer">
        <span>Generated: ${new Date().toLocaleDateString('en-IN')}</span>
        <span>Secure Digital Receipt • PaddyNexus v2.0</span>
      </div>
    </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printHtml); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const handleUpdateStage = async (lotId: string, currentStage: string, forcedNextStage?: string) => {
    let nextStage = forcedNextStage;
    if (!nextStage) {
      const idx = STAGE_FLOW.findIndex(s => s.id === currentStage);
      nextStage = STAGE_FLOW[idx + 1]?.id;
    }

    if (!nextStage) return;

    setUpdatingId(lotId);
    try {
      const payload: any = { stage: nextStage };
      if (nextStage === 'SETTLED') {
        payload.settled_at = new Date().toISOString();
      } else {
        payload.settled_at = null;
      }

      console.log(`[LotStages] Updating lot ${lotId} to stage: ${nextStage}`);
      let url = `${API_BASE_URL}/lots/${encodeURIComponent(lotId)}/stage`;
      if (user?.id) url += `?traderId=${user.id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, traderId: user?.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${res.status}`);
      }

      console.log(`[LotStages] Successfully updated lot ${lotId}`);
      setLots(prev => prev.map(l => l.id === lotId ? { ...l, stage: nextStage, settled_at: payload.settled_at } : l));
    } catch (err: any) {
      console.error('[LotStages] Failed to update stage:', err);
      alert(`Error updating lot: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStageInfo = (stageId: string) =>
    STAGE_FLOW.find(s => s.id === stageId) || STAGE_FLOW[0];

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1800px] flex flex-col h-full">

        {/* ─── Header ─── */}
        <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 px-5 lg:px-6 pt-5 lg:pt-12 pb-3 lg:pb-6 shrink-0">
          <div className="flex items-center gap-3 lg:gap-4 justify-between flex-wrap">

            <div className="flex items-center gap-3 lg:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2.5 lg:p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-emerald-500 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <p className="text-[11px] lg:text-sm font-black text-emerald-500 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Supply Chain</p>
                <h1 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">Lot <span className="text-emerald-500">Stages</span> <span className="text-slate-400 text-sm ml-2 font-black not-italic opacity-60">({visibleLots.length} LOTS)</span></h1>
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[260px] max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search driver, lot ID, mill..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl pl-11 pr-5 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Year Filter */}
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
              {years.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedYear === year ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
                >
                  {year}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
              <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-primary' : 'text-slate-400'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stage Filter Tabs */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setFilterStage('all')}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterStage === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-800'}`}
            >
              All · {visibleLots.length}
            </button>
            {STAGE_FLOW.map(s => {
              const count = visibleLots.filter(l => l.stage === s.id).length;
              const c = STAGE_COLORS[s.color];
              const isActive = filterStage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setFilterStage(s.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${isActive ? `${c.bg} text-white border-transparent shadow-lg` : `${c.light} ${c.text} ${c.border} hover:shadow-sm`
                    }`}
                >
                  {s.short} · {count}
                </button>
              );
            })}
          </div>
        </header>

        {/* ─── Main Content ─── */}
        <main className="flex-1 px-6 py-8 lg:px-16 lg:py-12 pb-32 lg:pb-12 overflow-y-auto no-scrollbar">
          {/* Results Summary */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] opacity-60">
              Showing <span className="text-slate-900 dark:text-white">{filteredLots.length}</span> of <span className="text-slate-900 dark:text-white">{visibleLots.length}</span> Total Pipeline Lots
            </p>
          </div>
          <AnimatePresence mode="popLayout">
            {viewMode === 'list' ? (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {filteredLots.map((lot, index) => {
                  const stageInfo = getStageInfo(lot.stage);
                  const c = STAGE_COLORS[stageInfo.color];
                  const stageIdx = STAGE_FLOW.findIndex(s => s.id === lot.stage);
                  const isSettled = lot.stage === 'SETTLED';
                  const isCompleted = lot.stage === 'PAID' || isSettled;
                  const isUpdating = updatingId === lot.id;
                  const StageIcon = stageInfo.icon;

                  // Financial calculations
                  const bags = Number(lot.bags) || 0;
                  const rate = Number(lot.rate) || 1200;
                  const lotAmount = bags * rate;
                  const traderAmount = bags * (Number(lot.dealer_commission) || 0);
                  const labourAmount = bags * (Number(lot.labour_commission) || 0);
                  const weightTons = (bags * 75) / 1000;
                  const status = STATUS_LABELS[lot.stage] || { label: 'PENDING', color: 'slate' };
                  const sc = STAGE_COLORS[status.color];
                  return (
                    <motion.div
                      key={lot.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`group bg-white dark:bg-[#0F172A] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden`}
                    >
                      <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr_200px] lg:items-center gap-4 lg:gap-0 px-6 py-6 lg:min-h-[120px]">

                        {/* Info Section */}
                        <div className="flex flex-col gap-2 pr-6 lg:border-r lg:border-slate-50 dark:lg:border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter">Lot #{lot.id}</span>
                            <span className={`text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${sc.light} ${sc.text} border ${sc.border}`}>
                              {status.label}
                            </span>
                          </div>
                          
                          {/* Driver & Paddy Type */}
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                              {lot.name || 'Unknown Driver'}
                            </p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                              {lot.type || 'Basmati Sella'} • {weightTons.toFixed(1)} Tons
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                            {/* Trader (Mill) */}
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-[10px] font-[900] text-slate-500 dark:text-slate-400 uppercase tracking-tight">Trader:</span>
                              <span className="text-[10px] font-[900] text-slate-700 dark:text-slate-200 uppercase">{lot.mill_name || 'N/A'}</span>
                            </div>
                            
                            {/* Labor */}
                            <div className="flex items-center gap-1.5">
                              <User className="w-1.5 h-1.5 text-blue-400 fill-blue-400" />
                              <span className="text-[10px] font-[900] text-slate-500 dark:text-slate-400 uppercase tracking-tight">Labor:</span>
                              <span className="text-[10px] font-[900] text-slate-700 dark:text-slate-200 uppercase">{lot.labour_group_name || 'N/A'}</span>
                            </div>

                            {/* Vehicle */}
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-[900] text-slate-700 dark:text-slate-200 uppercase tabular-nums">{lot.reg_number || 'REG-XXXX'}</span>
                            </div>

                            {/* Bags */}
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-[10px] font-[900] text-slate-700 dark:text-slate-200 uppercase">{bags} Bags</span>
                            </div>
                          </div>
                        </div>

                        {/* Stepper Section (Horizontal) */}
                        <div className="px-6 relative lg:px-12 py-4 flex-1">
                          <div className="relative flex items-center justify-between">
                            {/* Background line */}
                            <div className="absolute left-0 right-0 h-0.5 bg-slate-100 dark:bg-white/5 top-1/2 -translate-y-1/2 -z-0" />

                            {/* Status line */}
                            <div
                              className="absolute left-0 h-0.5 bg-emerald-500 top-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-0"
                              style={{ width: `${(stageIdx / (STAGE_FLOW.length - 1)) * 100}%` }}
                            />

                            {STAGE_FLOW.map((s, i) => {
                              const isPast = i < stageIdx;
                              const isCurrent = i === stageIdx;
                              const Icon = s.icon;
                              const sc_step = STAGE_COLORS[s.color];
                              const stageDate = lot[s.dateKey];

                              return (
                                <div key={s.id} className="relative z-10 flex flex-col items-center">
                                  <button
                                    disabled={isUpdating || isSettled}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStage(lot.id, 'MANUAL_OVERRIDE', s.id);
                                    }}
                                    className={`group w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isPast || isCurrent
                                      ? `${sc_step.bg} text-white shadow-lg shadow-${s.color}-500/10`
                                      : 'bg-slate-100 dark:bg-white/10 text-slate-300 dark:text-slate-600'
                                      } ${isSettled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </button>
                                  <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center whitespace-nowrap">
                                    <span className={`text-[10px] font-black uppercase tracking-tighter ${isCurrent ? sc_step.text : 'text-slate-400 dark:text-slate-600'
                                      }`}>
                                      {s.short}
                                    </span>
                                    {stageDate && (
                                      <span className="text-[6px] font-bold text-slate-500 tabular-nums">
                                        {new Date(stageDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Payment & Primary Action */}
                        <div className="flex flex-col lg:items-end gap-3 pl-6 lg:border-l lg:border-slate-50 dark:lg:border-white/5">
                          <div className="text-right">
                            <p className="text-2xl font-[1000] text-slate-900 dark:text-white tracking-tighter leading-none">₹{fmt(lotAmount)}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Payout</p>
                          </div>

                          {!isCompleted ? (
                            <button
                              onClick={() => handleUpdateStage(lot.id, lot.stage)}
                              disabled={isUpdating}
                              className="w-full lg:w-40 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95"
                            >
                              {isUpdating ? <div className="w-3 h-3 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                              {NEXT_ACTION_LABEL[lot.stage] || 'Advance'}
                            </button>
                          ) : lot.stage === 'PAID' ? (
                            <button
                              onClick={() => setSettlingLot(lot)}
                              className="w-full lg:w-40 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                            >
                              <BadgeCheck className="w-3.5 h-3.5" />
                              Settle Lot
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2 w-full lg:w-40">
                              <button
                                onClick={() => handleUpdateStage(lot.id, lot.stage, 'QUALITY CHECK')}
                                disabled={isUpdating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-orange-500 transition-all border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest"
                              >
                                {isUpdating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                Reopen Lot
                              </button>
                              <button
                                onClick={() => handlePrintPDF(lot)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-emerald-500 transition-all font-black text-[9px] uppercase tracking-widest group border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/10"
                              >
                                <FileText className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                                <span>Download Report</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredLots.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 px-6 text-center bg-white dark:bg-[#0F172A] rounded-[48px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <div className="w-20 h-20 rounded-[32px] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5 shadow-inner">
                      <LayoutGrid className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">No Active Pipeline</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[280px] leading-relaxed">
                      No lots are currently traversing the supply chain. New deployments will appear here for stage management.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ─── Grid View ─── */
              <motion.div key="grid" layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredLots.map((lot, index) => {
                  const stageInfo = getStageInfo(lot.stage);
                  const c = STAGE_COLORS[stageInfo.color];
                  const stageIdx = STAGE_FLOW.findIndex(s => s.id === lot.stage);
                  const isSettled = lot.stage === 'SETTLED';
                  const isCompleted = lot.stage === 'PAID' || isSettled;
                  const isUpdating = updatingId === lot.id;
                  const StageIcon = stageInfo.icon;
                  const bags = Number(lot.bags) || 0;
                  const rate = Number(lot.rate) || 1200;
                  const lotAmount = bags * rate;
                  const traderAmount = bags * (Number(lot.dealer_commission) || 0);
                  const labourAmount = bags * (Number(lot.labour_commission) || 0);
                  const weightTons = (bags * 75) / 1000;
                  const status = STATUS_LABELS[lot.stage] || { label: 'PENDING', color: 'slate' };
                  const sc = STAGE_COLORS[status.color];

                  return (
                    <motion.div
                      key={lot.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-white/80 dark:bg-[#111A2E]/80 backdrop-blur-xl rounded-[32px] border border-white dark:border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 flex flex-col relative overflow-hidden h-full group/card`}
                    >
                      {/* Premium Compact Header */}
                      <div className={`p-6 pb-6 relative overflow-hidden border-b ${sc.border}/15`}>
                        <div className={`absolute inset-0 opacity-5 ${sc.bg} blur-3xl -translate-y-1/2 -translate-x-1/2 scale-150`} />

                        <div className="relative z-10 flex justify-between items-center gap-4 mb-4">
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${sc.bg} shadow-[0_0_8px_${sc.bg.replace('bg-', '')}] animate-pulse`} />
                              <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${sc.text}`}>
                                {status.label}
                              </span>
                            </div>
                            <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none group-hover/card:translate-x-1 transition-transform origin-left">
                              Lot <span className="text-primary">#{lot.id}</span>
                            </h3>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-2xl font-[1000] text-slate-900 dark:text-white tracking-tighter tabular-nums">₹{fmt(lotAmount)}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">Payout Est.</p>
                          </div>
                        </div>

                        {/* Metadata Badges - Compact Row */}
                        <div className="relative z-10 flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 dark:bg-white/5 rounded-xl border border-white dark:border-white/10 shadow-sm backdrop-blur-md">
                            <User className={`w-3 h-3 ${sc.text}`} />
                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight truncate max-w-[100px]">{lot.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 dark:bg-white/5 rounded-xl border border-white dark:border-white/10 shadow-sm backdrop-blur-md">
                            <Package className={`w-3 h-3 ${sc.text}`} />
                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{lot.type || 'Basmati'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/40 dark:bg-white/5 rounded-xl border border-white dark:border-white/10 shadow-sm backdrop-blur-md">
                            <TrendingUp className={`w-3 h-3 ${sc.text}`} />
                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{weightTons.toFixed(1)} Tons</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-1 gap-6">
                        {/* Compact Information Boards */}
                        <div className="flex flex-col gap-5">
                          {/* Board 1: Logistics - Reduced Gaps */}
                          <div className="relative group/board">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-md ${sc.light} flex items-center justify-center`}>
                                <Truck className={`w-3 h-3 ${sc.text}`} />
                              </div>
                              Logistics
                            </h4>
                            <div className="bg-slate-50/40 dark:bg-white/[0.01] rounded-[20px] p-4 border border-slate-100/50 dark:border-white/5 transition-colors">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-0.5">
                                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Trader (Mill)</label>
                                  <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none truncate">{lot.mill_name || 'N/A'}</p>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 leading-none">{lot.labour_group_name || 'No Labor Group'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 text-right">
                                  <label className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Vehicle ID</label>
                                  <p className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase leading-none tabular-nums">{lot.reg_number || 'REG-XXXX'}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{lot.vehicle_type || 'Transport'}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Board 2: Yield & Commercials - Tighter Grid */}
                          <div className="relative group/board">
                            <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                              <div className={`w-5 h-5 rounded-md ${sc.light} flex items-center justify-center`}>
                                <IndianRupee className={`w-2.5 h-2.5 ${sc.text}`} />
                              </div>
                              Financials
                            </h4>
                            <div className="bg-slate-50/40 dark:bg-white/[0.01] rounded-[20px] p-4 border border-slate-100/50 dark:border-white/5 transition-colors">
                              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Volume</p>
                                  <p className="text-[12px] font-black text-slate-800 dark:text-slate-200">{bags} <span className="text-[8px] text-slate-400 ml-1">BAGS</span></p>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 text-right">
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Rate</p>
                                  <p className="text-[12px] font-black text-emerald-500">₹{fmt(rate)}<span className="text-[8px] ml-1">/QT</span></p>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Trader</p>
                                  <p className="text-[12px] font-black text-slate-800 dark:text-slate-200">₹{fmt(traderAmount)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 text-right">
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Labor</p>
                                  <p className="text-[12px] font-black text-slate-800 dark:text-slate-200">₹{fmt(labourAmount)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Compact Timeline Stepper with Stage Dates */}
                        <div className="py-1">
                          <div className="relative flex items-center justify-between">
                            <div className="absolute left-0 right-0 h-0.5 bg-slate-100 dark:bg-white/5 top-1/2 -translate-y-1/2 -z-0" />
                            <div
                              className="absolute left-0 h-0.5 bg-emerald-500 top-1/2 -translate-y-1/2 transition-all duration-700 z-0"
                              style={{ width: `${(stageIdx / (STAGE_FLOW.length - 1)) * 100}%` }}
                            />

                            {STAGE_FLOW.map((s, i) => {
                              const isPast = i < stageIdx;
                              const isCurrent = i === stageIdx;
                              const SIcon = s.icon;
                              const sc_step = STAGE_COLORS[s.color];
                              const stageDate = lot[s.dateKey];

                              return (
                                <div key={s.id} className="relative z-10 flex flex-col items-center">
                                  <button
                                    disabled={isUpdating || isSettled}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStage(lot.id, 'MANUAL_OVERRIDE', s.id);
                                    }}
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isPast || isCurrent
                                      ? `${sc_step.bg} text-white shadow-lg shadow-${s.color}-500/10`
                                      : 'bg-slate-100 dark:bg-white/10 text-slate-300 dark:text-slate-600'
                                      } ${isSettled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                                  >
                                    <SIcon className="w-3 h-3" />
                                  </button>
                                  {/* Stage Date Label */}
                                  <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none text-center">
                                    <p className={`text-[6px] font-black uppercase tracking-tighter ${isCurrent ? sc_step.text : 'text-slate-400'}`}>
                                      {s.short}
                                    </p>
                                    {stageDate && (
                                      <p className="text-[5px] font-bold text-slate-500 tabular-nums">
                                        {new Date(stageDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Visual spacer for dates */}
                          <div className="h-6" />
                        </div>

                        {/* Compact Actions */}
                        <div className="mt-auto pt-2">
                          {!isCompleted ? (
                            <button
                              onClick={() => handleUpdateStage(lot.id, lot.stage)}
                              disabled={isUpdating}
                              className="w-full group h-12 rounded-xl flex items-center justify-center gap-2 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/15 hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-50"
                            >
                              {isUpdating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                              Next Stage
                            </button>
                          ) : lot.stage === 'PAID' ? (
                            <button
                              onClick={() => setSettlingLot(lot)}
                              className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/15"
                            >
                              <BadgeCheck className="w-4 h-4" /> Settle Now
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleUpdateStage(lot.id, lot.stage, 'QUALITY CHECK')}
                                disabled={isUpdating}
                                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all font-black text-[9px] uppercase tracking-widest border border-slate-200 dark:border-white/10"
                              >
                                {isUpdating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                                Reopen Lot
                              </button>
                              <button
                                onClick={() => handlePrintPDF(lot)}
                                className="w-full h-8 flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-500 transition-all font-black text-[8px] uppercase tracking-widest group"
                              >
                                <FileText className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                                <span>Download Report</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ─── Settlement Sheet ─── */}
      <AnimatePresence>
        {settlingLot && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettlingLot(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 bg-white dark:bg-[#0F172A] rounded-t-[40px] z-[101] max-h-[90vh] overflow-y-auto max-w-2xl mx-auto shadow-2xl border-t border-slate-200 dark:border-white/10"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto mt-4 mb-6" />

              <div className="px-6 lg:px-10 pb-12">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">HARVEST 2024</h4>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Lot #{settlingLot.id}</h2>
                    {settlingLot.settled_at && (
                      <div className="flex items-center gap-2 mt-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Settled on {new Date(settlingLot.settled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                      <FileText className="w-6 h-6" />
                    </div>
                    <button
                      onClick={() => setSettlingLot(null)}
                      className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  {/* Settlement Summary Card */}
                  <div className="p-8 rounded-[32px] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 shadow-inner">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Settlement Summary</h3>
                    </div>

                    {(() => {
                      const calc = calculateLotSettlement(settlingLot);
                      return (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-white/5">
                            <span className="text-sm font-bold text-slate-500">Total Gross Amount</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">₹{fmt(calc.grossAmount)}.00</span>
                          </div>

                          <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DEDUCTIONS</p>

                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-500">Moisture Adjustment</span>
                              <span className="font-bold text-rose-500">-₹150.00</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-500">Quality Grade Disc.</span>
                              <span className="font-bold text-rose-500">-₹75.00</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                              <span className="font-bold text-slate-500">Labor & Handling</span>
                              <span className="font-bold text-rose-500">-₹{fmt(calc.labourCost)}.00</span>
                            </div>
                          </div>

                          <div className="pt-6 border-t-2 border-dashed border-slate-200 dark:border-white/10 flex justify-between items-center">
                            <span className="text-lg font-black text-slate-900 dark:text-white">Final Settled Amount</span>
                            <span className="text-2xl font-black text-emerald-500">₹{fmt(calc.netPayout)}.00</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        const now = new Date().toISOString();
                        const settledLotData = { ...settlingLot, stage: 'SETTLED', settled_at: now };
                        await handleUpdateStage(settlingLot.id, 'PAID');
                        setSettlingLot(null);
                      }}
                      className="flex-1 h-16 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Settled Done
                    </button>
                    <button
                      className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center shadow-sm"
                    >
                      <Share2 className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Stage History */}
                  <div className="pt-4">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6">Stage History</h3>
                    <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-white/5">
                      {[
                        { label: 'Settled', date: settlingLot.settled_at || new Date().toISOString(), status: 'completed' },
                        { label: 'Quality Verified', date: new Date(new Date(settlingLot.date).getTime() + 86400000).toISOString(), status: 'completed' },
                        { label: 'Lot Received', date: settlingLot.date, status: 'completed' }
                      ].map((hist, i) => (
                        <div key={i} className="relative pl-10">
                          <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white dark:border-[#0F172A] z-10 ${i === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-white/10'}`} />
                          <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{hist.label}</p>
                            <p className="text-[11px] font-bold text-slate-400 lowercase italic">
                              {new Date(hist.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(hist.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
