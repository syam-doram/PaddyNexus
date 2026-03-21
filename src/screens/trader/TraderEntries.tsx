import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';
import {
  Tractor, Package, Search, Trash2, AlertCircle, User,
  Calendar, MapPin, Gauge, Building2, Users, Phone, BadgeCheck, X, Plus, ChevronDown, IndianRupee
} from 'lucide-react';
import Modal from '../../components/common/Modal';

interface Machine {
  id: string;
  name: string;
  model: string;
  operator: string;
  status: string;
  per_hour_rate: number;
}

interface Lot {
  id: string;
  name: string; // Driver Name
  type: string;
  weight: string;
  date: string;
  stage: string;
  vehicle_type?: string;
  mill_name?: string;
  load_area?: string;
  labour_group_name?: string;
}

interface Mill {
  id: string;
  name: string;
  location: string;
  contact_person: string;
  phone: string;
  email: string;
}

interface Operator {
  id: string;
  name: string;
  mobile: string;
  address: string;
  experience: string;
  status: string;
  registration_date: string;
}

interface LabourMember {
  id?: number;
  name: string;
  mobile: string;
  role: string;
}

interface LabourGroup {
  id: string;
  name: string;
  location: string;
  contact_number: string;
  registration_date: string;
  members?: LabourMember[];
}

interface PaddyMarket {
  id: string;
  paddy_type: string;
  price_per_quintal: number;
  description: string;
  date: string;
}

type TabType = 'machines' | 'lots' | 'mills' | 'operators' | 'labour' | 'market';

export default function TraderEntries() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('machines');
  const { user } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [mills, setMills] = useState<Mill[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [labourGroups, setLabourGroups] = useState<LabourGroup[]>([]);
  const [marketEntries, setMarketEntries] = useState<PaddyMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'machine' | 'lot' | 'mill' | 'operator' | 'labour' | 'market' | null>(null);
  const [expandedLabourId, setExpandedLabourId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Operator Modal State
  const [showOpModal, setShowOpModal] = useState(false);
  const [opName, setOpName] = useState('');
  const [opMobile, setOpMobile] = useState('');
  const [opAddress, setOpAddress] = useState('');
  const [opExp, setOpExp] = useState('');
  const [isSubmittingOp, setIsSubmittingOp] = useState(false);

  // Labour Modal State
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [labourName, setLabourName] = useState('');
  const [labourLocation, setLabourLocation] = useState('');
  const [labourContact, setLabourContact] = useState('');
  const [labourMembers, setLabourMembers] = useState<LabourMember[]>([
    { name: '', mobile: '', role: 'Labour' }
  ]);
  const [isSubmittingLabour, setIsSubmittingLabour] = useState(false);

  // Market Modal State
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [paddyType, setPaddyType] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [marketDesc, setMarketDesc] = useState('');
  const [isSubmittingMarket, setIsSubmittingMarket] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const years = ['2023', '2024', '2025', '2026'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const tId = user?.trader_id || user?.id;
      const authQuery = tId ? `traderId=${tId}` : '';
      const [mRes, lRes, miRes, oRes, labRes, marRes] = await Promise.all([
        fetch(`${API_BASE_URL}/machines?date=${selectedDate}&includeSettled=true${authQuery ? `&${authQuery}` : ''}`),
        fetch(`${API_BASE_URL}/lot-stages${authQuery ? `?${authQuery}` : ''}`),
        fetch(`${API_BASE_URL}/mills${authQuery ? `?${authQuery}` : ''}`),
        fetch(`${API_BASE_URL}/operators${authQuery ? `?${authQuery}` : ''}`),
        fetch(`${API_BASE_URL}/labour-groups${authQuery ? `?${authQuery}` : ''}`),
        fetch(`${API_BASE_URL}/paddy-market${authQuery ? `?${authQuery}` : ''}`)
      ]);
      const mData = await mRes.json();
      const lData = await lRes.json();
      const miData = await miRes.json();
      const oData = await oRes.json();
      const labData = await labRes.json();
      const marData = await marRes.json();

      setMachines(Array.isArray(mData) ? mData : []);
      setLots(Array.isArray(lData) ? lData : []);
      setMills(Array.isArray(miData) ? miData : []);
      setOperators(Array.isArray(oData) ? oData : []);
      setLabourGroups(Array.isArray(labData) ? labData : []);
      setMarketEntries(Array.isArray(marData) ? marData : []);
    } catch (err) {
      console.error("Failed to fetch entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;

    setIsDeleting(true);
    try {
      const encodedId = encodeURIComponent(deleteId);
      const endpoint = deleteType === 'machine' ? `${API_BASE_URL}/machines/${encodedId}` :
        deleteType === 'lot' ? `${API_BASE_URL}/lots/${encodedId}` :
          deleteType === 'mill' ? `${API_BASE_URL}/mills/${encodedId}` :
            deleteType === 'operator' ? `${API_BASE_URL}/operators/${encodedId}` :
              deleteType === 'market' ? `${API_BASE_URL}/paddy-market/${encodedId}` : `${API_BASE_URL}/labour-groups/${encodedId}`;
      
      let finalEndpoint = endpoint;
      const tId = user?.trader_id || user?.id;
      if (tId) finalEndpoint += `?traderId=${tId}`;
      
      const res = await fetch(finalEndpoint, { method: 'DELETE' });

      if (res.ok) {
        if (deleteType === 'machine') {
          setMachines(prev => prev.filter(m => m.id !== deleteId));
        } else if (deleteType === 'lot') {
          setLots(prev => prev.filter(l => l.id !== deleteId));
        } else if (deleteType === 'mill') {
          setMills(prev => prev.filter(mi => mi.id !== deleteId));
        } else if (deleteType === 'operator') {
          setOperators(prev => prev.filter(o => o.id !== deleteId));
        } else if (deleteType === 'market') {
          setMarketEntries(prev => prev.filter(m => m.id !== deleteId));
        } else if (deleteType === 'labour') {
          setLabourGroups(prev => prev.filter(g => g.id !== deleteId));
        }
        setDeleteId(null);
        setDeleteType(null);
      } else {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setModalConfig({
            isOpen: true,
            type: 'error',
            title: 'Delete Failed',
            message: data.error || "Failed to delete entry"
          });
        } else {
          const text = await res.text();
          console.error("Server returned non-JSON error:", text);
          setModalConfig({
            isOpen: true,
            type: 'error',
            title: 'Server Error',
            message: `Failed to delete (Server Error: ${res.status})`
          });
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Network Error',
        message: "A network error occurred while deleting."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = () => {
    if (activeTab === 'machines') {
      return machines.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.operator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'lots') {
      return lots.filter(l =>
        l.date.startsWith(selectedYear) && (
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    if (activeTab === 'mills') {
      return mills.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeTab === 'operators') {
      return operators.filter(o =>
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.mobile.includes(searchQuery)
      );
    }
    if (activeTab === 'market') {
      return marketEntries.filter(m =>
        m.paddy_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return labourGroups.filter(g =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const entryOptions = [
    { title: 'Machine', icon: Tractor, color: 'bg-emerald-500', path: '/add-machine', },
    { title: 'Lot', icon: Package, color: 'bg-blue-600', path: '/add-lot', },
    { title: 'Mill', icon: Building2, color: 'bg-violet-500', path: '/add-mill', },
    { title: 'Market', icon: IndianRupee, color: 'bg-primary', onClick: () => setShowMarketModal(true) },
    { title: 'Labour', icon: Users, color: 'bg-orange-500', onClick: () => setShowLabourModal(true) },
    { title: 'Operator', icon: User, color: 'bg-indigo-500', onClick: () => setShowOpModal(true) }
  ];

  const handleLabourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labourName) return;
    setIsSubmittingLabour(true);
    const id = `LG-${Date.now()}`;
    const payload = {
      id,
      name: labourName,
      location: labourLocation,
      contact_number: labourContact,
      registration_date: new Date().toISOString().split('T')[0],
      members: labourMembers.filter(m => m.name.trim() !== ''),
      traderId: user?.id
    };
    try {
      const res = await fetch(`${API_BASE_URL}/labour-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowLabourModal(false);
        setLabourName('');
        setLabourLocation('');
        setLabourContact('');
        setLabourMembers([{ name: '', mobile: '', role: 'Labour' }]);
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save labour group:", err);
    } finally {
      setIsSubmittingLabour(false);
    }
  };

  const fetchLabourMembers = async (groupId: string) => {
    try {
      let url = `${API_BASE_URL}/labour-groups/${groupId}/members`;
      if (user?.id) url += `?traderId=${user.id}`;
      const res = await fetch(url);
      const data = await res.json();
      setLabourGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: data } : g));
    } catch (err) {
      console.error("Failed to fetch labour members:", err);
    }
  };

  const toggleLabourGroup = (groupId: string) => {
    if (expandedLabourId === groupId) {
      setExpandedLabourId(null);
    } else {
      setExpandedLabourId(groupId);
      const group = labourGroups.find(g => g.id === groupId);
      if (group && !group.members) {
        fetchLabourMembers(groupId);
      }
    }
  };

  const handleOpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName || !opMobile) return;
    setIsSubmittingOp(true);
    const id = `OP-${Date.now()}`;
    const payload = {
      id,
      name: opName,
      mobile: opMobile,
      address: opAddress,
      experience: opExp,
      registration_date: new Date().toISOString().split('T')[0],
      traderId: user?.id
    };
    try {
      const res = await fetch(`${API_BASE_URL}/operators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowOpModal(false);
        setOpName('');
        setOpMobile('');
        setOpAddress('');
        setOpExp('');
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save operator:", err);
    } finally {
      setIsSubmittingOp(false);
    }
  };

  const handleMarketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paddyType || !marketPrice) return;
    setIsSubmittingMarket(true);
    const id = `PM-${Date.now()}`;
    const payload = {
      id,
      paddy_type: paddyType,
      price_per_quintal: parseInt(marketPrice),
      description: marketDesc,
      date: new Date().toISOString().split('T')[0],
      traderId: user?.id
    };
    try {
      const res = await fetch(`${API_BASE_URL}/paddy-market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowMarketModal(false);
        setPaddyType('');
        setMarketPrice('');
        setMarketDesc('');
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save market entry:", err);
    } finally {
      setIsSubmittingMarket(false);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-background-dark font-display">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md pt-4 md:pt-12 flex flex-col border-b border-slate-100 dark:border-white/5 shrink-0 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 md:pb-6 gap-4 md:gap-6">
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Inventory <span className="text-primary">Logs</span></h1>
            <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1">Operational data management</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 -mx-1 px-1">
            {entryOptions.map(opt => (
              <button key={opt.title} onClick={opt.path ? () => navigate(opt.path!) : opt.onClick} className={`flex-none px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl ${opt.color} text-white shadow-lg shadow-black/5 flex items-center justify-center gap-1.5 active:scale-95 transition-all text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap`}>
                <opt.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>{opt.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input type="text" placeholder={`Search ${activeTab}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-11 md:h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl md:rounded-2xl pl-11 pr-4 text-[12px] md:text-[13px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all shadow-inner" />
          </div>

          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl md:rounded-2xl h-11 md:h-12 overflow-x-auto no-scrollbar">
            {(['machines', 'lots', 'mills', 'operators', 'labour', 'market'] as TabType[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-none sm:flex-1 px-4 md:px-6 flex items-center justify-center gap-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-slate-400 opacity-60 hover:opacity-100'}`}>
                {tab === 'machines' && <Tractor className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                {tab === 'lots' && <Package className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                {tab === 'mills' && <Building2 className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                {tab === 'operators' && <User className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                {tab === 'labour' && <Users className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                {tab === 'market' && <IndianRupee className="w-3 md:w-3.5 h-3 md:h-3.5" />}
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar h-11 md:h-12 items-center">
            {activeTab === 'lots' ? (
              years.map(year => (
                <button key={year} onClick={() => setSelectedYear(year)} className={`flex-shrink-0 px-5 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${selectedYear === year ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-105' : 'bg-white dark:bg-surface-dark text-slate-400 border border-slate-100 dark:border-white/5'}`}>
                  {year}
                </button>
              ))
            ) : (
              <div className="relative w-full">
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full h-10 md:h-11 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 rounded-xl md:rounded-2xl px-4 text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all pr-10" />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-primary w-3.5 md:w-4 h-3.5 md:h-4 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 pb-32 no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Records...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {filteredItems().map((item: any, idx: number) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`group relative bg-white dark:bg-surface-dark rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all ${activeTab === 'labour' ? 'cursor-pointer' : ''}`}
                  onClick={activeTab === 'labour' ? () => toggleLabourGroup(item.id) : undefined}
                >
                  <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                      <div className="flex items-center gap-3 md:gap-4 truncate mr-2">
                        <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex-shrink-0 flex items-center justify-center transition-colors ${activeTab === 'machines' ? 'bg-emerald-50 text-emerald-500' : activeTab === 'lots' ? 'bg-blue-50 text-blue-500' : activeTab === 'mills' ? 'bg-violet-50 text-violet-500' : activeTab === 'operators' ? 'bg-indigo-50 text-indigo-500' : activeTab === 'market' ? 'bg-green-50 text-primary' : 'bg-orange-50 text-orange-500'}`}>
                          {activeTab === 'machines' ? <Tractor className="w-6 h-6 md:w-7 md:h-7" /> : activeTab === 'lots' ? <Package className="w-6 h-6 md:w-7 md:h-7" /> : activeTab === 'mills' ? <Building2 className="w-6 h-6 md:w-7 md:h-7" /> : activeTab === 'operators' ? <User className="w-6 h-6 md:w-7 md:h-7" /> : activeTab === 'market' ? <IndianRupee className="w-6 h-6 md:w-7 md:h-7" /> : <Users className="w-6 h-6 md:w-7 md:h-7" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm md:text-base font-[1000] text-slate-900 dark:text-white uppercase tracking-tight truncate">{activeTab === 'lots' ? `${idx + 1}. ${item.vehicle_type || 'Lot'}` : activeTab === 'market' ? item.paddy_type : item.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[8px] md:text-[9px] font-black px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded uppercase tracking-tighter">ID: {item.id.slice(0, 12)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); setDeleteType(activeTab === 'machines' ? 'machine' : activeTab === 'lots' ? 'lot' : activeTab === 'mills' ? 'mill' : activeTab === 'operators' ? 'operator' : activeTab === 'market' ? 'market' : 'labour'); }} className="p-2.5 md:p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl md:rounded-2xl transition-all">
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        {activeTab === 'labour' && (
                          <div className={`p-1.5 md:p-2 rounded-xl transition-transform ${expandedLabourId === item.id ? 'rotate-180 bg-slate-100 dark:bg-white/5' : ''}`}>
                            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 md:gap-y-4 gap-x-2 border-t border-slate-50 dark:border-white/5 pt-4 md:pt-6">
                      {activeTab === 'machines' && (
                        <>
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.operator || 'No Operator'}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                            <p className="text-[10px] font-black text-emerald-600">₹{item.per_hour_rate}/h</p>
                          </div>
                        </>
                      )}
                      {activeTab === 'lots' && (
                        <>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.date}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                            <p className="text-[10px] font-black text-slate-900 dark:text-white">{item.weight || '0'} Bags</p>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-red-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{item.load_area || 'Unspecified Area'}</p>
                          </div>
                          <div className="col-span-2 space-y-2 mt-1 pt-2 border-t border-slate-50 dark:border-white/5">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-violet-500" />
                              <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase italic truncate">{item.mill_name || 'No Mill Assigned'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-orange-500" />
                              <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase italic truncate">{item.labour_group_name || 'No Labour Group'}</p>
                            </div>
                          </div>
                        </>
                      )}
                      {activeTab === 'mills' && (
                        <>
                          <div className="flex items-center gap-2 col-span-2">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.location || 'No Location'}</p>
                          </div>
                          {item.contact_person && (
                            <div className="flex items-center gap-2 col-span-2">
                              <User className="w-3.5 h-3.5 text-violet-500" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.contact_person}</p>
                            </div>
                          )}
                        </>
                      )}
                      {activeTab === 'operators' && (
                        <>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-indigo-500" />
                            <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.mobile}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{item.experience || 'NEW'}</p>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{item.address || 'Location Unspecified'}</p>
                          </div>
                        </>
                      )}
                      {activeTab === 'labour' && (
                        <>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.location || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <Users className="w-3.5 h-3.5 text-orange-500" />
                            <p className="text-[10px] font-black text-slate-900 dark:text-white">{item.members?.length || '?'}</p>
                          </div>
                        </>
                      )}
                      {activeTab === 'market' && (
                        <>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.date}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <IndianRupee className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[10px] font-black text-emerald-600">₹{item.price_per_quintal}/Qtl</p>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{item.description || 'Current Market Rate'}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeTab === 'labour' && expandedLabourId === item.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-900/30 p-5 pt-4">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Active Personnel</p>
                        <div className="space-y-2">
                          {item.members && item.members.length > 0 ? (
                            item.members.map((member: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                    <User className="w-3.5 h-3.5" />
                                  </div>
                                  <p className="text-[10px] font-black uppercase tracking-tight">{member.name}</p>
                                </div>
                                <p className="text-[9px] font-bold text-primary">{member.mobile}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-center py-4 text-slate-400 text-[9px] font-black uppercase tracking-widest">No members found</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredItems().length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-surface-dark rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="w-16 h-16 rounded-[24px] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5 shadow-inner">
                  <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">No {activeTab} Discovered</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[280px] leading-relaxed">
                  The {activeTab} registry is currently empty for this period. Initiate a new entry to synchronize your industrial data.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Labour Group Add Modal */}
      <AnimatePresence>
        {showLabourModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 100 }} className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] md:max-h-[90vh]">
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Register <span className="text-primary">Labour Group</span></h3>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Industrial Workforce Configuration</p>
                </div>
                <button onClick={() => setShowLabourModal(false)} className="p-2 md:p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl md:rounded-2xl transition-all">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Group Identifier</label>
                    <input type="text" value={labourName} onChange={e => setLabourName(e.target.value)} placeholder="e.g. Nellore Team A" className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Base</label>
                    <input type="text" value={labourLocation} onChange={e => setLabourLocation(e.target.value)} placeholder="e.g. Korutla" className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workforce Roster</h4>
                    <button type="button" onClick={() => setLabourMembers([...labourMembers, { name: '', mobile: '', role: 'Labour' }])} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Member
                    </button>
                  </div>
                  <div className="space-y-3">
                    {labourMembers.map((member, i) => (
                      <div key={i} className="flex gap-3 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-[28px] border border-slate-100 dark:border-white/5">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input type="text" value={member.name} onChange={e => { const m = [...labourMembers]; m[i].name = e.target.value; setLabourMembers(m); }} placeholder="Name" className="h-10 px-4 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold focus:outline-none" />
                          <input type="tel" value={member.mobile} onChange={e => { const m = [...labourMembers]; m[i].mobile = e.target.value; setLabourMembers(m); }} placeholder="Mobile" maxLength={10} className="h-10 px-4 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold focus:outline-none" />
                          <select value={member.role} onChange={e => { const m = [...labourMembers]; m[i].role = e.target.value; setLabourMembers(m); }} className="h-10 px-4 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold focus:outline-none">
                            <option value="Labour">Labour</option>
                            <option value="Leader">Leader</option>
                            <option value="Supervisor">Supervisor</option>
                          </select>
                        </div>
                        {labourMembers.length > 1 && (
                          <button type="button" onClick={() => setLabourMembers(labourMembers.filter((_, idx) => idx !== i))} className="p-2.5 text-slate-300 hover:text-red-500 transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-8 border-t border-slate-100 dark:border-white/5">
                <button onClick={handleLabourSubmit} disabled={isSubmittingLabour || !labourName} className="w-full h-14 md:h-16 bg-primary text-background-dark rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 text-[11px] md:text-[12px]">
                  {isSubmittingLabour ? 'AUTHORIZING...' : 'FINALIZE GROUP REGISTRY'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Operator Add Modal */}
      <AnimatePresence>
        {showOpModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 100 }} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Register <span className="text-primary">Operator</span></h3>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Machine Personnel Onboarding</p>
                </div>
                <button onClick={() => setShowOpModal(false)} className="p-2 md:p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl md:rounded-2xl transition-all">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              <form onSubmit={handleOpSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Operator Full Name</label>
                  <input type="text" value={opName} onChange={e => setOpName(e.target.value)} placeholder="e.g. Ramesh Kumar" className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile Connection</label>
                    <input type="tel" value={opMobile} onChange={e => setOpMobile(e.target.value)} placeholder="10 Digit Number" maxLength={10} className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Industrial Exp.</label>
                    <input type="text" value={opExp} onChange={e => setOpExp(e.target.value)} placeholder="e.g. 5 Years" className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Resident Address</label>
                  <input type="text" value={opAddress} onChange={e => setOpAddress(e.target.value)} placeholder="Full Postal Address" className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                </div>
                <button type="submit" disabled={isSubmittingOp || !opName || !opMobile} className="w-full h-14 md:h-16 bg-primary text-background-dark rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 text-[11px] md:text-[12px]">
                  {isSubmittingOp ? 'AUTHORIZING...' : 'FINALIZE REGISTRATION'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Market Entry Modal */}
      <AnimatePresence>
        {showMarketModal && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 100 }} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
              <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Market <span className="text-primary">Entry</span></h3>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Paddy Pricing Configuration</p>
                </div>
                <button onClick={() => setShowMarketModal(false)} className="p-2 md:p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl md:rounded-2xl transition-all">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              <form onSubmit={handleMarketSubmit} className="p-6 md:p-8 space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Paddy Variety/Type</label>
                  <input type="text" value={paddyType} onChange={e => setPaddyType(e.target.value)} placeholder="e.g. BPT 5204 / RNR" className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Price per Quintal (₹)</label>
                  <input type="number" value={marketPrice} onChange={e => setMarketPrice(e.target.value)} placeholder="e.g. 2400" className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observations / Notes</label>
                  <input type="text" value={marketDesc} onChange={e => setMarketDesc(e.target.value)} placeholder="e.g. Seasonal high / Grade A" className="w-full h-12 md:h-14 px-5 md:px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-xl md:rounded-2xl text-[13px] md:text-[14px] font-bold focus:outline-none transition-all" />
                </div>
                <button type="submit" disabled={isSubmittingMarket || !paddyType || !marketPrice} className="w-full h-14 md:h-16 bg-primary text-background-dark rounded-xl md:rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 text-[11px] md:text-[12px]">
                  {isSubmittingMarket ? 'AUTHORIZING...' : 'FINALIZE MARKET ENTRY'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Confirm Delete?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Are you sure you want to delete this {deleteType}? This action will permanently remove all associated logs and records.
              </p>
              <div className="flex gap-4">
                <button onClick={() => { setDeleteId(null); setDeleteType(null); }} className="flex-1 py-4 px-6 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white font-black rounded-2xl hover:bg-slate-200 transition-colors">CANCEL</button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-4 px-6 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all disabled:opacity-50">{isDeleting ? 'DELETING...' : 'DELETE NOW'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />
    </div>
  );
}
