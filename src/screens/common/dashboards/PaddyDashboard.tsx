import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Package, Truck, Users, Plus, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/apiConfig';

export default function PaddyDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedYear, setSelectedYear] = useState('2026');
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState({ bag_rate: 50, machine_hour_rate: 100 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = `${API_BASE_URL}/dashboard-summary`;
        const tId = user?.trader_id || user?.id;
        if (tId) url += `?traderId=${tId}`;
        const response = await fetch(url);
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        let url = `${API_BASE_URL}/commissions/${selectedYear}`;
        const tId = user?.trader_id || user?.id;
        if (tId) url += `?traderId=${tId}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setRates({ 
            bag_rate: data.bag_rate || 50, 
            machine_hour_rate: data.machine_hour_rate || 100 
          });
        }
      } catch (err) {
        console.error("Error fetching rates:", err);
      }
    };
    fetchRates();
  }, [selectedYear]);

  // Filter data by selected year
  const filteredData = dashboardData.filter(row => row.lotDate.startsWith(selectedYear));

  // KPI Calculations
  const totalBags = filteredData.reduce((sum, row) => sum + (row.bags || 0), 0);
  const totalLorries = new Set(filteredData.map(row => row.lotId)).size;
  
  // Farmer Contribution Data
  const farmerStats: Record<string, number> = {};
  filteredData.forEach(row => {
    if (row.farmerName) {
      farmerStats[row.farmerName] = (farmerStats[row.farmerName] || 0) + (row.bags || 0);
    }
  });
  const sortedFarmers = Object.entries(farmerStats)
    .map(([name, bags]) => ({ name, bags }))
    .sort((a, b) => b.bags - a.bags);
  
  const topFarmers = sortedFarmers.slice(0, 5);
  const maxFarmerBags = Math.max(...topFarmers.map(f => f.bags), 1);

  // Commission for 'PAYMENT RELEASED' or 'SETTLED' stage
  const totalEarned = filteredData
    .filter(row => ['PAYMENT RELEASED', 'SETTLED'].includes(row.stage))
    .reduce((sum, row) => sum + (row.bags || 0) * (rates.bag_rate), 0);

  const kpis = [
    { label: 'Total Earn', value: `₹${totalEarned.toLocaleString('en-IN')}`, icon: TrendingUp, iconBg: 'bg-orange-100 dark:bg-orange-500/20', iconColor: 'text-orange-600 dark:text-orange-400', subtext: 'Released Payments', subColor: 'text-orange-600 dark:text-orange-400' },
    { label: 'Total Bags', value: totalBags.toString(), icon: Package, iconBg: 'bg-green-100 dark:bg-green-500/20', iconColor: 'text-green-600 dark:text-green-400', subtext: 'Total bags loaded', subIcon: TrendingUp, subColor: 'text-green-600 dark:text-green-400' },
    { label: 'Total Lots', value: totalLorries.toString(), icon: Truck, iconBg: 'bg-blue-100 dark:bg-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400', subtext: 'Dispatched in ' + selectedYear, subColor: 'text-slate-400' },
  ];

  // Area Contribution Data
  const areaStats: Record<string, number> = {};
  filteredData.forEach(row => {
    const area = row.load_area || 'Unspecified';
    areaStats[area] = (areaStats[area] || 0) + (row.bags || 0);
  });
  const topAreas = Object.entries(areaStats)
    .map(([name, bags]) => ({ name, bags }))
    .sort((a, b) => b.bags - a.bags)
    .slice(0, 5);
  const maxAreaBags = Math.max(...topAreas.map(a => a.bags), 1);

  // Mill Stages Data
  const uniqueMillStats: Record<string, Record<string, number>> = {};
  const seenLots = new Set();
  filteredData.forEach(row => {
    if (!seenLots.has(row.lotId)) {
      seenLots.add(row.lotId);
      const mill = row.millName || 'Unassigned';
      if (!uniqueMillStats[mill]) {
        uniqueMillStats[mill] = { 'LOADING': 0, 'IN TRANSIT': 0, 'DELIVERED': 0, 'SETTLED': 0 };
      }
      
      let category = row.stage;
      if (row.stage === 'LOADED' || row.stage === 'LOADING') category = 'LOADING';
      else if (row.stage === 'IN TRANSIT') category = 'IN TRANSIT';
      else if (row.stage === 'DELIVERED TO MILL' || row.stage === 'QUALITY CHECK') category = 'DELIVERED';
      else if (row.stage === 'PAYMENT RELEASED' || row.stage === 'SETTLED') category = 'SETTLED';

      uniqueMillStats[mill][category] = (uniqueMillStats[mill][category] || 0) + 1;
    }
  });

  const millStatsData = Object.entries(uniqueMillStats).map(([name, stages]) => ({
    name,
    stages,
    total: Object.values(stages).reduce((a, b) => a + b, 0)
  })).sort((a, b) => b.total - a.total);

  const lotEarnings: Record<string, number> = {};
  filteredData
    .filter(row => ['PAYMENT RELEASED', 'SETTLED'].includes(row.stage))
    .forEach(row => {
      lotEarnings[row.lotId] = (lotEarnings[row.lotId] || 0) + (row.bags || 0) * (rates.bag_rate);
    });
  
  const lotEarningsData = Object.entries(lotEarnings)
    .map(([lotId, amount]) => ({ lotId, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const maxLotEarning = Math.max(...lotEarningsData.map(d => d.amount), 1);

  const summaryData = [
    { 
      date: selectedYear, 
      lorries: totalLorries, 
      bags: totalBags, 
      avg: totalLorries > 0 ? (totalBags / totalLorries).toFixed(1) : '0.0' 
    },
  ];

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-background-dark text-slate-900 dark:text-white font-display">
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
            <p className="text-[9px] lg:text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1 lg:mb-1.5">Command Center</p>
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
        <div className="px-5 lg:px-6 py-2 mb-1 flex justify-center">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="h-10 lg:h-12 w-full px-4 lg:px-6 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 shadow-sm focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-bold outline-none cursor-pointer text-center text-xs lg:text-base">
            <option value="2026">2026 Harvest Season</option>
            <option value="2025">2025 Harvest Season</option>
            <option value="2024">2024 Harvest Season</option>
          </select>
        </div>

        <div className="px-5 lg:px-6 py-1 grid grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
          {loading ? (
            <div className="col-span-2 lg:col-span-3 py-8 text-center text-slate-400 text-xs font-bold">Syncing live dashboard...</div>
          ) : kpis.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`bg-white dark:bg-surface-dark p-3.5 lg:p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex flex-col items-start gap-2 ${i === 0 ? 'col-span-2 lg:col-span-1' : 'col-span-1 lg:col-span-1'}`}>
              <div className="flex items-center gap-2">
                <div className={`p-2 lg:p-2.5 rounded-xl ${kpi.iconBg} ${kpi.iconColor}`}><kpi.icon className="w-4 h-4 lg:w-5 lg:h-5" /></div>
                <p className="text-[10px] lg:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{kpi.label}</p>
              </div>
              <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none my-1">{kpi.value}</p>
              <div className={`flex items-center gap-1.5 mt-auto ${kpi.subColor}`}>
                {kpi.subIcon && <kpi.subIcon className="w-3 h-3 lg:w-3.5 lg:h-3.5" />}
                <p className="text-[9px] lg:text-[10.5px] font-bold">{kpi.subtext}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-4 px-5 lg:px-6 py-2">
          {/* Mill Status */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 pt-6 mb-4 lg:mb-0">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Mill Batch Status</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Lot distribution across stages</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                    {[
                        { label: 'Loading', color: 'bg-slate-400' },
                        { label: 'Transit', color: 'bg-blue-400' },
                        { label: 'Delivered', color: 'bg-green-400' },
                        { label: 'Settled', color: 'bg-orange-400' }
                    ].map(s => (
                        <div key={s.label} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${s.color}`} />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{s.label}</span>
                        </div>
                    ))}
                </div>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-xl shadow-sm"><Package className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
            </div>
            <div className="space-y-6">
              {millStatsData.length > 0 ? millStatsData.map((mill) => (
                <div key={mill.name} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{mill.name}</span>
                    <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{mill.total} Lots</span>
                  </div>
                  <div className="flex h-3 w-full bg-slate-100 dark:bg-slate-800/40 rounded-full overflow-hidden shadow-inner">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(mill.stages['LOADING'] / mill.total) * 100}%` }} className="h-full bg-slate-400 border-r border-white/10" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(mill.stages['IN TRANSIT'] / mill.total) * 100}%` }} className="h-full bg-blue-400 border-r border-white/10" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(mill.stages['DELIVERED'] / mill.total) * 100}%` }} className="h-full bg-green-400 border-r border-white/10" />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(mill.stages['SETTLED'] / mill.total) * 100}%` }} className="h-full bg-orange-400" />
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                     {Object.entries(mill.stages).map(([stage, count]) => (
                        <div key={stage} className="flex flex-col items-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">{stage.split(' ')[0]}</span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 tabular-nums">{count}</span>
                        </div>
                     ))}
                  </div>
                </div>
              )) : <div className="py-8 text-center text-slate-400 text-[11px] font-bold italic opacity-60">No data available.</div>}
            </div>
          </div>

          {/* Area Contribution */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 pt-6 mb-4 lg:mb-0">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Area Contribution</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Bags by loading area</p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg"><Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
            </div>
            <div className="space-y-5">
              {topAreas.length > 0 ? topAreas.map((item, i) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{item.name}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.bags.toLocaleString()} Bags</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.bags / maxAreaBags) * 100}%` }} className={`h-full rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-blue-300'}`} />
                  </div>
                </div>
              )) : <div className="py-8 text-center text-slate-400 text-[11px] font-bold italic opacity-60">No loading data available.</div>}
            </div>
          </div>

          {/* Farmer Contribution */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 pt-6 mb-4 lg:mb-0">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Farmer Contributions</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Top performing farmers</p>
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg"><Users className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
            </div>
            <div className="space-y-5">
              {topFarmers.length > 0 ? topFarmers.map((item, i) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{item.name}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{item.bags.toLocaleString()} Bags</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.bags / maxFarmerBags) * 100}%` }} className={`h-full rounded-full ${i === 0 ? 'bg-purple-500' : 'bg-purple-300'}`} />
                  </div>
                </div>
              )) : <div className="py-8 text-center text-slate-400 text-[11px] font-bold italic opacity-60">No farmer data available.</div>}
            </div>
          </div>

          {/* Earnings by Lot */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-5 pt-6 mb-4 lg:mb-0">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">Earnings by Lot</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission</span>
            </div>
            <div className="space-y-5">
              {lotEarningsData.length > 0 ? lotEarningsData.map((item, i) => (
                <div key={item.lotId} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.lotId}</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">₹{item.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.amount / maxLotEarning) * 100}%` }} className="h-full bg-orange-500 rounded-full" />
                  </div>
                </div>
              )) : <div className="py-8 text-center text-slate-400 text-[11px] font-black italic opacity-60 uppercase tracking-widest">No Earnings Logged</div>}
            </div>
          </div>
        </div>

        {/* Daily Summary Table */}
        <div className="px-5 lg:px-6 py-4">
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden text-sm">
            <div className="p-5 border-b border-slate-100 dark:border-white/5 font-bold">Daily Summary Table</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Lots</th>
                    <th className="px-5 py-4">Bags</th>
                    <th className="px-5 py-4">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summaryData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-5 py-4 font-bold">{row.date}</td>
                      <td className="px-5 py-4">{row.lorries}</td>
                      <td className="px-5 py-4 text-green-600">{row.bags}</td>
                      <td className="px-5 py-4 text-slate-500">{row.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
