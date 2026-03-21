import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, ArrowLeft, Plus, Trash2, 
  ChevronRight, ChevronDown, MapPin, Phone, 
  Calendar, BadgeCheck, X, User, IndianRupee, Save, Edit2, Building2, TrendingUp, Filter, AlertCircle, PhoneCall, History
} from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface Member {
  id?: number;
  name: string;
  mobile: string;
  role: string;
}

interface Group {
  id: string;
  name: string;
  location: string;
  contact_number: string;
  registration_date: string;
  members?: Member[];
}

export default function LabourEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const traderId = user?.id;
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLocation, setNewGroupLocation] = useState('');
  const [newGroupContact, setNewGroupContact] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState<Member[]>([
    { name: '', mobile: '', role: 'Labour' }
  ]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/labour-groups?traderId=${traderId}`);
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch labour groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchMembers = async (groupId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/labour-groups/${groupId}/members?traderId=${traderId}`);
      const data = await res.json();
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: data } : g));
    } catch (err) {
      console.error("Failed to fetch members:", err);
    }
  };

  const toggleGroup = (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
    } else {
      setExpandedGroupId(groupId);
      const group = groups.find(g => g.id === groupId);
      if (group && !group.members) {
        fetchMembers(groupId);
      }
    }
  };

  const addMemberRow = () => {
    setNewGroupMembers([...newGroupMembers, { name: '', mobile: '', role: 'Labour' }]);
  };

  const removeMemberRow = (index: number) => {
    setNewGroupMembers(newGroupMembers.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof Member, value: string) => {
    const updated = [...newGroupMembers];
    updated[index] = { ...updated[index], [field]: value };
    setNewGroupMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName) return;

    setIsSubmitting(true);
    const id = `LG-${Date.now()}`;
    const payload = {
      id,
      name: newGroupName,
      location: newGroupLocation,
      contact_number: newGroupContact,
      registration_date: new Date().toISOString().split('T')[0],
      members: newGroupMembers.filter(m => m.name.trim() !== '')
    };

    try {
      const res = await fetch(`${API_BASE_URL}/labour-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, traderId })
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewGroupName('');
        setNewGroupLocation('');
        setNewGroupContact('');
        setNewGroupMembers([{ name: '', mobile: '', role: 'Labour' }]);
        fetchGroups();
      }
    } catch (err) {
      console.error("Failed to save labour group:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this labour group?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/labour-groups/${id}?traderId=${traderId}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shrink-0 px-6 pt-12 pb-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl hover:bg-slate-200 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">Labour <span className="text-primary">Registry</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Workforce Management Protocol</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background-dark rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            Register Group
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 pb-32 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Workforce...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 px-6 text-center bg-white dark:bg-surface-dark rounded-[48px] border border-slate-100 dark:border-white/5 shadow-sm">
                <div className="w-20 h-20 rounded-[32px] bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5 shadow-inner">
                  <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">No Groups Discovered</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest max-w-[280px] leading-relaxed">
                  Your labour registry is currently empty. Register a new group to manage seasonal workforces effectively.
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-white/5 overflow-hidden transition-all shadow-sm hover:shadow-md">
                  <div 
                    onClick={() => toggleGroup(group.id)}
                    className="p-6 cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Users className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">{group.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase tracking-tighter">ID: {group.id}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {group.location || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => deleteGroup(group.id, e)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className={`p-2 rounded-xl transition-transform ${expandedGroupId === group.id ? 'rotate-180 bg-slate-100 dark:bg-white/5' : ''}`}>
                        <ChevronDown className="w-6 h-6 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedGroupId === group.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Composition</h4>
                          <span className="text-[10px] font-bold text-slate-500">{group.members?.length || 0} Members Found</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.members && group.members.length > 0 ? (
                            group.members.map((member, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-surface-dark rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                                    <User className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-tight">{member.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{member.role}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-primary">{member.mobile}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="col-span-full py-6 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No members registered in this group</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Add Group Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Register <span className="text-primary">Group</span></h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manual Deployment Configuration</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Group Identifier</label>
                    <input 
                      type="text" 
                      value={newGroupName}
                      onChange={e => setNewGroupName(e.target.value)}
                      placeholder="e.g. Nellore Team A"
                      className="w-full h-14 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-2xl text-[14px] font-black focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Primary Base</label>
                    <input 
                      type="text" 
                      value={newGroupLocation}
                      onChange={e => setNewGroupLocation(e.target.value)}
                      placeholder="e.g. Korutla"
                      className="w-full h-14 px-6 bg-slate-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/30 rounded-2xl text-[14px] font-black focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Wokforce Roster</h4>
                    <button 
                      onClick={addMemberRow}
                      className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Member
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {newGroupMembers.map((member, i) => (
                      <div key={i} className="flex gap-3 items-end bg-slate-50 dark:bg-white/5 p-4 rounded-[28px] border border-slate-100 dark:border-white/5">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Name</label>
                            <input 
                              type="text"
                              value={member.name}
                              onChange={e => updateMember(i, 'name', e.target.value)}
                              className="w-full h-10 px-4 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile</label>
                            <input 
                              type="tel"
                              value={member.mobile}
                              onChange={e => updateMember(i, 'mobile', e.target.value)}
                              maxLength={10}
                              className="w-full h-10 px-4 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Designation</label>
                            <select 
                              value={member.role}
                              onChange={e => updateMember(i, 'role', e.target.value)}
                              className="w-full h-10 px-4 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                            >
                              <option value="Labour">Labour</option>
                              <option value="Leader">Leader</option>
                              <option value="Supervisor">Supervisor</option>
                            </select>
                          </div>
                        </div>
                        {newGroupMembers.length > 1 && (
                          <button 
                            onClick={() => removeMemberRow(i)}
                            className="p-2.5 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-slate-100 dark:border-white/5">
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting || !newGroupName}
                  className="w-full h-16 bg-primary text-background-dark rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing Submission...' : 'Finalize Group Registry'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
