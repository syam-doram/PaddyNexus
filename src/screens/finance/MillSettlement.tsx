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
    const moistureIndex = lot.avgMoisture || 13.5;
    const moistureLoss = (lot.manual_deductions_applied === 1) ? (lot.moisture_loss || 0) : 0;
    const bagPenalty = (lot.manual_deductions_applied === 1) ? (lot.bag_penalty || 0) : 0;
    const laborCost = (lot.manual_deductions_applied === 1) ? (lot.labor_cost || 0) : 0;
    const totalDeductions = moistureLoss + bagPenalty + laborCost;
    const bagWeight = parseFloat(lot.weight_capacity as string) || 73;
    const lotTotalBags = lot.totalBags || 0;
    
    // 1. Total Weight = Bags * Weight Capacity
    const lotTotalWeight = lotTotalBags * bagWeight;
    
    // 2. Per KG Rate = Paddy Rate / Weight Capacity
    const perKgPaddyRate = (lot.paddyRate || 1200) / bagWeight;
    
    // 3. Total Paddy Gross = Total Weight * Per KG Rate
    const currentLotAmount = lotTotalWeight * perKgPaddyRate;
    
    // 4. Commissions
    const traderAmount = lotTotalBags * (lot.dealer_commission_rate || 0);
    const labourAmount = lotTotalBags * (lot.labour_commission_rate || 0);
    
    const netPayable = (currentLotAmount + traderAmount + labourAmount) - totalPayments - totalDeductions;

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Commercial Invoice - ${lot.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
          body { font-family: 'Outfit', sans-serif; padding: 40px; color: #334155; line-height: 1.4; background: #f8fafc; }
          .invoice-card { background: #fff; max-width: 900px; margin: 0 auto; box-shadow: 0 20px 50px rgba(0,0,0,0.05); border-radius: 24px; padding: 50px; position: relative; overflow: hidden; }
          .invoice-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px; background: linear-gradient(to right, #6366f1, #3b82f6); }
          
          .header { display: flex; justify-content: space-between; margin-bottom: 50px; }
          .brand-box { }
          .brand-name { font-size: 32px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -1px; margin-bottom: 5px; }
          .brand-tagline { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
          
          .meta-box { text-align: right; }
          .doc-title { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; }
          .badge { display: inline-block; padding: 6px 12px; border-radius: 10px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
          .badge-blue { background: #eef2ff; color: #6366f1; }
          
          .info-grid { display: grid; grid-template-cols: 1.5fr 1fr; gap: 40px; margin-bottom: 40px; }
          .info-section h4 { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
          .info-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; font-weight: 600; }
          .info-val { color: #0f172a; }

          .scale-iq-banner { background: #0f172a; color: #fff; border-radius: 20px; padding: 25px; display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
          .scale-stat { text-align: center; border-right: 1px solid rgba(255,255,255,0.1); }
          .scale-stat:last-child { border-right: none; }
          .scale-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; }
          .scale-value { font-size: 18px; font-weight: 800; color: #fff; }
          .scale-plus { color: #6366f1; }

          .ledger-table { width: 100%; margin-bottom: 40px; }
          .ledger-table th { text-align: left; padding: 15px; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; background: #f8fafc; border-radius: 10px 0 0 10px; }
          .ledger-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600; }
          .ledger-table .val-col { text-align: right; font-weight: 800; color: #0f172a; }
          .ledger-table .desc-col { color: #64748b; font-size: 11px; display: block; margin-top: 4px; }
          
          .grand-total-box { margin-left: auto; width: 350px; background: #f8fafc; border-radius: 24px; padding: 30px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 14px; font-weight: 600; }
          .total-row.final { font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 20px; padding-top: 20px; border-top: 2px dashed #e2e8f0; }

          .footer-section { margin-top: 60px; display: flex; justify-content: space-between; align-items: center; }
          .qr-placeholder { width: 80px; height: 80px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8; text-align: center; border: 1px solid #e2e8f0; }
          .auth-box { text-align: right; }
          .auth-line { border-bottom: 2px solid #0f172a; width: 180px; margin-bottom: 10px; }
          .auth-title { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; }

          @media print {
             body { padding: 0; background: #fff; }
             .invoice-card { box-shadow: none; padding: 30px; border-radius: 0; max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-card">
          <div class="header">
            <div class="brand-box">
              <div class="brand-name">PADDY<span>NEXUS</span></div>
              <div class="brand-tagline">Industrial Logistics & Finance Audit</div>
            </div>
            <div class="meta-box">
              <div class="doc-title">Settlement Audit</div>
              <div class="badge badge-blue">REF ID: ${lot.id}</div>
              <div style="font-size: 11px; font-weight: 700; color: #94a3b8; margin-top: 10px;">PERIOD: ${new Date().getFullYear()} AUDIT CYCLE</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-section">
              <h4>Mill Logistics Provider</h4>
              <div class="info-item"><span>Processing Entity</span><span class="info-val">${lot.mill_name || 'N/A'}</span></div>
              <div class="info-item"><span>Vehicle Registry</span><span class="info-val">${lot.reg_number || 'N/A'} [${lot.vehicle_type || 'Transport'}]</span></div>
              <div class="info-item"><span>Point of Loading</span><span class="info-val">${lot.load_area || 'Standard Depot'}</span></div>
              <div class="info-item"><span>Inventory Count</span><span class="info-val">${lot.totalBags || 0} Standard Bags</span></div>
            </div>
            <div class="info-section">
              <h4>Chronicle Details</h4>
              <div class="info-item"><span>Harvest Point</span><span class="info-val">${lot.date}</span></div>
              <div class="info-item"><span>Batch No.</span><span class="info-val">${lot.id.split('-').pop()} / ${new Date().getMonth() + 1}</span></div>
              <div class="info-item"><span>Paddy Type</span><span class="info-val">${lot.paddyType || 'Basmati'}</span></div>
              <div class="info-item"><span>Status</span><span class="info-val" style="color: #059669">Verified Entry</span></div>
            </div>
          </div>

          <div class="scale-iq-banner">
            <div class="scale-stat">
              <div class="scale-label">Tare Weight (Unladen)</div>
              <div class="scale-value">${(lot.pre_load_scale || 0).toLocaleString('en-IN')} <span class="scale-plus">KG</span></div>
            </div>
            <div class="scale-stat">
              <div class="scale-label">Gross Weight (Laden)</div>
              <div class="scale-value">${(lot.post_load_scale || 0).toLocaleString('en-IN')} <span class="scale-plus">KG</span></div>
            </div>
            <div class="scale-stat">
              <div class="scale-label">Net Payload Weight</div>
              <div class="scale-value" style="color: #6366f1;">${(lot.totalWeightKgs || 0).toLocaleString('en-IN')} <span class="scale-label" style="color: #fff">KG</span></div>
            </div>
          </div>

          <table class="ledger-table">
            <thead>
              <tr>
                <th>Audit Ledger Item</th>
                <th style="text-align: right;">Amount Distribution (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  Lot Valuation
                  <span class="desc-col">
                    Standard Valuation: ${lot.totalBags || 0} Bags × Market Rate (₹${lot.paddyRate || 1200} / 73KG Bag)
                  </span>
                </td>
                <td class="val-col">₹${currentLotAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>
                  Agency Remuneration
                  <span class="desc-col">Trader Brokerage Fee for ${lot.totalBags || 0} Bags</span>
                </td>
                <td class="val-col">₹${traderAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>
                  Labour Management Fee
                  <span class="desc-col">Industrial Labour Handling & Loading Service</span>
                </td>
                <td class="val-col">₹${labourAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>
                  Operational Deductions
                  <span class="desc-col">Adjustments for Moisture Loss, Penalties & Handling (₹${moistureLoss} + ₹${bagPenalty} + ₹${laborCost})</span>
                </td>
                <td class="val-col" style="color: #ef4444;">- ₹${(moistureLoss + bagPenalty + laborCost).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="grand-total-box">
             <div class="total-row"><span>Total Receivables</span><span>₹${(currentLotAmount + traderAmount + labourAmount).toLocaleString('en-IN')}</span></div>
             <div class="total-row"><span>Remittance Received</span><span style="color: #059669">₹${totalPayments.toLocaleString('en-IN')}</span></div>
             <div class="total-row final">
               <span style="font-size: 14px; text-transform: uppercase;">Outstanding</span>
               <span>₹${netPayable.toLocaleString('en-IN')}</span>
             </div>
          </div>

          <div class="footer-section">
            <div class="qr-placeholder">DIGITAL<br>VERIFIED<br>AUDIT</div>
            <div class="auth-box">
              <div class="auth-line"></div>
              <div class="auth-title">Certified Audit Officer</div>
              <div style="font-size: 9px; color: #94a3b8; margin-top: 5px;">This Audit Certificate is digitally generated via PaddyNexus Cloud Nodes.</div>
            </div>
          </div>
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
        <title>Statement - \${millName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
          .subtitle { font-size: 10px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 2px; }
          .meta { text-align: right; font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #e2e8f0; }
          td { padding: 12px; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
          .summary { margin-top: 40px; display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; }
          .stat-box { padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
          .stat-label { font-size: 9px; font-weight: 900; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .stat-value { font-size: 18px; font-weight: 900; }
          .footer { margin-top: 60px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="subtitle">Industrial Registry Statement</div>
            <div class="title">\${millName}</div>
            <div style="font-size: 14px; font-weight: 700; color: #64748b; margin-top: 4px;">\${filterTitle}</div>
          </div>
          <div class="meta">
            <div>Season: \${selectedYear}</div>
            <div>Generated: \${reportDate}</div>
            <div style="margin-top: 8px; font-weight: 900; color: #0f172a;">ID: MS-\${millId}-\${Date.now().toString().slice(-6)}</div>
          </div>
        </div>

        <div class="summary">
          <div class="stat-box">
            <div class="stat-label">Units Manifested</div>
            <div class="stat-value">\${data.summary.totalBags || 0} Bags</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Total Outstanding</div>
            <div class="stat-value" style="color: #ef4444">₹\${(data.summary.netBalance || 0).toLocaleString('en-IN')}</div>
          </div>
          <div class="stat-box">
             <div class="stat-label">Audit Status</div>
             <div class="stat-value" style="color: #10b981; text-transform: uppercase">\${data.summary.is_settled ? 'VERIFIED' : 'ACTIVE'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transaction ID</th>
              <th>Resource/Entity</th>
              <th style="text-align:right">Debit</th>
              <th style="text-align:right">Credit</th>
            </tr>
          </thead>
          <tbody>
            \${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          This is an electronically generated industrial audit statement for PaddyManager.<br>
          Verification Code: \${Math.random().toString(36).substring(7).toUpperCase()} • Institutional Protocol v2.4
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
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
              <Package className="w-3.5 h-3.5" />
              Lot-{lot.id.toString().slice(-4).toUpperCase()}
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
                                <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{lot.date}</p>
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
          <h4 className="text-lg md:text-xl font-[1000] text-slate-900 dark:text-white uppercase italic tracking-tighter">BATCH: {lot.id}</h4>
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
                <FileText className="w-4 h-4 text-primary group-hover/btn:scale-110 transition-transform" />
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
