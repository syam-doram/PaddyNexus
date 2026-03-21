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
  ShieldCheck
} from 'lucide-react';

export default function EditBatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const batch = location.state?.batch;
  const [lot, setLot] = useState(location.state?.lot);
  const { user } = useAuth();

  React.useEffect(() => {
    if (lot?.id) {
        let url = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}`;
        if (user?.id) url += `?traderId=${user.id}`;
        fetch(url)
            .then(res => res.json())
            .then(data => setLot(data))
            .catch(err => console.error("Error fetching lot details:", err));
    }
  }, [lot?.id]);

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
    let ptUrl = `${API_BASE_URL}/paddy-types`;
    if (user?.id) ptUrl += `?traderId=${user.id}`;
    fetch(ptUrl)
      .then(res => res.json())
      .then(data => setExistingPaddyTypes(data))
      .catch(err => console.error("Error fetching paddy types:", err));

    let lgUrl = `${API_BASE_URL}/labour-groups`;
    if (user?.id) lgUrl += `?traderId=${user.id}`;
    fetch(lgUrl)
      .then(res => res.json())
      .then(data => setLabourGroups(data))
      .catch(err => console.error("Error fetching labour groups:", err));
  }, [user?.id]);

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
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-6 lg:px-12 py-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-background-dark transition-all"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">
                {isEditing ? 'Configure Batch' : 'Deploy New Batch'}
              </h1>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                <span className="text-primary italic">Manifest Context:</span>
                <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-500">{lot.id}</span>
                {lot.labour_group_name && (
                  <>
                    <span className="text-slate-300 mx-1">•</span>
                    <span className="text-primary italic">Labour Group:</span>
                    <span className="bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-500">{lot.labour_group_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {isDelivered ? (
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Manifest Delivered & Locked
            </div>
          ) : (
            <button
                onClick={handleSave}
                className="hidden md:flex items-center gap-3 px-8 py-4 bg-primary text-background-dark rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                  <Save className="w-4 h-4" />
                  Commit Configuration
              </button>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-8 pb-32 lg:pb-8 overflow-y-auto no-scrollbar">
            <div className="max-w-3xl mx-auto w-full space-y-8">
                
                {/* Identification & Status */}
                <div className="space-y-6">
                    {isDelivered && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                This manifest has been officially delivered. Modifying payload specifications or deploying new batches is restricted to maintain supply chain data integrity.
                            </p>
                        </div>
                    )}
                    <AnimatePresence>
                        {validationError && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }} 
                                className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
                            >
                                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-relaxed">
                                    {validationError}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8">
                            <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center ${statusConfig.bg} ${statusConfig.text} border border-current opacity-20 group-hover:opacity-100 transition-all duration-500`}>
                                <StatusIcon className="w-8 h-8" />
                            </div>
                        </div>

                        <div className="relative z-10 space-y-8">
                            <div className="space-y-4">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                                    {statusConfig.label}
                                </span>
                                <div className="mt-4">
                                    <label className="text-[10px] font-black text-primary uppercase tracking-widest block ml-1 mb-2 flex items-center gap-1">
                                        Farmer Identification <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'name'));
                                        }}
                                        className={`w-full bg-transparent border-none p-0 text-2xl lg:text-3xl font-black uppercase italic tracking-tighter focus:ring-0 placeholder:text-slate-100 dark:placeholder:text-slate-900 transition-colors ${errorFields.includes('name') ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}
                                        placeholder="Farmer Name"
                                    />
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 dark:border-white/5 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-1">
                                        Paddy Morph Grade <span className="text-rose-500">*</span>
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
                                            className={`w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl pl-12 pr-6 py-3 text-sm font-black transition-all border ${errorFields.includes('paddyType') ? 'border-rose-500 animate-pulse ring-2 ring-rose-500/20' : 'border-none focus:ring-2 focus:ring-primary/40'}`}
                                        />
                                        <datalist id="paddy-types">
                                            {existingPaddyTypes.map(type => (
                                                <option key={type} value={type} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 flex items-center gap-1">
                                        Secure Contact Uplink <span className="text-rose-500">*</span>
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
                                            className={`w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl pl-12 pr-6 py-3 text-sm font-black transition-all border ${errorFields.includes('mobile') ? 'border-rose-500 animate-pulse ring-2 ring-rose-500/20' : 'border-none focus:ring-2 focus:ring-primary/40'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 lg:p-8 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                         <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-slate-500/10 rounded-2xl flex items-center justify-center border border-slate-500/20">
                                    <TrendingUp className="w-6 h-6 text-slate-500" />
                                </div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Fiscal Bonus Structures</h3>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Labour Gratuity (Fixed)</label>
                                <div className="flex items-center gap-5">
                                    <span className="text-3xl font-black text-slate-400 italic">₹</span>
                                    <input 
                                        type="number"
                                        value={labourGratuity}
                                        onChange={(e) => setLabourGratuity(e.target.value)}
                                        className="bg-transparent border-none p-0 text-4xl font-black text-slate-900 dark:text-white italic focus:ring-0 w-full placeholder:text-slate-200"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                         </div>
                         <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-slate-500/5 rounded-full blur-[100px]" />
                    </section>

                    <section className="bg-white dark:bg-surface-dark rounded-[32px] p-6 lg:p-8 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                                <User className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Labour Coordination</h3>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Assigned Labour Group</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 z-10" />
                                <select 
                                    value={selectedLabourGroupId}
                                    onChange={(e) => setSelectedLabourGroupId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-none rounded-xl pl-12 pr-10 py-3.5 text-sm font-black focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none relative"
                                >
                                    <option value="">No Group Assigned</option>
                                    {labourGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                            </div>
                        </div>
                    </section>
                </div>
                
                {/* Payload Specs & Conditions */}
                <div className="space-y-8">
                     <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <ShoppingBag className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1">
                                    Quantity Metrics <span className="text-rose-500">*</span>
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <input 
                                        type="number"
                                        value={bags}
                                        onChange={(e) => {
                                            setBags(e.target.value);
                                            if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'bags'));
                                        }}
                                        className={`w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl px-4 py-4 text-3xl font-black italic transition-all text-center border ${errorFields.includes('bags') ? 'border-rose-500 text-rose-500 ring-2 ring-rose-500/20' : 'border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40'}`}
                                        placeholder="000"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Total Bags</span>
                                </div>
                                <div className="relative">
                                    <Scale className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errorFields.includes('weight') ? 'text-rose-500' : 'text-slate-300'}`} />
                                    <input 
                                        type="number"
                                        value={weight}
                                        onChange={(e) => {
                                            setWeight(e.target.value);
                                            if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'weight'));
                                        }}
                                        className={`w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl pl-16 pr-6 py-3.5 text-lg font-black italic transition-all border ${errorFields.includes('weight') ? 'border-rose-500 text-rose-500 ring-2 ring-rose-500/20' : 'border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/40'}`}
                                        placeholder="00.0"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">KG PER BAG</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-surface-dark rounded-[32px] p-6 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 space-y-4 text-center">
                             <div className="flex items-center justify-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                    <Droplet className="w-6 h-6 text-blue-500" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1">
                                    Hydro Calibration <span className="text-rose-500">*</span>
                                </h3>
                            </div>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={moisture}
                                    onChange={(e) => {
                                        setMoisture(e.target.value);
                                        if (e.target.value) setErrorFields(prev => prev.filter(f => f !== 'moisture'));
                                    }}
                                    className={`w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl px-4 py-8 text-4xl font-black italic transition-all text-center border ${errorFields.includes('moisture') ? 'border-rose-500 text-rose-500 ring-2 ring-rose-500/20' : 'border-none text-blue-500 focus:ring-2 focus:ring-blue-500/40'}`}
                                    placeholder="00.0"
                                />
                                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">PERCENTAGE MOISTURE</span>
                            </div>
                        </div>
                     </section>

                     <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Market Liquidity Type</label>
                            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl gap-1">
                                {['Spot Cash', 'Barrow'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setAmountType(type)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${amountType === type ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Moisture Baseline</label>
                            <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl gap-1">
                                {['Dry Paddy', 'Wet Paddy'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setMoistureType(type)}
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${moistureType === type ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                     </section>

                     <div className="bg-primary/5 border border-primary/20 rounded-[32px] p-6 flex items-start gap-4">
                        <Info className="w-10 h-10 text-primary shrink-0" />
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">Automated Calibration Active</h4>
                            <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                Our sensory suite automatically maps moisture content to yield predictions. 
                                Dry paddy ({"<"}14%) triggers immediate premium classification.
                            </p>
                        </div>
                     </div>
                </div>
            </div>
        </main>

        {/* Mobile Action Bar */}
        {!isDelivered && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-slate-100 dark:border-white/5">
              <button
                  onClick={handleSave}
                  className="w-full py-4 bg-primary text-background-dark rounded-2xl text-[11px] font-black uppercase tracking-[.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                  <Save className="w-5 h-5" />
                  Commit Batch Specs
              </button>
          </div>
        )}

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
