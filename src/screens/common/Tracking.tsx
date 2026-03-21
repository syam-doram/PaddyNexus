import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  MoreVertical, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  Warehouse, 
  Package, 
  Phone, 
  ChevronRight, 
  Tractor,
  Activity,
  Navigation,
  Clock,
  ShieldCheck,
  Zap,
  PhoneCall,
  Map as MapIcon,
  Search,
  ExternalLink
} from 'lucide-react';
import apMap from '../../assets/ap_map.png';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';

const STAGE_FLOW: Record<string, string> = {
  '': 'LOADING',
  'PENDING': 'LOADING',
  'HARVESTED': 'LOADING',
  'LOADING': 'LOADED',
  'LOADED': 'IN TRANSIT',
  'IN TRANSIT': 'DELIVERED TO MILL'
};

const STAGE_LABELS: Record<string, string> = {
  '': 'Start Loading',
  'PENDING': 'Start Loading',
  'HARVESTED': 'Start Loading',
  'LOADING': 'Mark as Loaded',
  'LOADED': 'Start Transit',
  'IN TRANSIT': 'Mark as Delivered'
};

export default function Tracking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const traderId = user?.id;
  const lotFromState = location.state?.lot || { dbId: '1', id: '#PD-8829', stage: 'LOADED', paymentStatus: 'UNPAID' };
  
  const [lot, setLot] = useState(lotFromState);
  const [vehiclePosition, setVehiclePosition] = useState({ x: 25, y: 75, rotation: 0 });
  const [transitionTimes, setTransitionTimes] = useState<Record<string, string>>({});
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const fetchLotData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/lot-stages?traderId=${traderId}`);
        if (res.ok) {
          const allLots = await res.json();
          const currentLot = allLots.find((l: any) => l.id === lot.id);
          if (currentLot) {
            setLot((prev: any) => ({ ...prev, ...currentLot }));
            
            const dbTimes: Record<string, string> = {};
            if (currentLot.loaded_at) dbTimes['LOADED'] = currentLot.loaded_at;
            if (currentLot.transit_at) dbTimes['IN TRANSIT'] = currentLot.transit_at;
            if (currentLot.delivered_at) dbTimes['DELIVERED TO MILL'] = currentLot.delivered_at;
            
            setTransitionTimes(prev => ({ ...prev, ...dbTimes }));
          }
        }
      } catch (err) {
        console.error("Error fetching lot data:", err);
      }
    };
    fetchLotData();
  }, [lot.id]);

  useEffect(() => {
    let interval: any;
    if (lot.stage === 'IN TRANSIT' && pathRef.current) {
      const path = pathRef.current;
      const totalLength = path.getTotalLength();
      let progress = 0;

      interval = setInterval(() => {
        progress += 0.5;
        if (progress > totalLength) progress = totalLength;

        const point = path.getPointAtLength(progress);
        const nextPoint = path.getPointAtLength(Math.min(progress + 1, totalLength));
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);

        setVehiclePosition({ x: point.x, y: point.y, rotation: angle });

        if (progress >= totalLength) clearInterval(interval);
      }, 50);
    } else if (['DELIVERED TO MILL', 'QUALITY CHECK', 'PAID'].includes(lot.stage)) {
      setVehiclePosition({ x: 55, y: 15, rotation: 0 });
    } else {
      setVehiclePosition({ x: 25, y: 75, rotation: 0 });
    }
    return () => clearInterval(interval);
  }, [lot.stage]);

  const handleUpdateStage = async (targetStage: string) => {
    if (targetStage === 'IN TRANSIT' && (parseInt(lot.bags) || 0) === 0) {
      alert("Cannot start transit. Please load at least one bag first.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/lots/${encodeURIComponent(lot.id)}/stage?traderId=${traderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage })
      });

      if (res.ok) {
        const now = new Date();
        const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + 
                        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        
        setTransitionTimes(prev => ({ ...prev, [targetStage]: timeStr }));
        setLot((prev: any) => ({ ...prev, stage: targetStage }));
      }
    } catch (err) {
      console.error("Failed to update stage:", err);
    }
  };

  const steps = [
    { 
      id: '1', 
      title: lot.stage === 'LOADING' ? `${lot.vehicle_type || 'Tractor'} Loading` : 'Vehicle Loaded', 
      location: lot.load_area || 'Loading Area', 
      time: transitionTimes['LOADED'] || '--', 
      status: (lot.stage === 'LOADING' || lot.stage === 'LOADED') ? 'active' : (['', 'PENDING', 'HARVESTED'].includes(lot.stage) ? 'pending' : 'completed') 
    },
    { 
      id: '2', 
      title: 'In Transit', 
      location: 'Highway NH16', 
      time: transitionTimes['IN TRANSIT'] || (lot.stage === 'IN TRANSIT' ? 'LIVE' : '--'), 
      status: lot.stage === 'IN TRANSIT' ? 'active' : (['DELIVERED TO MILL', 'QUALITY CHECK', 'PAID'].includes(lot.stage) ? 'completed' : 'pending') 
    },
    { 
      id: '3', 
      title: 'Delivered', 
      location: lot.mill_name || 'Rajahmundry Mill', 
      time: transitionTimes['DELIVERED TO MILL'] || '--', 
      status: lot.stage === 'DELIVERED TO MILL' ? 'active' : (['QUALITY CHECK', 'PAID'].includes(lot.stage) ? 'completed' : 'pending') 
    },
  ];

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100">
      <div className="mx-auto w-full max-w-[1600px] flex flex-col lg:flex-row h-full relative overflow-hidden">
        
        {/* Left Pane: Interactive Map & Header (lg:w-[60%]) */}
        <div className="relative flex-1 lg:w-[60%] h-[50vh] lg:h-full overflow-hidden flex flex-col bg-slate-200 dark:bg-slate-900 border-r border-slate-200 dark:border-white/5">
            
            {/* Header Overlay */}
            <header className="absolute top-0 left-0 right-0 z-50 px-5 py-6 lg:p-6 flex items-center justify-between">
                <div className="flex items-center gap-4 lg:gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex h-11 w-11 lg:h-12 lg:w-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-background-dark transition-all shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-xl px-4 lg:px-6 py-2.5 rounded-[20px] border border-slate-200 dark:border-white/10 shadow-lg">
                        <h1 className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Live Tracking</h1>
                        <h2 className="text-base lg:text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase italic">Lot {lot.id}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-emerald-500 text-white px-3 lg:px-4 py-2 lg:py-2.5 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        <span className="hidden sm:inline">Live Connection</span>
                        <span className="sm:hidden">LIVE</span>
                    </div>
                </div>
            </header>

            {/* Map Canvas */}
            <div className="flex-1 w-full relative">
                <div 
                    className="absolute inset-0 bg-[#E3F2FD] dark:bg-[#0D1B2A] bg-cover bg-center transition-opacity duration-700" 
                    style={{ 
                        backgroundImage: `url(${apMap})`,
                        backgroundBlendMode: 'multiply' 
                    }} 
                />
                
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <motion.path
                    ref={pathRef}
                    d="M 25 75 C 35 60, 45 35, 55 15"
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="text-slate-400 dark:text-slate-600"
                    />
                </svg>

                {/* Origin Marker */}
                <div className="absolute left-[25%] top-[75%] -translate-x-1/2 -translate-y-1/2 z-10 group">
                    <div className="flex flex-col items-center">
                        <div className="bg-white dark:bg-surface-dark px-3 py-1.5 rounded-xl shadow-2xl border border-slate-100 dark:border-white/10 mb-2 opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
                            <p className="text-[10px] font-black text-slate-900 dark:text-white whitespace-nowrap uppercase tracking-widest">Nellore Payload Center</p>
                        </div>
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white dark:border-[#0D1B2A] group-hover:scale-125 transition-transform">
                            <MapPin className="w-3 h-3" />
                        </div>
                    </div>
                </div>

                {/* Destination Marker */}
                <div className="absolute left-[55%] top-[15%] -translate-x-1/2 -translate-y-1/2 z-10 group">
                    <div className="flex flex-col items-center">
                        <div className="bg-white dark:bg-surface-dark px-3 py-1.5 rounded-xl shadow-2xl border border-slate-100 dark:border-white/10 mb-2 opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
                            <p className="text-[10px] font-black text-slate-900 dark:text-white whitespace-nowrap uppercase tracking-widest">{lot.mill_name || 'Target Mill Terminal'}</p>
                        </div>
                        <div className="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white dark:border-[#0D1B2A] group-hover:scale-125 transition-transform">
                            <Warehouse className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Animated Vehicle Telemetry */}
                <motion.div
                    className="absolute z-20"
                    style={{ x: '-50%', y: '-50%' }}
                    animate={{ 
                    left: `${vehiclePosition.x}%`, 
                    top: `${vehiclePosition.y}%`, 
                    rotate: vehiclePosition.rotation 
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                >
                    <div className="relative">
                        <div className="absolute -inset-6 bg-primary/20 rounded-full animate-ping opacity-30"></div>
                        <div className="w-12 h-12 bg-primary text-background-dark rounded-[18px] flex items-center justify-center shadow-2xl border-4 border-white dark:border-[#0D1B2A] transform hover:scale-110 transition-transform">
                            <Truck className="w-6 h-6" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Map Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <button className="w-12 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-xl border border-slate-200 dark:border-white/5 hover:text-primary transition-colors">
                    <Navigation className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-400 shadow-xl border border-slate-200 dark:border-white/5 hover:text-primary transition-colors">
                    <MapIcon className="w-5 h-5" />
                </button>
            </div>
        </div>

        {/* Right Pane: Logistics Manifesto (lg:w-[40%]) */}
        <div className="flex-1 lg:w-[40%] flex flex-col bg-[#F8FAFC] dark:bg-[#0F172A] p-0 lg:p-12 overflow-y-auto no-scrollbar pb-32 lg:pb-12 max-w-md mx-auto w-full">
            <div className="px-5 py-8 lg:p-0">
            
            <section className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Logistics Pipeline</h3>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest italic flex items-center gap-1.5 ${lot.stage === 'IN TRANSIT' ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${lot.stage === 'IN TRANSIT' ? 'bg-primary animate-pulse' : 'bg-slate-400'}`} />
                        {lot.stage}
                    </span>
                </div>

                <div className="space-y-1 relative">
                    <div className="absolute left-[20px] top-6 bottom-6 w-0.5 bg-slate-100 dark:bg-white/5" />
                    {steps.map((step, idx) => (
                        <motion.div 
                            key={step.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`relative flex gap-8 p-6 rounded-[32px] transition-all duration-500 ${step.status === 'active' ? 'bg-white dark:bg-surface-dark shadow-2xl shadow-black/5 ring-1 ring-primary/20 scale-105 z-10' : 'opacity-60'}`}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative z-10 transition-all duration-500 ${
                                step.status === 'completed' ? 'bg-primary text-background-dark' : 
                                step.status === 'active' ? 'bg-primary text-background-dark' : 
                                'bg-slate-100 dark:bg-white/5 text-slate-400 border border-slate-200 dark:border-white/10'
                            }`}>
                                {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                                step.status === 'active' ? <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Truck className="w-5 h-5" /></motion.div> : 
                                <Clock className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{step.title}</h4>
                                    <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-md tracking-tighter">{step.time}</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {step.location}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className="space-y-6 mb-12">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Operative Intelligence</h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                
                <div className="bg-white dark:bg-surface-dark rounded-[40px] p-8 border border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop" className="w-20 h-20 rounded-[28px] object-cover ring-4 ring-primary/10 group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-2xl flex items-center justify-center text-white border-4 border-white dark:border-surface-dark">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">{lot.name || 'Primary Operative'}</h4>
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{lot.reg_number || 'TRX-9902'}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lot.driver_mobile || 'CONTACT SECURE'}</p>
                                </div>
                            </div>
                        </div>
                        <button className="w-14 h-14 bg-primary text-background-dark rounded-[20px] flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all">
                            <PhoneCall className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-[28px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Cargo Manifest</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{lot.type || 'Basmati Sella'}</p>
                        </div>
                        <div className="p-5 rounded-[28px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Net Tonnage</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{lot.weight || '24.5 T'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Protocol Control */}
            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-white/5">
                {!['DELIVERED TO MILL', 'QUALITY CHECK', 'PAID'].includes(lot.stage) ? (
                    <button
                        onClick={() => {
                            const nextStage = STAGE_FLOW[lot.stage] || STAGE_FLOW[''];
                            if (nextStage) handleUpdateStage(nextStage);
                        }}
                        disabled={(['LOADING', 'LOADED'].includes(lot.stage)) && (parseInt(lot.bags) || 0) === 0}
                        className={`w-full group h-14 lg:h-20 bg-primary text-background-dark rounded-xl lg:rounded-[24px] flex items-center justify-between px-8 lg:px-10 font-black text-sm shadow-2xl shadow-primary/20 active:scale-98 transition-all overflow-hidden relative ${
                        (['LOADING', 'LOADED'].includes(lot.stage) && (parseInt(lot.bags) || 0) === 0) ? 'opacity-50 cursor-not-allowed grayscale' : ''
                        }`}
                    >
                        <div className="flex flex-col items-start translate-y-0.5 lg:translate-y-0">
                             <span className="text-[8px] lg:text-[9px] uppercase tracking-[0.3em] opacity-60 leading-none mb-1 lg:mb-0">Authorize Protocol</span>
                             <span className="text-base lg:text-lg uppercase italic tracking-tighter leading-none">
                                {STAGE_LABELS[lot.stage] || STAGE_LABELS['']}
                             </span>
                        </div>
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-background-dark/10 rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform">
                            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-full bg-white/10 -skew-x-[30deg] translate-x-32 group-hover:translate-x-12 transition-transform duration-700" />
                    </button>
                ) : (
                    <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 p-8 rounded-[40px] flex items-center justify-between">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1">Logistics Complete</p>
                            <p className="text-2xl font-black italic tracking-tighter uppercase">Payload Secured</p>
                         </div>
                         <CheckCircle2 className="w-12 h-12 opacity-50" />
                    </div>
                )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
