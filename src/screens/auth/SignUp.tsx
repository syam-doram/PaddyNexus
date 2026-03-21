import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User, Smartphone, MapPin, ArrowLeft, Check, Briefcase, Lock, Zap, BadgeCheck, ShieldAlert, Globe } from 'lucide-react';
import { useAuth, Role, User as AuthUser } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

export default function SignUp() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [role, setRole] = useState<Role>('trader');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [location, setLocation] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    // traderExists check removed to allow multiple traders

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, mobile, password, location, role }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to register');
            }

            login(data.user as AuthUser);
            navigate('/dashboard');

        } catch (err: any) {
            setErrorMsg(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* Left Column: Vision & Brand (Desktop) */}
            <div className="hidden lg:flex lg:col-span-1 w-1/2 relative overflow-hidden bg-slate-900 group">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 opacity-60"
                    style={{ backgroundImage: `url("https://images.unsplash.com/photo-1594911776510-18451109a150?q=80&w=2072&auto=format&fit=crop")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from- emerald-500/40 via-slate-900/80 to-slate-900" />

                <div className="relative z-10 flex flex-col justify-between p-20 w-full h-full">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                            <Globe className="w-7 h-7 text-slate-900 fill-current" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Paddy<span className="text-primary text-emerald-500">Nexus</span></h2>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="max-w-md"
                    >
                        <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.4em] mb-4 block">Ecosystem Onboarding</span>
                        <h1 className="text-6xl font-black text-white leading-[0.9] tracking-tighter mb-8 transform -rotate-1">
                            BUILD YOUR <span className="text-emerald-500 italic block mt-2">DIGITAL EMPIRE.</span>
                        </h1>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed">
                            Join the most advanced ag-tech network. Unified settlements, global asset visibility, and seamless trader collaboration.
                        </p>
                        <div className="mt-12 flex flex-wrap gap-4">
                            {['Fleet Control', 'Real-time Ledger', 'Institutional Trust'].map((tag, i) => (
                                <div key={i} className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white uppercase tracking-widest">{tag}</div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-6">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800" />
                            ))}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">+500 verified traders active</p>
                    </div>
                </div>
                <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
            </div>

            {/* Right Column: Registration Logic */}
            <div className="flex-1 flex flex-col items-center relative overflow-y-auto no-scrollbar w-full bg-[#F8FAFC] dark:bg-[#0F172A]">
                <div className="sticky top-0 bg-[#F8FAFC]/95 dark:bg-[#0F172A]/95 backdrop-blur-md flex items-center gap-4 z-40 w-full px-6 lg:px-20 py-8 border-b border-slate-100 dark:border-white/5 lg:border-none">
                    <span className="lg:hidden text-lg font-black uppercase tracking-tighter">Paddy<span className="text-primary underline decoration-emerald-500">Nexus</span></span>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full lg:max-w-xl px-5 lg:px-20 py-12 z-10"
                >
                    <div className="mb-8 text-center lg:text-left">
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-3">operative <span className="text-emerald-500 italic">Registry</span></h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Operative Verification Protocol</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-8 p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 rounded-[28px] text-[11px] font-black uppercase tracking-widest flex items-center gap-3"
                            >
                                <ShieldAlert className="w-5 h-5 shrink-0" />
                                {errorMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.form
                        onSubmit={handleSignUp}
                        className="space-y-5 lg:space-y-6"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.1 }
                            }
                        }}
                    >
                        {/* Role Status Card */}
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                            className="group relative overflow-hidden bg-slate-100 dark:bg-slate-800/50 p-6 lg:p-8 rounded-2xl lg:rounded-[40px] border border-slate-200 dark:border-white/5 transition-all"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-emerald-500/10 rounded-xl lg:rounded-[28px] flex items-center justify-center text-emerald-500">
                                    <Briefcase className="w-7 h-7 lg:w-8 lg:h-8" />
                                </div>
                                 <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase border bg-emerald-500 text-slate-900 border-transparent`}>
                                     AVAILABLE
                                 </div>
                            </div>
                            <div className="space-y-1">
                                 <h4 className="text-lg lg:text-xl font-black uppercase tracking-tight">TRADER (MASTER)</h4>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Administrative Authority</p>
                             </div>
                            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-[40px]" />
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-2 text-left">
                                <label htmlFor="signUpName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mt-2 block">Operative Identity</label>
                                <div className="relative group">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        id="signUpName"
                                        name="signUpName"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Full Legal Name"
                                        className="w-full h-14 lg:h-16 pl-14 pr-6 bg-white dark:bg-white/5 border-2 border-transparent group-hover:bg-slate-50 dark:group-hover:bg-white/10 focus:border-emerald-500/40 rounded-xl lg:rounded-[28px] text-sm lg:text-[15px] font-black focus:outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-2 text-left">
                                <label htmlFor="signUpMobile" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mt-2 block">Secure Contact Matrix</label>
                                <div className="relative group">
                                    <Smartphone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        id="signUpMobile"
                                        name="signUpMobile"
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        maxLength={10}
                                        placeholder="98765-XXXXX"
                                        className="w-full h-14 lg:h-16 pl-14 pr-6 bg-white dark:bg-white/5 border-2 border-transparent group-hover:bg-slate-50 dark:group-hover:bg-white/10 focus:border-emerald-500/40 rounded-xl lg:rounded-[28px] text-sm lg:text-[15px] font-black focus:outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-2 text-left">
                                <label htmlFor="signUpLocation" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mt-2 block">Operational Territory</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        id="signUpLocation"
                                        name="signUpLocation"
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Base Location"
                                        className="w-full h-14 lg:h-16 pl-14 pr-6 bg-white dark:bg-white/5 border-2 border-transparent group-hover:bg-slate-50 dark:group-hover:bg-white/10 focus:border-emerald-500/40 rounded-xl lg:rounded-[28px] text-sm lg:text-[15px] font-black focus:outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="space-y-2 text-left">
                                <label htmlFor="signUpPassword" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mt-2 block">Encryption Key</label>
                                <div className="relative group">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        id="signUpPassword"
                                        name="signUpPassword"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-14 lg:h-16 pl-14 pr-6 bg-white dark:bg-white/5 border-2 border-transparent group-hover:bg-slate-50 dark:group-hover:bg-white/10 focus:border-emerald-500/40 rounded-xl lg:rounded-[28px] text-sm lg:text-[15px] font-black focus:outline-none transition-all shadow-sm"
                                        required
                                    />
                                </div>
                            </motion.div>
                        </div>

                        <motion.button
                             variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                             type="submit"
                             disabled={loading}
                             className="w-full h-14 lg:h-20 mt-4 lg:mt-6 bg-emerald-500 text-slate-900 rounded-xl lg:rounded-[32px] font-black text-lg lg:text-xl uppercase tracking-tighter flex items-center justify-center gap-4 shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:grayscale"
                         >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Provisioning Account...</span>
                                </div>
                            ) : (
                                <>Initialize <span className="italic">Onboarding</span> <Check className="w-6 h-6 stroke-[3]" /></>
                            )}
                        </motion.button>

                        <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 leading-relaxed">
                            By initiating this protocol, you agree to our <button className="text-emerald-500 font-black hover:underline" type='button'>Governance Framework</button> & <button className="text-emerald-500 font-black hover:underline" type='button'>Data Privacy Manifest</button>
                        </motion.p>

                        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                Already in the network?
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-emerald-500 ml-2 hover:underline decoration-2 underline-offset-4"
                                >
                                    Access Dashboard
                                </button>
                            </p>
                        </motion.div>
                    </motion.form>
                </motion.div>

                {/* Background decorative elements for mobile */}
                <div className="lg:hidden absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="lg:hidden absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
            </div>
        </div>
    );
}
