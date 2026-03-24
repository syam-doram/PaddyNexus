import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShieldCheck, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'info' | 'destructive';
}

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'info'
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl md:rounded-[48px] p-6 md:p-10 lg:p-12 shadow-[0_32px_128px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5"
          >
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl mb-6 md:mb-8 flex items-center justify-center ${type === 'destructive' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
              {type === 'destructive' ? <Trash2 className="w-6 h-6 md:w-8 md:h-8" /> : <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />}
            </div>

            <div className="mb-8 md:mb-10">
              <h3 className="text-2xl md:text-3xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter mb-3 md:mb-4 leading-none">
                {title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium leading-relaxed uppercase tracking-tight">
                {message}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onConfirm}
                className={`w-full py-4 md:py-6 rounded-2xl md:rounded-3xl text-xs md:text-sm font-black uppercase tracking-widest transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] ${type === 'destructive'
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-primary text-slate-900 shadow-primary/20'
                  }`}
              >
                {confirmLabel}
              </button>
              <button
                onClick={onCancel}
                className="w-full py-4 md:py-6 bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-2xl md:rounded-3xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                {cancelLabel}
              </button>
            </div>

            {/* Accent Blur */}
            <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-[64px] ${type === 'destructive' ? 'bg-rose-500/20' : 'bg-primary/20'}`} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
