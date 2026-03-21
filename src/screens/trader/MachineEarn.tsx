import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tractor, 
  Sprout, 
  TrendingUp, 
  Package, 
  ArrowUpRight, 
  BarChart3, 
  Bell, 
  Search, 
  FileText, 
  ChevronDown, 
  Filter,
  CheckCircle2,
  Zap,
  Sun,
  Sunrise,
  Waves,
  User,
  Download,
  ShieldCheck,
  X,
  ExternalLink,
  Clock,
  MapPin,
  Building2,
  Receipt,
  CreditCard,
  RotateCcw,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

interface MachineSummary {
  totalRevenue: string;
  operatingExpenses: string;
  netProfit: string;
  machineTypes: string[];
  highlights: any[];
  fleet: any[];
}

export default function MachineEarn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<MachineSummary | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [timeFilter, setTimeFilter] = useState('Month');
  const [machineTypeFilter, setMachineTypeFilter] = useState('All Machine Entities');

  // Re-deployment state
  const [selectedMachine, setSelectedMachine] = useState<any | null>(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [deploymentForm, setDeploymentForm] = useState({
    operatorName: '',
    hub: '',
    initialHours: '0',
    notes: ''
  });

  useEffect(() => {
    fetchMachineSummary(summary === null);
  }, [timeFilter, user]); // Added user to dependency array

  const fetchMachineSummary = async (isInitial: boolean) => {
    try {
      if (isInitial) setLoading(true);
      else setRefreshing(true);
      
      let url = `${API_BASE_URL}/trader/machine-summary?filter=${timeFilter}`;
      if (user?.id) {
        url += `&traderId=${user.id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Error fetching machine summary:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReopen = (machine: any) => {
    setSelectedMachine(machine);
    setDeploymentForm({
      operatorName: machine.operatorName || '',
      hub: '',
      initialHours: '0',
      notes: ''
    });
    setShowDeployModal(true);
  };

  const handleCommitEntry = () => {
    setShowDeployModal(false);
    setShowCommitDialog(true);
  };

  const finalizeDeployment = () => {
    // In a real app, this would hit an API
    setShowCommitDialog(false);
    setSelectedMachine(null);
    fetchMachineSummary(false); // Refresh data
  };

  const exportToPDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    const primaryColor = [249, 115, 22]; // Orange-500
    const secondaryColor = [71, 85, 105]; // Slate-600

    // Header - Institutional Branding
    doc.setFillColor(255, 247, 237); // orange-50
    doc.rect(0, 0, 210, 60, 'F');
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("MACHINE INTELLIGENCE", 14, 25);
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FLEET PERFORMANCE & SETTLEMENT AUDIT", 14, 32);

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PaddyNexus Enterprise | Strategic Fleet Partner Audit", 14, 37);

    // Metadata Right-aligned
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.text(`AUDIT PERIOD: ${timeFilter.toUpperCase()}`, 140, 25);
    doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, 140, 30);
    doc.text(`AUDIT ID: PM-MAC-${Math.floor(Math.random() * 900000 + 100000)}`, 140, 35);

    // Divider
    doc.setDrawColor(253, 186, 116); // orange-300
    doc.line(14, 45, 196, 45);

    // Summary Financials
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("FINANCIAL PERFORMANCE SUMMARY", 14, 55);

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 65, 182, 35, 2, 2, 'F');
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 65, 182, 35, 2, 2, 'S');

    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(8);
    doc.text("TOTAL NET REVENUE", 25, 75);
    doc.text("OPERATING COSTS", 85, 75);
    doc.text("NET PROFIT", 145, 75);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(summary.totalRevenue, 25, 85);
    doc.text(summary.operatingExpenses, 85, 85);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(summary.netProfit, 145, 85);

    // Fleet performance Table
    autoTable(doc, {
      startY: 110,
      head: [['MACHINE NAME', 'CONFIGURATION', 'OPERATOR', 'RUNTIME', 'EFFICIENCY', 'SETTLEMENT']],
      body: filteredFleet.map(m => [
        m.name.toUpperCase(),
        m.type.toUpperCase(),
        m.operatorName.toUpperCase(),
        m.hours,
        m.efficiency,
        m.revenue
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
        fillColor: [255, 247, 237] // orange-50
      },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold', textColor: [249, 115, 22] }
      },
      margin: { top: 110 },
      didDrawPage: (data) => {
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`CONFIDENTIAL - PaddyNexus Machine Intelligence Audit - Page ${data.pageNumber}`, 14, 285);
        doc.text("Note: Revenue values represent net payout potency for the reported period.", 130, 285);
      }
    });

    doc.save(`Machine_Intelligence_Audit_${timeFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowPreview(false);
  };

  if (loading || !summary) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#fffbeb] dark:bg-[#020617] font-display">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-orange-500"
        >
          <Sun className="w-16 h-16 fill-orange-500/20" />
        </motion.div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Revenue', value: summary.totalRevenue, growth: '12%', up: true, theme: 'amber', icon: Sunrise },
    { label: 'Operating Expenses', value: summary.operatingExpenses, growth: '5%', up: false, theme: 'rose', icon: Waves },
    { label: 'Net Profit', value: summary.netProfit, growth: '15%', up: true, theme: 'orange', icon: Sun },
  ];

  const filteredFleet = (machineTypeFilter === 'All Machine Entities' 
    ? summary.fleet 
    : summary.fleet.filter(m => m.type === machineTypeFilter)
  ).filter(m => m.is_settled === 1);

  return (
    <div className="h-screen w-full bg-[#fffcf5] dark:bg-[#020617] font-display flex flex-col overflow-hidden">
      
      {/* Fixed Sticky Header */}
      <header className="flex-none bg-[#fffcf5]/80 dark:bg-slate-900/80 backdrop-blur-xl z-50 border-b border-orange-100/50 dark:border-slate-800 sticky top-0">
        <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-10 py-4 md:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
          <div className="space-y-0.5 md:space-y-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-2 md:gap-3">
              <span className="bg-gradient-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">Machine Intelligence</span>
              <ShieldCheck className="w-5 h-5 md:w-8 md:h-8 text-orange-500" />
            </h1>
            <p className="text-[8px] md:text-xs font-bold text-slate-400 dark:text-slate-500 tracking-[0.15em] md:tracking-[0.2em] uppercase">Enterprise Fleet Performance & Sunrise Analytics</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
             <div className="flex items-center p-1 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl border border-orange-100 dark:border-slate-700 shadow-sm overflow-x-auto no-scrollbar">
                {['Today', 'Week', 'Month', 'Year'].map((f) => (
                  <button 
                    key={f}
                    onClick={() => setTimeFilter(f)}
                    className={`flex-1 sm:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
                      timeFilter === f ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-orange-500'
                    }`}
                  >
                    {f}
                  </button>
                ))}
             </div>
             <button 
              onClick={() => setShowPreview(true)}
              className="flex items-center justify-center gap-2 px-5 md:px-6 py-3 md:py-3.5 bg-slate-900 dark:bg-orange-600 text-white font-black rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20"
             >
                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Audit Preview
             </button>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className={`flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32 lg:pb-10 transition-opacity duration-300 ${refreshing ? 'opacity-40' : 'opacity-100'}`}>
        <div className="max-w-[1600px] mx-auto p-6 lg:p-10 pt-4 space-y-10">
          

          {/* KPI Cards Row - Sunrise Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
             {kpis.map((s, i) => (
               <div key={i} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm border border-orange-50 dark:border-slate-800 relative overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500">
                  <div className="relative z-10">
                     <div className="flex items-center justify-between mb-6 md:mb-10">
                        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${
                          s.theme === 'amber' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' : 
                          s.theme === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 
                          'bg-orange-50 dark:bg-orange-900/20 text-orange-500'
                        }`}>
                           <s.icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-black ${s.up ? 'bg-orange-500/10 text-orange-600' : 'bg-rose-500/10 text-rose-600'}`}>
                           {s.up ? '↑' : '↓'} {s.growth}
                        </div>
                     </div>
                     <p className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2">{s.label}</p>
                     <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{s.value}</p>
                  </div>
                  <div className={`absolute right-0 bottom-0 w-32 h-32 md:w-48 md:h-48 opacity-10 rounded-full -mr-16 md:-mr-20 -mb-16 md:-mb-20 blur-2xl md:blur-3xl ${
                    s.theme === 'amber' ? 'bg-amber-500' : 
                    s.theme === 'rose' ? 'bg-rose-500' : 
                    'bg-orange-500'
                  }`} />
               </div>
             ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
             {/* Performance Trends - Area Chart Upgrade */}
             <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[32px] md:rounded-[48px] shadow-sm border border-orange-50 dark:border-slate-800 flex flex-col relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 md:mb-12 relative z-10 gap-4">
                   <div>
                      <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">Revenue Dynamics</h2>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Real-time earnings flow visualization</p>
                   </div>
                   <div className="flex items-center gap-4 md:gap-6">
                      <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
                         <span className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Actual</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                         <span className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Projection</span>
                      </div>
                   </div>
                </div>

                <div className="h-72 w-full relative group">
                   <svg viewBox="0 0 800 300" className="w-full h-full preserve-3d">
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      {[0, 1, 2, 3].map(i => (
                        <line key={i} x1="0" y1={i * 100} x2="800" y2={i * 100} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="1" />
                      ))}
                      
                      {/* Area */}
                      <motion.path
                        initial={{ d: "M 0 300 L 0 300 L 160 300 L 320 300 L 480 300 L 640 300 L 800 300 L 800 300 Z" }}
                        animate={{ d: "M 0 300 L 0 180 L 160 120 L 320 200 L 480 80 L 640 40 L 800 220 L 800 300 Z" }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        fill="url(#areaGradient)"
                      />
                      
                      {/* Main Line */}
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                        d="M 0 180 L 160 120 L 320 200 L 480 80 L 640 40 L 800 220"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Data Points */}
                      {[
                        {x: 0, y: 180}, {x: 160, y: 120}, {x: 320, y: 200}, 
                        {x: 480, y: 80}, {x: 640, y: 40}, {x: 800, y: 220}
                      ].map((p, i) => (
                        <motion.circle
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1.5 + (i * 0.1) }}
                          cx={p.x} cy={p.y} r="6"
                          fill="white"
                          stroke="#f97316"
                          strokeWidth="3"
                        />
                      ))}
                   </svg>
                   
                   {/* X-Axis Labels */}
                   <div className="absolute bottom-0 w-full flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pt-4">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                   </div>
                </div>
             </div>
             {/* Top Performers - Deep Sunset Sidebar */}
             <div className="lg:col-span-4 bg-gradient-to-br from-orange-600 via-orange-700 to-rose-700 p-6 md:p-8 rounded-[32px] md:rounded-[48px] shadow-2xl flex flex-col text-white relative overflow-hidden">
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-8 md:mb-10">
                      <h2 className="text-base md:text-lg font-black tracking-tight uppercase">Top Performers</h2>
                      <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                        <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-200" />
                      </div>
                   </div>
 
                   <div className="space-y-4 md:space-y-5 flex-1">
                      {summary.highlights.map((h, i) => (
                        <div key={i} className="p-4 md:p-6 rounded-[24px] md:rounded-[32px] bg-white/10 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all flex items-center justify-between group cursor-pointer backdrop-blur-md">
                           <div className="flex items-center gap-4 md:gap-5">
                              <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white text-orange-600 flex items-center justify-center shadow-xl shadow-black/20 group-hover:rotate-12 transition-transform border border-orange-100 flex-shrink-0">
                                 <Tractor className="w-5 h-5 md:w-7 md:h-7" />
                              </div>
                              <div className="min-w-0">
                                 <h3 className="text-[12px] md:text-sm font-black uppercase tracking-tight truncate">{h.id}</h3>
                                 <div className="flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-1">
                                    <span className="text-[9px] md:text-[10px] font-bold text-orange-200 uppercase tracking-wider truncate max-w-[80px] md:max-w-none">{h.operatorName}</span>
                                    <span className="w-0.5 h-0.5 md:w-1 md:h-1 bg-white/40 rounded-full" />
                                    <span className="text-[9px] md:text-[10px] font-black text-white">{h.revenue}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full -mr-24 md:-mr-32 -mt-24 md:-mt-32 blur-3xl opacity-40" />
                <div className="absolute bottom-0 left-0 w-48 h-48 md:w-64 md:h-64 bg-orange-400/20 rounded-full -ml-24 md:-ml-32 -mb-24 md:-mb-32 blur-3xl opacity-30" />
             </div>
          </div>

          {/* Fleet performance table */}
          <section className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[56px] shadow-sm border border-orange-50 dark:border-slate-800 overflow-hidden">
             <div className="p-6 md:p-10 border-b border-orange-50 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
                <div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic text-center lg:text-left">Fleet Intelligence Matrix</h2>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1 text-center lg:text-left">Granular machine performance records</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 md:gap-6">
                   <div className="relative flex-1 lg:min-w-[240px]">
                      <select 
                        value={machineTypeFilter}
                        onChange={(e) => setMachineTypeFilter(e.target.value)}
                        className="appearance-none w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-3.5 text-[10px] md:text-xs font-black text-slate-600 dark:text-slate-200 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
                      >
                         <option className="bg-white dark:bg-slate-900">All Machine Entities</option>
                         {summary.machineTypes.map(type => (
                           <option key={type} className="bg-white dark:bg-slate-900" value={type}>{type}</option>
                         ))}
                      </select>
                      <ChevronDown className="absolute right-5 md:right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 pointer-events-none" />
                   </div>
                   <button 
                    onClick={() => setShowPreview(true)}
                    className="flex items-center justify-center gap-2 md:gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-slate-900 dark:bg-orange-600 text-white font-black rounded-xl md:rounded-[24px] text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-slate-900/10"
                   >
                      <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      Generate Audit
                   </button>
                </div>
             </div>

             <div className="px-4 md:px-6 pb-6 lg:pb-10">
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] bg-[#fffcf5] dark:bg-slate-800/30">
                            <th className="px-10 py-8 first:rounded-l-3xl">Machine Entity</th>
                            <th className="px-8 py-8">Configuration</th>
                            <th className="px-8 py-8 text-center">Runtime</th>
                            <th className="px-8 py-8 text-center">Area Covered</th>
                            <th className="px-8 py-8">Operator</th>
                            <th className="px-8 py-8 text-right">Earning Potency</th>
                            <th className="px-8 py-8 text-center">Yield %</th>
                            <th className="px-8 py-8 text-center">Status</th>
                            <th className="px-10 py-8 last:rounded-r-3xl text-right">Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-50/50 dark:divide-slate-800 text-slate-600 dark:text-slate-400">
                         {filteredFleet.map((m, i) => (
                           <tr key={i} className="hover:bg-orange-50/30 dark:hover:bg-slate-800/50 transition-all group">
                              <td className="px-10 py-8">
                                 <span className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight">{m.name}</span>
                                 <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase italic leading-none mt-1">{m.id}</p>
                              </td>
                              <td className="px-8 py-8 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{m.type}</td>
                              <td className="px-8 py-8 text-xs font-black text-slate-900 dark:text-white text-center">{m.hours}</td>
                              <td className="px-8 py-8 text-xs font-black text-slate-900 dark:text-white text-center">
                                 <span className="text-orange-600 dark:text-orange-400">{m.acres}</span>
                              </td>
                              <td className="px-8 py-10 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">{m.operatorName}</td>
                              <td className="px-8 py-8 text-xs font-black text-emerald-600 dark:text-emerald-400 text-right">{m.revenue}</td>
                              <td className="px-8 py-8 text-center">
                                 <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-black">{m.efficiency}</span>
                              </td>
                              <td className="px-8 py-8 text-center">
                                 <div className="flex flex-col items-center gap-1">
                                    <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest leading-none ${
                                      m.is_settled === 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                                    }`}>
                                       {m.is_settled === 1 ? 'SETTLED' : 'ACTIVE'}
                                    </span>
                                    {m.is_settled === 1 && m.settled_at && (
                                       <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                          {new Date(m.settled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                       </span>
                                    )}
                                 </div>
                              </td>
                              <td className="px-10 py-8 text-right">
                                 {m.status === 'Active' && (
                                   <button 
                                     onClick={() => handleReopen(m)}
                                     className="p-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-orange-500 transition-all group-hover:scale-110 shadow-lg"
                                     title="Reopen for New Deployment"
                                   >
                                      <RotateCcw className="w-4 h-4" />
                                   </button>
                                 )}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 pt-4">
                   {filteredFleet.map((m, i) => (
                     <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[24px] border border-orange-100/50 dark:border-slate-800 space-y-4">
                        <div className="flex items-start justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-orange-500 shadow-sm border border-orange-50 dark:border-slate-600">
                                 <Tractor className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                 <h3 className="text-[12px] font-[1000] text-slate-900 dark:text-white uppercase tracking-tight truncate">{m.name}</h3>
                                 <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{m.id}</p>
                              </div>
                           </div>
                           <div className="flex flex-col items-end gap-1.5">
                              <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                m.is_settled === 1 ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                              }`}>
                                 {m.is_settled === 1 ? 'SETTLED' : 'ACTIVE'}
                              </span>
                              {m.is_settled === 1 && m.settled_at && (
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                    {new Date(m.settled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                 </span>
                              )}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-orange-100/30 dark:border-slate-700">
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Operator</p>
                              <div className="flex items-center gap-1.5">
                                 <User className="w-3 h-3 text-slate-300" />
                                 <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase truncate">{m.operatorName}</p>
                              </div>
                           </div>
                           <div className="space-y-1 text-right">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Earning Potency</p>
                              <p className="text-[12px] font-[1000] text-emerald-600 dark:text-emerald-400">{m.revenue}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Performance</p>
                              <div className="flex items-center gap-2">
                                 <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-300" />
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white">{m.hours}h</span>
                                 </div>
                                 <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-300" />
                                    <span className="text-[10px] font-black text-orange-600 dark:text-orange-400">{m.acres} Ac</span>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-1 text-right">
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                              <span className="inline-block bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg text-[9px] font-black border border-orange-50 dark:border-slate-600">{m.efficiency}</span>
                           </div>
                        </div>

                        {m.status === 'Active' && (
                           <div className="pt-2">
                              <button 
                                onClick={() => handleReopen(m)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                              >
                                 <RotateCcw className="w-3.5 h-3.5" />
                                 Reopen for Deployment
                              </button>
                           </div>
                        )}
                     </div>
                   ))}
                </div>
             </div>
          </section>

        </div>
      </div>

      {/* New Deployment Entry Modal */}
      <AnimatePresence>
        {showDeployModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
               onClick={() => setShowDeployModal(false)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden border border-orange-100 dark:border-slate-800 mt-auto md:mt-0"
             >
                <div className="p-6 md:p-10 space-y-6 md:space-y-8">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 md:gap-4">
                         <div className="p-3 md:p-4 bg-orange-100 dark:bg-orange-900/30 rounded-[15px] md:rounded-[20px] text-orange-600">
                            <PlusCircle className="w-6 h-6 md:w-8 md:h-8" />
                         </div>
                         <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">New Deployment Entry</h2>
                            <p className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 md:mt-1">Machine ID: {selectedMachine?.id}</p>
                         </div>
                      </div>
                      <button onClick={() => setShowDeployModal(false)} className="p-2 md:p-3 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl md:rounded-2xl transition-all">
                         <X className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                   </div>
 
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1.5 md:space-y-2">
                         <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Operator Name</label>
                         <input 
                           type="text" 
                           value={deploymentForm.operatorName}
                           onChange={(e) => setDeploymentForm(prev => ({ ...prev, operatorName: e.target.value }))}
                           placeholder="Enter Name"
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-[11px] md:text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                         />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                         <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Target Hub / Hub Location</label>
                         <input 
                           type="text" 
                           value={deploymentForm.hub}
                           onChange={(e) => setDeploymentForm(prev => ({ ...prev, hub: e.target.value }))}
                           placeholder="Enter Hub"
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-[11px] md:text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                         />
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                         <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Initial Runtime Hour</label>
                         <input 
                           type="number" 
                           value={deploymentForm.initialHours}
                           onChange={(e) => setDeploymentForm(prev => ({ ...prev, initialHours: e.target.value }))}
                           className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl px-5 md:px-6 py-3.5 md:py-4 text-[11px] md:text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                         />
                      </div>
                   </div>
 
                   <button 
                     onClick={handleCommitEntry}
                     className="w-full py-4 md:py-5 bg-slate-900 dark:bg-orange-600 text-white font-black rounded-2xl md:rounded-3xl text-[10px] md:text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-500 transition-all flex items-center justify-center gap-2 md:gap-3"
                   >
                      <Zap className="w-4 h-4 md:w-5 md:h-5" />
                      Commit Entry
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Commit Entry Confirmation Dialog */}
      <AnimatePresence>
        {showCommitDialog && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden text-center p-6 md:p-12 space-y-8 md:space-y-10"
             >
                <div className="flex flex-col items-center">
                   <div className="w-16 h-16 md:w-24 md:h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500 mb-6 md:mb-8 border border-green-100 dark:border-green-800">
                      <CheckCircle2 className="w-8 h-8 md:w-12 md:h-12" />
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Commit Success</h3>
                   <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 px-4 md:px-10">Machine has been re-deployed under strategic command</p>
                </div>
 
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-3xl p-5 md:p-8 space-y-3 md:space-y-4 text-left border border-slate-100 dark:border-slate-700">
                   <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Machine Entity</span>
                      <span className="text-slate-900 dark:text-white">{selectedMachine?.id}</span>
                   </div>
                   <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Operator</span>
                      <span className="text-slate-900 dark:text-white">{deploymentForm.operatorName}</span>
                   </div>
                   <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Operational Hub</span>
                      <span className="text-slate-900 dark:text-white">{deploymentForm.hub}</span>
                   </div>
                   <div className="flex justify-between items-center text-[8px] md:text-[10px] font-black uppercase tracking-widest pt-3 md:pt-4 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">Status</span>
                      <span className="text-orange-500 italic">DEPLOYED</span>
                   </div>
                </div>
 
                <button 
                  onClick={finalizeDeployment}
                  className="w-full py-4 md:py-5 bg-gradient-to-r from-orange-600 to-rose-600 text-white font-black rounded-2xl md:rounded-3xl text-[10px] md:text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-orange-500/30 hover:scale-105 transition-all"
                >
                   Acknowledge Insights
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Preview Modal - Enhanced Bank Statement Style */}
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
               className="relative w-full max-w-5xl bg-[#fffefc] dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-orange-100 dark:border-slate-800"
             >
                <div className="flex flex-col h-[90vh]">
                   {/* Modal Header */}
                   <div className="p-5 md:p-8 border-b border-orange-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/50">
                      <div className="flex items-center gap-3 md:gap-4">
                         <div className="p-2.5 md:p-3 bg-slate-900 dark:bg-orange-600 rounded-xl md:rounded-2xl text-white">
                            <Building2 className="w-5 h-5 md:w-6 md:h-6" />
                         </div>
                         <div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Fleet Intelligence Preview</h2>
                            <p className="text-[8px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5 md:mt-1">Ref: PM-MAC-AUD-2024-{timeFilter.toUpperCase()}</p>
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
                         <div className="space-y-4 md:space-y-6">
                            <div>
                               <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-1.5">Fleet Operator</label>
                               <p className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Machine Intelligence Strategic Fleet</p>
                               <p className="text-[10px] md:text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                  Commercial Entity ID: PM-MAC-9982<br />
                                  Operational Hub: PAN-India Logistics Center
                               </p>
                            </div>
                            <div className="flex gap-6 md:gap-10">
                               <div>
                                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-1.5">Audit Window</label>
                                  <span className="px-2.5 md:px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800 rounded-lg text-[9px] md:text-[10px] font-black uppercase">{timeFilter}</span>
                               </div>
                               <div>
                                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-1.5">Fleet Status</label>
                                  <span className="px-2.5 md:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-[9px] md:text-[10px] font-black uppercase">Active Performance</span>
                               </div>
                            </div>
                         </div>
                         <div className="md:text-right space-y-4 md:space-y-6">
                            <div>
                               <label className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1 md:mb-1.5">Net Settlement Potency</label>
                               <p className="text-2xl md:text-4xl font-black text-orange-600 dark:text-orange-400 mt-1">{summary.totalRevenue}</p>
                               <p className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 md:mt-2">{summary.fleet.length} Machines Under Audit</p>
                            </div>
                            <div className="flex md:justify-end gap-2.5 md:gap-3">
                               <div className="p-2.5 md:p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl shadow-sm">
                                  <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                               </div>
                               <div className="p-2.5 md:p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl md:rounded-2xl shadow-sm">
                                  <Receipt className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                               </div>
                            </div>
                         </div>
                      </div>
                       {/* Performance Ledger Table */}
                       <div className="space-y-3 md:space-y-4">
                          <div className="flex items-center justify-between px-2">
                             <label className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Operational Performance Ledger</label>
                             <span className="text-[7px] md:text-[9px] font-bold text-slate-400 italic">Settlement Potency Audit</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[24px] border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-sm no-scrollbar">
                             <table className="w-full text-left min-w-[500px] md:min-w-0">
                                <thead>
                                   <tr className="bg-slate-900 dark:bg-black text-[8px] md:text-[9px] font-black text-white/60 uppercase tracking-[0.15em]">
                                      <th className="px-5 md:px-8 py-4 md:py-5">Machine Identity</th>
                                      <th className="px-4 md:px-6 py-4 md:py-5">Config/Operator</th>
                                      <th className="px-4 md:px-6 py-4 md:py-5 text-center">Runtime</th>
                                      <th className="px-4 md:px-6 py-4 md:py-5 text-center">ROI %</th>
                                      <th className="px-5 md:px-8 py-4 md:py-5 text-right">Revenue Cr</th>
                                   </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                   {summary.fleet.map((m, idx) => (
                                     <tr key={idx} className="text-[10px] md:text-[11px] text-slate-600 dark:text-slate-400 hover:bg-orange-50/20 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-5 md:px-8 py-4 md:py-5 font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight">{m.id}</td>
                                        <td className="px-4 md:px-6 py-4 md:py-5">
                                           <div className="flex flex-col">
                                              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase">{m.type}</span>
                                              <span className="text-[8px] md:text-[9px] text-slate-400 uppercase italic mt-0.5">{m.operatorName}</span>
                                           </div>
                                        </td>
                                        <td className="px-4 md:px-6 py-4 md:py-5 text-center font-bold tracking-widest">{m.hours}</td>
                                        <td className="px-4 md:px-6 py-4 md:py-5 text-center">
                                           <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-black text-slate-600 dark:text-slate-400 text-[9px] md:text-[10px]">{m.efficiency}</span>
                                        </td>
                                        <td className="px-5 md:px-8 py-4 md:py-5 text-right font-black text-orange-600 dark:text-orange-400">{m.revenue}</td>
                                     </tr>
                                   ))}
                                </tbody>
                                <tfoot>
                                   <tr className="bg-orange-50/30 dark:bg-slate-800/30">
                                      <td colSpan={4} className="px-5 md:px-8 py-5 md:py-6 text-[8px] md:text-[10px] font-black text-slate-900 dark:text-white uppercase text-right">Aggregated Fleet Payout Potency</td>
                                      <td className="px-5 md:px-8 py-5 md:py-6 text-right text-base md:text-lg font-black text-orange-600 dark:text-orange-400">{summary.totalRevenue}</td>
                                   </tr>
                                </tfoot>
                             </table>
                          </div>
                       </div>

                      {/* Fleet Security Disclosure */}
                      <div className="p-6 bg-[#fffcf5] dark:bg-slate-800/30 rounded-2xl border border-orange-100 dark:border-slate-800">
                         <div className="flex items-start gap-4">
                            <ShieldCheck className="w-5 h-5 text-orange-600 mt-1 flex-none" />
                            <div>
                               <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Fleet Intelligence Security Protocol</p>
                               <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed uppercase tracking-tight">
                                  This performance ledger is a verified record of machine operations and corresponding revenue potency for the strategic partner entity. All runtime metrics and ROI yields have been processed through the PaddyNexus Intelligence Engine. Individual operator logs are attached to the secure institutional master-file.
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Modal Actions */}
                   <div className="p-8 border-t border-orange-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-3 py-3 px-5 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                         <CheckCircle2 className="w-5 h-5 text-orange-600" />
                         <span className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase tracking-widest">Fleet Performance Audited</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <button 
                           onClick={() => setShowPreview(false)}
                           className="px-8 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                         >
                            Back To Insights
                         </button>
                         <button 
                           onClick={exportToPDF}
                           className="px-10 py-4 bg-orange-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-orange-700 transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3"
                         >
                            <Download className="w-4 h-4" />
                            Secure PDF Download
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
