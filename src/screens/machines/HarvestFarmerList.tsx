import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Filter, Calendar, User, MapPin, IndianRupee, Clock, ChevronRight, FileStack, Printer, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HarvestFarmerList() {
  const { machineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const activeYear = parseInt(queryParams.get('year') || new Date().getFullYear().toString());
  const activeMonth = queryParams.get('month');
  
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [machineInfo, setMachineInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedAreas, setExpandedAreas] = useState<Record<string, boolean>>({});

  const toggleArea = (area: string) => {
    setExpandedAreas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF() as any;
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); 
      doc.text('PADDYNEXUS', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); 
      doc.text('OFFICIAL HARVEST STATEMENT', 14, 28);
      doc.text(`DATE GENERATED: ${new Date().toLocaleDateString('en-IN')}`, 130, 22);

      // Machine Info
      doc.setFillColor(248, 250, 252); 
      doc.rect(14, 35, 182, 30, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont(undefined, 'bold');
      doc.text(`MACHINE: ${(machineInfo?.name || 'UNNAMED').toUpperCase()}`, 20, 45);
      doc.setFont(undefined, 'normal');
      doc.text(`SESSION: ${activeYear} Harvester Operative`, 20, 52);
      doc.text(`Total Records: ${filteredLogs.length}`, 20, 58);

      // Summary Totals
      const totalYield = filteredLogs.reduce((sum, l) => sum + (l.total_amount || 0), 0);
      const totalHours = filteredLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
      
      doc.setTextColor(15, 23, 42);
      doc.text(`GROSS YIELD: Rs. ${totalYield.toLocaleString()}`, 110, 45);
      doc.text(`DEEP USAGE: ${totalHours.toFixed(1)} HOURS`, 110, 52);

      // Table Data Construction
      const tableData = filteredLogs.map(l => [
        new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) === 'Invalid Date' 
           ? 'N/A' 
           : new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        (l.farmer_name || 'N/A').toString().toUpperCase(),
        (l.location || 'N/A').toString().toUpperCase(),
        `${l.hours || 0} HR`,
        `Rs. ${(l.total_amount || 0).toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 75,
        head: [['DATE', 'FARMER NAME', 'LOCATION / AREA', 'USAGE', 'NET AMOUNT']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold', halign: 'center' },
        columnStyles: { 4: { halign: 'right', fontStyle: 'bold' }, 3: { halign: 'center' } },
        styles: { fontSize: 8, cellPadding: 4 }
      });

      doc.save(`Statement_${machineInfo?.name || 'Machine'}_${activeYear}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Oops! PDF generation failed. Close and try again.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const tId = user?.trader_id || user?.id;
      let url = `${API_BASE_URL}/machine-report/${encodeURIComponent(machineId!)}?year=${activeYear}`;
      if (tId) url += `&traderId=${tId}`;
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs || []);
      setMachineInfo(data.machine);
    } catch (err) {
      console.error("Failed to fetch harvest logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (machineId) fetchData();
  }, [machineId, activeYear]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = 
        l.farmer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStartDate = !startDate || l.date >= startDate;
      const matchesEndDate = !endDate || l.date <= endDate;
      const matchesMonth = !activeMonth || l.date.startsWith(activeMonth);
      
      return matchesSearch && matchesStartDate && matchesEndDate && matchesMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, searchQuery, startDate, endDate, activeMonth]);

  const groupedByArea = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredLogs.forEach(log => {
      const area = log.location || 'UNASSIGNED TERRITORY';
      if (!groups[area]) groups[area] = [];
      groups[area].push(log);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredLogs]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Organizing Archives...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          main { overflow: visible !important; height: auto !important; padding: 0 !important; }
          .flex-1 { overflow: visible !important; height: auto !important; }
          body { background: white !important; color: black !important; }
          .bg-slate-50\\/30 { background: white !important; }
          section { page-break-inside: avoid; margin-bottom: 2rem !important; }
          .sticky { position: relative !important; shadow: none !important; border: none !important; }
        }
        .print-only { display: none; }
      `}} />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0 no-print">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase leading-none">
                Harvest <span className="text-primary italic">Ledger</span>
              </h1>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {machineInfo?.name} • Area-wise Distribution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {activeMonth && (
              <button 
                onClick={() => navigate(`/machine-settlement/${machineId}/harvests?year=${activeYear}`)}
                className="h-10 px-4 bg-primary/10 text-primary rounded-xl flex items-center gap-2 border border-primary/20"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase text-nowrap">{activeMonth.split('-')[1]}/{activeMonth.split('-')[0]}</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Custom Date Filters */}
        <div className="px-4 lg:px-6 pb-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Find farmer or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold focus:border-primary focus:outline-none transition-all"
              />
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="h-12 px-6 bg-red-500/10 text-red-500 rounded-2xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border border-red-500/20"
              >
                <X className="w-4 h-4" /> Clear Filter
              </button>
            )}
          </div>
          
          {/* Predefined Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
             {[
               { label: 'Today', days: 0 },
               { label: 'Yesterday', days: 1 },
               { label: 'Last 7 Days', days: 7 },
               { label: 'Last 30 Days', days: 30 },
             ].map((chip) => {
                const end = new Date();
                const start = new Date();
                if (chip.label === 'Yesterday') {
                   start.setDate(start.getDate() - 1);
                   end.setDate(end.getDate() - 1);
                } else {
                   start.setDate(start.getDate() - chip.days);
                }
                const sStr = start.toISOString().split('T')[0];
                const eStr = end.toISOString().split('T')[0];
                const isActive = startDate === sStr && endDate === eStr;

                return (
                  <button 
                    key={chip.label}
                    onClick={() => {
                      setStartDate(sStr);
                      setEndDate(eStr);
                    }}
                    className={`px-4 h-8 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                      isActive 
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                      : 'bg-slate-900/5 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
             })}
             {activeMonth && (
                <button 
                  onClick={() => {
                    setStartDate(`${activeMonth}-01`);
                    setEndDate(`${activeMonth}-31`);
                  }}
                  className={`px-4 h-8 border rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    (startDate === `${activeMonth}-01` && endDate === `${activeMonth}-31`)
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-primary/10 text-primary border-primary/20'
                  }`}
                >
                   Full {new Date(activeMonth + '-01').toLocaleDateString('en-IN', { month: 'long' })}
                </button>
             )}
          </div>
        </div>
      </header>


      {/* Grouped Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-0 lg:p-8 bg-slate-50/30 dark:bg-transparent pb-48">
        <div className="max-w-7xl mx-auto space-y-10 lg:space-y-12">
          <AnimatePresence mode="popLayout">
            {groupedByArea.map(([area, areaLogs], areaIdx) => (
              <motion.section 
                key={area}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Collapsible Area Header */}
                <button 
                   onClick={() => toggleArea(area)}
                   className="w-full sticky top-0 z-30 bg-[#F8FAFC]/90 dark:bg-[#0F172A]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-y md:border border-slate-200 dark:border-white/5 md:rounded-3xl shadow-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all group"
                >
                   <div className="flex items-center gap-4">
                      <div className={`transition-transform duration-300 ${expandedAreas[area] ? 'rotate-90' : ''}`}>
                         <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary" />
                      </div>
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                         <MapPin className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                         <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{area}</h3>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                            {areaLogs.length} Records registered
                         </p>
                      </div>
                   </div>
                   <div className="text-right flex items-center gap-6">
                      <div className="hidden sm:block">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Area Yield</p>
                         <p className="text-sm font-black text-emerald-500">
                            ₹{areaLogs.reduce((sum, l) => sum + l.total_amount, 0).toLocaleString()}
                         </p>
                      </div>
                   </div>
                </button>

                {/* Logs in this area (Conditional Rendering) */}
                {expandedAreas[area] && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Farmer Detail</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Service Date</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Harvest Hours</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Yield amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {areaLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group cursor-default">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/5 text-primary rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{log.farmer_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase">
                              {new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/10 rounded-md text-[9px] font-black text-slate-500">
                              {log.hours} HR
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs font-black text-emerald-500">₹{log.total_amount.toLocaleString()}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="grid grid-cols-1 md:hidden gap-4 px-4">
                  {areaLogs.map((log) => (
                    <motion.div
                      key={log.id}
                      className="group bg-white dark:bg-surface-dark p-5 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400">
                              <User className="w-4 h-4" />
                           </div>
                           <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate max-w-[120px]">
                              {log.farmer_name}
                           </p>
                        </div>
                        <p className="text-xs font-black text-emerald-500">₹{log.total_amount.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                         <div>
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Harvest Usage</p>
                            <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                               {log.hours} HOURS
                            </span>
                         </div>
                         <div className="text-right">
                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Date</p>
                            <span className="text-[9px] font-black text-slate-500 uppercase">
                               {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                         </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
              </motion.section>
            ))}
          </AnimatePresence>

          {groupedByArea.length === 0 && (
            <div className="py-20 flex flex-col items-center text-center">
               <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 opacity-40">
                  <Search className="w-10 h-10 text-slate-400" />
               </div>
               <h3 className="text-xl font-black text-slate-400 uppercase tracking-tighter">No Operative Data Found</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Try refining your search or date range</p>
            </div>
          )}
        </div>
      </main>

      {/* Premium Dashboard-style Summary Bar (Elevated on Mobile) */}
      <div className="fixed md:sticky bottom-20 md:bottom-0 left-0 right-0 z-[45] bg-slate-900 dark:bg-slate-900 border-t border-white/10 p-4 lg:p-6 shadow-[0_-15px_40px_rgba(0,0,0,0.3)] no-print mx-0 lg:mx-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 lg:gap-16 flex-1 text-white">
             <div className="relative pl-6 border-l-2 border-emerald-500">
               <p className="text-[7px] lg:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">Gross Session Yield</p>
               <p className="text-xl lg:text-4xl font-black text-emerald-400 tracking-tighter leading-none flex items-center gap-1">
                 <span className="text-sm opacity-60">₹</span>{filteredLogs.reduce((sum, l) => sum + l.total_amount, 0).toLocaleString()}
               </p>
             </div>
             <div className="relative pl-6 border-l-2 border-primary hidden sm:block">
               <p className="text-[7px] lg:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none">Total Machine Hours</p>
               <p className="text-xl lg:text-4xl font-black text-white tracking-tighter leading-none">
                 {filteredLogs.reduce((sum, l) => sum + (l.hours || 0), 0).toFixed(1)} <span className="text-xs font-black opacity-40">HRS</span>
               </p>
             </div>
          </div>
          <button 
            className="h-10 lg:h-14 px-6 lg:px-10 bg-white dark:bg-white text-slate-900 rounded-xl lg:rounded-2xl font-black text-[9px] lg:text-[11px] uppercase tracking-[0.2em] shadow-xl flex items-center gap-3 hover:bg-emerald-400 hover:text-black transition-all shrink-0 active:scale-95 group"
            onClick={generatePDF}
          >
            <Printer className="w-4 h-4 group-hover:animate-bounce" /> STATEMENTS
          </button>
        </div>
      </div>

    </div>
  );
}
