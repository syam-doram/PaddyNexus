import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/apiConfig';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Factory,
  IndianRupee,
  Package,
  Plus,
  Search,
  History,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlusCircle,
  X,
  CreditCard,
  TrendingDown,
  TrendingUp,
  FileText,
  MapPin,
  Activity,
  ShieldCheck,
  Download,
  Share2,
  Info,
  Users,
  Edit3,
  Truck,
  Droplet,
  LayoutGrid,
  Scale,
  Trash2
} from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function MillSettlement() {
  const { millId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState('All Lots');
  const [remitLotId, setRemitLotId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deduction Edit State
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [customMoisture, setCustomMoisture] = useState('');
  const [customBagPenalty, setCustomBagPenalty] = useState('');
  const [customLabor, setCustomLabor] = useState('');
  const [isSavingDeductions, setIsSavingDeductions] = useState(false);

  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    actionLabel: string;
    isDestructive: boolean;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => { },
    actionLabel: 'Confirm',
    isDestructive: false
  });

  useEffect(() => {
    fetchData();
  }, [millId, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE_URL}/mill-settlements/${millId}?year=${selectedYear}`;
      if (user?.id) url += `&traderId=${user.id}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching mill settlement detail:", err);
      setLoading(false);
    }
  };

  const [isUpdating, setIsUpdating] = useState(false);

  const handleSettleLot = async (lotId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Release Payment',
      message: 'Are you sure you want to settle this lot? This will mark the lot as officially paid and cleared.',
      actionLabel: 'Settle Lot',
      isDestructive: false,
      onConfirm: async () => {
        setIsUpdating(true);
        try {
          const res = await fetch(`${API_BASE_URL}/lots/${encodeURIComponent(lotId)}/settle?traderId=${user?.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settled_at: new Date().toISOString() })
          });
          if (res.ok) {
            fetchData();
          } else {
            const errData = await res.json();
            alert(errData.error || "Failed to settle lot");
          }
        } catch (err) {
          console.error("Failed to settle lot:", err);
          alert("An error occurred while settling the lot.");
        } finally {
          setIsUpdating(false);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleGenerateReport = (lot: any, payments: any[]) => {
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const moistureLoss = (lot.manual_deductions_applied === 1) ? (lot.moisture_loss || 0) : 0;
    const bagPenalty = (lot.manual_deductions_applied === 1) ? (lot.bag_penalty || 0) : 0;
    const laborCost = (lot.manual_deductions_applied === 1) ? (lot.labor_cost || 0) : 0;
    const totalDeductions = moistureLoss + bagPenalty + laborCost;
    
    // Financial calculations
    const bagWeight = 73; // Standard bag weight as per business logic
    const lotTotalBags = lot.totalBags || 0;
    const lotTotalWeight = lot.totalWeightKgs || (lotTotalBags * bagWeight);
    const perKgPaddyRate = (lot.paddyRate || 1200) / bagWeight;
    const currentLotAmount = lotTotalWeight * perKgPaddyRate;
    
    const traderAmount = lotTotalBags * (lot.dealer_commission_rate || 0);
    const labourAmount = lotTotalBags * (lot.labour_commission_rate || 0);

    const transitions = [
      { id: 'LOADED', label: 'Lot Loaded', date: lot.loaded_at },
      { id: 'TRANSIT', label: 'In Transit', date: lot.transit_at },
      { id: 'DELIVERED', label: 'Arrival at Mill', date: lot.delivered_at },
      { id: 'QUALITY', label: 'Quality Verified', date: lot.quality_checked_at },
      { id: 'PAID', label: 'Remittance Released', date: lot.paid_at },
      { id: 'SETTLED', label: 'Account Finalized', date: lot.settled_at }
    ].filter(t => t.date);

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Lot Audit - ${lot.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { 
            font-family: 'Outfit', sans-serif; 
            background: #F1F5F9; 
            color: #0F172A; 
            padding: 24px; 
            padding-top: 80px;
            line-height: 1.4; 
          }

          .no-print { position: fixed; top: env(safe-area-inset-top, 20px); right: 20px; z-index: 99999; display: flex; gap: 16px; margin-top: 10px; }
          .btn-action { 
            width: 56px; height: 56px; border-radius: 50%; 
            background: #0F172A; color: white; border: none; 
            font-size: 24px; cursor: pointer; 
            display: flex; align-items: center; justify-content: center; 
            box-shadow: 0 15px 30px rgba(0,0,0,0.3); 
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            -webkit-tap-highlight-color: transparent;
            pointer-events: auto;
          }
          .btn-action:active { transform: scale(0.85); box-shadow: 0 5px 15px rgba(0,0,0,0.4); }
          .btn-download { background: #10B981; }
          .btn-action svg { pointer-events: none; }

          .container { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

          /* Header Section */
          .header-meta { font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
          .lot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
          .lot-id { font-size: 32px; font-weight: 900; color: #0F172A; letter-spacing: -0.02em; }
          .status-badge { 
            background: #BEF264; color: #3F6212; 
            padding: 6px 12px; border-radius: 99px; 
            font-size: 10px; font-weight: 900; 
            text-transform: uppercase; letter-spacing: 0.05em; 
            display: flex; align-items: center; gap: 4px;
          }

          .entity-bar { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
          .entity-logo { 
            width: 48px; height: 48px; background: #0F172A; 
            border-radius: 12px; display: flex; align-items: center; justify-content: center;
          }
          .entity-info h3 { font-size: 18px; font-weight: 800; text-transform: uppercase; line-height: 1.2; }
          .entity-info p { font-size: 12px; font-weight: 600; color: #64748B; }

          /* Generic Card Style */
          .card { background: #FFFFFF; padding: 24px; border-radius: 28px; border: 1px solid rgba(0,0,0,0.05); }
          .card-title { font-size: 11px; font-weight: 900; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px;}

          /* Payload Card */
          .payload-card { 
            background: #143D14; color: white; 
            padding: 32px; border-radius: 32px; 
            position: relative; overflow: hidden;
            box-shadow: 0 20px 40px rgba(20, 61, 20, 0.1);
          }
          .payload-label { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.6); text-transform: uppercase; margin-bottom: 8px; }
          .payload-main { font-size: 48px; font-weight: 900; line-height: 1; margin-bottom: 24px; }
          .payload-unit { font-size: 16px; opacity: 0.6; margin-left: 4px; }
          .payload-sub-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;}
          .payload-sub-label { font-size: 9px; font-weight: 800; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 4px; }
          .payload-sub-value { font-size: 20px; font-weight: 800; }

          /* Info Grid */
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .info-val { font-size: 15px; font-weight: 800; color: #0F172A; }
          .info-label { font-size: 9px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 2px; }

          /* Timeline */
          .timeline { display: flex; flex-direction: column; gap: 16px; padding-left: 12px; }
          .timeline-item { position: relative; padding-left: 28px; border-left: 2px solid #E2E8F0; }
          .timeline-item::before { 
            content: ''; position: absolute; left: -7px; top: 0; 
            width: 12px; height: 12px; background: #BEF264; border: 2px solid #143D14; border-radius: 50%;
          }
          .timeline-item:last-child { border-left-color: transparent; }
          .timeline-label { font-size: 13px; font-weight: 800; color: #0F172A; }
          .timeline-date { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; }

          /* Ledger List */
          .ledger-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #F1F5F9; }
          .ledger-item:last-child { border-bottom: none; }
          .ledger-info h5 { font-size: 13px; font-weight: 800; }
          .ledger-info p { font-size: 10px; color: #94A3B8; font-weight: 700; }
          .ledger-val { font-size: 14px; font-weight: 800; color: #0F172A; }

          /* Transaction Row */
          .txn-item { background: #F8FAFC; padding: 14px; border-radius: 16px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #F1F5F9; }
          .txn-main { font-size: 13px; font-weight: 800; color: #14532D; }

          @media print {
            body { padding: 0 !important; background: white !important; }
            .no-print { display: none !important; }
            .container { max-width: 100% !important; margin: 0 !important; }
            .card { border: 1px solid #F1F5F9 !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-action btn-download" type="button" onclick="window.print(); return false;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button class="btn-action" type="button" onclick="self.close(); return false;">×</button>
        </div>
        <div class="container">
          <div>
            <p class="header-meta">Institutional Archive</p>
            <div class="lot-header">
              <h1 class="lot-id">#${lot.id}</h1>
              <div class="status-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Audit Finalized
              </div>
            </div>
          </div>

          <div class="entity-bar">
            <div class="entity-logo">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BEF264" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10"/><path d="M8 11h4"/><path d="M8 15h4"/><circle cx="10" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M15 18h1"/><path d="M17 10h4l2 3v5h-5"/><path d="M17 13h6"/></svg>
            </div>
            <div class="entity-info">
              <h3>${lot.mill_name || 'REGISTERED MILL'}</h3>
              <p>Industrial Settlement Context • ${new Date().getFullYear()}</p>
            </div>
          </div>

          <div class="payload-card">
            <p class="payload-label">Certified Net Yield</p>
            <div class="payload-main">${(lotTotalWeight || 0).toLocaleString('en-IN')}<span class="payload-unit">KG</span></div>
            <p style="font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4); margin-top: -12px; margin-bottom: 20px;">BAG CALCULATION: ${lotTotalBags.toLocaleString('en-IN')} BAGS × ${bagWeight} KG (STD)</p>
            ${lot.post_load_scale > 0 ? `<p style="font-size: 8px; font-weight: 600; color: rgba(255,255,255,0.3); margin-top: -16px; margin-bottom: 20px;">TRUCK CALCULATION: ${(lot.post_load_scale || 0).toLocaleString('en-IN')} (GROSS) - ${(lot.pre_load_scale || 0).toLocaleString('en-IN')} (TARE)</p>` : ''}
          </div>

          <div class="card">
            <p class="card-title">Logistics Traceability</p>
            <div class="info-grid">
              <div>
                <p class="info-label">Vehicle Context</p>
                <p class="info-val">${lot.vehicle_type || 'Commercial Trailor'}</p>
              </div>
              <div>
                <p class="info-label">Registry Number</p>
                <p class="info-val" style="text-transform: uppercase;">${lot.reg_number || 'TR-7722'}</p>
              </div>
              <div style="margin-top: 12px;">
                <p class="info-label">Point of Loading</p>
                <p class="info-val">${lot.load_area || 'Central Depot'}</p>
              </div>
              <div style="margin-top: 12px;">
                <p class="info-label">Manifest Date</p>
                <p class="info-val">${lot.date}</p>
              </div>
            </div>
          </div>

          <div class="card">
            <p class="card-title">Technical Audit Statistics</p>
            <div class="info-grid">
               <div>
                <p class="info-label">Avg Moisture Index</p>
                <p class="info-val" style="color: #10B981;">${lot.avgMoisture || '13.5'}%</p>
              </div>
               <div>
                <p class="info-label">Verification Strategy</p>
                <p class="info-val" style="color: ${lot.post_load_scale > 0 ? '#0EA5E9' : '#0F172A'};">${lot.post_load_scale > 0 ? 'Digital Audit' : 'Bag Audit'}</p>
              </div>
              <div style="margin-top: 12px;">
                <p class="info-label">Inventory Size</p>
                <p class="info-val">${lotTotalBags} Standard Bags</p>
              </div>
              <div style="margin-top: 12px;">
                <p class="info-label">Unit Valuation</p>
                <p class="info-val">₹${lot.paddyRate || 1200} / Unit</p>
              </div>
            </div>
          </div>

          <div class="card">
            <p class="card-title">Chain of Custody Timeline</p>
            <div class="timeline">
              ${transitions.map(t => `
                <div class="timeline-item">
                  <p class="timeline-label">${t.label}</p>
                  <p class="timeline-date">${new Date(t.date).toLocaleDateString('en-IN')} • ${new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <p class="card-title">Audit Ledger Breakdown</p>
            <div class="ledger-item">
              <div class="ledger-info">
                <h5>Lot Valuation</h5>
                <p>Gross Paddy Value (Weight × Rate)</p>
                <p style="font-size: 8px; color: #64748B;">${lotTotalWeight.toLocaleString('en-IN')} KG × ₹${perKgPaddyRate.toFixed(2)}/KG</p>
              </div>
              <p class="ledger-val">₹${currentLotAmount.toLocaleString('en-IN')}</p>
            </div>
            <div class="ledger-item">
              <div class="ledger-info">
                <h5>Merchant Fees</h5>
                <p>Brokerage Remuneration (Bags × Fee)</p>
                <p style="font-size: 8px; color: #64748B;">${lotTotalBags} BAGS × ₹${lot.dealer_commission_rate || 0}/BAG</p>
              </div>
              <p class="ledger-val">+ ₹${traderAmount.toLocaleString('en-IN')}</p>
            </div>
            <div class="ledger-item">
              <div class="ledger-info">
                <h5>Industrial Costs</h5>
                <p>Handling & Labour (Bags × Fee)</p>
                <p style="font-size: 8px; color: #64748B;">${lotTotalBags} BAGS × ₹${lot.labour_commission_rate || 0}/BAG</p>
              </div>
              <p class="ledger-val">+ ₹${labourAmount.toLocaleString('en-IN')}</p>
            </div>
            <!-- Audit Penalties Itemization -->
            <div class="ledger-item" style="border-top: 1px dashed #E2E8F0; margin-top: 8px; padding-top: 8px;">
               <div class="ledger-info"><p style="font-size: 8px; font-weight: 800; color: #94A3B8; text-transform: uppercase;">Detailed Audit Penalties</p></div>
            </div>
            <div class="ledger-item" style="padding-top: 4px;">
              <div class="ledger-info"><h5>Moisture Loss</h5><p>Quality Adjustment Index (${lot.avgMoisture || '13.5'}%)</p></div>
              <p class="ledger-val" style="color: #EF4444; font-size: 11px;">- ₹${moistureLoss.toLocaleString('en-IN')}</p>
            </div>
            <div class="ledger-item" style="padding-top: 0px;">
              <div class="ledger-info"><h5>Bag Weight</h5><p>Unit Deviation Penalty</p></div>
              <p class="ledger-val" style="color: #EF4444; font-size: 11px;">- ₹${bagPenalty.toLocaleString('en-IN')}</p>
            </div>
            <div class="ledger-item" style="padding-top: 0px;">
              <div class="ledger-info"><h5>Institutional Fee</h5><p>Audit/Labor Costs</p></div>
              <p class="ledger-val" style="color: #EF4444; font-size: 11px;">- ₹${laborCost.toLocaleString('en-IN')}</p>
            </div>
            <div class="ledger-item" style="background: rgba(239, 68, 68, 0.05); border-radius: 8px; padding: 12px; margin-top: 4px;">
              <div class="ledger-info"><h5 style="color: #B91C1C;">Total Penalty Burden</h5><p style="color: #EF4444; opacity: 0.8;">Audit Final Adjustment</p></div>
              <p class="ledger-val" style="color: #B91C1C; font-weight: 900;">- ₹${totalDeductions.toLocaleString('en-IN')}</p>
            </div>
            <div class="ledger-item" style="border-top: 2px solid #0F172A; margin-top: 12px; padding-top: 16px;">
              <div class="ledger-info"><h5 style="font-size: 16px;">Total Receivables</h5></div>
              <p class="ledger-val" style="font-size: 18px;">₹${(currentLotAmount + traderAmount + labourAmount - totalDeductions).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div class="card" style="background: #EBFEC7;">
            <p class="card-title" style="color: #3F6212; border-bottom-color: rgba(63,98,18,0.1)">Remittance Ledger (Success)</p>
            ${payments.length > 0 ? payments.map(p => `
              <div class="txn-item">
                <div>
                  <p class="txn-main">₹${p.amount.toLocaleString('en-IN')}</p>
                  <p style="font-size: 9px; font-weight: 700; color: #64748B; text-transform: uppercase;">ID: REMT-${(p.id || '').toString().slice(-4).toUpperCase()} • ${p.date}</p>
                </div>
                <div style="text-align: right">
                  <p style="font-size: 10px; font-weight: 800; color: #14532D;">BANK VERIFIED</p>
                  <p style="font-size: 8px; color: #94A3B8;">${p.description || 'Paddy Procurement'}</p>
                </div>
              </div>
            `).join('') : '<p style="text-align: center; font-size: 11px; font-weight: 800; color: #64748B; padding: 20px;">NO TRANSACTION ENTRIES FOUND</p>'}
            
            <div style="margin-top: 12px; text-align: right; padding-top: 12px; border-top: 1px dashed rgba(63,98,18,0.2)">
              <p style="font-size: 10px; font-weight: 800; color: #3F6212;">TOTAL REMITTANCE RECEIVED</p>
              <p style="font-size: 24px; font-weight: 900; color: #14532D;">₹${totalPayments.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <p style="text-align: center; font-size: 9px; font-weight: 700; color: #94A3B8; margin-top: 20px;">
            DIGITALLY GENERATED AUDIT CONTEXT • PADDYNEXUS INDUSTRIAL NODE<br>
            REF: ${Date.now()} • SECURE AUTH VERIFIED
          </p>
        </div>
      </body>
      </html>

    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(reportHtml);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/mill-payments?year=${selectedYear}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mill_id: millId,
          amount: parseInt(paymentAmount),
          date: new Date().toISOString().split('T')[0],
          description: paymentDescription,
          lot_id: remitLotId,
          traderId: user?.id
        })
      });
      if (res.ok) {
        setIsPaymentModalOpen(false);
        setPaymentAmount('');
        setPaymentDescription('');
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to record payment");
      }
    } catch (err) {
      console.error("Error recording payment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDeductions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLot) return;
    setIsSavingDeductions(true);
    try {
      const res = await fetch(`${API_BASE_URL}/lots/${encodeURIComponent(editingLot.id)}/deductions?traderId=${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moisture_loss: parseFloat(customMoisture) || 0,
          bag_penalty: parseFloat(customBagPenalty) || 0,
          labor_cost: parseFloat(customLabor) || 0
        })
      });
      if (res.ok) {
        setIsDeductionModalOpen(false);
        await fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update deductions");
      }
    } catch (err) {
      console.error("Error updating deductions:", err);
      alert("An error occurred while communicating with the server");
    } finally {
      setIsSavingDeductions(false);
    }
  };

  const handleDeletePayment = async (e: React.MouseEvent, paymentId: number) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: 'Delete Remittance',
      message: 'Are you sure you want to delete this remittance entry? This will revert the balance and permanently remove the record.',
      actionLabel: 'Delete Permanently',
      isDestructive: true,
      onConfirm: async () => {
        try {
          console.log(`Attempting to delete payment: ${paymentId}`);
          const res = await fetch(`${API_BASE_URL}/mill-payments/${paymentId}?traderId=${user?.id}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            await fetchData();
          } else {
            const errData = await res.json();
            alert(errData.error || "Failed to delete remittance entry");
          }
        } catch (error) {
          console.error("Error deleting payment:", error);
          alert("An error occurred while deleting the remittance entry.");
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleDeleteLot = async (e: React.MouseEvent, lotId: string) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      title: 'Unassign Lot',
      message: `Are you sure you want to un-assign lot "${lotId}" from this mill? It will be returned to the 'DELIVERED' stage.`,
      actionLabel: 'Unassign Now',
      isDestructive: true,
      onConfirm: async () => {
        try {
          console.log(`Attempting to unassign lot: ${lotId}`);
          const res = await fetch(`${API_BASE_URL}/lots/${encodeURIComponent(lotId)}/unassign?traderId=${user?.id}`, {
            method: 'PATCH'
          });
          if (res.ok) {
            await fetchData();
          } else {
            const errData = await res.json();
            alert(errData.error || "Failed to unassign lot");
          }
        } catch (error) {
          console.error("Error unassigning lot:", error);
          alert("An error occurred while unassigning the lot.");
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const exportToPDF = () => {
    if (!data) return;

    const filteredLots = data.lots.filter((l: any) => selectedLotId === 'All Lots' || l.id === selectedLotId);
    const millName = data.name || 'Industrial Partner';
    const reportDate = new Date().toLocaleDateString('en-IN');
    const filterTitle = selectedLotId === 'All Lots' ? 'Full Seasonal Ledger' : `Lot Audit: ${selectedLotId}`;

    let tableRowsHtml = '';

    if (selectedLotId === 'All Lots') {
      // Seasonal Summary View
      filteredLots.forEach((lot: any) => {
        tableRowsHtml += `
          <tr>
            <td>${lot.date}</td>
            <td style="font-weight:900; font-style: italic">Manifest ${lot.id}</td>
            <td>${lot.name}</td>
            <td style="text-align:right">₹${lot.totalAmount.toLocaleString('en-IN')}</td>
            <td style="text-align:right">--</td>
          </tr>
        `;
      });

      data.payments.forEach((p: any) => {
        tableRowsHtml += `
          <tr style="background-color: #f0fdf4">
            <td>${p.date}</td>
            <td style="font-weight:900; font-style: italic">REMT-${p.id}</td>
            <td>${p.description || 'Remittance'}</td>
            <td style="text-align:right">--</td>
            <td style="text-align:right; color: #10b981">₹${p.amount.toLocaleString('en-IN')}</td>
          </tr>
        `;
      });
    } else {
      // Single Lot Audit View
      const lot = filteredLots[0];
      if (lot) {
        tableRowsHtml += `
          <tr style="background-color: #f8fafc">
            <td>${lot.date}</td>
            <td style="font-weight:900">MANIFEST ${lot.id}</td>
            <td>${lot.name}</td>
            <td style="text-align:right">₹${lot.totalAmount.toLocaleString('en-IN')}</td>
            <td style="text-align:right">--</td>
          </tr>
        `;

        const transitions = [
          { name: 'LOT LOADED', date: lot.loaded_at },
          { name: 'IN TRANSIT', date: lot.transit_at },
          { name: 'DELIVERED TO MILL', date: lot.delivered_at },
          { name: 'QUALITY CHECKED', date: lot.quality_checked_at },
          { name: 'PAYMENT RELEASED', date: lot.paid_at },
          { name: 'ACCOUNT SETTLED', date: lot.settled_at }
        ].filter(t => t.date);

        transitions.forEach(t => {
          tableRowsHtml += `
            <tr style="border-left: 4px solid #10b981">
              <td style="font-size: 10px; color: #64748b">${new Date(t.date).toLocaleDateString('en-IN')}</td>
              <td style="font-weight:900; color: #10b981; font-style: italic">${t.name}</td>
              <td colspan="3" style="font-size: 10px; color: #94a3b8">Verified at ${new Date(t.date).toLocaleTimeString('en-IN')}</td>
            </tr>
          `;
        });
      }
    }

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Statement - ${millName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
          body { 
            font-family: 'Outfit', sans-serif; 
            background: #F8FAFC; 
            color: #0F172A; 
            padding: 24px; 
            padding-top: 80px;
            line-height: 1.5; 
          }

          .no-print { position: fixed; top: 20px; right: 20px; z-index: 9999; }
          .btn-close { 
            width: 44px; height: 44px; border-radius: 50%; 
            background: #0F172A; color: white; border: none; 
            font-size: 24px; cursor: pointer; 
            display: flex; align-items: center; justify-content: center; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
          }

          .container { max-width: 600px; margin: 0 auto; }

          .header-meta { font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
          .lot-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
          .lot-id { font-size: 24px; font-weight: 900; color: #0F172A; letter-spacing: -0.02em; }
          .report-date { font-size: 11px; font-weight: 700; color: #94A3B8; }

          .summary-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
          .stat-card { background: #FFFFFF; padding: 16px; border-radius: 20px; border: 1px solid #F1F5F9; }
          .stat-label { font-size: 8px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-bottom: 4px; }
          .stat-value { font-size: 14px; font-weight: 800; }

          table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
          th { text-align: left; padding: 12px; font-size: 9px; font-weight: 900; color: #94A3B8; text-transform: uppercase; }
          td { padding: 16px; background: #FFFFFF; font-size: 11px; font-weight: 600; }
          td:first-child { border-radius: 12px 0 0 12px; }
          td:last-child { border-radius: 0 12px 12px 0; text-align: right; }
          .manifest-id { font-weight: 900; color: #0F172A; }

          @media print {
            body { padding: 0 !important; background: white !important; }
            .no-print { display: none !important; }
            .container { max-width: 100% !important; margin: 0 !important; }
            .stat-card, td { border: 1px solid #F1F5F9 !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-close" onclick="window.close()">×</button>
        </div>
        <div class="container">
          <p class="header-meta">Industrial Statement</p>
          <div class="lot-header">
            <div>
              <h1 class="lot-id">${millName}</h1>
              <p class="report-date">${filterTitle}</p>
            </div>
            <div style="text-align: right">
              <p class="report-date">Generated: ${reportDate}</p>
              <p class="header-meta" style="margin-top: 4px">ID: MS-${millId}</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="stat-card">
              <p class="stat-label">Total Units</p>
              <p class="stat-value">${data.summary.totalBags || 0} Bags</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Net Liability</p>
              <p class="stat-value" style="color: #EF4444">₹${(data.summary.netBalance || 0).toLocaleString('en-IN')}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Audit status</p>
              <p class="stat-value" style="color: #10B981">${data.summary.is_settled ? 'VERIFIED' : 'ACTIVE'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Entity</th>
                <th style="text-align: right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F8FAFC] dark:bg-[#0F172A]">
        <div className="h-12 w-12 animate-spin rounded-2xl border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return <div className="p-12 text-center font-black uppercase text-slate-400">Mill Registry Not Found</div>;

  const lots = data.lots || [];
  const payments = data.payments || [];
  const summary = data.summary || { totalDelivered: 0, totalPaid: 0, netBalance: 0 };

  const globalGross = lots.reduce((sum: number, l: any) => {
    const bagWeight = parseFloat(l.weight_capacity) || 73;
    const lotTotalBags = l.totalBags || 0;
    
    // 1. Total Weight = Bags * Weight Capacity
    const lotTotalWeight = lotTotalBags * bagWeight;
    
    // 2. Per KG Rate = Paddy Rate / Weight Capacity
    const perKgPaddyRate = (l.paddyRate || 1200) / bagWeight;
    
    // 3. Total Paddy Gross = Total Weight * Per KG Rate
    const lotValue = lotTotalWeight * perKgPaddyRate;
    
    // 4. Commissions
    const lotTrader = lotTotalBags * (l.dealer_commission_rate || 0);
    const lotLabour = lotTotalBags * (l.labour_commission_rate || 0);
    
    return sum + lotValue + lotTrader + lotLabour;
  }, 0);

  const globalDeductions = lots.reduce((sum: number, l: any) => {
    const moisture = (l.manual_deductions_applied === 1) ? (l.moisture_loss || 0) : 0;
    const penalty = (l.manual_deductions_applied === 1) ? (l.bag_penalty || 0) : 0;
    const labor = (l.manual_deductions_applied === 1) ? (l.labor_cost || 0) : 0;
    return sum + moisture + penalty + labor;
  }, 0);

  const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const globalNetBalance = globalGross - totalPaid - globalDeductions;

  const totalSettledValue = lots.filter((l: any) => l.stage === 'SETTLED').reduce((sum: number, l: any) => {
    const lotValue = (l.totalWeightKgs || 0) * ((l.paddyRate || 1200) / 73);
    const lotTrader = (l.totalBags || 0) * (l.dealer_commission_rate || 0);
    const lotLabour = (l.totalBags || 0) * (l.labour_commission_rate || 0);
    return sum + lotValue + lotTrader + lotLabour;
  }, 0);

  const currentLot = selectedLotId === 'All Lots' ? null : lots.find((l: any) => l.id === selectedLotId);
  const lotPayments = selectedLotId === 'All Lots' ? payments : payments.filter((p: any) => (p.lotId || p.lot_id) === selectedLotId);

  return (
    <div className="flex h-full w-full flex-col bg-[#F8FAFC] dark:bg-[#020617] font-display text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="px-4 py-6 md:px-10 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 gap-6 md:gap-0">
        <div className="flex items-center gap-4 md:gap-8">
          <button
            onClick={() => navigate('/mill-settlements')}
            className="flex w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 items-center justify-center text-slate-400 hover:text-primary hover:border-primary/50 transition-all shadow-sm shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-emerald-500">Live Industrial Audit</p>
            </div>
            <h1 className="text-xl md:text-3xl font-[1000] tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">
              {data.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-2.5 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
          >
            <option value="2026">2026 Season</option>
            <option value="2025">2025 Season</option>
            <option value="2024">2024 Season</option>
          </select>

          {selectedLotId === 'All Lots' && (summary.netBalance || 0) > 0 && (
            <button
              onClick={() => {
                setRemitLotId(null);
                setIsPaymentModalOpen(true);
              }}
              className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-3 md:py-4 bg-primary text-slate-900 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
              Est. Remittance
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 md:pb-12 space-y-8 md:space-y-12">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedLotId('All Lots')}
            className={`px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedLotId === 'All Lots' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl' : 'bg-white dark:bg-white/5 text-slate-400 border border-slate-100 dark:border-white/5 hover:border-primary/30'}`}
          >
            Seasonal Ledger View
          </button>
          {lots.map((lot: any) => (
            <button
              key={lot.id}
              onClick={() => setSelectedLotId(lot.id)}
              className={`px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 md:gap-3 ${selectedLotId === lot.id ? 'bg-primary text-slate-900 shadow-xl shadow-primary/20' : 'bg-white dark:bg-white/5 text-slate-400 border border-slate-100 dark:border-white/5 hover:border-primary/30'}`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                <span>Lot-{lot.id.toString().slice(-4).toUpperCase()}</span>
                {lot.stage === 'SETTLED' && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black flex items-center gap-1 ${selectedLotId === lot.id ? 'bg-slate-900/10 text-slate-900' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    SETTLED
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {selectedLotId === 'All Lots' ? (
          <div className="space-y-12">
            {/* Global Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-8">
              <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[40px] p-6 md:p-8 border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Manifested Value</p>
                <h3 className="text-2xl md:text-4xl font-[1000] italic tracking-tighter tabular-nums mb-2">₹{globalGross.toLocaleString('en-IN')}</h3>
                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase">
                  <Activity className="w-3 h-3" />
                  {lots.length} Manifests Tracked
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[40px] p-6 md:p-8 border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden group border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Settled Capital</p>
                <h3 className="text-2xl md:text-4xl font-[1000] italic tracking-tighter tabular-nums mb-2 text-emerald-500">₹{totalSettledValue.toLocaleString('en-IN')}</h3>
                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase">
                  <CheckCircle2 className="w-3 h-3" />
                  {lots.filter((l: any) => l.stage === 'SETTLED').length} Lots Finalized
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[40px] p-6 md:p-8 border border-slate-100 dark:border-white/5 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Remitted Capital</p>
                <h3 className="text-2xl md:text-4xl font-[1000] italic tracking-tighter tabular-nums mb-2">₹{totalPaid.toLocaleString('en-IN')}</h3>
                <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase">
                  <TrendingDown className="w-3 h-3" />
                  {payments.length} Remittance Entries
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[40px] p-6 md:p-8 border border-slate-100 dark:border-white/5 shadow-sm border-l-4 border-l-orange-500">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Outstanding Liability</p>
                <h3 className="text-2xl md:text-4xl font-[1000] italic tracking-tighter tabular-nums mb-2 text-orange-500">₹{globalNetBalance.toLocaleString('en-IN')}</h3>
                <div className={`flex items-center gap-2 text-[9px] font-black uppercase ${globalNetBalance <= 0 ? 'text-emerald-500' : 'text-orange-500'}`}>
                  {globalNetBalance <= 0 ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {globalNetBalance <= 0 ? 'Session Settled' : 'Session Active'}
                </div>
              </div>

              <div className="bg-slate-900 dark:bg-white rounded-3xl md:rounded-[40px] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="text-[10px] font-black text-white/40 dark:text-slate-400 uppercase tracking-widest mb-4">Quick Actions</p>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <button onClick={exportToPDF} className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-white/5 dark:bg-slate-900/5 rounded-2xl hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors">
                    <Download className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    <span className="text-[8px] font-black uppercase text-white dark:text-slate-900">Export PDF</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-2 p-3 md:p-4 bg-white/5 dark:bg-slate-900/5 rounded-2xl hover:bg-white/10 dark:hover:bg-slate-900/10 transition-colors">
                    <Share2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    <span className="text-[8px] font-black uppercase text-white dark:text-slate-900">Transmit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[48px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm">
              <div className="p-6 md:p-8 border-b border-slate-50 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter leading-none">Seasonal Financial Ledger</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional protocol v2.4 verified</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="SEARCH MANIFESTS..."
                      className="bg-slate-100 dark:bg-white/5 border-none rounded-xl pl-12 pr-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                      <th className="px-6 md:px-12 py-6 md:py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction Context</th>
                      <th className="hidden md:table-cell px-12 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Entity</th>
                      <th className="px-6 md:px-12 py-6 md:py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Debit (Lot)</th>
                      <th className="px-6 md:px-12 py-6 md:py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Credit (Payment)</th>
                      <th className="hidden lg:table-cell px-12 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {lots.map((lot: any) => {
                      const lotGross = (lot.totalWeightKgs || 0) * (lot.paddyRate / 73);
                      const lotTrader = (lot.totalBags || 0) * (lot.dealer_commission_rate || 0);
                      const lotLabour = (lot.totalBags || 0) * (lot.labour_commission_rate || 0);
                      const moistureLoss = (lot.manual_deductions_applied === 1) ? (lot.moisture_loss || 0) : 0;
                      const bagPenalty = (lot.manual_deductions_applied === 1) ? (lot.bag_penalty || 0) : 0;
                      const laborCost = (lot.manual_deductions_applied === 1) ? (lot.labor_cost || 0) : 0;
                      const lotCombinedGross = (lotGross + lotTrader + lotLabour) - (moistureLoss + bagPenalty + laborCost);

                      return (
                        <tr key={`lot-${lot.id}`} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedLotId(lot.id)}>
                          <td className="px-6 md:px-12 py-5 md:py-7">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shrink-0">
                                <Package className="w-4 h-4 md:w-5 md:h-5" />
                              </div>
                              <div>
                                <p className="text-[11px] md:text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-1">Lot Manifest {lot.id}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lot.date}</p>
                                  {lot.stage === 'SETTLED' && (
                                    <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                      <CheckCircle2 className="w-2.5 h-2.5" />
                                      Settled
                                    </span>
                                  )}
                                </div>
                                <p className="md:hidden text-[8px] font-bold text-slate-500 uppercase mt-1">{lot.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-12 py-7">
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{lot.name}</p>
                          </td>
                          <td className="px-6 md:px-12 py-5 md:py-7 text-right text-xs md:text-sm font-black text-slate-900 dark:text-white italic tracking-tighter tabular-nums">
                            ₹{lotCombinedGross.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 md:px-12 py-5 md:py-7 text-right text-slate-300 dark:text-slate-700">--</td>
                          <td className="hidden lg:table-cell px-12 py-7 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {payments.map((p: any) => {
                      const associatedLot = lots.find((l: any) => l.id === p.lotId);
                      return (
                        <tr key={`pay-${p._id || p.id}`} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-l-4 border-l-primary">
                          <td className="px-6 md:px-12 py-5 md:py-7">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0">
                                <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
                              </div>
                              <div>
                                <p className="text-[11px] md:text-xs font-black text-primary uppercase italic tracking-tighter leading-none mb-1">Financial Remittance</p>
                                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.date}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-12 py-7">
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">{p.description || 'Institutional Payment'}</p>
                          </td>
                          <td className="px-6 md:px-12 py-5 md:py-7 text-right text-slate-300 dark:text-slate-700">--</td>
                          <td className="px-6 md:px-12 py-5 md:py-7 text-right text-xs md:text-sm font-black text-emerald-500 italic tracking-tighter tabular-nums">
                            ₹{(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 md:px-12 py-5 md:py-7 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <span className="hidden lg:inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10">
                                <History className="w-3 h-3" />
                                Success
                              </span>
                              {associatedLot?.stage !== 'SETTLED' && (
                                <button
                                  type="button"
                                  onClick={(e) => handleDeletePayment(e, p.id)}
                                  className="relative z-10 p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 hover:scale-110 active:scale-95 pointer-events-auto"
                                  title="Delete Remittance"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <MillLotDashboard
            lot={currentLot}
            payments={lotPayments}
            onRecordPayment={() => {
              setRemitLotId(selectedLotId);
              setIsPaymentModalOpen(true);
            }}
            onEditDeductions={(l) => {
              setEditingLot(l);
              setCustomMoisture(l.moisture_loss?.toString() || '0');
              setCustomBagPenalty(l.bag_penalty?.toString() || '0');
              setCustomLabor(l.labor_cost?.toString() || '0');
              setIsDeductionModalOpen(true);
            }}
            onSettleLot={handleSettleLot}
            onDeletePayment={handleDeletePayment}
            onGenerateReport={handleGenerateReport}
            isUpdating={isUpdating}
          />
        )}
      </main>

      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[48px] p-6 sm:p-10 md:p-12 shadow-[0_32px_128px_rgba(23,207,84,0.15)] overflow-hidden border border-white/5"
            >
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                type="button"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="mb-8 md:mb-10">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3 block">Institutional Remittance</label>
                <h3 className="text-2xl md:text-3xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Record Capital</h3>
                {remitLotId && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20 px-3 py-1 rounded-full">Lot: {remitLotId}</span>
                    <button onClick={() => setRemitLotId(null)} className="text-[9px] font-black text-slate-400 hover:text-slate-100 uppercase underline">Make Global</button>
                  </div>
                )}
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-8 md:space-y-10">
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl md:text-5xl font-[1000] text-primary italic">₹</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    autoFocus
                    className="w-full bg-transparent border-b-2 md:border-b-4 border-slate-100 dark:border-white/10 pb-4 text-3xl md:text-5xl font-[1000] text-slate-900 dark:text-white italic focus:border-primary outline-none transition-all placeholder:text-slate-100 dark:placeholder:text-white/5"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Memo</p>
                  <input
                    type="text"
                    value={paymentDescription}
                    onChange={(e) => setPaymentDescription(e.target.value)}
                    placeholder="e.g. Wire Transfer via HDFC"
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-6 py-4 md:py-6 text-base md:text-lg font-bold focus:ring-4 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 md:py-7 bg-primary text-background-dark text-lg font-[1000] uppercase tracking-[0.2em] rounded-2xl md:rounded-[32px] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submitting ? 'PROCESSING...' : 'AUTHORIZE TRANSFER'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeductionModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeductionModalOpen(false)}
              className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl md:rounded-[48px] p-6 sm:p-10 shadow-2xl border border-white/5"
            >
              <button
                onClick={() => setIsDeductionModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors"
                type="button"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <h3 className="text-2xl md:text-3xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter mb-8 leading-none">Edit Audit</h3>

              <form onSubmit={handleUpdateDeductions} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Moisture Loss (₹)</label>
                    <input
                      type="number"
                      value={customMoisture}
                      onChange={(e) => setCustomMoisture(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-6 py-4 text-lg font-black focus:ring-4 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Bag Penalty (₹)</label>
                    <input
                      type="number"
                      value={customBagPenalty}
                      onChange={(e) => setCustomBagPenalty(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-6 py-4 text-lg font-black focus:ring-4 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Labor Cost (₹)</label>
                    <input
                      type="number"
                      value={customLabor}
                      onChange={(e) => setCustomLabor(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl px-6 py-4 text-lg font-black focus:ring-4 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingDeductions}
                  className="w-full py-5 md:py-6 bg-primary text-slate-900 font-black uppercase tracking-widest rounded-2xl md:rounded-[24px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50 mt-4"
                >
                  {isSavingDeductions ? 'SAVING...' : 'COMMIT ADJUSTMENTS'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmDialog
        open={confirmDialog.open}
        type={confirmDialog.isDestructive ? 'destructive' : 'info'}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        confirmLabel={confirmDialog.actionLabel}
        cancelLabel="Discard"
      />
    </div>
  );
}



// PREMIUM SINGLE LOT DASHBOARD
function MillLotDashboard({
  lot,
  payments,
  onRecordPayment,
  onEditDeductions,
  onSettleLot,
  onDeletePayment,
  onGenerateReport,
  isUpdating
}: {
  lot: any;
  payments: any[];
  onRecordPayment: () => void;
  onEditDeductions: (lot: any) => void;
  onSettleLot: (lotId: string) => void;
  onDeletePayment: (e: React.MouseEvent, paymentId: number) => void;
  onGenerateReport: (lot: any, payments: any[]) => void;
  isUpdating?: boolean;
}) {
  if (!lot) return null;

  const grossAmount = (lot.totalWeightKgs || 0) * ((lot.paddyRate || 1200) / 73);
  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Derived Metrics
  const moistureIndex = lot.avgMoisture || 13.5;

  // Use custom deductions if manual override flag is set, else use automated business logic
  const moistureLoss = (lot.manual_deductions_applied === 1)
    ? (lot.moisture_loss || 0)
    : 0;
  const bagPenalty = (lot.manual_deductions_applied === 1)
    ? (lot.bag_penalty || 0)
    : 0;
  const laborCost = (lot.manual_deductions_applied === 1)
    ? (lot.labor_cost || 0)
    : 0;

  const traderAmount = (lot.totalBags || 0) * (lot.dealer_commission_rate || 0);
  const labourAmount = (lot.totalBags || 0) * (lot.labour_commission_rate || 0);
  const totalDeductions = moistureLoss + bagPenalty + laborCost;

  const combinedGrossAmount = grossAmount + traderAmount + labourAmount;
  const netPayable = combinedGrossAmount - totalPayments - totalDeductions;
  const isCleared = netPayable <= 1; // Tolerance for floating point/rounding
  const isSettled = lot.stage === 'SETTLED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 md:space-y-8"
    >
      {/* PRIMARY CONTEXT ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl md:rounded-[32px] p-4 md:p-6 shadow-xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck className="w-12 h-12 text-primary" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Lot Source Entity</p>
          <h3 className="text-lg md:text-xl font-[1000] text-white uppercase italic tracking-tighter truncate">{lot.mill_name || 'REGISTERED MILL'}</h3>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Processing</span>
          </div>
        </div>

        <div className="bg-primary rounded-2xl md:rounded-[32px] p-4 md:p-6 shadow-xl shadow-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Scale className="w-12 h-12 text-slate-900" />
          </div>
          <p className="text-[10px] font-black text-slate-900/50 uppercase tracking-[0.2em] mb-1">Total Net Payload</p>
          <h2 className="text-2xl md:text-3xl font-[1000] text-slate-900 uppercase italic tracking-tighter">
            {lot.totalWeightKgs?.toLocaleString('en-IN')} <span className="text-sm">KGS</span>
          </h2>
          <p className="text-[9px] font-bold text-slate-900/60 uppercase tracking-widest mt-1">
            {(lot.totalWeightKgs / 100).toFixed(2)} QUINTALS TOTAL
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-[32px] p-4 md:p-6 border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Settlement Session</p>
          <div className="flex items-center gap-3">
             <h4 className="text-lg md:text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter">BATCH: {lot.id}</h4>
             {isSettled && (
               <span className="px-2 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">SETTLED</span>
             )}
          </div>
          <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-2 bg-primary/10 px-2 py-1 rounded-lg inline-block">
            Verified Audit Cycle
          </p>
        </div>
      </div>

      {/* RE-ARCHITECTED: 4-COLUMN AUDIT COMMAND CENTER */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[56px] p-6 sm:p-8 md:p-12 border border-slate-100 dark:border-white/5 shadow-2xl relative overflow-hidden group mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-12 relative z-10">

          {/* COLUMN 1: PRIMARY VALUATION (COMBINED GROSS) */}
          <div className="space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Primary Audit Valuation</p>
              <h4 className="text-3xl sm:text-4xl md:text-5xl font-[1000] text-slate-900 dark:text-white italic tracking-tighter tabular-nums leading-none">
                ₹{combinedGrossAmount.toLocaleString('en-IN')}
              </h4>
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-2 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Total Combined Gross
              </p>
            </div>

            <div className="pt-6 border-t border-slate-50 dark:border-white/5 space-y-3">
              <div className="flex justify-between items-center group/item hover:bg-slate-50/50 dark:hover:bg-white/[0.02] p-2 -mx-2 rounded-xl transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Paddy Inventory</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 italic">₹{grossAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center p-2 -mx-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trader Service Fee</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 italic">₹{traderAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center p-2 -mx-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Labour Handling</span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 italic">₹{labourAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* COLUMN 2: PRODUCT INTELLIGENCE (BAGS, RATE, WEIGHT) */}
          <div className="space-y-6 sm:border-l xl:border-l border-slate-100 dark:border-white/5 sm:pl-8 xl:pl-12">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-slate-50 dark:bg-white/5 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-white/5 group-hover:border-primary/20 transition-all">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Bag Count</p>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white italic leading-none">{lot.totalBags || 0} PCS</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-3 sm:p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">Purchase Rate</p>
                <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white italic leading-none">₹{lot.paddyRate} <span className="text-[8px] opacity-30">/73</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-2.5 h-2.5" />
                  Verification Strategy
                </p>
                <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                  {lot.post_load_scale > 0 ? 'Digital Audit' : 'Bag Audit'}
                </span>
              </div>

              <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Net Yield</span>
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                </div>
                <p className="text-lg sm:text-xl font-[1000] text-slate-900 dark:text-white italic tracking-tighter tabular-nums leading-none">
                  {lot.totalWeightKgs?.toLocaleString('en-IN')} <span className="text-[10px] opacity-40">KGS</span>
                </p>
              </div>

              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic truncate">
                <MapPin className="w-2.5 h-2.5 inline mr-1" /> {lot.load_area || 'Standard Logistics'}
              </p>
            </div>
          </div>

          {/* COLUMN 3: SETTLEMENT ACCOUNTING (REMITTANCE) */}
          <div className="space-y-6 sm:border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-white/5 pt-8 sm:pt-0 xl:pt-0 xl:pl-12 xl:border-l">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2">Current Remittance</p>
              <h4 className="text-2xl sm:text-3xl md:text-4xl font-[1000] text-emerald-600 dark:text-emerald-500 italic tracking-tighter tabular-nums leading-none">
                ₹{totalPayments.toLocaleString('en-IN')}
              </h4>
              <div className="flex items-center gap-2 mt-3">
                <div className="h-1 flex-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${combinedGrossAmount > 0 ? (totalPayments / combinedGrossAmount) * 100 : 0}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
                <span className="text-[9px] font-black text-emerald-500 uppercase">{combinedGrossAmount > 0 ? ((totalPayments / combinedGrossAmount) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 dark:border-white/5 space-y-4">
              <div>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] leading-none mb-1">Audit Deductions</p>
                <p className="text-sm sm:text-base font-black text-rose-500 italic tabular-nums leading-none">₹{totalDeductions.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 p-3 sm:p-4 rounded-2xl flex items-center justify-between group-hover:bg-primary transition-all duration-500">
                <div className="truncate pr-4">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-900 transition-colors">Vehicle Identity</p>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-900 dark:text-white group-hover:text-slate-900 transition-colors uppercase italic truncate">{lot.reg_number || 'N/A'}</p>
                </div>
                <Truck className="w-4 h-4 text-slate-300 group-hover:text-slate-900 transition-colors shrink-0" />
              </div>
            </div>
          </div>

          {/* COLUMN 4: LIABILITY STATUS & ACTIONS */}
          <div className="flex flex-col justify-between pt-8 sm:border-l xl:border-l border-slate-100 dark:border-white/5 sm:pl-8 xl:pl-12">
            <div className="space-y-4 mb-6">
              <div className={`p-5 sm:p-6 rounded-[24px] sm:rounded-[32px] border transition-all ${isCleared ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-orange-500/5 border-orange-500/20 shadow-xl shadow-orange-500/5'}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Net Liability</p>
                <h4 className={`text-2xl sm:text-3xl md:text-4xl font-[1000] italic tracking-tighter tabular-nums leading-none ${isCleared ? 'text-emerald-500' : 'text-orange-500'}`}>
                  ₹{netPayable.toLocaleString('en-IN')}
                </h4>
                <div className="flex items-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${isCleared ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isCleared ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {isSettled ? 'Institutional Account Cleared' : isCleared ? 'Final Audit Verified' : 'Remittance Pending'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => onGenerateReport(lot, payments)}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 dark:border-white/5 group/btn"
              >
                <Download className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
                <span className="hidden sm:inline">Download Audit Context</span>
                <span className="sm:hidden">Download Report</span>
              </button>

              <button
                onClick={() => onSettleLot(lot.id)}
                disabled={!isCleared || isSettled || isUpdating}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${isSettled
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed'
                  : isCleared
                    ? 'bg-primary text-slate-900 border-none hover:scale-105 active:scale-95 shadow-primary/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-white/5 cursor-not-allowed shadow-none'
                  }`}
              >
                {isUpdating ? <Clock className="w-4 h-4 animate-spin" /> : isSettled ? <CheckCircle2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4 opacity-50" />}
                {isSettled ? 'Audit Session Closed' : 'Release Final Payment'}
              </button>
            </div>
          </div>

          <div className="absolute top-0 right-1/4 w-32 h-full bg-slate-50/50 dark:bg-white/[0.02] -skew-x-12 transform pointer-events-none hidden xl:block" />
        </div>
      </div>

      {/* SECONDARY AUDIT: EARNINGS & DEDUCTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        {/* TRADER & LABOR EARNINGS */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] p-6 sm:p-8 md:p-10 border border-slate-100 dark:border-white/5 shadow-sm space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-[11px] sm:text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic">Merchant & Labour Ledger</h5>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Service Earnings</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Trader Revenue</p>
              <p className="text-xl sm:text-2xl font-[1000] text-slate-900 dark:text-white italic tracking-tighter leading-none">₹{traderAmount.toLocaleString('en-IN')}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">{lot.totalBags || 0} Bags × ₹{lot.dealer_commission_rate}</p>
            </div>
            <div className="bg-slate-50/50 dark:bg-white/[0.02] p-4 rounded-2xl border border-slate-100 dark:border-white/5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Labour Yield</p>
              <p className="text-xl sm:text-2xl font-[1000] text-slate-900 dark:text-white italic tracking-tighter leading-none">₹{labourAmount.toLocaleString('en-IN')}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">{lot.totalBags || 0} Bags × ₹{lot.labour_commission_rate}</p>
            </div>
          </div>

          <div className="bg-primary/5 dark:bg-primary/10 p-5 sm:p-6 rounded-3xl border border-primary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Cumulative Manifest Gross</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Paddy + Service Fees</p>
            </div>
            <p className="text-2xl sm:text-3xl font-[1000] text-primary italic tracking-tighter tabular-nums leading-none">₹{combinedGrossAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* DEDUCTION SUMMARY */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] md:rounded-[40px] p-6 sm:p-8 md:p-10 border border-slate-100 dark:border-white/5 shadow-sm space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-[11px] sm:text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic">Quality & Adjustments</h5>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Penalties & Deductions</p>
            </div>
            <button
              onClick={() => onEditDeductions(lot)}
              className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20 shrink-0"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Moisture</p>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">₹{moistureLoss.toLocaleString('en-IN')}</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase mt-2">{moistureIndex.toFixed(1)}% Index</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Bag Weight</p>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">₹{bagPenalty.toLocaleString('en-IN')}</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase mt-2">Deviation</p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Mill Fee</p>
              <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-none">₹{laborCost.toLocaleString('en-IN')}</p>
              <p className="text-[7px] font-bold text-slate-400 uppercase mt-2">Institutional</p>
            </div>
          </div>

          <div className="bg-rose-500/5 dark:bg-rose-500/10 p-5 sm:p-6 rounded-3xl border border-rose-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1">Total Audit Deductions</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Aggregated Penalties</p>
            </div>
            <p className="text-2xl sm:text-3xl font-[1000] text-rose-500 italic tracking-tighter tabular-nums leading-none">₹{totalDeductions.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>


      {/* Middle Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Bank Transactions</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400"><TrendingUp className="w-4 h-4" /></button>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400"><History className="w-4 h-4" /></button>
          </div>
        </div>
        {!isCleared && (
          <button
            onClick={onRecordPayment}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Record Mill Remittance
          </button>
        )}
      </div>

      {/* Transactions Table Style */}
      {/* Transactions Table Style */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[48px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <th className="px-6 md:px-12 py-6 md:py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Value Date</th>
                <th className="hidden md:table-cell px-12 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction ID</th>
                <th className="px-6 md:px-12 py-6 md:py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Details</th>
                <th className="hidden lg:table-cell px-12 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Mode</th>
                <th className="px-6 md:px-12 py-6 md:py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                <th className="hidden lg:table-cell px-12 py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                <th className="px-6 md:px-12 py-6 md:py-8 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {payments.length > 0 ? payments.map((p: any) => (
                <tr key={p._id || p.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 md:px-12 py-5 md:py-7 text-xs font-bold text-slate-500 uppercase">{p.date}</td>
                  <td className="hidden md:table-cell px-12 py-7 text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">REMT-{(p._id || p.id).toString().slice(-4).toUpperCase()}</td>
                  <td className="px-6 md:px-12 py-5 md:py-7">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-[1000] text-slate-900 dark:text-white uppercase italic leading-none">{p.description || 'Paddy Procurement'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct Bank Remittance</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-12 py-7">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10">NEFT-TXN</span>
                  </td>
                  <td className="px-6 md:px-12 py-5 md:py-7 text-right text-xs md:text-sm font-black text-slate-900 dark:text-white italic tracking-tighter tabular-nums">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="hidden lg:table-cell px-12 py-7 text-right">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Success
                    </span>
                  </td>
                  <td className="px-6 md:px-12 py-5 md:py-7 text-right">
                    {!isSettled && (
                      <button
                        type="button"
                        onClick={(e) => onDeletePayment(e, p.id)}
                        className="relative z-10 p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 hover:scale-110 active:scale-95 pointer-events-auto"
                        title="Delete Remittance"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-12 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <Activity className="w-12 h-12 opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No capital transfers established for this manifest</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 md:px-12 py-6 bg-slate-50/50 dark:bg-white/5 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-50 dark:border-white/5">
          <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center md:text-left">Showing {payments.length} Transaction(s) linked to manifest context</p>
          <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">View All Activity Context</button>
        </div>
      </div>

    </motion.div>
  );
}
