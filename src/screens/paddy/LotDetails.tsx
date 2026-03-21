import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

import {
  ArrowLeft,
  MoreVertical,
  ShoppingBag,
  Filter,
  Droplet,
  IndianRupee,
  Plus,
  Sprout,
  Tractor,
  User,
  Truck,
  LayoutGrid,
  Pencil,
  Check,
  Phone,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  Scale,
  Activity,
  Package
} from 'lucide-react';


export default function LotDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const traderId = user?.trader_id || user?.id;

  const [lot, setLot] = useState(location.state?.lot || { id: '#PD-2024-081', name: 'R. Singh' });
  const [batches, setBatches] = useState<any[]>([]);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [lotRate, setLotRate] = useState<string>('1200'); // Default demo rate
  const [commissionRate, setCommissionRate] = useState<number>(user?.commission_rate || 0);
  const [labourCommissionRate, setLabourCommissionRate] = useState<number>(0);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editLoadArea, setEditLoadArea] = useState(lot.load_area || '');
  const [editMillName, setEditMillName] = useState(lot.mill_name || lot.mill || '');
  const [editGratuity, setEditGratuity] = useState(lot.gratuity || 0);
  const [isEditingGratuity, setIsEditingGratuity] = useState(false);
  const [postLoadScale, setPostLoadScale] = useState(lot.post_load_scale || 0);
  const [preLoadScale, setPreLoadScale] = useState(lot.pre_load_scale || 0);
  const [isEditingPostScale, setIsEditingPostScale] = useState(false);
  const [isEditingPreScale, setIsEditingPreScale] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  const totalBags = batches.reduce((acc, curr) => acc + (parseInt(curr.bags) || 0), 0);
  const totalWeight = batches.reduce((acc, curr) => {
    return acc + (parseFloat(curr.weight) || 0);
  }, 0);
  const avgWeight = batches.length > 0 ? (totalWeight / batches.length).toFixed(1) : '0';
  const totalCommission = totalBags * (commissionRate || 0);
  const totalLabourCommission = totalBags * (labourCommissionRate || 0);
  const totalDealerEarnings = totalCommission + totalLabourCommission;
  const totalValue = totalBags * (parseFloat(lotRate) || 0);
  
  const isDelivered = lot.stage && !['LOADING', 'LOADED', 'IN TRANSIT'].includes(lot.stage.toUpperCase());

  useEffect(() => {
    // Fetch full lot details to ensure state is fresh
    let lotUrl = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}`;
    if (traderId) lotUrl += `?traderId=${traderId}`;
    fetch(lotUrl)
      .then(res => res.json())
      .then(data => {
        setLot(data);
        setEditLoadArea(data.load_area || '');
        setEditMillName(data.mill_name || data.mill || '');
        setEditGratuity(data.gratuity || 0);
        setPostLoadScale(data.post_load_scale || 0);
        setPreLoadScale(data.pre_load_scale || 0);
      })
      .catch(err => console.error("Error fetching lot details:", err));

    // Fetch batches
    let batchesUrl = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}/batches`;
    if (traderId) batchesUrl += `?traderId=${traderId}`;
    fetch(batchesUrl)
      .then(res => res.json())
      .then(data => {
        const mappedData = data.map((item: any) => {
          let uiProps = {};
          if (item.moistureStatus === 'green') {
            uiProps = { icon: Sprout, iconColor: 'text-green-600', iconBg: 'bg-green-100' };
          } else if (item.moistureStatus === 'yellow') {
            uiProps = { icon: Tractor, iconColor: 'text-orange-600', iconBg: 'bg-orange-100' };
          } else {
            uiProps = { icon: LayoutGrid, iconColor: 'text-blue-600', iconBg: 'bg-blue-100' };
          }
          return { ...item, ...uiProps };
        });
        setBatches(mappedData);
      })
      .catch(err => console.error("Error fetching batches:", err));

    // Fetch saved rate
    let rateUrl = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}/rate`;
    if (traderId) rateUrl += `?traderId=${traderId}`;
    fetch(rateUrl)
      .then(res => res.json())
      .then(data => {
        if (data.rate) setLotRate(data.rate.toString());
      })
      .catch(err => console.error("Error fetching lot rate:", err));

    // Fetch year-wise commission rate
    if (lot.date) {
      const year = new Date(lot.date).getFullYear();
      if (!isNaN(year)) {
        let commUrl = `${API_BASE_URL}/commissions/${year}`;
        if (traderId) commUrl += `?traderId=${traderId}`;
        fetch(commUrl)
          .then(res => res.json())
          .then(data => {
            if (data.bag_rate) setCommissionRate(data.bag_rate);
            if (data.labour_rate) setLabourCommissionRate(data.labour_rate);
          })
          .catch(err => console.error("Error fetching commission rate:", err));
      }
    }
  }, [lot.id, lot.date]);

  const handleSaveRate = async () => {
    setIsEditingRate(!isEditingRate);

    // If we are currently editing and now saving, push to DB
    if (isEditingRate) {
      try {
        let url = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}/rate`;
        if (traderId) url += `?traderId=${traderId}`;
        await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rate: parseInt(lotRate) || 0, traderId })
        });
      } catch (err) {
        console.error("Failed to save rate", err);
      }
    }
  };
  const handleSaveDetails = async () => {
    if (isEditingDetails) {
      try {
        let url = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}`;
        if (traderId) url += `?traderId=${traderId}`;
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            load_area: editLoadArea, 
            mill_name: editMillName, 
            gratuity: parseInt(String(editGratuity)) || 0,
            traderId
          })
        });
        // Update local state to reflect changes
        setLot(prev => ({
          ...prev,
          load_area: editLoadArea,
          mill_name: editMillName,
          gratuity: parseInt(String(editGratuity)) || 0
        }));
      } catch (err) {
        console.error("Failed to save lot details", err);
      }
    }
    setIsEditingDetails(!isEditingDetails);
  };

  const handleSaveGratuity = async () => {
    setIsEditingGratuity(!isEditingGratuity);
    if (isEditingGratuity) {
      try {
        let url = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}`;
        if (user?.id) url += `?traderId=${user.id}`;
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
             gratuity: parseInt(String(editGratuity)) || 0,
             traderId: user?.id
          })
        });
        setLot(prev => ({
          ...prev,
          gratuity: parseInt(String(editGratuity)) || 0
        }));
      } catch (err) {
        console.error("Failed to save gratuity", err);
      }
    }
  };

  const handleSavePostScale = async () => {
    setIsEditingPostScale(!isEditingPostScale);
    if (isEditingPostScale) {
       try {
         let url = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}`;
         if (user?.id) url += `?traderId=${user.id}`;
         await fetch(url, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
              post_load_scale: parseFloat(String(postLoadScale)) || 0,
              traderId: user?.id
           })
         });
         setLot(prev => ({
           ...prev,
           post_load_scale: parseFloat(String(postLoadScale)) || 0
         }));
       } catch (err) {
         console.error("Failed to save post-load scale", err);
       }
    }
  };

  const handleSavePreScale = async () => {
    setIsEditingPreScale(!isEditingPreScale);
    if (isEditingPreScale) {
       try {
         let url = `${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}`;
         if (user?.id) url += `?traderId=${user.id}`;
         await fetch(url, {
           method: 'PATCH',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ 
              pre_load_scale: parseFloat(String(preLoadScale)) || 0,
              traderId: user?.id
           })
         });
         setLot(prev => ({
           ...prev,
           pre_load_scale: parseFloat(String(preLoadScale)) || 0
         }));
       } catch (err) {
         console.error("Failed to save pre-load scale", err);
       }
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100">
      {/* Centered Desktop Container */}
      <div className="mx-auto w-full max-w-[1600px] flex flex-col h-full relative">
        
        {/* Header - Unified with specific Mobile/Web adjustments */}
        <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md pt-5 lg:pt-12 flex flex-col border-b border-slate-100 dark:border-white/5 shrink-0 px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 lg:pb-6 gap-4 sm:gap-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <button onClick={() => navigate(-1)} className="group p-2.5 lg:p-3 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-primary rounded-xl lg:rounded-2xl transition-all">
                <ArrowLeft className="w-4 h-4 lg:w-6 lg:h-6" />
              </button>
              <div>
                <h1 className="text-xl lg:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Lot <span className="text-primary">Details</span></h1>
                <div className="flex items-center gap-1.5 mt-0.5 lg:mt-1">
                  <span className="text-[8px] lg:text-[10px] font-black px-1.5 py-0.5 bg-primary/10 text-primary rounded uppercase tracking-tighter">LOT: {lot.id}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/tracking', { state: { lot } })}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <Activity className="w-4 h-4" />
                <span>Live Tracking</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-3 lg:py-8 pb-32 no-scrollbar">
            {/* Dual-Mode Grid System */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
                
                {/* Section 1: Logistics Payload */}
                <div className="lg:col-span-6 space-y-5 lg:space-y-8">
                    <section className="bg-white dark:bg-[#0F172A] rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-5 lg:mb-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 text-primary">Overview</span>
                                    <h3 className="text-lg lg:text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Logistics Payload</h3>
                                </div>
                                <button 
                                    onClick={handleSaveDetails}
                                    className="p-2 lg:p-2.5 bg-slate-50 dark:bg-white/5 text-slate-400 rounded-xl hover:bg-primary hover:text-background-dark transition-all border border-slate-100 dark:border-white/5"
                                >
                                    {isEditingDetails ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="space-y-3 lg:space-y-4">
                                <div className="bg-slate-50 dark:bg-white/5 rounded-xl lg:rounded-2xl p-4 border border-slate-100 dark:border-white/5 group-hover:bg-primary/5 transition-all duration-500">
                                    <div className="flex items-center gap-3 mb-4 last:mb-0">
                                        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-white dark:bg-[#0F172A] flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-sm">
                                            <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Origin Load Area</p>
                                            {isEditingDetails ? (
                                                <input 
                                                    value={editLoadArea}
                                                    onChange={e => setEditLoadArea(e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border-none rounded-lg px-3 py-1.5 text-xs lg:text-sm font-black focus:ring-2 focus:ring-primary/40 mt-1"
                                                />
                                            ) : (
                                                <p className="text-sm lg:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{editLoadArea || 'Not Specified'}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-white dark:bg-[#0F172A] flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-sm">
                                            <Building2 className="w-4 h-4 lg:w-5 lg:h-5 text-purple-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Destination Mill</p>
                                            {isEditingDetails ? (
                                                <input 
                                                    value={editMillName}
                                                    onChange={e => setEditMillName(e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border-none rounded-lg px-3 py-1.5 text-xs lg:text-sm font-black focus:ring-2 focus:ring-primary/40 mt-1"
                                                />
                                            ) : (
                                                <p className="text-sm lg:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{editMillName || 'Sunrise Mills'}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-white dark:bg-[#0F172A] flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-sm">
                                            <Sprout className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Crop Classification</p>
                                            <p className="text-sm lg:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{lot.type || 'Basmati Sella'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 lg:pt-4 border-t border-slate-100 dark:border-white/5">
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-slate-100 dark:border-white/5">
                                        <p className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary Operator</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-white dark:bg-[#0F172A] flex items-center justify-center border border-slate-100 dark:border-white/10">
                                                <User className="w-3.5 h-3.5 lg:w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-[10px] lg:text-[11px] font-[1000] text-slate-900 dark:text-white truncate uppercase italic leading-none">{lot.name}</p>
                                                <p className="text-[7px] lg:text-[8px] font-bold text-primary truncate leading-none mt-1">{lot.driver_mobile || 'VERIFIED'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-slate-100 dark:border-white/5">
                                        <p className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Fleet Registry</p>
                                        <p className="text-[10px] lg:text-[11px] font-[1000] text-slate-900 dark:text-white uppercase italic leading-none mb-1">{lot.vehicle_type || 'Tractor'}</p>
                                        <p className="text-[7px] lg:text-[8px] font-bold text-slate-400 uppercase tracking-tighter tabular-nums leading-none">{lot.reg_number || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-slate-900 dark:bg-[#0F172A] rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 shadow-sm border border-slate-800 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                         {/* Asset Indicators (Unified) */}
                         <div className="grid grid-cols-3 gap-3 relative z-10 text-white">
                            <div className="space-y-1">
                                <ShoppingBag className="w-4 h-4 lg:w-5 lg:h-5 text-primary mb-3" />
                                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Bags</p>
                                <p className="text-xl lg:text-2xl font-[1000] italic leading-none">{totalBags}</p>
                            </div>
                            <div className="space-y-1 border-x border-white/5 px-2 lg:px-4 text-center">
                                <Scale className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400 mb-3 mx-auto" />
                                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Avg Kg</p>
                                <p className="text-xl lg:text-2xl font-[1000] italic leading-none">{avgWeight}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <Droplet className="w-4 h-4 lg:w-5 lg:h-5 text-blue-400 mb-3 ml-auto" />
                                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Moist.</p>
                                <p className="text-xl lg:text-2xl font-[1000] italic leading-none">13.5<span className="text-[10px] text-primary">%</span></p>
                            </div>
                         </div>
                    </section>

                    <section className="bg-white dark:bg-[#0F172A] rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 text-blue-500">Asset Weight</span>
                                <h3 className="text-lg lg:text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Scale Intelligence</h3>
                            </div>
                            <button 
                                onClick={handleSavePostScale}
                                className="p-2 lg:p-2.5 bg-slate-50 dark:bg-white/5 text-slate-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all border border-slate-100 dark:border-white/5"
                            >
                                {isEditingPostScale ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unladen (Start)</p>
                                    <button 
                                        onClick={handleSavePreScale}
                                        className="p-1 text-slate-400 hover:text-primary transition-all"
                                    >
                                        {isEditingPreScale ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isEditingPreScale ? (
                                        <input 
                                            type="number"
                                            value={preLoadScale}
                                            onChange={e => setPreLoadScale(Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-lg px-2 py-1 text-sm font-black focus:ring-2 focus:ring-primary/40"
                                        />
                                    ) : (
                                        <>
                                            <Scale className="w-4 h-4 text-slate-300" />
                                            <p className="text-xl font-[1000] text-slate-900 dark:text-white italic tabular-nums">{(preLoadScale || 0).toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 not-italic">KG</span></p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2">Laden (Final)</p>
                                <div className="flex items-center gap-2">
                                    {isEditingPostScale ? (
                                        <input 
                                            type="number"
                                            value={postLoadScale}
                                            onChange={e => setPostLoadScale(Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-900 border-none rounded-lg px-2 py-1 text-sm font-black focus:ring-2 focus:ring-blue-500/40"
                                        />
                                    ) : (
                                        <>
                                            <Scale className="w-4 h-4 text-blue-400" />
                                            <p className="text-xl font-[1000] text-slate-900 dark:text-white italic tabular-nums">{(postLoadScale || 0).toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 not-italic">KG</span></p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 bg-primary/10 rounded-2xl p-4 border border-primary/20">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Calculated Net Yield</p>
                                    <p className="text-2xl font-[1000] text-background-dark dark:text-primary italic tabular-nums">
                                        {(Math.max(0, postLoadScale - preLoadScale)).toLocaleString('en-IN')} <span className="text-xs not-italic">KG</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">In Quintals</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white italic tabular-nums">
                                        {(Math.max(0, postLoadScale - preLoadScale) / 100).toFixed(2)} Q
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Section 2: Fiscal Intelligence */}
                <div className="lg:col-span-6 space-y-5 lg:space-y-8">
                    <section className="bg-white dark:bg-[#0F172A] rounded-[24px] lg:rounded-[32px] p-5 lg:p-6 shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group h-full flex flex-col justify-between">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-5 lg:mb-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 text-primary">Financials</span>
                                    <h3 className="text-lg lg:text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Fiscal Intelligence</h3>
                                </div>
                                <div className="w-9 h-9 lg:w-11 lg:h-11 bg-slate-50 dark:bg-white/5 rounded-xl lg:rounded-2xl flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-sm">
                                    <IndianRupee className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-white/5 rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-slate-100 dark:border-white/5 mb-5 lg:mb-6">
                                <p className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Estimated Disbursement</p>
                                <h2 className="text-3xl lg:text-4xl font-[1000] tracking-tighter text-slate-900 dark:text-white leading-none italic tabular-nums">
                                    ₹{totalValue > 0 ? totalValue.toLocaleString('en-IN') : '0'}
                                </h2>
                            </div>

                            <div className="space-y-3 lg:space-y-4">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-slate-100 dark:border-white/5">
                                    <div className="flex-1">
                                        <p className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Rate (Bag)</p>
                                        {isEditingRate ? (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-xs font-black text-primary">₹</span>
                                                <input
                                                    type="number"
                                                    value={lotRate}
                                                    onChange={(e) => setLotRate(e.target.value)}
                                                    className="w-16 lg:w-20 bg-white dark:bg-slate-900 font-black text-sm lg:text-base focus:outline-none px-2 py-0.5 rounded border border-slate-200 dark:border-white/10"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-lg lg:text-xl font-[1000] text-primary italic leading-none tabular-nums">₹{parseFloat(lotRate).toLocaleString('en-IN')}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSaveRate}
                                        className="p-2 lg:p-2.5 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-primary transition-all shadow-sm"
                                    >
                                        {isEditingRate ? <Check className="w-3.5 h-3.5 lg:w-4 h-4" /> : <Pencil className="w-3.5 h-3.5 lg:w-4 h-4" />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2 lg:gap-3">
                                    <div className="flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                <TrendingUp className="w-3.5 h-3.5 lg:w-4 h-4" />
                                            </div>
                                            <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Management</span>
                                        </div>
                                        <p className="text-xs lg:text-sm font-[1000] text-slate-900 dark:text-white italic tabular-nums">₹{totalCommission.toLocaleString('en-IN')}</p>
                                    </div>

                                    <div className="flex items-center justify-between p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-100 dark:border-white/5 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg lg:rounded-xl bg-orange-500/5 flex items-center justify-center text-orange-500 border border-orange-500/10">
                                                <User className="w-3.5 h-3.5 lg:w-4 h-4" />
                                            </div>
                                            <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Labour</span>
                                        </div>
                                        <p className="text-xs lg:text-sm font-[1000] text-orange-500 italic tabular-nums">₹{totalLabourCommission.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>

                            <section className="bg-emerald-500 dark:bg-emerald-600 rounded-xl lg:rounded-[24px] p-4 lg:p-5 text-emerald-950 dark:text-emerald-50 shadow-sm relative overflow-hidden group mt-5 lg:mt-6">
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 flex justify-between items-end">
                                    <div className="flex-1">
                                        <h4 className="text-[8px] lg:text-[9px] font-black uppercase tracking-[0.2em] mb-3 opacity-60">Fleet Incentives</h4>
                                        <p className="text-[7px] lg:text-[8px] font-black uppercase tracking-widest mb-1 opacity-40">Base Gratuity</p>
                                        {isEditingGratuity ? (
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-xl lg:text-2xl font-[1000] italic leading-none">₹</span>
                                                <input
                                                    type="number"
                                                    value={editGratuity}
                                                    onChange={(e) => setEditGratuity(Number(e.target.value))}
                                                    className="w-24 lg:w-32 bg-white/10 text-white font-[1000] text-xl lg:text-2xl italic focus:outline-none px-2 py-0.5 rounded border border-white/20 focus:border-white/40 transition-all shadow-inner"
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-2xl lg:text-3xl font-[1000] italic leading-none tabular-nums">₹{editGratuity}</p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <button 
                                            onClick={handleSaveGratuity}
                                            className="w-10 h-10 lg:w-11 lg:h-11 bg-black/10 rounded-xl lg:rounded-[18px] flex items-center justify-center border border-black/5 hover:bg-black/20 transition-all text-white/50 hover:text-white group/btn shadow-sm"
                                        >
                                            {isEditingGratuity ? <Check className="w-4 h-4 lg:w-5 lg:h-5" /> : <Pencil className="w-4 h-4 lg:w-5 lg:h-5" />}
                                        </button>
                                        <IndianRupee className="w-4 h-4 opacity-20" />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </section>
                </div>

                {/* Section 3: Operational Ledger Batches Grid */}
                <div className="lg:col-span-12 space-y-5 lg:space-y-8 mt-4 lg:mt-8">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex flex-col">
                            <span className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 text-primary">Batches</span>
                            <h3 className="text-lg lg:text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Payload Ledger</h3>
                        </div>
                        {!isDelivered && (
                            <button 
                                onClick={() => navigate('/edit-batch', { state: { lot } })}
                                className="group flex items-center gap-2 px-6 py-3 bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest text-background-dark shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" strokeWidth={3} />
                                <span>Deploy New Batch</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 max-h-[60vh] lg:max-h-[75vh] overflow-y-auto no-scrollbar pr-0.5 pb-8 lg:pb-0">
                        {batches.length > 0 ? (
                            batches.map((batch, index) => (
                                <motion.div
                                    key={batch.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group bg-white dark:bg-[#0F172A] rounded-2xl lg:rounded-[24px] p-4 lg:p-5 shadow-sm border border-slate-100 dark:border-white/5 relative hover:border-primary/40 transition-all duration-300"
                                >
                                     {!isDelivered && (
                                        <button
                                            onClick={() => {
                                                const { icon, ...safeBatchState } = batch;
                                                navigate(`/edit-batch`, {
                                                    state: { batch: safeBatchState, lot }
                                                });
                                            }}
                                            className="absolute top-4 right-4 p-2 bg-slate-50 dark:bg-white/5 rounded-lg text-slate-400 hover:text-primary transition-all border border-slate-100 dark:border-white/10"
                                        >
                                            <Pencil className="w-3.5 h-3.5 lg:w-4 h-4" />
                                        </button>
                                    )}

                                    <div className="flex gap-4 items-center mb-4 lg:mb-5">
                                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center ${batch.iconBg || 'bg-slate-50'} ${batch.iconColor || 'text-slate-400'} border border-slate-100 dark:border-white/5 shadow-sm`}>
                                            {batch.icon ? <batch.icon className="w-5 h-5 lg:w-6 lg:h-6" /> : <LayoutGrid className="w-5 h-5 lg:w-6 lg:h-6" />}
                                        </div>
                                        <div className="truncate">
                                            <h4 className="text-base lg:text-lg font-[1000] text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1.5 italic truncate">{batch.name}</h4>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[7.5px] lg:text-[8px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-widest leading-none">{batch.paddyType || 'STANDARD'}</span>
                                                <span className="text-[8.5px] lg:text-[9px] font-bold text-slate-400 tabular-nums">{batch.date}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-white/5 p-3 rounded-xl lg:rounded-2xl border border-slate-100 dark:border-white/5">
                                        <div className="text-center">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Bags</p>
                                            <p className="text-xs lg:text-sm font-black text-slate-900 dark:text-white tabular-nums">{batch.bags}</p>
                                        </div>
                                        <div className="text-center border-x border-slate-200 dark:border-white/10 px-1">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Mass Kg</p>
                                            <p className="text-xs lg:text-sm font-black text-slate-900 dark:text-white tabular-nums">{batch.weight}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">Moist.</p>
                                            <p className="text-xs lg:text-sm font-black text-primary italic tabular-nums">{batch.moisture}</p>
                                        </div>
                                    </div>

                                    {batch.labour_gratuity > 0 && (
                                        <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center px-1">
                                            <div className="flex items-center gap-1.5">
                                                <Activity className="w-2.5 h-2.5 lg:w-3 h-3 text-emerald-500" />
                                                <span className="text-[7.5px] lg:text-[8px] font-black text-slate-400 uppercase tracking-widest">Efficiency Bonus</span>
                                            </div>
                                            <span className="text-[9px] lg:text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 lg:px-2.5 py-0.5 rounded-md italic">₹{batch.labour_gratuity}</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white dark:bg-[#0F172A] rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm">
                                <div className="w-16 h-16 rounded-[24px] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-4 border border-slate-100 dark:border-white/5 shadow-inner">
                                    <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-sm font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter mb-1">No Batches Deployed</h3>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">
                                    This asset has no recorded payloads. Deploy a new batch to begin verifying yield.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </main>

        {/* Floating Mobile Action Button (Conditional Rendering) */}
        {!isDelivered && (
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <button 
                    onClick={() => navigate('/edit-batch', { state: { lot } })}
                    className="w-16 h-16 bg-primary text-background-dark rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                >
                    <Plus className="w-8 h-8" strokeWidth={3} />
                </button>
            </div>
        )}

      </div>
    </div>
  );
}
