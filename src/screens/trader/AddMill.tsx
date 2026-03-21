import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, User, Phone, AlertCircle, Save, Globe, CheckCircle2, Mail, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';

export default function AddMill() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    location: '',
    contact_person: '',
    phone: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/mills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, traderId: user?.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register mill');

      setSuccess(true);
      setTimeout(() => navigate('/trader/entries'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-[#F8FAFC] dark:bg-background-dark font-display relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full -mr-64 -mt-64 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full -ml-64 -mb-64 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md pt-8 md:pt-12 pb-4 md:pb-6 px-4 md:px-6 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-4 md:gap-6 max-w-5xl mx-auto w-full">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 md:p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Mill <span className="text-primary">Registry</span></h1>
            <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Institutional Onboarding</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-start pt-8 md:pt-12 pb-32 overflow-y-auto no-scrollbar">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-dark rounded-[40px] p-20 shadow-2xl border border-slate-100 dark:border-white/5 text-center flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-[32px] flex items-center justify-center text-emerald-500 mb-8">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Registration Successful!</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[11px]">Mill protocol initialized. Redirecting...</p>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-surface-dark rounded-[32px] md:rounded-[40px] p-6 md:p-12 shadow-2xl border border-slate-100 dark:border-white/5">
                <form onSubmit={handleSubmit} className="space-y-10">
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500">
                      <AlertCircle className="w-6 h-6 shrink-0" />
                      <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] pl-1 mb-2">Core Identity</h3>
                        {/* Mill ID */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unique Protocol ID*</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
                              <span className="text-[11px] font-black">#</span>
                            </div>
                            <input required type="text" placeholder="e.g. MILL-001" value={formData.id} onChange={(e) => setFormData({...formData, id: e.target.value.toUpperCase()})} className="w-full h-16 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] pl-16 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                          </div>
                        </div>

                        {/* Mill Name */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Institution Name*</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
                              <Building2 className="w-5 h-5" />
                            </div>
                            <input required type="text" placeholder="Enter Full Mill Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full h-16 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] pl-16 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                          </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geographic Location</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <input type="text" placeholder="e.g. Nellore Industrial Zone" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full h-16 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] pl-16 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                          </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] pl-1 mb-2">Point of Contact</h3>
                        {/* Contact Person */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Liaison Officer</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
                              <User className="w-5 h-5" />
                            </div>
                            <input type="text" placeholder="Officer Name" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} className="w-full h-16 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] pl-16 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                          </div>
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Line</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
                              <Phone className="w-5 h-5" />
                            </div>
                            <input type="tel" placeholder="10 Digit Mobile" maxLength={10} value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} className="w-full h-16 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] pl-16 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Encryption Email</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
                              <Mail className="w-5 h-5" />
                            </div>
                            <input type="email" placeholder="official@mill.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full h-16 bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] pl-16 pr-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                          </div>
                        </div>
                    </div>
                  </div>

                  <div className="pt-10 flex justify-center">
                    <button type="submit" disabled={loading} className="w-full max-w-sm h-16 bg-primary text-background-dark font-black rounded-[24px] shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 text-xs tracking-widest uppercase disabled:opacity-50">
                      {loading ? (
                        <><Loader2 className="w-6 h-6 animate-spin" /> Finalizing Protocol...</>
                      ) : (
                        <><Save className="w-6 h-6" /> Initialize Mill Registry</>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
