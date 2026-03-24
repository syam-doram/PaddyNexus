import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';
import { 
  ArrowLeft, 
  Save, 
  ShoppingBag, 
  Droplet, 
  Filter, 
  Tractor, 
  LayoutGrid, 
  Sprout, 
  Phone, 
  IndianRupee,
  User,
  Info,
  ChevronRight,
  TrendingUp,
  Scale,
  AlertCircle,
  Check,
  ShieldCheck,
  Plus
} from 'lucide-react';

export default function EditBatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const batch = location.state?.batch;
  const [lot, setLot] = useState(location.state?.lot);
  const { user } = useAuth();

  React.useEffect(() => {
    if (lot?.id) {
        const traderId = user?.trader_id || user?.id;
        let url = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}`;
        if (traderId) url += `?traderId=${traderId}`;
        fetch(url)
            .then(res => res.json())
            .then(data => setLot(data))
            .catch(err => console.error("Error fetching lot details:", err));
    }
  }, [lot?.id, user]);

  const isDelivered = lot?.stage && !['LOADING', 'LOADED', 'IN TRANSIT'].includes(lot.stage.toUpperCase());

  if (!lot) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F8FAFC] dark:bg-[#0F172A] p-6">
        <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] mb-6">No mission context established</p>
        <button onClick={() => navigate(-1)} className="px-8 py-4 bg-primary text-background-dark rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Emergency Return</button>
      </div>
    );
  }

  const isEditing = !!batch;
  const [name, setName] = useState(batch?.name || '');
  const [paddyType, setPaddyType] = useState(batch?.paddyType || '');
  const [bags, setBags] = useState(batch?.bags || '');
  const [weight, setWeight] = useState(batch?.weight ? batch.weight.replace(/[^\d.]/g, '') : '');
  const [moisture, setMoisture] = useState(batch?.moisture ? batch.moisture.replace('%', '') : '');
  const [amountType, setAmountType] = useState(batch?.amountType || 'Spot Cash');
  const [moistureType, setMoistureType] = useState(batch?.moistureType || 'Dry Paddy');
  const [mobile, setMobile] = useState(batch?.mobile || '');
  const [labourGratuity, setLabourGratuity] = useState(batch?.labour_gratuity || '');
  const [existingPaddyTypes, setExistingPaddyTypes] = useState<string[]>([]);
  const [labourGroups, setLabourGroups] = useState<any[]>([]);
  const [selectedLabourGroupId, setSelectedLabourGroupId] = useState(lot?.labour_group_id || '');

  React.useEffect(() => {
    const traderId = user?.trader_id || user?.id;
    let ptUrl = `${API_BASE_URL}/paddy-types`;
    if (traderId) ptUrl += `?traderId=${traderId}`;
    fetch(ptUrl)
      .then(res => res.json())
      .then(data => setExistingPaddyTypes(data))
      .catch(err => console.error("Error fetching paddy types:", err));

    let lgUrl = `${API_BASE_URL}/labour-groups`;
    if (traderId) lgUrl += `?traderId=${traderId}`;
    fetch(lgUrl)
      .then(res => res.json())
      .then(data => setLabourGroups(data))
      .catch(err => console.error("Error fetching labour groups:", err));
  }, [user]);

  const IconMap: any = {
    green: { icon: Sprout, bg: 'bg-green-500/10', text: 'text-green-500', label: 'Optimum Yield' },
    yellow: { icon: Tractor, bg: 'bg-orange-500/10', text: 'text-orange-500', label: 'Processing Req' },
    red: { icon: LayoutGrid, bg: 'bg-blue-500/10', text: 'text-blue-500', label: 'High Priority' }
  };
  
  const statusConfig = isEditing && batch?.moistureStatus ? IconMap[batch.moistureStatus] || IconMap['green'] : IconMap['green'];
  const StatusIcon = statusConfig.icon;

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [errorFields, setErrorFields] = useState<string[]>([]);

  const handleSave = () => {
    const missing = [];
    if (!name) missing.push('name');
    if (!paddyType) missing.push('paddyType');
    if (!bags) missing.push('bags');
    if (!weight) missing.push('weight');
    if (!moisture) missing.push('moisture');
    if (!mobile) missing.push('mobile');

    if (missing.length > 0) {
      setErrorFields(missing);
      setValidationError("Registration halted: Please fill in all mandatory specifications highlighted in red before committing.");
      return;
    }
    setErrorFields([]);
    setValidationError('');
    setShowConfirmDialog(true);
  };

  const commitData = async () => {

    try {
      const endpoint_base = isEditing 
        ? `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}/batches/${batch.id}`
        : `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}/batches`;

      let endpoint = endpoint_base;
      if (user?.id) endpoint += `?traderId=${user.id}`;

      const method = isEditing ? 'PUT' : 'POST';

      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'New Batch',
          paddyType: paddyType,
          bags: parseInt(bags) || 0,
          weight: `${weight} KG`,
          moisture: `${moisture}%`,
          amountType,
          moistureType,
          mobile,
          labour_gratuity: parseInt(labourGratuity) || 0,
          traderId: user?.id
        })
      });

      // Update lot's labour group if changed
      if (selectedLabourGroupId !== lot?.labour_group_id) {
        let lotPatchUrl = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}`;
        if (user?.id) lotPatchUrl += `?traderId=${user.id}`;
        await fetch(lotPatchUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ labour_group_id: selectedLabourGroupId, traderId: user?.id })
        });
      }
    } catch (error) {
      console.error("Failed to commit batch:", error);
    }
    setShowConfirmDialog(false);
    navigate(-1);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1400px] flex flex-col h-full relative">
        
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-4 lg:px-12 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 lg:gap-6 flex-1 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="group flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-xl lg:rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-background-dark transition-all shrink-0"
            >
              <ArrowLeft className="w-5 h-5 lg:w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="truncate">
              <h1 className="text-lg lg:text-3xl font-[1000] tracking-tighter text-slate-900 dark:text-white uppercase italic truncate">
                {isEditing ? 'Configure Batch' : 'New Batch'}
              </h1>
              <div className="flex items-center gap-1.5 text-[7px] lg:text-[10px] font-bold text-slate-400 mt-0.5 lg:mt-1 uppercase tracking-widest truncate">
                <span className="text-primary italic">LOT:</span>
                <span className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-slate-500">{lot.id}</span>
                {lot.labour_group_name && (
                  <span className="text-slate-500 truncate ml-1">{lot.labour_group_name}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isDelivered ? (
              <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-3 lg:px-8 py-2.5 lg:py-4 bg-primary text-background-dark rounded-xl lg:rounded-2xl text-[9px] lg:text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Commit Configuration</span>
                    <span className="sm:hidden">Commit</span>
                </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Manifest Locked</span>
                <span className="sm:hidden">Locked</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-3 lg:p-8 pb-12 lg:pb-8 overflow-y-auto no-scrollbar">
            <div className="max-w-2xl mx-auto w-full space-y-4 lg:space-y-6">
                
                {/* Identification & Status */}
                <div className="space-y-4">
                    {isDelivered && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                This manifest has been officially delivered. Modifying payload specifications is restricted.
                            </p>
                        </div>
                    )}
                    <AnimatePresence>
                        {validationError && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }} 
                                className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-3 flex items-start gap-3 shadow-sm"
                            >
                                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <p className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-relaxed">
                                    {validationError}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <section className="bg-white dark:bg-surface-dark rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 shadow-xl shadow-black/5 border border-slate-100 dark:border-white/5 relative overflow-hidden group space-y-6">
                        {/* Status Ribbon */}
                        <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                                {statusConfig.label}
                            </span>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusConfig.bg} ${statusConfig.text} border border-current opacity-20`}>
                                <StatusIcon className="w-5 h-5" />
                            </div>
                        </div>

                        {/* Farmer Identification Section */}
                        <div className="space-y-4">
                            <div className="mt-2">
                                <label className="text-[9px] font-black text-primary uppercase tracking-widest block ml-1 mb-1.5 flex items-center gap-1">
                                    Farmer Identification <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errorFields.includes('name') ? 'text-rose-500' : 'text-slate-300'}`} />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'name'));
                                        }}
                                        className={`w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-12 pr-6 py-4 text-xl lg:text-3xl font-black uppercase italic tracking-tighter focus:ring-2 focus:ring-primary/40 placeholder:text-slate-200 dark:placeholder:text-slate-800 transition-colors ${errorFields.includes('name') ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}
                                        placeholder="Farmer Name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-1">
                                        Paddy Grade <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Sprout className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errorFields.includes('paddyType') ? 'text-rose-500' : 'text-slate-300'}`} />
                                        <input 
                                            type="text"
                                            list="paddy-types"
                                            value={paddyType}
                                            onChange={(e) => {
                                                setPaddyType(e.target.value);
                                                if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'paddyType'));
                                            }}
                                            placeholder="e.g. Basmati 1121"
                                            className={`w-full bg-slate-100 dark:bg-white/5 rounded-xl pl-12 pr-4 py-4 text-xs font-black transition-all border ${errorFields.includes('paddyType') ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-none focus:ring-2 focus:ring-primary/40'}`}
                                        />
                                        <datalist id="paddy-types">
                                            {existingPaddyTypes.map(type => (
                                                <option key={type} value={type} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-1">
                                        Contact Number <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errorFields.includes('mobile') ? 'text-rose-500' : 'text-slate-300'}`} />
                                        <input 
                                            type="tel"
                                            value={mobile}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0,10);
                                                setMobile(val);
                                                if (val) setErrorFields(prev => prev.filter(f => f !== 'mobile'));
                                            }}
                                            placeholder="Mobile Network ID"
                                            className={`w-full bg-slate-100 dark:bg-white/5 rounded-xl pl-12 pr-4 py-4 text-xs font-black transition-all border ${errorFields.includes('mobile') ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-none focus:ring-2 focus:ring-primary/40'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Combined Metrics Card Area */}
                        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Quantity Metrics Section */}
                                <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <ShoppingBag className="w-4 h-4 text-primary" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            Quantity Metrics <span className="text-rose-500">*</span>
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="relative">
                                            <ShoppingBag className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errorFields.includes('bags') ? 'text-rose-500' : 'text-slate-300'}`} />
                                            <input 
                                                type="number"
                                                value={bags}
                                                onChange={(e) => {
                                                    setBags(e.target.value);
                                                    if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'bags'));
                                                }}
                                                className={`w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-10 pr-4 py-3.5 text-[14px] font-black italic transition-all border ${errorFields.includes('bags') ? 'border-rose-500 text-rose-500 ring-2 ring-rose-500/20' : 'border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40'}`}
                                                placeholder="Bags"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-300 uppercase tracking-widest">PCS</span>
                                        </div>
                                        <div className="relative">
                                            <Scale className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errorFields.includes('weight') ? 'text-rose-500' : 'text-slate-300'}`} />
                                            <input 
                                                type="number"
                                                value={weight}
                                                onChange={(e) => {
                                                    setWeight(e.target.value);
                                                    if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'weight'));
                                                }}
                                                className={`w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-10 pr-4 py-3.5 text-[14px] font-black italic transition-all border ${errorFields.includes('weight') ? 'border-rose-500 text-rose-500 ring-2 ring-rose-500/20' : 'border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40'}`}
                                                placeholder="Kg"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-300 uppercase tracking-widest">KG</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Hydro Calibration Section */}
                                <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 space-y-4">
                                     <div className="flex items-center gap-3 w-full">
                                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                            <Droplet className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            Hydro Calibration <span className="text-rose-500">*</span>
                                        </h3>
                                    </div>
                                    <div className="relative w-full">
                                        <Droplet className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errorFields.includes('moisture') ? 'text-rose-500' : 'text-slate-300'}`} />
                                        <input 
                                            type="number"
                                            value={moisture}
                                            onChange={(e) => {
                                                setMoisture(e.target.value);
                                                if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'moisture'));
                                            }}
                                            className={`w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-12 pr-12 py-4 text-xl font-black italic transition-all border ${errorFields.includes('moisture') ? 'border-rose-500 text-rose-500 ring-2 ring-rose-500/20' : 'border-none text-blue-500 focus:ring-2 focus:ring-blue-500/40'}`}
                                            placeholder="Moisture %"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[7px] font-black text-slate-300 uppercase tracking-widest">% MC</span>
                                    </div>
                                </div>
                            </div>

                            {/* Labour Coordination & Gratuity Section */}
                            <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                                        <User className="w-5 h-5 text-indigo-500" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Labour Coordination</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 z-10" />
                                        <select 
                                            value={selectedLabourGroupId}
                                            onChange={(e) => setSelectedLabourGroupId(e.target.value)}
                                            className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-12 pr-8 py-4 text-xs font-black focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none relative"
                                        >
                                            <option value="">No Group Assigned</option>
                                            {labourGroups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                                    </div>

                                    <div className="relative flex items-center bg-slate-100 dark:bg-white/5 px-4 py-4 rounded-xl border-t border-slate-50 dark:border-white/5">
                                        <div className="flex items-center gap-2 flex-1">
                                            <TrendingUp className="w-4 h-4 text-indigo-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gratuity (₹)</span>
                                        </div>
                                        <div className="flex items-center bg-white/40 dark:bg-black/20 px-4 py-2 rounded-lg border border-slate-100 dark:border-white/5">
                                            <IndianRupee className="w-3.5 h-3.5 text-slate-400 mr-2" />
                                            <input 
                                                type="number"
                                                value={labourGratuity}
                                                onChange={(e) => setLabourGratuity(e.target.value)}
                                                className="bg-transparent border-none p-0 text-base font-black text-slate-900 dark:text-white italic focus:ring-0 w-24 text-right"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Liquidity and Baseline Section */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Liquidity</label>
                                    <div className="flex bg-white dark:bg-slate-900/50 p-1 rounded-xl gap-1">
                                        {['Spot Cash', 'Barrow'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setAmountType(type)}
                                                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${amountType === type ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-2">Baseline</label>
                                    <div className="flex bg-white dark:bg-slate-900/50 p-1 rounded-xl gap-1">
                                        {['Dry Paddy', 'Wet Paddy'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setMoistureType(type)}
                                                className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${moistureType === type ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-[24px] p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">
                        Automated Calibration Active: Dry paddy (less than 14%) triggers immediate premium classification.
                    </p>
                </div>
            </div>
        </main>



        {/* Confirmation Modal */}
        <AnimatePresence>
          {showConfirmDialog && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-100 dark:border-white/10 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Confirm Payload</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
                  You are about to deploy this batch into the primary ledger. Please verify the core specifications below to ensure no details are missed.
                </p>

                <div className="space-y-3 mb-8 bg-slate-50 dark:bg-white/5 p-5 rounded-[24px] border border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Farmer</span>
                    <span className="text-[11px] font-[1000] text-slate-900 dark:text-white uppercase italic truncate max-w-[150px]">{name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Morph Grade</span>
                    <span className="text-[11px] font-[1000] text-primary uppercase italic">{paddyType}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Volume (Bags @ Kg)</span>
                    <span className="text-[11px] font-[1000] text-slate-900 dark:text-white uppercase italic">{bags} Bags @ {weight}kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Moisture Baseline</span>
                    <span className="text-[11px] font-[1000] text-blue-500 uppercase italic">{moisture}% ({moistureType})</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-white/5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payout Logic</span>
                    <span className="text-[11px] font-[1000] text-slate-600 dark:text-slate-400 uppercase italic">{amountType} / {labourGratuity ? `₹${labourGratuity} Bonus` : 'No Bonus'}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowConfirmDialog(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/5"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={commitData}
                    className="flex-1 py-4 bg-primary text-background-dark rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Deploy
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
