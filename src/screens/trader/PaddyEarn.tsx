import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Package, 
  ArrowUpRight, 
  BarChart3, 
  Bell, 
  Search, 
  Clock, 
  MapPin, 
  Sprout, 
  ChevronDown, 
  MoreVertical,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Factory,
  User,
  ShieldCheck,
  X,
  FileText,
  ExternalLink,
  CreditCard,
  Building2,
  Receipt,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

interface LotData {
  id: string;
  label: string;
  date: string;
  variety: string;
  tonnage: string;
  destination: string;
  value: number;
  status: 'COMPLETED' | 'PROCESSING';
}

interface EarningData {
  label: string;
  value: number;
}

interface TraderEarningsSummary {
  revenue: number;
  profit: number;
  years: EarningData[];
  areas: EarningData[];
  varieties: EarningData[];
  mills: EarningData[];
  lots: LotData[];
  totalYears: number;
  activeLots: number;
}

export default function PaddyEarn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<TraderEarningsSummary | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filters, setFilters] = useState({
    year: 'All Seasons',
    status: 'Completed',
    variety: 'All Varieties'
  });

  useEffect(() => {
    fetchEarnings(summary === null);
  }, [filters]);

  const fetchEarnings = async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      const params = new URLSearchParams();
      if (filters.year !== 'All Seasons') params.append('year', filters.year);
      if (filters.variety !== 'All Varieties') params.append('variety', filters.variety);
      if (filters.status !== 'All Status') params.append('status', filters.status);
      
      // Add traderId to fetchEarnings as well, assuming it's relevant for the summary
      const tId = user?.trader_id || user?.id;
      if (tId) params.append('traderId', tId);

      const response = await fetch(`${API_BASE_URL}/trader/earnings-summary?${params.toString()}`);
      if (!response.ok) {
        setSummary(null);
        return;
      }
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching trader earnings:', error);
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const exportToPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    const primaryColor = [21, 128, 61]; // Green-700
    const secondaryColor = [100, 116, 139]; // Slate-500

    // Header - Institutional Branding
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, 210, 60, 'F');
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("PADDY INTELLIGENCE", 14, 25);
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("INSTITUTIONAL SETTLEMENT STATEMENT", 14, 32);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PaddyNexus Enterprise | Strategic Partner Audit", 14, 37);

    // Metadata Right-aligned
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`STATEMENT PERIOD: ${filters.year.toUpperCase()}`, 140, 25);
    doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, 140, 30);
    doc.text(`AUDIT ID: PM-AUD-${Math.floor(Math.random() * 900000 + 100000)}`, 140, 35);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 45, 196, 45);

    // Summary Financials
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SETTLEMENT SUMMARY", 14, 55);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 65, 182, 35, 2, 2, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 65, 182, 35, 2, 2, 'S');

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(8);
    doc.text("TOTAL NET REVENUE", 25, 75);
    doc.text("SETTLED ITEMS", 85, 75);
    doc.text("AUDIT STATUS", 145, 75);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`INR ${summary.profit.toLocaleString()}`, 25, 85);
    doc.text(`${summary.activeLots} RECORDS`, 85, 85);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("VERIFIED", 145, 85);

    // Transaction Ledger
    autoTable(doc, {
      startY: 110,
      head: [['DATE', 'LOT IDENTIFIER', 'VARIETY', 'TONNAGE', 'HUB / DESTINATION', 'SETTLEMENT']],
      body: summary.lots.map(l => [
        l.date,
        l.label,
        l.variety,
        l.tonnage,
        l.destination,
        `+ ₹${l.value.toLocaleString()}`
      ]),
      headStyles: { 
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'left',
        cellPadding: 5
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85],
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] }
      },
      margin: { top: 110 },
      didDrawPage: (data) => {
        // Footer on every page
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`CONFIDENTIAL - PaddyNexus Intelligence Report - Page ${data.pageNumber}`, 14, 285);
        doc.text("This is a computer-generated institutional statement and does not require a physical signature.", 110, 285);
      }
    });

    doc.save(`Paddy_Settlement_Statement_${filters.year}_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowPreview(false);
  };

  const revenueDistribution = useMemo(() => {
    if (!summary || !summary.mills || !summary.mills.length) return [];
    const total = summary.mills.reduce((acc, m) => acc + (m.value || 0), 0);
    if (total === 0) return [];

    return summary.mills.map(m => ({
      ...m,
      percentage: Math.round((m.value / total) * 100)
    })).sort((a, b) => b.value - a.value).slice(0, 3);
  }, [summary]);

  if (loading || !summary) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-[#020617] font-display">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white"
        >
          <Sprout className="w-6 h-6" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#f8fafc] dark:bg-[#020617] font-display flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
      
      {/* Fixed Sticky Header */}
      <header className="flex-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-2 md:gap-3">
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Paddy Intelligence</span>
              <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">Enterprise Earnings & Season Analytics</p>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
             <div className="flex flex-1 md:flex-none items-center p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 ml-2 md:ml-3" />
                <select 
                  value={filters.year}
                  onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                  className="appearance-none bg-transparent border-none rounded-xl px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-200 outline-none uppercase tracking-widest cursor-pointer"
                >
                   <option className="bg-white dark:bg-slate-900">All Seasons</option>
                   {summary.years.map(y => <option key={y.label} className="bg-white dark:bg-slate-900">{y.label}</option>)}
                </select>
                <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 mr-2 md:mr-3 pointer-events-none" />
             </div>

             <div className="flex flex-1 md:flex-none items-center p-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 ml-2 md:ml-3" />
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="appearance-none bg-transparent border-none rounded-xl px-2 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs font-black text-slate-700 dark:text-slate-200 outline-none uppercase tracking-widest cursor-pointer"
                >
                   <option className="bg-white dark:bg-slate-900" value="Completed">Settled only</option>
                   <option className="bg-white dark:bg-slate-900" value="All Status">All Archive</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400 mr-2 md:mr-3 pointer-events-none" />
             </div>
             <button 
                onClick={() => setShowPreview(true)}
                disabled={!summary || summary.activeLots === 0}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-slate-900 dark:bg-green-600 text-white font-black rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-green-600 dark:hover:bg-green-500 transition-all shadow-xl shadow-slate-900/10 ${
                  (!summary || summary.activeLots === 0) ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                 <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                 <span className="hidden sm:inline">Audit Preview</span>
                 <span className="sm:hidden">Audit</span>
              </button>
          </div>
        </div>
      </header>

      {/* Scrollable Content Area */}
      <div className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth px-6 lg:px-10 pb-32 lg:pb-10 transition-opacity duration-300 ${refreshing ? 'opacity-40' : 'opacity-100'}`}>
        <div className="max-w-[1400px] mx-auto space-y-8 pt-8">
          
          {/* KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
             <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl md:rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col group hover:border-blue-200 dark:hover:border-blue-900 transition-all relative overflow-hidden">
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                   <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                   </div>
                   <p className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Total Profit</p>
                </div>
                
                <div className="space-y-1 md:space-y-2">
                   <p className="text-[10px] md:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 leading-none">Net Realized Value</p>
                   <p className="text-4xl md:text-6xl font-[1000] text-slate-900 dark:text-white tracking-tighter italic">
                     {summary.profit >= 100000 ? `₹${(summary.profit / 100000).toFixed(2)}L` : `₹${summary.profit.toLocaleString()}`}
                   </p>
                   <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
                      <span className="text-[11px] md:text-xs font-bold text-green-500">+8.4%</span>
                   </div>
                </div>
                
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 blur-2xl md:blur-3xl opacity-50" />
             </div>

             <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl md:rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-green-200 dark:hover:border-green-900 transition-all relative overflow-hidden">
                <div className="relative z-10">
                   <p className="text-[11px] md:text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 md:mb-2 uppercase tracking-[0.2em]">Settled Items</p>
                   <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{summary.activeLots}</p>
                   <div className="flex items-center gap-1.5 mt-3 md:mt-4">
                      <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                      <p className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Audited Records</p>
                   </div>
                </div>
                <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-[32px] border border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600 relative z-10">
                   <Package className="w-6 h-6 md:w-7 md:h-7" />
                </div>
             </div>
          </div>

          {/* Charts Row - Wave and Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
             
             {/* Performance Analytics - Wave Chart */}
             <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl md:rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
                   <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Performance Analytics</h2>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Top Lots vs Previous Season</p>
                   </div>
                   <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[8px] md:text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                      <Filter className="w-3 h-3" /> <span className="hidden sm:inline">Weekly</span>
                   </div>
                </div>

                <div className="flex-1 h-64 w-full relative group">
                   <svg viewBox="0 0 800 300" className="w-full h-full preserve-3d">
                      <defs>
                        <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <line x1="0" y1="50" x2="800" y2="50" stroke="currentColor" className="text-slate-50 dark:text-slate-800/50" strokeWidth="1" />
                      <line x1="0" y1="150" x2="800" y2="150" stroke="currentColor" className="text-slate-50 dark:text-slate-800/50" strokeWidth="1" />
                      <line x1="0" y1="250" x2="800" y2="250" stroke="currentColor" className="text-slate-50 dark:text-slate-800/50" strokeWidth="1" />
                      
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2 }}
                        d="M 0 200 C 100 180, 200 230, 300 210 C 400 190, 500 240, 600 220 C 700 200, 800 230, 850 210"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray="8 6"
                        className="opacity-60"
                      />

                      <motion.path
                        initial={{ d: "M 0 300 Q 400 300 800 300 L 800 300 L 0 300 Z" }}
                        animate={{ d: "M 0 180 C 100 140, 250 220, 400 130 C 550 40, 700 280, 800 50 L 800 300 L 0 300 Z" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        fill="url(#waveGradient)"
                      />
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                        d="M 0 180 C 100 140, 250 220, 400 130 C 550 40, 700 280, 800 50"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />

                      <motion.circle
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 2 }}
                        cx="600" cy="115" r="6"
                        fill="#6366f1"
                        stroke="white"
                        strokeWidth="3"
                        className="shadow-xl"
                      />
                   </svg>
                   
                   <div className="absolute top-10 right-20 bg-slate-900 text-white p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 duration-300">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">#AK-0982</p>
                      <p className="text-sm font-black italic mt-1">$ 2,840</p>
                   </div>
                </div>

                <div className="flex items-center justify-between mt-8 border-t border-slate-50 dark:border-slate-800 pt-8">
                   <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 bg-[#6366f1] rounded-full" />
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Current Season</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 bg-[#10b981] rounded-full" />
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Previous Avg</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg">
                      <Info className="w-3 h-3 text-orange-500" />
                      <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400">Projected growth +18%</span>
                   </div>
                </div>
             </div>

             {/* Revenue Distribution - Donut Chart */}
             <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl md:rounded-[48px] shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 md:mb-10 relative z-10">
                   <div>
                      <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tighter">Revenue Distribution</h2>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Monthly processing breakdown</p>
                   </div>
                   <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-[8px] md:text-[9px] font-black text-slate-500 uppercase">
                      <span className="hidden sm:inline">This Month</span> <ChevronDown className="w-3 h-3" />
                   </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative">
                   <div className="relative w-48 h-48">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                         {/* Circle segments */}
                         <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f9ff" strokeWidth="12" className="dark:stroke-slate-800" />
                         <motion.circle 
                            cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12" 
                            strokeDasharray="251.2" 
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 * (1 - (revenueDistribution[0]?.percentage || 0) / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeLinecap="round"
                         />
                         <motion.circle 
                            cx="50" cy="50" r="40" fill="none" stroke="#4ade80" strokeWidth="12" 
                            strokeDasharray="251.2" 
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 * (1 - (revenueDistribution[1]?.percentage || 0) / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                            style={{ rotate: `${(revenueDistribution[0]?.percentage || 0) * 3.6}deg`, transformOrigin: '50% 50%' }}
                            strokeLinecap="round"
                         />
                         <motion.circle 
                            cx="50" cy="50" r="40" fill="none" stroke="#d1fae5" strokeWidth="12" 
                            strokeDasharray="251.2" 
                            initial={{ strokeDashoffset: 251.2 }}
                            animate={{ strokeDashoffset: 251.2 * (1 - (revenueDistribution[2]?.percentage || 0) / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                            style={{ rotate: `${((revenueDistribution[0]?.percentage || 0) + (revenueDistribution[1]?.percentage || 0)) * 3.6}deg`, transformOrigin: '50% 50%' }}
                            strokeLinecap="round"
                         />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">TOTAL MILLS</span>
                         <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">03</span>
                      </div>
                   </div>

                   <div className="w-full space-y-3 mt-10">
                      {revenueDistribution.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all border border-transparent hover:border-green-100">
                           <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-green-400' : 'bg-green-200'}`} />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{m.label}</span>
                           </div>
                           <span className="text-[11px] font-black text-slate-900 dark:text-white">{m.percentage}%</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-50 dark:bg-green-900/10 rounded-full -mr-32 -mb-32 blur-3xl opacity-30" />
             </div>
          </div>

          {/* Recent Records Grid Section */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
             {/* Recent Lot Section */}
             <div className="lg:col-span-5 space-y-8">
                <div className="flex items-center justify-between px-4">
                   <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Recent Lot</h2>
                   <button className="text-[10px] font-black text-green-500 dark:text-green-400 uppercase tracking-widest hover:underline decoration-2 underline-offset-4 transition-all">Audit Vault</button>
                </div>
                              <div className="space-y-4">
                   {summary.lots.slice(0, 5).map((lot, idx) => (
                     <div key={idx} className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl md:rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-green-200 dark:hover:border-green-900 hover:shadow-xl hover:shadow-green-500/5 transition-all cursor-pointer group relative overflow-hidden">
                        <div className="flex items-center gap-3 md:gap-5 relative z-10">
                           <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-[20px] flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm ${
                             lot.status === 'PROCESSING' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' : 'bg-green-50 dark:bg-green-900/20 text-green-500'
                           }`}>
                              {lot.status === 'PROCESSING' ? <Clock className="w-6 h-6 md:w-7 md:h-7" /> : <Sprout className="w-6 h-6 md:w-7 md:h-7" />}
                           </div>
                           <div>
                              <h3 className="text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight">{lot.variety}</h3>
                              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">{lot.label}</p>
                           </div>
                        </div>
                        <div className="text-right relative z-10">
                           <p className="text-[13px] font-black text-slate-900 dark:text-white">₹{lot.value.toLocaleString()}</p>
                           <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg mt-2 inline-block ${
                             lot.status === 'PROCESSING' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' : 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                           }`}>
                              {lot.status === 'COMPLETED' ? 'SETTLED' : lot.status}
                           </span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Matrix Breakdown */}
             <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl md:rounded-[56px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden h-full">
                <div className="p-6 md:p-10 border-b border-slate-50 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
                   <div>
                      <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Earnings Breakdown Matrix</h2>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">Granular multi-pivot audit of seasonal lot performance</p>
                   </div>
                </div>

                <div className="overflow-x-auto px-4 md:px-6 pb-4 md:pb-6 no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[8px] md:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] bg-slate-50/50 dark:bg-slate-800/30">
                            <th className="px-4 md:px-8 py-5 md:py-8 first:rounded-l-2xl md:first:rounded-l-3xl">Lot</th>
                            <th className="px-3 md:px-6 py-5 md:py-8 text-center text-green-500">ROI</th>
                            <th className="hidden sm:table-cell px-6 py-8">Variety</th>
                            <th className="px-4 md:px-6 py-5 md:py-8 text-right">Revenue</th>
                            <th className="px-4 md:px-8 py-5 md:py-8 last:rounded-r-2xl md:last:rounded-r-3xl text-center"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                         {summary.lots.slice(0, 6).map((lot, i) => (
                           <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-all group">
                              <td className="px-4 md:px-8 py-5 md:py-8">
                                 <span className="text-[10px] md:text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight">{lot.label}</span>
                                 <p className="text-[7px] md:text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase leading-none mt-1 md:mt-1.5">{lot.date}</p>
                              </td>
                              <td className="px-3 md:px-6 py-5 md:py-8 text-center">
                                 <span className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[7px] md:text-[8px] font-black uppercase tracking-widest ${
                                   lot.status === 'COMPLETED' ? 'bg-green-500 text-white shadow-lg' : 'bg-orange-500 text-white shadow-lg'
                                 }`}>
                                    {lot.status === 'COMPLETED' ? 'Settled' : 'Active'}
                                 </span>
                              </td>
                              <td className="hidden sm:table-cell px-6 py-8">
                                 <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{lot.variety}</span>
                              </td>
                              <td className="px-4 md:px-6 py-5 md:py-8 text-right font-black text-slate-900 dark:text-slate-100 text-[11px] md:text-sm">
                                 ₹{lot.value.toLocaleString()}
                              </td>
                              <td className="px-4 md:px-8 py-5 md:py-8 text-center text-slate-300">
                                 <MoreVertical className="w-3 h-3 md:w-4 md:h-4 mx-auto" />
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowPreview(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-5xl bg-[#fcfdfe] dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
             >
                <div className="flex flex-col h-[90vh]">
                   {/* Modal Header */}
                   <div className="p-4 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/50">
                      <div className="flex items-center gap-3 md:gap-4">
                         <div className="p-2 md:p-3 bg-slate-900 dark:bg-green-600 rounded-xl md:rounded-2xl text-white">
                            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                         </div>
                         <div>
                            <h2 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Intelligence Audit Preview</h2>
                            <p className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Ref: PM-AUD-2024-{filters.year.replace(/\D/g,'')}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setShowPreview(false)}
                        className="p-2 md:p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl md:rounded-2xl text-slate-400 transition-colors"
                      >
                         <X className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                   </div>

                   {/* Statement Content */}
                   <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 no-scrollbar">
                      
                      {/* Institutional Entity Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20">
                         <div className="space-y-6">
                            <div>
                               <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Statement For</label>
                               <p className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Paddy Intelligence Enterprise</p>
                               <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                  Strategic Commercial Partner ID: PM-TR-99421<br />
                                  Authorized Audit Region: South Karnataka Hub
                               </p>
                            </div>
                            <div className="flex gap-6 md:gap-10">
                               <div>
                                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Period</label>
                                  <span className="px-2 md:px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] md:text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase">{filters.year}</span>
                               </div>
                               <div>
                                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Status</label>
                                  <span className="px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-[9px] md:text-[10px] font-black uppercase">Verified</span>
                               </div>
                            </div>
                         </div>
                         <div className="md:text-right space-y-4 md:space-y-6">
                            <div>
                               <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">Net Seasonal ROI</label>
                               <p className="text-3xl md:text-4xl font-black text-green-600 dark:text-green-400 mt-1">₹{summary.profit.toLocaleString()}</p>
                               <p className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{summary.activeLots} Total Records Audited</p>
                            </div>
                            <div className="flex justify-end gap-3">
                               <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                                  <CreditCard className="w-5 h-5 text-slate-400" />
                               </div>
                               <div className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                                  <Receipt className="w-5 h-5 text-slate-400" />
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Professional Statement Table */}
                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-2">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Transaction Summary Ledger</label>
                            <span className="text-[9px] font-bold text-slate-400 italic">Values expressed in Indian Rupees (INR)</span>
                         </div>
                         <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left">
                               <thead>
                                  <tr className="bg-slate-900 dark:bg-black text-[8px] md:text-[9px] font-black text-white/60 uppercase tracking-[0.15em]">
                                     <th className="px-4 md:px-8 py-3 md:py-5">Date</th>
                                     <th className="px-4 md:px-6 py-3 md:py-5">Lot ID</th>
                                     <th className="hidden sm:table-cell px-6 py-5">Hub</th>
                                     <th className="hidden sm:table-cell px-6 py-5 text-center">Tonnage</th>
                                     <th className="px-4 md:px-8 py-3 md:py-5 text-right font-bold">Value</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {summary.lots.map((l, idx) => (
                                    <tr key={idx} className="text-[9px] md:text-[11px] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                       <td className="px-4 md:px-8 py-3 md:py-5 font-bold text-slate-400 uppercase">{l.date}</td>
                                       <td className="px-4 md:px-6 py-3 md:py-5 font-black text-slate-900 dark:text-slate-200">{l.label}</td>
                                       <td className="hidden sm:table-cell px-6 py-5">
                                          <div className="flex flex-col">
                                             <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">{l.variety}</span>
                                             <span className="text-[9px] text-slate-400 uppercase italic mt-0.5">{l.destination}</span>
                                          </div>
                                       </td>
                                       <td className="hidden sm:table-cell px-6 py-5 text-center font-bold">{l.tonnage}</td>
                                       <td className="px-4 md:px-8 py-3 md:py-5 text-right font-black text-green-600 dark:text-green-400">₹{l.value.toLocaleString()}</td>
                                    </tr>
                                  ))}
                               </tbody>
                               <tfoot>
                                  <tr className="bg-slate-50 dark:bg-slate-800/30">
                                     <td colSpan={4} className="px-8 py-6 text-[10px] font-black text-slate-900 dark:text-white uppercase text-right">Aggregated Seasonal Balance</td>
                                     <td className="px-8 py-6 text-right text-lg font-black text-green-600 dark:text-green-400">₹{summary.profit.toLocaleString()}</td>
                                  </tr>
                               </tfoot>
                            </table>
                         </div>
                      </div>

                      {/* Disclosure/Verification Footer */}
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-800">
                         <div className="flex items-start gap-4">
                            <ShieldCheck className="w-5 h-5 text-green-600 mt-1 flex-none" />
                            <div>
                               <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Institutional Audit Clearance</p>
                               <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-tight">
                                  This performance statement is a consolidated record of settled agricultural lots for the specified period. All tonnage values and HUB destination metadata have been verified against PaddyNexus Strategic Logistics Protocol. Settlement values represent net ROI after operational adjustments.
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Modal Actions */}
                   <div className="p-4 md:p-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-900 gap-4">
                      <div className="flex items-center gap-3 py-2 md:py-3 px-4 md:px-5 bg-green-50 dark:bg-green-900/20 rounded-xl md:rounded-2xl border border-green-100 dark:border-green-900/30">
                         <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                         <span className="text-[9px] md:text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Digital Audit Hash Verified</span>
                      </div>
                      <div className="flex items-center justify-end gap-2 md:gap-4">
                         <button 
                           onClick={() => setShowPreview(false)}
                           className="px-4 md:px-8 py-3 md:py-4 text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                         >
                            Back
                         </button>
                         <button 
                           onClick={exportToPDF}
                           className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 bg-green-600 text-white font-black rounded-xl md:rounded-2xl text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 md:gap-3"
                         >
                            <Download className="w-4 h-4" />
                            Download PDF
                         </button>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
