import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap } from 'lucide-react';

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center font-display overflow-hidden relative">
      {/* Background pulses */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo Container */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
          className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/40 mb-10"
        >
          <Zap className="w-12 h-12 text-background-dark fill-current animate-pulse" />
        </motion.div>

        {/* Brand Name */}
        <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="text-center mb-12"
        >
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none italic">
            Paddy<span className="text-primary underline decoration-8 underline-offset-[12px]">Nexus</span>
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-6">
            Institutional Intelligence
          </p>
        </motion.div>

        {/* Progress System */}
        <div className="w-64 space-y-4">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
            <motion.div 
               className="h-full bg-primary shadow-[0_0_15px_rgba(0,200,83,0.5)]"
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
               transition={{ ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-primary uppercase tracking-widest animate-pulse">
              System Uplink: Active
            </span>
            <span className="text-[10px] font-black text-white/40 tabular-nums">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Version Footer */}
      <div className="absolute bottom-12 left-0 w-full text-center">
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
            Protocol v2.4.0 • Secured Gateway
        </p>
      </div>
    </div>
  );
}
