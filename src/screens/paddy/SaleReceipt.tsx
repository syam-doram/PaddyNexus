import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Tractor, 
  Download, 
  Share2, 
  Info, 
  FileText, 
  ShieldCheck, 
  ExternalLink,
  Printer,
  Copy,
  ChevronRight,
  TrendingDown,
  Building2,
  Calendar,
  IndianRupee
} from 'lucide-react';

export default function SaleReceipt() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100 overflow-y-auto no-scrollbar">
      <div className="mx-auto w-full max-w-[1200px] flex flex-col h-full relative p-6 lg:p-12">
        
        {/* Navigation & Actions */}
        <header className="flex items-center justify-between mb-8 lg:mb-12">
           <div className="flex items-center gap-4 lg:gap-6">
                <button
                onClick={() => navigate(-1)}
                className="group flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-2xl bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5 hover:bg-primary hover:text-background-dark transition-all"
                >
                <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6 group-hover:-translate-x-1 transition-transform" />
                </button>
                <h1 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase italic">Fiscal <span className="text-primary">Receipt</span></h1>
           </div>
           <div className="flex items-center gap-3 lg:gap-4">
                <button className="hidden sm:flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all">
                    <Printer className="w-4 h-4" />
                    Print
                </button>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-3 px-6 lg:px-8 py-2.5 lg:py-3 bg-primary text-background-dark rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    Finalize
                    <ChevronRight className="w-4 h-4" />
                </button>
           </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Area: Digital Receipt Document (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white dark:bg-surface-dark rounded-[32px] lg:rounded-[48px] p-6 lg:p-16 shadow-2xl shadow-black/5 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                {/* Document Texture */}
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <Building2 className="w-64 h-64" />
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex flex-col items-center gap-6 mb-16">
                        <motion.div 
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border-4 border-emerald-500/20 shadow-xl shadow-emerald-500/10"
                        >
                            <ShieldCheck className="w-12 h-12" />
                        </motion.div>
                        <div className="text-center">
                            <h2 className="text-2xl lg:text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Transaction Verified</h2>
                            <p className="text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] lg:tracking-[0.3em]">Protocol Alpha Secure Payload Record</p>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-12 py-12 border-y border-slate-50 dark:border-white/5 mb-12">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Registry</p>
                            <div className="flex items-center gap-2">
                                <p className="text-lg font-black text-slate-900 dark:text-white uppercase italic">#TRX-8930219</p>
                                <button className="p-1 text-slate-300 hover:text-primary transition-colors"><Copy className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                            <div className="flex items-center gap-2 justify-end">
                                <Calendar className="w-4 h-4 text-primary" />
                                <p className="text-lg font-black text-slate-900 dark:text-white italic">OCT 24, 2026</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Farmer Identity</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Rajesh Kumar Verma</p>
                            <p className="text-[10px] font-bold text-slate-400">UID: FMR-9122-PX</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Consignee</p>
                            <p className="text-xl font-black text-primary italic uppercase tracking-tighter font-display">Green Valley Mills Ltd.</p>
                            <p className="text-[10px] font-bold text-slate-400">Mill ID: GVM-001</p>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="space-y-6 mb-16">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">Manifest Content</h3>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[40px] p-10 border border-slate-100 dark:border-white/5">
                            <div className="flex justify-between items-start mb-10">
                                <div className="flex gap-6">
                                    <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 dark:border-white/5">
                                        <Tractor className="w-8 h-8 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Basmati Paddy</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full italic">Premium Grade A</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">₹1,68,750</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Gross Yield</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 dark:border-white/10">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Volume</p>
                                    <p className="text-lg lg:text-xl font-black text-slate-900 dark:text-white italic">150 <span className="text-[9px] text-slate-300">BAGS</span></p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Net Mass</p>
                                    <p className="text-lg lg:text-xl font-black text-slate-900 dark:text-white italic">75.4 <span className="text-[9px] text-slate-300">QTL</span></p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Rate</p>
                                    <p className="text-lg lg:text-xl font-black text-slate-900 dark:text-white italic">₹2,250<span className="text-[10px] text-slate-300">/Qtl</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Signature Area */}
                    <div className="flex justify-between items-end">
                        <div className="space-y-4">
                            <div className="w-32 h-12 bg-slate-100 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
                        </div>
                        <div className="flex bg-slate-50 dark:bg-white/5 p-4 rounded-3xl items-center gap-4 border border-slate-100 dark:border-white/5">
                            <Info className="w-5 h-5 text-primary" />
                            <p className="text-[10px] font-black text-slate-500 uppercase leading-none italic max-w-[200px]">This is a system generated digital ledger certificate.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Area: Fiscal Ledger Summary (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6 lg:space-y-8">
                <section className="bg-slate-900 rounded-[32px] lg:rounded-[48px] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-12">Fiscal Audit Summary</h3>
                        
                        <div className="space-y-8">
                            <div className="flex justify-between items-center group/item">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gross Inventory Value</p>
                                <p className="text-xl font-black italic tracking-tighter">₹1,68,750.00</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Market Levy (2%)</p>
                                    </div>
                                    <p className="text-xl font-black text-red-400 italic tracking-tighter">-₹3,375.00</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cargo Loading Fee</p>
                                    </div>
                                    <p className="text-xl font-black text-red-400 italic tracking-tighter">-₹1,500.00</p>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-white/5 mt-4">
                                <div className="flex justify-between items-end mb-10">
                                    <div>
                                        <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-2 leading-none">Net Disbursable</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Includes Comprehensive Taxes</p>
                                    </div>
                                    <div className="relative">
                                        <p className="text-6xl font-black text-primary italic tracking-tighter leading-none">₹1,63,875</p>
                                        <div className="absolute -right-4 top-0 w-8 h-8 bg-primary/20 rounded-full blur-xl" />
                                    </div>
                                </div>

                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-emerald-500 rounded-[32px] p-6 lg:p-8 flex items-center gap-6 shadow-xl shadow-emerald-500/20"
                                >
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                                        <IndianRupee className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Payment Synchronization</p>
                                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">Queued for Oct 25, 2026</p>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-6">
                    <button className="flex flex-col items-center justify-center p-8 bg-white dark:bg-surface-dark rounded-[40px] border border-slate-100 dark:border-white/5 hover:border-primary/40 transition-all group shadow-sm">
                        <Download className="w-8 h-8 text-slate-400 group-hover:text-primary mb-4 transition-colors" />
                        <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">Archival PDF</span>
                    </button>
                    <button className="flex flex-col items-center justify-center p-8 bg-white dark:bg-surface-dark rounded-[40px] border border-slate-100 dark:border-white/5 hover:border-primary/40 transition-all group shadow-sm">
                        <Share2 className="w-8 h-8 text-slate-400 group-hover:text-emerald-500 mb-4 transition-colors" />
                        <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">Transmit Record</span>
                    </button>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
