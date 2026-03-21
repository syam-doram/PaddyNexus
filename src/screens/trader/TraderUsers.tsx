import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Smartphone, MapPin, Plus, Tractor, Sprout, Shield, Users as UsersIcon, Trash2, Search, Bell, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';
import { useNavigate } from 'react-router-dom';

interface TeamMember {
  id: number;
  name: string;
  mobile: string;
  location: string;
  role: string;
}

export default function TraderUsers() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [role, setRole] = useState<'machine_harvest' | 'paddy_harvest'>('machine_harvest');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/auth/users`;
      if (currentUser?.id) url += `?traderId=${currentUser.id}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.filter((u: any) => u.role !== 'trader' && u.id !== currentUser?.id));
      }
    } catch (err) {
      console.error('Failed to fetch team members', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      let url = `${API_BASE_URL}/auth/users/${id}`;
      if (currentUser?.id) url += `?traderId=${currentUser.id}`;
      
      const response = await fetch(url, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete team member');
      }
      setDeleteConfirmationId(null);
      fetchTeamMembers();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, password, location, role, traderId: currentUser?.id }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to register team member');
      }
      setName('');
      setMobile('');
      setPassword('');
      setLocation('');
      setShowAddModal(false);
      fetchTeamMembers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.mobile.includes(searchQuery) ||
    m.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative h-full flex flex-col w-full bg-[#F8FAFC] dark:bg-background-dark font-display">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md px-6 pt-12 pb-6 border-b border-slate-100 dark:border-white/5 shrink-0">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Team <span className="text-primary">Management</span></h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Personnel & Access Control</p>
          </div>
          <div className="flex items-center gap-3">
             <button className="hidden md:flex p-3 bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/10 rounded-2xl text-slate-400">
                <Bell className="w-5 h-5" />
             </button>
             <button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-primary text-background-dark font-black rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2 active:scale-95 transition-all text-[11px] uppercase tracking-widest"
             >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Register Member</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search by name, mobile or area..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-4 text-[13px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 transition-all shadow-inner" 
                />
            </div>
            
            <div className="hidden lg:flex items-center gap-4 bg-white dark:bg-surface-dark p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-2 px-3 border-r border-slate-100 dark:border-white/5">
                    <Tractor className="w-4 h-4 text-orange-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{teamMembers.filter(m => m.role === 'machine_harvest').length} Machine</span>
                </div>
                <div className="flex items-center gap-2 px-3">
                    <Sprout className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{teamMembers.filter(m => m.role === 'paddy_harvest').length} Paddy</span>
                </div>
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 pt-8 pb-32 no-scrollbar">
        
        <div className="flex items-center justify-between mb-8 px-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <div className="w-2 h-8 bg-primary rounded-full" />
                Team Directory <span className="text-slate-400 font-bold text-sm ml-2">({filteredMembers.length})</span>
            </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-32 bg-white dark:bg-surface-dark rounded-[32px] animate-pulse border border-slate-100 dark:border-white/5" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20 bg-white dark:bg-surface-dark rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <UsersIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No members discovered</p>
            <p className="text-[10px] font-bold text-slate-300 mt-2">Adjust your filters or add a new team member</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((member, idx) => (
                <motion.div 
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-white dark:bg-surface-dark p-6 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-5 mb-6">
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-colors ${member.role === 'machine_harvest' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>
                      {member.role === 'machine_harvest' ? <Tractor className="w-8 h-8" /> : <Sprout className="w-8 h-8" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight truncate">{member.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{member.role === 'machine_harvest' ? 'Machine Ops' : 'Paddy Logistics'}</p>
                    </div>
                    <button 
                      onClick={() => setDeleteConfirmationId(member.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight">{member.mobile}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-red-400 transition-colors">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white tracking-tight truncate">{member.location}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmationId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[40px] p-8 shadow-2xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Delete Member?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8 leading-relaxed">This action cannot be undone. All data for this member will be permanently removed.</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDeleteConfirmationId(null)} className="py-4 px-6 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-black rounded-2xl transition-all uppercase text-xs tracking-widest">Cancel</button>
                <button onClick={() => handleDeleteUser(deleteConfirmationId)} className="py-4 px-6 bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/20 active:scale-95 transition-all uppercase text-xs tracking-widest">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-[#F8FAFC] dark:bg-background-dark w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl relative overflow-hidden h-[92vh] sm:h-auto flex flex-col">
              {/* Drag Handle for Mobile */}
              <div className="w-full h-1.5 flex items-center justify-center pt-1 pb-4 sm:hidden">
                <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>

              <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">New Member</h2>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Access Registration</p>
                </div>
                <button onClick={() => { setShowAddModal(false); setErrorMsg(''); }} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 font-black transition-colors hover:text-slate-600 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-500 rounded-2xl text-[11px] font-black uppercase tracking-tight">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-10">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl mb-8">
                  <button type="button" onClick={() => setRole('machine_harvest')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${role === 'machine_harvest' ? 'bg-white dark:bg-slate-800 text-primary shadow-md' : 'text-slate-400'}`}>
                    <Tractor className="w-4 h-4" />
                    Machine
                  </button>
                  <button type="button" onClick={() => setRole('paddy_harvest')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${role === 'paddy_harvest' ? 'bg-white dark:bg-slate-800 text-primary shadow-md' : 'text-slate-400'}`}>
                    <Sprout className="w-4 h-4" />
                    Paddy
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[22px] pl-12 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[22px] pl-12 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} required />
                  </div>
                  <div className="relative group">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[22px] pl-12 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
                    <input className="w-full h-14 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[22px] pl-12 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" placeholder="Work Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-primary text-background-dark h-16 rounded-[24px] text-xs font-black uppercase tracking-widest mt-6 shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50">
                  {isSubmitting ? 'Registering...' : 'Register Team Member'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
