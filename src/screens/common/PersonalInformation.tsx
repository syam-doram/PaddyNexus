import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Smartphone, Lock, MapPin, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PersonalInformation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const infoItems = [
    {
      label: 'Full Name',
      value: user?.name || 'Not Available',
      icon: User,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10'
    },
    {
      label: 'Mobile Number',
      value: user?.mobile || 'Not Available',
      icon: Smartphone,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10'
    },
    {
      label: 'Password',
      value: user?.password || '********',
      icon: Lock,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      isSensitive: true
    },
    {
      label: 'Base Location',
      value: user?.location || 'Not Specified',
      icon: MapPin,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-500/10'
    },
    {
        label: 'Account Role',
        value: user?.role === 'trader' ? 'Master Administrator' : user?.role?.replace('_', ' ') || 'User',
        icon: ShieldCheck,
        color: 'text-primary',
        bg: 'bg-primary/10'
      }
  ];

  return (
    <div className="relative flex h-full w-full flex-col bg-background-light dark:bg-background-dark font-display overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 lg:px-6 pt-8 lg:pt-12 pb-3 lg:pb-4 justify-between bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 dark:border-white/5">
        <button 
          onClick={() => navigate(-1)}
          className="text-slate-900 dark:text-white flex size-11 lg:size-12 shrink-0 items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>
        <h2 className="text-slate-900 dark:text-white text-base lg:text-lg font-black leading-tight tracking-[-0.015em] flex-1 text-center uppercase tracking-widest">Personal <span className="text-primary italic">Intelligence</span></h2>
        <div className="size-11 lg:size-12" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-32 no-scrollbar max-w-md mx-auto w-full">
        <div className="flex flex-col gap-4">
          {infoItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-surface-dark p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-slate-900 dark:text-white text-base font-bold tracking-tight">
                        {item.isSensitive && !showPassword ? '••••••••' : item.value}
                    </p>
                    {item.isSensitive && (
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-500 text-center uppercase tracking-[0.2em] leading-relaxed">
                Security clearance level: <span className="text-primary italic">Alpha-Prime</span>. These credentials are for your eyes only.
            </p>
        </div>
      </div>
    </div>
  );
}
