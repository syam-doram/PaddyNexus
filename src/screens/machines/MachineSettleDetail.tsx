import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ArrowLeft, Plus, IndianRupee, TrendingUp, History, Tractor, ChevronRight, AlertCircle, Calendar, Search, Download, Filter, User, Info, FileStack, X, Banknote, Lock, Trash2, Printer } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/apiConfig';

export default function MachineSettleDetail() {
  const { machineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryParams = new URLSearchParams(location.search);
  const activeYear = parseInt(queryParams.get('year') || new Date().getFullYear().toString());
  
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [isSettling, setIsSettling] = useState(false);
  const [remittanceAmount, setRemittanceAmount] = useState('');
  const [remittanceDesc, setRemittanceDesc] = useState('');
  const [remittanceDate, setRemittanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    action: () => void;
    type: 'critical' | 'action';
  }>({ title: '', description: '', action: () => {}, type: 'action' });

  const groupedLogs = useMemo(() => {
    if (!reportData?.logs) return [];
    const groups: Record<string, any> = {};
    reportData.logs.forEach((l: any) => {
      const date = new Date(l.date);
      const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[mKey]) {
        groups[mKey] = {
          monthKey: mKey,
          displayMonth: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
          hours: 0,
          farmers: 0,
          amount: 0,
          areas: new Set<string>()
        };
      }
      groups[mKey].hours += (l.hours || 0);
      groups[mKey].farmers += 1;
      groups[mKey].amount += (l.total_amount || 0);
      if (l.location) groups[mKey].areas.add(l.location);
    });
    return Object.values(groups).sort((a: any, b: any) => b.monthKey.localeCompare(a.monthKey));
  }, [reportData]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const tId = user?.trader_id || user?.id;
      let url = `${API_BASE_URL}/machine-report/${encodeURIComponent(machineId!)}?year=${activeYear}`;
      if (tId) url += `&traderId=${tId}`;
      const res = await fetch(url);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (machineId) fetchReport();
  }, [machineId, activeYear]);

  const handleSettleMachine = () => {
    setConfirmConfig({
        title: 'Finalize Settlement',
        description: 'Are you sure you want to FINAL PROGRESS this settlement? This will lock the machine logs for this year. This is a critical session action.',
        type: 'critical',
        action: async () => {
            setIsSettling(true);
            try {
                const tId = user?.trader_id || user?.id;
                let url = `${API_BASE_URL}/machines/${encodeURIComponent(machineId!)}/settle?year=${activeYear}`;
                if (tId) url += `&traderId=${tId}`;
                const res = await fetch(url, { method: 'POST' });
                if (res.ok) fetchReport();
            } catch (err) {
                console.error("Settlement failed:", err);
            } finally {
                setIsSettling(false);
                setShowConfirm(false);
            }
        }
    });
    setShowConfirm(true);
  };

  const handleReopenMachine = () => {
    setConfirmConfig({
        title: 'Reopen Ledger',
        description: 'Are you sure you want to REOPEN this ledger? This will allow new entries and remittances for this session.',
        type: 'action',
        action: async () => {
            setIsSettling(true);
            try {
                const tId = user?.trader_id || user?.id;
                let url = `${API_BASE_URL}/machines/${encodeURIComponent(machineId!)}/reopen?year=${activeYear}`;
                if (tId) url += `&traderId=${tId}`;
                const res = await fetch(url, { method: 'POST' });
                if (res.ok) fetchReport();
            } catch (err) {
                console.error("Reopen failed:", err);
            } finally {
                setIsSettling(false);
                setShowConfirm(false);
            }
        }
    });
    setShowConfirm(true);
  };

  const exportReportToPDF = () => {
    if (!reportData) return;
    const data = reportData;
    try {
        const doc = new jsPDF();
        
        // Premium Institutional Branding
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("PADDYMANAGER", 15, 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("INSTITUTIONAL SETTLEMENT AUDIT", 15, 28);
        doc.text(`SESSION ID: ${activeYear}-${String(data.machine.id).slice(-4).toUpperCase()}`, 15, 34);
        
        // Right Aligned Header Details
        doc.setFontSize(10);
        doc.text(`ASSET: ${data.machine.name.toUpperCase()}`, 195, 20, { align: 'right' });
        doc.text(`MODEL: ${data.machine.model.toUpperCase()}`, 195, 26, { align: 'right' });
        doc.text(`STATUS: ${data.machine.is_settled ? 'FINALIZED' : 'ACTIVE'}`, 195, 32, { align: 'right' });

        // Financial Summary Section
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.text("FINANCIAL SUMMARY OVERVIEW", 15, 55);
        
        // Draw 3 Summary Boxes
        const drawBox = (x: number, y: number, label: string, val: string, color: [number, number, number]) => {
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(x, y, 60, 25, 3, 3, 'F');
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(7);
            doc.text(label, x + 5, y + 8);
            doc.setTextColor(...color);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(val, x + 5, y + 18);
        };

        drawBox(15, 60, "TOTAL GROSS YIELD", `INR ${data.totalEarnings.toLocaleString()}`, [16, 185, 129]);
        drawBox(78, 60, "DEALER COMMISSION", `INR ${data.totalDealerCommission.toLocaleString()}`, [100, 116, 139]);
        drawBox(141, 60, "CASH DISBURSEMENTS", `INR ${data.totalAdvances.toLocaleString()}`, [239, 68, 68]);

        const totalMachineHours = data.logs.reduce((sum: number, l: any) => sum + (l.hours || 0), 0);
        
        // Draw Net Payable Box below
        doc.setFillColor(15, 23, 42); // slate-900
        doc.roundedRect(15, 87, 186, 15, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text("FINAL NET SETTLEMENT PAYABLE", 20, 96);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`INR ${data.netBalance.toLocaleString()}`, 195, 96, { align: 'right' });

        // Audit Trail Details
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("OPERATIONAL DEPLOYMENT LEDGER (GROSS)", 15, 115);

        const logRows = data.logs.map((l: any) => [
            new Date(l.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            `${l.farmer_name.toUpperCase()}\n[${(l.location || 'N/A').toUpperCase()}]`,
            `INR ${l.rate}`,
            `${l.hours} HR`,
            `INR ${l.total_amount.toLocaleString()}`
        ]);

        autoTable(doc, {
            startY: 120,
            head: [['DATE', 'COUNTERPARTY & AREA/LOCATION', 'RATE', 'USAGE', 'SUBTOTAL']],
            body: logRows,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 3 }, // Reduced padding for density
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 75 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 40, halign: 'right' }
            },
            alternateRowStyles: { fillColor: [250, 250, 250] }, // Better zebra striping for long lists
            margin: { top: 40, bottom: 20 }
        });

        // Advances Section
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.text("SEASONAL DISBURSEMENTS & REMITTANCES", 15, finalY);

        const advanceRows = data.advances.map((a: any) => [
            new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
            (a.description || 'Institutional Withdrawal').toUpperCase(),
            `INR ${a.amount.toLocaleString()}`
        ]);

        // Add Dealer Commission as a line item if > 0
        if (data.totalDealerCommission > 0) {
            advanceRows.push([
                `S-${activeYear}`,
                `SEASONAL DEALER COMMISSION (₹${data.commissionRate}/HR x ${totalMachineHours}H)`,
                `INR ${data.totalDealerCommission.toLocaleString()}`
            ]);
        }

        autoTable(doc, {
            startY: finalY + 5,
            head: [['DATE', 'DISBURSEMENT DESCRIPTION', 'AMOUNT']],
            body: advanceRows,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 4 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 120 },
                2: { cellWidth: 40, halign: 'right' }
            }
        });

        // Seal and Timestamp
        const lastY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`AUDIT GENERATED: ${new Date().toLocaleString()}`, 15, lastY);
        doc.text(`THIS IS A SYSTEM GENERATED INSTITUTIONAL DOCUMENT. NO PHYSICAL SIGNATURE IS REQUIRED.`, 15, lastY + 5);

        doc.save(`Settle_Audit_${data.machine.name}_${activeYear}.pdf`);
    } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Institutional Sync Error: PDF drafting failed.");
    }
  };

  const handleRemittance = async () => {
    if (!remittanceAmount || parseInt(remittanceAmount) <= 0) return;
    try {
        const fullDesc = `[${paymentMethod.toUpperCase()}] ${remittanceDesc}`;
        await fetch(`${API_BASE_URL}/machine-advances`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                machine_id: machineId, 
                amount: parseInt(remittanceAmount), 
                date: remittanceDate, 
                description: fullDesc,
                traderId: user?.trader_id || user?.id 
            })
        });
        setRemittanceAmount('');
        setRemittanceDesc('');
        setRemittanceDate(new Date().toISOString().split('T')[0]);
        fetchReport();
    } catch (e) {
        console.error(e);
    }
  };

  if (loading || !reportData) {
    return (
        <div className="flex h-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] items-center justify-center p-6">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Syncing Settlement Data...</p>
        </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#0F172A] font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="px-4 lg:px-6 py-3 lg:py-6 flex items-center justify-between">
           <div className="flex items-center gap-3 lg:gap-4">
              <button onClick={() => navigate(-1)} className="p-2.5 lg:p-3 bg-slate-100 dark:bg-white/5 rounded-xl lg:rounded-2xl hover:bg-slate-200 transition-colors">
                <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
              </button>
              <div>
                 <h1 className="text-lg lg:text-3xl font-black tracking-tighter uppercase leading-none">
                   {reportData.machine.name} <span className="text-primary italic">Audit</span>
                 </h1>
                 <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                   {reportData.machine.model} • SESSION {activeYear}
                 </p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={exportReportToPDF}
                className="p-2.5 lg:p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl lg:rounded-2xl hover:scale-105 transition-all shadow-lg"
              >
                <Printer className="w-5 h-5" />
              </button>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-4 lg:p-12 pb-32">
         <div className="max-w-5xl mx-auto space-y-8 lg:space-y-12">
            
            {/* Financial Dashboard */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                <div className="p-4 lg:p-6 bg-white dark:bg-surface-dark rounded-[24px] lg:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[7px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 lg:mb-4 opacity-60">Gross Yield</p>
                    <span className="text-base lg:text-xl font-black text-slate-900 dark:text-white">₹{reportData.totalEarnings.toLocaleString()}</span>
                </div>
                <div className="p-4 lg:p-6 bg-white dark:bg-surface-dark rounded-[24px] lg:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm border-l-4 border-l-slate-400">
                    <p className="text-[7px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 lg:mb-4 opacity-60">Commission</p>
                    <span className="text-base lg:text-xl font-black text-slate-400">₹{reportData.totalDealerCommission.toLocaleString()}</span>
                </div>
                <div className="p-4 lg:p-6 bg-white dark:bg-surface-dark rounded-[24px] lg:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-sm border-l-4 border-l-red-500">
                    <p className="text-[7px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 lg:mb-4 opacity-60">Payouts</p>
                    <span className="text-base lg:text-xl font-black text-red-500">₹{reportData.totalAdvances.toLocaleString()}</span>
                </div>
                <div className="p-4 lg:p-6 bg-primary rounded-[24px] lg:rounded-[40px] shadow-2xl shadow-primary/20">
                    <p className="text-[7px] lg:text-[10px] font-black text-background-dark/60 uppercase tracking-widest mb-2 lg:mb-4">Total Dues</p>
                    <span className="text-base lg:text-xl font-black text-background-dark">₹{reportData.netBalance.toLocaleString()}</span>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Tables Column */}
                <div className="lg:col-span-2 space-y-16">
                    {/* Operational Ledger */}
                    <section>
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-4">
                                <TrendingUp className="w-5 h-5 text-emerald-500" /> Operational Deployment Ledger
                                <div className="h-px bg-slate-100 dark:bg-white/10 flex-1" />
                            </h4>
                        </div>
                        
                        <div className="bg-white dark:bg-surface-dark rounded-[32px] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
                            {/* Desktop Table: Grouped by Month */}
                            <table className="w-full hidden md:table">
                                <thead>
                                    <tr className="text-left bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Period</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Farmer Count</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Fleet Usage</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Yield amount</th>
                                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                    {(groupedLogs as any[]).map((g) => {
                                        // Find min/max dates for this month
                                        const monthLogs = reportData.logs.filter((l: any) => {
                                            const d = new Date(l.date);
                                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === g.monthKey;
                                        });
                                        const dates = monthLogs.map((l: any) => new Date(l.date).getTime());
                                        const minDate = new Date(Math.min(...dates));
                                        const maxDate = new Date(Math.max(...dates));

                                        return (
                                            <tr key={g.monthKey} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-6">
                                                    <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                                        {g.displayMonth}
                                                    </p>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        {g.farmers} ENTRIES
                                                    </span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <p className="text-base font-black text-slate-900 dark:text-white leading-none">{g.hours}</p>
                                                        <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1">Total HR</p>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-right font-black text-emerald-600">
                                                    ₹{g.amount.toLocaleString()}
                                                </td>
                                                <td className="p-6 text-center">
                                                    <button 
                                                        onClick={() => navigate(`/machine-settlement/${machineId}/harvests?year=${activeYear}&month=${g.monthKey}`)}
                                                        className="p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-110 transition-all shadow-md group"
                                                    >
                                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* Mobile List View: Grouped by Month */}
                            <div className="md:hidden divide-y divide-slate-50 dark:divide-white/5">
                                {(groupedLogs as any[]).map((g) => (
                                    <div 
                                        key={g.monthKey} 
                                        className="p-6 active:bg-slate-50 dark:active:bg-white/5 transition-colors flex justify-between items-center group"
                                        onClick={() => navigate(`/machine-settlement/${machineId}/harvests?year=${activeYear}&month=${g.monthKey}`)}
                                    >
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">{g.displayMonth}</p>
                                            <h5 className="text-base font-black text-slate-900 dark:text-white uppercase leading-none mb-1">
                                                {g.farmers} Farmers
                                            </h5>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                Total Usage: {g.hours} HR
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-3">
                                            <p className="text-base font-black text-emerald-500 tracking-tighter">₹{g.amount.toLocaleString()}</p>
                                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {reportData.logs.length === 0 && (
                                <div className="py-20 text-center opacity-40">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Activity Registered</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Disbursement History */}
                    <section>
                         <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                            <History className="w-5 h-5 text-red-500" /> Disbursement & Remittance History
                            <div className="h-px bg-slate-100 dark:bg-white/10 flex-1" />
                        </h4>
                        <div className="space-y-3 lg:space-y-4">
                            {reportData.advances.map((a: any) => (
                                <div key={a.id} className="p-4 lg:p-6 bg-white dark:bg-surface-dark rounded-[24px] lg:rounded-[32px] border border-slate-100 dark:border-white/5 flex justify-between items-center group shadow-sm transition-all hover:border-red-500/20">
                                    <div className="flex items-center gap-4 lg:gap-6">
                                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-500/10 rounded-xl lg:rounded-2xl flex items-center justify-center text-red-500"><Banknote className="w-5 h-5 lg:w-6 lg:h-6" /></div>
                                        <div>
                                            <p className="text-xs lg:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[120px] sm:max-w-none">
                                                {a.description || 'Institutional Withdrawal'}
                                            </p>
                                            <p className="text-[8px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 lg:mt-1">
                                                {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-base lg:text-xl font-black text-red-500 tracking-tighter">-₹{a.amount.toLocaleString()}</p>
                                </div>
                            ))}
                            {reportData.advances.length === 0 && (
                                <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[32px]">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Remittances Found</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Actions Column */}
                <div className="space-y-12">
                     {/* Add Remittance Card */}
                    {/* Compact Remittance Entry */}
                    {!reportData.machine.is_settled && (
                        <section className="bg-white dark:bg-slate-900 p-6 lg:p-8 rounded-[32px] border border-slate-100 dark:border-white/5 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                               <Banknote className="w-5 h-5 text-emerald-500" />
                               <h4 className="text-sm font-black uppercase tracking-widest">New <span className="text-emerald-500 italic">Payout</span></h4>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="relative">
                                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                                    <input 
                                        type="number" 
                                        value={remittanceAmount}
                                        onChange={(e) => setRemittanceAmount(e.target.value)}
                                        placeholder="Amount (0.00)" 
                                        className="w-full h-12 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-lg font-black outline-none focus:border-emerald-500 transition-all" 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                   <input 
                                      type="date"
                                      value={remittanceDate}
                                      onChange={(e) => setRemittanceDate(e.target.value)}
                                      className="h-10 px-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-bold outline-none"
                                   />
                                   <select 
                                      value={paymentMethod}
                                      onChange={(e) => setPaymentMethod(e.target.value)}
                                      className="h-10 px-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-bold outline-none appearance-none"
                                   >
                                      <option value="Cash">Cash</option>
                                      <option value="UPI">UPI</option>
                                      <option value="Bank">Bank</option>
                                   </select>
                                </div>
                                
                                <input 
                                   type="text"
                                   value={remittanceDesc}
                                   onChange={(e) => setRemittanceDesc(e.target.value)}
                                   placeholder="Payment description..." 
                                   className="w-full h-10 px-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all" 
                                />

                                <button 
                                    onClick={handleRemittance}
                                    className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    Log Disbursement
                                </button>
                            </div>
                        </section>
                    )}

                    {/* Finalize/Reopen Action */}
                    <section className="bg-slate-50 dark:bg-white/5 p-10 rounded-[48px] border border-slate-100 dark:border-white/5 text-center">
                        {reportData.machine.is_settled ? (
                            <>
                                <div className="w-16 h-16 bg-emerald-500 text-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Audit <span className="text-emerald-500 italic">Locked</span></h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                                    Settled on {new Date(reportData.machine.settled_at).toLocaleDateString()}
                                </p>
                                <button 
                                  onClick={handleReopenMachine}
                                  className="w-full py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Reopen For Edits
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <AlertCircle className="w-8 h-8" />
                                </div>
                                <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Finalize <span className="text-primary italic">Session</span></h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed px-4">
                                    Finalizing locks the operational ledger for this session.
                                </p>
                                <button 
                                  onClick={handleSettleMachine}
                                  className="w-full py-5 bg-emerald-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                                >
                                    Complete Settlement
                                </button>
                            </>
                        )}
                    </section>
                </div>
            </div>
         </div>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#0F172A]/80 backdrop-blur-md">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 30 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.9, opacity: 0, y: 30 }} 
               className="bg-white dark:bg-[#1E293B] w-full max-w-sm rounded-[42px] p-10 shadow-2xl relative border border-white/10"
            >
                <div className="flex flex-col items-center text-center mb-10">
                    <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 ${confirmConfig.type === 'critical' ? 'bg-red-500/10 text-red-500 shadow-lg shadow-red-500/5' : 'bg-primary/10 text-primary shadow-lg shadow-primary/5'}`}>
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">
                        {confirmConfig.title.split(' ')[0]} <span className={confirmConfig.type === 'critical' ? 'text-red-500' : 'text-primary'}>{confirmConfig.title.split(' ').slice(1).join(' ')}</span>
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        {confirmConfig.description}
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button 
                        onClick={confirmConfig.action}
                        disabled={isSettling}
                        className={`py-6 rounded-[28px] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center ${
                            confirmConfig.type === 'critical' 
                            ? 'bg-red-500 text-white shadow-red-500/20' 
                            : 'bg-primary text-background-dark shadow-primary/20'
                        }`}
                    >
                        {isSettling ? (
                             <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Execute Protocol'
                        )}
                    </button>
                    <button 
                        onClick={() => setShowConfirm(false)}
                        className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all"
                    >
                        Abort Operation
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
