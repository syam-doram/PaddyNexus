import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Mountain, Tractor, Star, User, Banknote, Store, Bell, Plus, ChevronRight, CheckCircle2, LogOut, Edit2, X, Package, Users as UsersIcon, ShieldCheck, Lock, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence } from 'motion/react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [bagRate, setBagRate] = useState('0');
  const [machineRate, setMachineRate] = useState('0');
  const [labourRate, setLabourRate] = useState('0');
  const [loadingRates, setLoadingRates] = useState(false);
  const [realStats, setRealStats] = useState({ lots: 0, machines: 0, operators: 0, members: 0 });
  
  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const getDisplayImage = (url?: string | null) => {
    if (!url || url.trim() === "") return null;
    const isLocal = url.startsWith('http://localhost') || url.startsWith('capacitor://') || url.includes('_capacitor_') || url.startsWith('blob:');
    if (isLocal && !Capacitor.isNativePlatform()) return null;
    return url;
  };

  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  const fetchRates = async (year: number) => {
    setLoadingRates(true);
    try {
      const res = await fetch(`${API_BASE_URL}/commissions/${year}?traderId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setBagRate(data.bag_rate.toString());
        setMachineRate(data.machine_hour_rate.toString());
        setLabourRate((data.labour_rate || 0).toString());
      }
    } catch (e) {
      console.error("Failed to fetch rates:", e);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (isTrader) {
      fetchRates(selectedYear);
      
      // Fetch real stats
      const fetchSummary = async () => {
        try {
          const [lotsRes, machinesRes, opsRes, usersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/lot-stages?traderId=${user?.id}`),
            fetch(`${API_BASE_URL}/machines?includeSettled=true&traderId=${user?.id}`),
            fetch(`${API_BASE_URL}/operators?traderId=${user?.id}`),
            fetch(`${API_BASE_URL}/auth/users?traderId=${user?.id}`)
          ]);
          
          let lotsCount = 0;
          let machinesCount = 0;
          let opsCount = 0;
          let usersCount = 0;

          if (lotsRes.ok) {
            const lotsData = await lotsRes.json();
            lotsCount = Array.isArray(lotsData) ? lotsData.length : 0;
          }
          
          if (opsRes.ok) {
            const opsData = await opsRes.json();
            opsCount = Array.isArray(opsData) ? opsData.length : 0;
          }

          if (usersRes.ok) {
             const usersData = await usersRes.json();
             usersCount = Array.isArray(usersData) ? usersData.length : 0;
          }

          setRealStats({ 
            lots: lotsCount, 
            machines: machinesCount,
            operators: opsCount,
            members: usersCount
          });
        } catch (e) {
          console.error("Failed to fetch trader stats:", e);
        }
      };
      fetchSummary();
    }
  }, []);

  const handleSaveCommission = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/commissions/${selectedYear}?traderId=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          bag_rate: parseFloat(bagRate), 
          machine_hour_rate: parseFloat(machineRate),
          labour_rate: parseFloat(labourRate)
        })
      });
      if (res.ok) {
        setIsEditingCommission(false);
        // If it's the current year, also update user context for consistency
        if (selectedYear === new Date().getFullYear() && user) {
           login({ ...user, commission_rate: parseFloat(bagRate) });
        }
      }
    } catch (e) {
      console.error("Failed to save commission:", e);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
        setPassError("Passwords do not match");
        return;
    }
    if (passwordForm.new.length < 4) {
        setPassError("Password must be at least 4 characters");
        return;
    }

    setPassLoading(true);
    setPassError(null);
    try {
        const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: user?.id, 
                oldPassword: passwordForm.old, 
                newPassword: passwordForm.new 
            })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to change password');
        
        setPassSuccess(true);
        setTimeout(() => {
            setIsChangingPassword(false);
            setPassSuccess(false);
            setPasswordForm({ old: '', new: '', confirm: '' });
        }, 2000);
    } catch (err: any) {
        setPassError(err.message);
    } finally {
        setPassLoading(false);
    }
  };

  const handleUpdatePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      if (image.base64String && user) {
        const photoUrl = `data:image/jpeg;base64,${image.base64String}`;
        const res = await fetch(`${API_BASE_URL}/auth/update-photo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, image: photoUrl })
        });

        if (res.ok) {
          login({ ...user, image: photoUrl });
        }
      }
    } catch (err) {
      console.error("Photo update error:", err);
    }
  };

  const isMachine = user?.role === 'machine_harvest';
  const isTrader = user?.role === 'trader';

  const stats = isTrader ? [
    { label: 'Total Lots', value: realStats.lots.toString(), icon: Package, color: 'text-blue-500' },
    { label: 'Operators', value: realStats.operators.toString(), icon: ShieldCheck, color: 'text-orange-500' },
    { label: 'Workforce', value: realStats.members.toString(), icon: UsersIcon, color: 'text-emerald-500' },
  ] : [
    { label: isMachine ? 'Total Acres' : 'Total Lots', value: isMachine ? '450' : '24', icon: Mountain, color: 'text-primary' },
    { label: isMachine ? 'Total Machines' : 'Quintals Sold', value: isMachine ? '12' : '1,200', icon: Tractor, color: 'text-primary' },
    { label: 'App Rating', value: '4.8', icon: Star, color: 'text-yellow-500' },
  ];

  const settings = [
    { id: 'personal', title: 'Personal Information', sub: 'Phone, Address, ID Proof', icon: User, path: '/profile/personal-info' },
    ...(isTrader ? [{ id: 'team', title: 'Team Management', sub: 'Manage Operators & Staff', icon: UsersIcon, path: '/trader/users' }] : []),
    { id: 'bank', title: 'Bank Account Details', sub: 'SBI - xxxx 1234', icon: Banknote, path: '#' },
    { id: 'security', title: 'Security & Password', sub: 'Update Credentials', icon: ShieldCheck, path: 'MODAL' },
    { id: 'notifications', title: 'Notification Settings', sub: 'SMS & Push Enabled', icon: Bell, path: '#' },
  ];

  const years = [2024, 2025, 2026, 2027];

  return (
    <>
    <div className="relative flex h-full w-full flex-col bg-background-light dark:bg-background-dark font-display overflow-hidden">
      {/* Header / Navigation */}
      <div className="flex items-center px-4 lg:px-6 pt-6 lg:pt-12 pb-3 lg:pb-4 justify-between bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 dark:border-white/5">
        <button 
          onClick={() => navigate(-1)}
          className="text-slate-900 dark:text-white flex size-10 lg:size-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>
        <h2 className="text-slate-900 dark:text-white text-sm md:text-base lg:text-lg font-black leading-tight tracking-[-0.015em] flex-1 text-center uppercase tracking-widest">Profile <span className="text-primary italic">Matrix</span></h2>
        <button 
          onClick={handleLogout}
          className="flex size-10 lg:size-12 items-center justify-center rounded-xl md:rounded-2xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

       {/* Scrollable Content */}
       <div className="flex-1 overflow-y-auto pb-32 lg:pb-12 no-scrollbar w-full max-w-7xl mx-auto px-4 lg:px-8">
         <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:pt-10">
           {/* Left Sidebar: Profile & Stats */}
           <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit">
             {/* Profile Info */}
             <div className="bg-white dark:bg-surface-dark lg:rounded-3xl lg:border lg:border-slate-100 lg:dark:border-white/5 lg:shadow-sm">
        <div className="flex p-5 md:p-6 pb-4">
          <div className="flex w-full flex-col gap-3 md:gap-4 items-center">
            <div className="relative group cursor-pointer" onClick={handleUpdatePhoto}>
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 md:h-32 md:w-32 shadow-lg ring-4 ring-white dark:ring-surface-dark overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800" 
              >
                {getDisplayImage(user?.image) ? (
                  <img src={getDisplayImage(user?.image)!} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <User className="w-12 h-12 text-slate-400" />
                )}
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="absolute bottom-1 right-1 bg-primary text-slate-900 p-1.5 rounded-full ring-2 ring-white dark:ring-surface-dark flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-1">
              <h1 className="text-slate-900 dark:text-white text-xl md:text-[22px] font-bold leading-tight tracking-[-0.015em] text-center">{user?.name || 'Loading...'}</h1>
              <div className="flex flex-wrap justify-center items-center gap-2">
                <span className="bg-primary/10 text-primary text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
                  {isTrader ? 'Master Administrator' : isMachine ? 'Verified Machine Harvest' : 'Verified Paddy Harvest'}
                </span>
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  {user?.mobile || '+91 -'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1">
                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <p className="text-xs md:text-sm font-medium">{user?.location || 'Not Specified'}</p>
              </div>
            </div>
          </div>
        </div>
             </div>

        {/* Stats Cards */}
        <div className="flex flex-row gap-3 overflow-x-auto pb-6 no-scrollbar lg:px-0 px-4">
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex min-w-[130px] md:min-w-[140px] flex-1 flex-col gap-1.5 md:gap-2 rounded-xl p-4 md:p-5 bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5"
            >
              <div className={`flex items-center gap-2 ${stat.color}`}>
                <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div>
                <p className="text-slate-900 dark:text-white tracking-tight text-lg md:text-xl lg:text-2xl font-bold leading-tight">{stat.value}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[8px] md:text-[9px] lg:text-[10px] font-bold uppercase tracking-wider mt-0.5 md:mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
           </div>

           {/* Right Content: Commission & Settings */}
           <div className="lg:col-span-8 space-y-6">
        {/* Year-wise Commission Manager (Trader Only) */}
        {isTrader && (
          <div className="lg:px-0 px-4 mb-6">
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Commission Management</h3>
                  <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-widest">Year-wise setup</p>
                </div>
                {!isEditingCommission && (
                  <button 
                    onClick={() => setIsEditingCommission(true)}
                    className="p-2.5 text-primary hover:bg-primary/10 transition-colors bg-primary/5 rounded-xl border border-primary/10"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Year Selector */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-white/5">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 pl-2">Select Year</p>
                <div className="flex gap-1">
                  {years.map(y => (
                    <button
                      key={y}
                      onClick={() => {
                        setSelectedYear(y);
                        fetchRates(y);
                        setIsEditingCommission(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${selectedYear === y ? 'bg-primary text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4 mt-2">
                {/* Bag Rate Card */}
                <div className="flex flex-col gap-1.5 md:gap-2 relative">
                   <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Bag Comm. (₹)</p>
                   {isEditingCommission ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                        <input 
                          type="number"
                          value={bagRate}
                          onChange={(e) => setBagRate(e.target.value)}
                          className="w-full h-12 md:h-14 pl-7 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-bold outline-none text-sm"
                        />
                      </div>
                   ) : (
                      <div className="h-10 md:h-12 flex items-center gap-2 px-1">
                        <span className="text-xl md:text-2xl font-black text-primary tracking-tighter">{bagRate}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">/ Bag</span>
                      </div>
                   )}
                </div>

                {/* Machine Hour Rate Card */}
                <div className="flex flex-col gap-1.5 md:gap-2 relative">
                   <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Machine Hr. (₹)</p>
                   {isEditingCommission ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                        <input 
                          type="number"
                          value={machineRate}
                          onChange={(e) => setMachineRate(e.target.value)}
                          className="w-full h-12 md:h-14 pl-7 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-bold outline-none text-sm"
                        />
                      </div>
                   ) : (
                      <div className="h-10 md:h-12 flex items-center gap-2 px-1">
                        <span className="text-xl md:text-2xl font-black text-blue-500 tracking-tighter">{machineRate}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">/ Hour</span>
                      </div>
                   )}
                </div>

                {/* Labour Rate Card */}
                <div className="flex flex-col gap-1.5 md:gap-2 relative">
                   <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Labour Comm. (₹)</p>
                   {isEditingCommission ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                        <input 
                          type="number"
                          value={labourRate}
                          onChange={(e) => setLabourRate(e.target.value)}
                          className="w-full h-12 md:h-14 pl-7 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white font-bold outline-none text-sm"
                        />
                      </div>
                   ) : (
                      <div className="h-10 md:h-12 flex items-center gap-2 px-1">
                        <span className="text-xl md:text-2xl font-black text-orange-500 tracking-tighter">{labourRate}</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">/ Bag</span>
                      </div>
                   )}
                </div>
              </div>

              {isEditingCommission && (
                <div className="flex gap-3 mt-2">
                  <button 
                    onClick={handleSaveCommission}
                    className="flex-1 h-14 bg-primary text-slate-900 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 text-sm uppercase tracking-widest px-4"
                  >
                    Save {selectedYear} Rates
                  </button>
                  <button 
                    onClick={() => {
                      setIsEditingCommission(false);
                      fetchRates(selectedYear);
                    }}
                    className="w-14 h-14 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

             {/* Settings List */}
             <div className="mt-2 lg:mt-0">
               <div className="bg-white dark:bg-surface-dark rounded-2xl md:rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
                 {settings.map((item, i) => (
                   <motion.button 
                     key={item.id}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => {
                        if (item.path === 'MODAL') setIsChangingPassword(true);
                        else if (item.path !== '#') navigate(item.path);
                     }}
                     className={`w-full flex items-center justify-between p-5 md:p-6 lg:p-8 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${i !== settings.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''} group`}
                   >
                     <div className="flex items-center gap-5 md:gap-6">
                       <div className={`p-3.5 md:p-4 rounded-xl md:rounded-2xl ${item.id === 'team' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                         <item.icon className="w-6 h-6 lg:w-7 lg:h-7" />
                       </div>
                       <div className="text-left">
                         <p className="text-slate-900 dark:text-white text-sm md:text-base font-black leading-normal uppercase tracking-tight">{item.title}</p>
                         <p className="text-slate-500 dark:text-slate-400 text-[10px] md:text-[11px] font-black leading-normal mt-0.5 md:mt-1 uppercase tracking-widest">{item.sub}</p>
                       </div>
                     </div>
                     <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-primary transition-colors" />
                   </motion.button>
                 ))}
               </div>
             </div>
           </div>
         </div>
         {/* End of content */}
       </div>


    </div>

    {/* Change Password Modal */}
    <AnimatePresence>
      {isChangingPassword && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[40px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[85vh] md:h-auto">
            {/* Drag Handle for Mobile */}
            <div className="w-full h-1.5 flex items-center justify-center pt-4 pb-2 md:hidden">
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>

            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Secure <span className="text-primary italic">Credentials</span></h3>
                <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Access Maintenance Module</p>
              </div>
              <button onClick={() => setIsChangingPassword(false)} className="p-2 md:p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl md:rounded-2xl transition-all">
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="p-6 md:p-8 space-y-6">
              {/* Password fields */}
              <div className="space-y-4">
                {/* Old Password */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                    <div className="relative">
                        <input 
                            type={showPasswords.old ? "text" : "password"} 
                            value={passwordForm.old} 
                            onChange={e => setPasswordForm(prev => ({ ...prev, old: e.target.value }))}
                            className="w-full h-14 px-6 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-2xl outline-none font-bold placeholder:text-slate-300"
                            placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPasswords(p => ({ ...p, old: !p.old }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                            {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Credential</label>
                    <div className="relative">
                        <input 
                            type={showPasswords.new ? "text" : "password"} 
                            value={passwordForm.new} 
                            onChange={e => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                            className="w-full h-14 px-6 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-2xl outline-none font-bold placeholder:text-slate-300"
                            placeholder="At least 4 chars"
                        />
                        <button type="button" onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Validate Credential</label>
                    <div className="relative">
                        <input 
                            type={showPasswords.confirm ? "text" : "password"} 
                            value={passwordForm.confirm} 
                            onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                            className="w-full h-14 px-6 bg-slate-50 dark:bg-white/5 border border-transparent focus:border-primary/30 rounded-2xl outline-none font-bold placeholder:text-slate-300"
                            placeholder="Re-type new password"
                        />
                        <button type="button" onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors">
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
              </div>

              {passError && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wide">{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-100/20 rounded-2xl flex items-center gap-3 text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wide">Credentials Verified & Updated</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={passLoading || !passwordForm.old || !passwordForm.new || !passwordForm.confirm}
                className="w-full h-16 bg-primary text-slate-900 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 mt-4"
              >
                {passLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                Authorise Update
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
