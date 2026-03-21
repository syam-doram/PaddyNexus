import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: ModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      case 'error': return <AlertCircle className="w-8 h-8 text-rose-500" />;
      case 'confirm': return <Info className="w-8 h-8 text-primary" />;
      default: return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'error': return 'bg-rose-500 hover:bg-rose-600';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600';
      default: return 'bg-primary hover:bg-[#22c55e]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#1e293b] rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
          >
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  {getIcon()}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
                {title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {message}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {type === 'confirm' ? (
                  <>
                    <button
                      onClick={onClose}
                      className="flex-1 h-14 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                    >
                      {cancelText}
                    </button>
                    <button
                      onClick={() => {
                        onConfirm?.();
                        onClose();
                      }}
                      className={`flex-1 h-14 ${getButtonClass()} text-background-dark rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95`}
                    >
                      {confirmText}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onClose}
                    className={`w-full h-14 ${getButtonClass()} text-background-dark rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95`}
                  >
                    Got it
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
