import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, TrendingUp, TrendingDown, ChevronRight, Sprout, Tractor, IndianRupee } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/apiConfig';

export default function MachineDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [commissionRate, setCommissionRate] = useState<number>(100);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tId = user?.trader_id || user?.id;
        const commUrl = `${API_BASE_URL}/commissions/${selectedYear}${tId ? `?traderId=${tId}` : ''}`;
        const logsUrl = `${API_BASE_URL}/machine-logs${tId ? `?traderId=${tId}` : ''}`;
        
        const [commRes, logsRes] = await Promise.all([
          fetch(commUrl),
          fetch(logsUrl)
        ]);
        
        if (commRes.ok) {
          const data = await commRes.json();
          setCommissionRate(data.machine_hour_rate || 100);
        }
        
        if (logsRes.ok) {
          const data = await logsRes.json();
          setLogs(data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  const filteredLogs = logs.filter(log => log.date && log.date.startsWith(selectedYear));
  const totalHours = filteredLogs.reduce((sum, log) => sum + (parseFloat(log.hours) || 0), 0);
  const totalCommission = totalHours * commissionRate;
  

  return (
    <div className="relative flex h-full w-full flex-col bg-background-light dark:bg-background-dark font-display">
      <header className="px-5 lg:px-6 pt-5 lg:pt-12 pb-3 lg:pb-6 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl z-40 border-b border-slate-200/50 dark:border-white/5">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="relative cursor-pointer group" onClick={() => navigate('/profile')}>
            <div className="absolute inset-0 bg-emerald-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop" 
              alt="Profile" 
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl border-2 border-white dark:border-white/10 shadow-xl object-cover relative z-10" 
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#F8FAFC] dark:border-background-dark z-20 shadow-sm" />
          </div>
          <div>
            <p className="text-[9px] lg:text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Machine Ops</p>
            <h2 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">{user?.name?.split(' ')[0] || 'Operator'}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button className="p-2.5 lg:p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-emerald-500 transition-all shadow-sm">
            <Search className="w-5 h-5" />
          </button>
          <button className="relative p-2.5 lg:p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-emerald-500 transition-all shadow-sm">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-background-dark" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 lg:pb-24 no-scrollbar">
        <div className="px-5 lg:px-6 py-2 flex items-center gap-2">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="h-10 lg:h-12 px-3 lg:px-4 rounded-xl bg-white dark:bg-surface-dark border-none shadow-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-bold outline-none cursor-pointer text-[11px] lg:text-sm">
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 lg:w-5 lg:h-5" />
            <input type="text" placeholder="Search parts..." className="w-full h-10 lg:h-12 pl-9 lg:pl-12 pr-4 rounded-xl bg-white dark:bg-surface-dark border-none shadow-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white transition-all text-xs lg:text-sm" />
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-4 px-5 lg:px-6 py-4">
          <div className="bg-white dark:bg-surface-dark rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-white/5 group transform transition-all hover:shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-2xl text-blue-600"><Sun className="w-6 h-6" /></div>
              <div className="text-right">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Total Hours Worked</p>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalHours.toLocaleString()}h</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-white/5">
              <p className="text-[10px] font-bold text-slate-500 tracking-tight">Active tracking on major harvesters</p>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-white/5 group transform transition-all hover:shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl text-emerald-600"><TrendingUp className="w-6 h-6" /></div>
              <div className="text-right">
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Total Commission</p>
                <h2 className="text-3xl font-black text-emerald-600 tracking-tight">₹{totalCommission.toLocaleString()}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50 dark:border-white/5">
              <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg">Rate: ₹{commissionRate}/h</span>
            </div>
          </div>
        </div>

        <div className="px-5 lg:px-6 py-4">
          <div className="bg-white dark:bg-surface-dark rounded-[2rem] lg:rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm">
            <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Fleet Performance</h3>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              Seasonal analytics and detailed operational breakdowns are now managed through the <strong>Fleet Settlements</strong> hub for enhanced security and session integrity.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
