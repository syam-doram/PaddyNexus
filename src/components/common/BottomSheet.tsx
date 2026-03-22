import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Info, HelpCircle } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: BottomSheetProps) {
  
  const getTheme = () => {
    switch (type) {
      case 'success': return { icon: <CheckCircle2 className="w-8 h-8" />, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
      case 'error': return { icon: <AlertCircle className="w-8 h-8" />, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' };
      case 'confirm': return { icon: <HelpCircle className="w-8 h-8" />, color: 'text-primary', bg: 'bg-primary/10' };
      default: return { icon: <Info className="w-8 h-8" />, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
    }
  };

  const theme = getTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Sheet Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-t-[40px] sm:rounded-[32px] shadow-2xl overflow-hidden border-t sm:border border-slate-200 dark:border-white/10"
          >
            {/* Drag Handle (Mobile only) */}
            <div className="w-full h-1.5 flex items-center justify-center pt-4 pb-2 sm:hidden">
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>

            <div className="p-8 pb-10 sm:pb-8">
              <div className="flex items-start justify-between mb-8">
                <div className={`p-4 ${theme.bg} ${theme.color} rounded-[20px] shadow-sm`}>
                  {theme.icon}
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-2xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                  {title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed pr-8">
                  {message}
                </p>
              </div>

              <div className="mt-12 space-y-4">
                {type === 'confirm' ? (
                  <div className="flex flex-col md:flex-row gap-4 w-full">
                    <button
                      onClick={() => {
                        onConfirm?.();
                        onClose();
                      }}
                      className="w-full md:flex-1 h-18 bg-primary text-background-dark rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20 active:scale-95 transition-all order-1 md:order-2"
                    >
                      {confirmText}
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full md:flex-1 h-18 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs active:scale-95 transition-all order-2 md:order-1"
                    >
                      {cancelText}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={onClose}
                    className="w-full h-18 bg-slate-900 dark:bg-primary text-white dark:text-background-dark rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    CONTINUE HUB LOGISTICS
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
