import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Lock, Eye, EyeOff, Fingerprint, Smile, Tractor, Sprout, Briefcase, Zap, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useAuth, Role, User as AuthUser } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [selectedRole, setSelectedRole] = useState<Role>('machine_harvest');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile, password, role: selectedRole }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to login');
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
            {/* Left Column: Visual Storytelling (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 group">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 opacity-60"
                    style={{ backgroundImage: `url("https://images.unsplash.com/photo-1594776208137-aa2f9f1d41a5?q=80&w=2072&auto=format&fit=crop")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-slate-900/80 to-slate-900" />

                <div className="relative z-10 flex flex-col justify-between p-20 w-full h-full">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20">
                            <Zap className="w-7 h-7 text-background-dark fill-current" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Paddy<span className="text-primary">Nexus</span></h2>
                    </div>

                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-md"
                        >
                            <span className="text-xs font-black text-primary uppercase tracking-[0.4em] mb-4 block">Institutional Intelligence</span>
                            <h1 className="text-6xl font-black text-white leading-[0.9] tracking-tighter mb-8 italic">
                                REDEFINING <span className="text-primary underline decoration-8 underline-offset-[12px]">HARVEST</span> MANAGEMENT.
                            </h1>
                            <p className="text-lg text-slate-400 font-medium leading-relaxed">
                                The ultimate command center for modern paddy traders and machine operators. Real-time fleet tracking and automated settlements.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-2 gap-8 mt-16 max-w-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Encrypted Logistics</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
                                    <BadgeCheck className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">FISCAL AUTHENTICATION</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">© {new Date().getFullYear()} AgriNexus Systems • v2.4.0</p>
                </div>

                {/* Decorative elements */}
                <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
            </div>

            {/* Right Column: Authentication Form */}
            <div className="flex-1 flex flex-col items-center lg:justify-center relative overflow-y-auto no-scrollbar">
                
                {/* Mobile Branding Header - Sticky */}
                <div className="lg:hidden sticky top-0 z-30 w-full flex flex-col items-center py-6 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5 mb-8 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                            <Zap className="w-5 h-5 text-primary fill-current" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-tighter">
                            Paddy<span className="text-primary underline decoration-emerald-500 underline-offset-4 decoration-2">Nexus</span>
                        </span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[440px] z-10 px-6 lg:px-0 pb-12 lg:pb-0"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h3 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-3">Command <span className="text-primary">Login</span></h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Access Portal for Verified Personnel</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                            >
                                <ShieldCheck className="w-4 h-4 shrink-0" />
                                {errorMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Role Segmentation UI */}
                    <div className="relative flex p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-[28px] mb-10 border border-slate-200 dark:border-white/5">
                        <motion.div
                            layoutId="auth-role-slider-split"
                            className="absolute inset-1.5 w-[31.5%] h-auto bg-white dark:bg-surface-dark rounded-[22px] shadow-xl z-0 border border-slate-100 dark:border-white/10"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            style={{ left: selectedRole === 'machine_harvest' ? '0.375rem' : selectedRole === 'paddy_harvest' ? '34.25%' : '68%' }}
                        />

                        {[
                            { id: 'machine_harvest', label: 'Machine', icon: Tractor },
                            { id: 'paddy_harvest', label: 'Paddy', icon: Sprout },
                            { id: 'trader', label: 'Trader', icon: Briefcase }
                        ].map((role) => (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id as Role)}
                                className={`flex-1 relative z-10 py-3.5 flex flex-col items-center gap-1.5 transition-all duration-300 ${selectedRole === role.id ? 'text-primary' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
                            >
                                <role.icon className="w-5 h-5" />
                                <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${selectedRole === role.id ? 'opacity-100' : 'opacity-70'}`}>{role.label}</span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                                <Smartphone className="w-3.5 h-3.5" /> Direct Contact
                            </label>
                            <input
                                type="tel"
                                placeholder="98765-XXXXX"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                maxLength={10}
                                required
                                className="w-full h-16 px-8 bg-white dark:bg-white/5 border-2 border-transparent focus:border-primary/40 rounded-[24px] text-lg font-black focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center ml-4 pr-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5" /> Security Key
                                </label>
                                <button type="button" className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">Reset?</button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full h-16 px-8 bg-white dark:bg-white/5 border-2 border-transparent focus:border-primary/40 rounded-[24px] text-lg font-black focus:outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-sm"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-18 bg-slate-900 dark:bg-white text-white dark:text-background-dark rounded-[28px] font-black text-lg uppercase tracking-tight flex items-center justify-center gap-4 shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Initiating Uplink...</span>
                                </div>
                            ) : (
                                <>Execute <span className="text-primary italic">Initialization</span></>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 flex flex-col items-center gap-8">
                        <div className="flex gap-6">
                            {[Fingerprint, Smile].map((Icon, idx) => (
                                <button key={idx} className="w-16 h-16 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[24px] flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
                                    <Icon className="w-7 h-7" />
                                </button>
                            ))}
                        </div>

                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            New operative?
                            <button
                                onClick={() => navigate('/signup')}
                                className="text-primary ml-2 hover:underline decoration-2 underline-offset-4"
                            >
                                Onboard Protocol
                            </button>
                        </p>
                    </div>
                </motion.div>

                {/* Decorative elements for mobile */}
                <div className="lg:hidden absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
            </div>
        </div>
    );
}
