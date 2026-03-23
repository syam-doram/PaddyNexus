import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Tractor, Search, ArrowLeft, Fuel, Gauge, 
  Settings, ShieldCheck, AlertCircle, TrendingUp, IndianRupee,
  Clock, MapPin, Filter, Calendar, ListFilter, User, ChevronRight, FileStack, Download
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface HarvestLog {
  _id: string;
  machine_id: string;
  farmer_name: string;
  date: string;
  hours: number;
  acres: number;
  fuel_cost: number;
  rate: number;
  total_amount: number;
  farmer_mobile: string;
  location: string;
  start_time: string;
  end_time: string;
  trader_id: string;
}

interface Machine {
  id: string;
  name: string;
  model: string;
}

export default function FarmerHarvestList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const traderId = user?.trader_id || user?.id;
  
  const state = location.state as { machineId?: string; year?: string } | null;
  
  const [logs, setLogs] = useState<HarvestLog[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachine, setSelectedMachine] = useState(state?.machineId || 'all');
  const [selectedYear, setSelectedYear] = useState(state?.year || new Date().getFullYear().toString());

  const years = [2024, 2025, 2026];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tId = user?.trader_id || user?.id;
        const [logsRes, machinesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/machine-logs?traderId=${tId}`),
          fetch(`${API_BASE_URL}/machines?traderId=${tId}`)
        ]);

        if (logsRes.ok && machinesRes.ok) {
          const logsData = await logsRes.json();
          const machinesData = await machinesRes.json();
          setLogs(Array.isArray(logsData) ? logsData : []);
          setMachines(Array.isArray(machinesData) ? machinesData : []);
        }
      } catch (err) {
        console.error("Failed to fetch harvest data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [traderId]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.machine_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesMachine = selectedMachine === 'all' || log.machine_id === selectedMachine;
      const matchesYear = log.date.startsWith(selectedYear);
      
      return matchesSearch && matchesMachine && matchesYear;
    });
  }, [logs, searchQuery, selectedMachine, selectedYear]);

  const stats = useMemo(() => {
    return {
      totalHours: filteredLogs.reduce((sum, l) => sum + (l.hours || 0), 0),
      totalRevenue: filteredLogs.reduce((sum, l) => sum + (l.total_amount || 0), 0),
      totalAcres: filteredLogs.reduce((sum, l) => sum + (l.acres || 0), 0),
      count: filteredLogs.length
    };
  }, [filteredLogs]);

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text("PADDYMANAGER", 15, 20);
      doc.setFontSize(10);
      doc.text(`GLOBAL HARVEST JOURNAL - ${selectedYear}`, 15, 30);
      
      const tableData = filteredLogs.map(l => [
        new Date(l.date).toLocaleDateString('en-IN'),
        l.farmer_name.toUpperCase(),
        l.location.toUpperCase(),
        machines.find(m => m.id === l.machine_id)?.name || l.machine_id,
        `${l.hours} H`,
        `₹${l.total_amount.toLocaleString()}`
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['DATE', 'FARMER', 'LOCATION', 'MACHINE', 'HOURS', 'BILLING']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], fontSize: 8 },
        styles: { fontSize: 8 }
      });

      doc.save(`Harvest_Journal_${selectedYear}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative h-full flex flex-col w-full bg-background-light dark:bg-background-dark font-display">
      <header className="px-5 lg:px-8 pt-6 lg:pt-12 pb-6 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl z-40 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Fleet Intelligence
              </p>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">
                Harvest <span className="text-primary">Journal</span>
              </h1>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 opacity-60">Session Hours</p>
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-xl font-black text-slate-900 dark:text-white">{stats.totalHours.toFixed(1)}</span>
                <span className="text-[9px] font-bold text-slate-300">HRS</span>
              </div>
            </div>
            <div className="w-[1px] h-10 bg-slate-200 dark:bg-white/5" />
            <div className="text-right">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1 opacity-60">Total Gross</p>
              <p className="text-xl font-black text-emerald-500 tracking-tight">₹{(stats.totalRevenue / 1000).toFixed(1)}K</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by farmer, area, or identifier..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
          
          <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl h-14 overflow-x-auto no-scrollbar lg:flex-none">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y.toString())}
                className={`px-6 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedYear === y.toString() ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 opacity-60'}`}
              >
                {y}
              </button>
            ))}
          </div>

          <button 
            onClick={exportToPDF}
            className="h-14 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Reports</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 lg:px-8 py-8 no-scrollbar pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Log Entry Registry...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-dark rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronology</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Counterparty</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Asset</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Duration</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Yield (INR)</th>
                  <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredLogs.map((log) => {
                    const machine = machines.find(m => m.id === log.machine_id);
                    return (
                      <motion.tr 
                        key={log._id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-baseline gap-2">
                             <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                               {new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                             </span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase italic">{new Date(log.date).getFullYear()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.farmer_name}</span>
                            <div className="flex items-center gap-1.5 opacity-60">
                               <MapPin className="w-3 h-3 text-red-400" />
                               <span className="text-[9px] font-bold uppercase tracking-widest truncate max-w-[120px]">{log.location || 'Unknown'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                 <Tractor className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{machine?.name || 'Asset'}</span>
                                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{machine?.model || log.machine_id}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                              <Clock className="w-3 h-3 text-primary" />
                              {log.hours.toFixed(1)} HR
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-emerald-500 text-sm tracking-tighter leading-none">
                           ₹{log.total_amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-5">
                           <button 
                             onClick={() => navigate(`/machine-log/${encodeURIComponent(log.machine_id)}`, { state: { date: log.date } })}
                             className="mx-auto w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90"
                           >
                             <ChevronRight className="w-4 h-4" />
                           </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            
            {filteredLogs.length === 0 && (
              <div className="py-32 flex flex-col items-center justify-center text-center px-10">
                <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-[32px] flex items-center justify-center mb-6">
                   <FileStack className="w-10 h-10 text-slate-200 dark:text-white/10" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-2">No Records Detected</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                  The harvest journal is empty for the current intelligence configuration. Initiate a field deployment to generate records.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 lg:left-72 right-0 p-6 md:p-8 flex items-center justify-between pointer-events-none z-50">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="p-5 bg-slate-900 dark:bg-white rounded-[28px] shadow-2xl flex items-center gap-6 border border-white/10 dark:border-slate-200">
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Total Yield</span>
                <span className="text-xl font-black text-white dark:text-slate-900 tracking-tighter">₹{(stats.totalRevenue / 1000).toFixed(1)}K</span>
             </div>
             <div className="w-px h-8 bg-white/10 dark:bg-slate-200" />
             <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Fleet Hours</span>
                <span className="text-xl font-black text-white dark:text-slate-900 tracking-tighter">{stats.totalHours.toFixed(0)}H</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
