import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Truck, 
  Tractor, 
  User, 
  Package, 
  Calendar, 
  Hash, 
  FileText, 
  MapPin, 
  Building2, 
  ShoppingBag, 
  Phone, 
  Camera, 
  Banknote,
  CheckCircle2,
  AlertCircle,
  X,
  Scale,
  ShieldCheck
} from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';

export default function AddLot() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lotId, setLotId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [vehicleType, setVehicleType] = useState('Tractor');
  const [regNumber, setRegNumber] = useState('');
  const [paddyType, setPaddyType] = useState('');
  const [weight, setWeight] = useState('75'); 
  const [weighScaleKgs, setWeighScaleKgs] = useState('');
  const [tonCapacity, setTonCapacity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [loadArea, setLoadArea] = useState('');
  const [millName, setMillName] = useState('Sunrise Mills Ltd.');
  const [emptyBags, setEmptyBags] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [gratuity, setGratuity] = useState('500'); 
  const [lotCount, setLotCount] = useState(0);
  const [mills, setMills] = useState<any[]>([]);
  const [labourGroups, setLabourGroups] = useState<any[]>([]);
  const [selectedLabourGroupId, setSelectedLabourGroupId] = useState('');
  const [paddyVariants, setPaddyVariants] = useState<string[]>([]);
  const [loadingMills, setLoadingMills] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);



  const [preLoadScale, setPreLoadScale] = useState('');

  useEffect(() => {
    const fetchCount = async () => {
      const year = date.split('-')[0];
      try {
        let url = `${API_BASE_URL}/lots/count/${year}`;
        const tId = user?.trader_id || user?.id;
        if (tId) url += `?traderId=${tId}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setLotCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching lot count:', error);
      }
    };
    fetchCount();

    const fetchMills = async () => {
      try {
        let url = `${API_BASE_URL}/mills`;
        if (user?.id) url += `?traderId=${user.id}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setMills(data);
          if (data.length > 0) setMillName(data[0].name);
        }
      } catch (err) {
        console.error('Error fetching mills:', err);
      } finally {
        setLoadingMills(false);
      }
    };
    fetchMills();

    const fetchLabourGroups = async () => {
        try {
          let url = `${API_BASE_URL}/labour-groups`;
          if (user?.id) url += `?traderId=${user.id}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setLabourGroups(data);
            if (data.length > 0) setSelectedLabourGroupId(data[0].id);
          }
        } catch (err) {
          console.error('Error fetching labour groups:', err);
        }
      };
      fetchLabourGroups();

    const fetchPaddyVariants = async () => {
      try {
        let url = `${API_BASE_URL}/paddy-types`;
        if (user?.id) url += `?traderId=${user.id}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setPaddyVariants(data.sort());
        }
      } catch (err) {
        console.error('Error fetching paddy variants:', err);
      }
    };
    fetchPaddyVariants();
  }, [date, user]);



  useEffect(() => {
    if (loadArea || paddyType || date) {
      const areaChar = loadArea.trim() ? loadArea.trim().charAt(0).toUpperCase() : '';
      const paddyChar = paddyType.trim() ? paddyType.trim().charAt(0).toUpperCase() : '';
      const year = date.split('-')[0];
      const count = (lotCount + 1).toString().padStart(3, '0');

      if (areaChar || paddyChar) {
        setLotId(`${areaChar}${paddyChar}-${year}-${count}`);
      }
    }
  }, [loadArea, paddyType, date, lotCount]);

  const handleWeighScaleChange = (val: string) => {
    setWeighScaleKgs(val);
  };

  const handleTonCapacityChange = (val: string) => {
    setTonCapacity(val);
  };

  const handleSave = () => {
    if (!lotId || !driverName || !paddyType) {
      alert('Please fill in all required fields (ID, Driver, Paddy Type)');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeSave = async () => {
    setIsSaving(true);
    setShowConfirmModal(false);
    try {
      const response = await fetch(`${API_BASE_URL}/lots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lotId.startsWith('#') ? lotId : `#${lotId}`,
          name: driverName,
          type: paddyType,
          weight: tonCapacity || '0.00',
          weighScaleKgs: weighScaleKgs || '',
          date: date,
          load_area: loadArea,
          mill_name: millName,
          empty_bags: emptyBags,
          driver_mobile: driverMobile,
          photo_path: photo || '',
          vehicle_type: vehicleType,
          reg_number: regNumber,
          gratuity: parseInt(gratuity) || 0,
          labour_group_id: selectedLabourGroupId,
          traderId: user?.id,
          pre_load_scale: parseFloat(preLoadScale) || 0
        })
      });

      if (response.ok) {
        navigate('/trader-entries');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save lot');
      }
    } catch (error) {
      console.error('Error saving lot:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoClick = () => {
    const dummyPhoto = "photo_" + Date.now() + ".jpg";
    setPhoto(dummyPhoto);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1400px] flex flex-col h-full relative">
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 md:gap-6">
            <button
              onClick={() => navigate(-1)}
              className="group flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-background-dark transition-all"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-xl md:text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic leading-none">New Deployment</h1>
              <p className="hidden md:block text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">Initiate Asset Logistics Chain</p>
            </div>
          </div>

          <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 md:gap-3 px-4 py-2.5 md:px-8 md:py-4 bg-primary text-background-dark rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? '...' : (
                <>
                    <ShieldCheck className="w-4 h-4" />
                    <span className="hidden xs:inline">Authorize</span>
                    <span className="inline xs:hidden">Save</span>
                </>
              )}
            </button>
        </header>

        <main className="flex-1 p-4 lg:p-8 pb-32 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Mission Control & Origin */}
                <div className="space-y-4 md:space-y-6">
                    <section className="bg-white dark:bg-surface-dark rounded-3xl md:rounded-[32px] p-4 md:p-6 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center">
                                <Hash className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            </div>
                            <h3 className="text-[12px] md:text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Registry Identity</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest block ml-1">Harvest Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                    <input 
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest block ml-1">Manifest ID</label>
                                <div className="relative">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-primary" />
                                    <input 
                                        type="text"
                                        value={lotId}
                                        onChange={(e) => setLotId(e.target.value)}
                                        placeholder="Generating..."
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-lg md:text-xl font-black text-primary uppercase italic focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest block ml-1">Pre-Load Scale Read</label>
                                <div className="relative">
                                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                    <input 
                                        type="number"
                                        value={preLoadScale}
                                        onChange={(e) => setPreLoadScale(e.target.value)}
                                        placeholder="0 (KG)"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-slate-50 dark:border-white/5">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest block ml-1">Load Area Origin</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                    <input 
                                        type="text"
                                        value={loadArea}
                                        onChange={(e) => setLoadArea(e.target.value)}
                                        placeholder="e.g. Nellore North Depot"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <div className="flex justify-between items-center mb-0.5 md:mb-1 ml-1">
                                    <label className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">Target Mill</label>
                                    <button onClick={() => navigate('/add-mill')} className="text-[8px] font-black text-slate-400 hover:text-primary underline uppercase tracking-widest">Add New Lab</button>
                                </div>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400 z-10" />
                                    <select 
                                        value={millName}
                                        onChange={(e) => setMillName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-10 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-primary/40 transition-all appearance-none relative"
                                    >
                                        {mills.map(m => (
                                            <option key={m.id} value={m.name}>{m.name}</option>
                                        ))}
                                    </select>
                                    <ArrowLeft className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 -rotate-90 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest block ml-1">Labour Group Allocation</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400 z-10" />
                                    <select 
                                        value={selectedLabourGroupId}
                                        onChange={(e) => setSelectedLabourGroupId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-10 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-primary/40 transition-all appearance-none relative"
                                    >
                                        {labourGroups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <ArrowLeft className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 -rotate-90 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest block ml-1">Driver Gratuity</label>
                                <div className="relative">
                                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                    <input 
                                        type="number"
                                        value={gratuity}
                                        onChange={(e) => setGratuity(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-primary/40 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Operative & Payload Details */}
                <div className="space-y-4 md:space-y-6">
                    <section className="bg-white dark:bg-surface-dark rounded-3xl md:rounded-[32px] p-4 md:p-6 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 space-y-4 md:space-y-6">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 rounded-xl md:rounded-2xl flex items-center justify-center">
                                    <User className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                                </div>
                                <h3 className="text-[12px] md:text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Operative Profile</h3>
                            </div>
                            <button 
                                onClick={handlePhotoClick}
                                className={`flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${photo ? 'bg-primary text-background-dark' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:bg-slate-200'}`}
                            >
                                <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                {photo ? 'Locked' : 'Capture'}
                            </button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest block ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                    <input 
                                        type="text"
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        placeholder="Legal Name"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-blue-500/40 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest block ml-1">Mobile Uplink</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                    <input 
                                        type="tel"
                                        value={driverMobile}
                                        onChange={(e) => setDriverMobile(e.target.value.replace(/\D/g, '').slice(0,10))}
                                        placeholder="Contact"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-blue-500/40 transition-all"
                                    />
                                </div>
                            </div>
                         </div>

                         <div className="pt-4 md:pt-8 border-t border-slate-50 dark:border-white/5 space-y-4 md:space-y-6">
                            <label className="text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest block ml-1">Mobile Asset Selection</label>
                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                {[
                                    { id: 'Tractor', icon: Tractor },
                                    { id: 'Truck', icon: Truck },
                                    { id: 'Lorry', icon: Package }
                                ].map(asset => (
                                    <button
                                        key={asset.id}
                                        onClick={() => setVehicleType(asset.id)}
                                        className={`flex flex-col items-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-2xl md:rounded-3xl border-2 transition-all duration-300 ${vehicleType === asset.id ? 'bg-blue-500 border-blue-500 text-white shadow-xl shadow-blue-500/30' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent text-slate-400 hover:border-blue-500/30'}`}
                                    >
                                        <asset.icon className={`w-5 h-5 md:w-6 md:h-6 ${vehicleType === asset.id ? 'text-white' : 'text-slate-300'}`} />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{asset.id}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                <input 
                                    type="text"
                                    value={regNumber}
                                    onChange={(e) => setRegNumber(e.target.value)}
                                    placeholder="Registration ID"
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-blue-500/40 transition-all uppercase"
                                />
                            </div>
                         </div>
                    </section>

                    <section className="bg-white dark:bg-surface-dark rounded-3xl md:rounded-[32px] p-4 md:p-6 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-xl md:rounded-2xl flex items-center justify-center">
                                <Package className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                            </div>
                            <h3 className="text-[12px] md:text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Payload Logistics</h3>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest block ml-1">Paddy Variant</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                    <input 
                                        type="text"
                                        list="paddy-variants"
                                        value={paddyType}
                                        onChange={(e) => setPaddyType(e.target.value)}
                                        placeholder="Variant"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-emerald-500/40 transition-all"
                                    />
                                    <datalist id="paddy-variants">
                                        {paddyVariants.map(v => <option key={v} value={v} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 md:gap-4">
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest block ml-1">Bag WT</label>
                                    <input 
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="75"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-emerald-500/40 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest block ml-1">Scale (Opt)</label>
                                    <input 
                                        type="number"
                                        value={weighScaleKgs}
                                        onChange={(e) => handleWeighScaleChange(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-emerald-500/40 transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest block ml-1">Capacity</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={tonCapacity}
                                            onChange={(e) => handleTonCapacityChange(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl px-4 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-emerald-500/40 transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">MT</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest block ml-1">Empty Bags Supply</label>
                                <div className="relative">
                                    <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                                    <input 
                                        type="number"
                                        value={emptyBags}
                                        onChange={(e) => setEmptyBags(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl md:rounded-2xl pl-12 pr-6 py-2.5 md:py-3.5 text-sm md:text-base font-black focus:ring-2 focus:ring-emerald-500/40 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>

        {/* Mobile Spacer to avoid overlap with bottom navigation */}
        <div className="md:hidden h-24 shrink-0" />

        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
              >
                <div className="p-8 lg:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Authorize Entry</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify Mission Parameters</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowConfirmModal(false)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Manifest ID</p>
                        <p className="font-black text-primary uppercase italic text-lg tracking-tighter">#{lotId}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Harvest Date</p>
                        <p className="font-black text-slate-900 dark:text-white">{new Date(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operative</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-lg font-black text-slate-900 dark:text-white">{driverName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{driverMobile}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{vehicleType}</p>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{regNumber}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-3xl border border-slate-100 dark:border-white/5">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <Package className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload</span>
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white mb-1">{paddyType}</p>
                          <p className="text-lg font-black text-emerald-500">{tonCapacity || '0.00'} <span className="text-[10px] uppercase">MT</span></p>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <Building2 className="w-4 h-4 text-purple-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Mill</span>
                          </div>
                          <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-2">{millName}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setShowConfirmModal(false)}
                      className="flex-1 h-16 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-[20px] text-[11px] font-black uppercase tracking-[.2em] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                    >
                      Abort Registry
                    </button>
                    <button
                      onClick={executeSave}
                      disabled={isSaving}
                      className="flex-1 h-16 bg-primary text-background-dark rounded-[20px] text-[11px] font-black uppercase tracking-[.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {isSaving ? (
                        <>
                          <div className="h-4 w-4 border-2 border-background-dark/30 border-t-background-dark rounded-full animate-spin" />
                          Synchronizing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Confirm Entry
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
