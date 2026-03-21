import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, ChevronLeft, ChevronRight, Clock, Receipt, Fuel, Settings, Eye, Download, Share2, Sprout, Tractor, User, Search } from 'lucide-react';
import { useState } from 'react';


export default function ReportGenerator() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState({
    workHours: true,
    billingDetails: true,
    fuelExpenses: false,
    maintenanceLogs: false,
  });

  const toggleConfig = (key: keyof typeof configs) => {
    setConfigs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-background-light dark:bg-background-dark font-display">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 pt-12 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-center flex-1">Daily Report</h1>
          <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-48 no-scrollbar">
        {/* Date Picker Section */}
        <div className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-white/5">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Date</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">August 24, 2023</span>
              </div>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Mini Calendar Strip */}
            <div className="flex justify-between items-center py-2 px-1">
              {[21, 22, 23, 24, 25, 26, 27].map((day, i) => {
                const isSelected = day === 24;
                return (
                  <div key={day} className={`flex flex-col items-center gap-1 ${isSelected ? 'bg-primary text-background-dark rounded-xl px-3 py-2 shadow-lg shadow-primary/20' : 'opacity-50'}`}>
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-background-dark' : 'text-slate-400'}`}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                    <span className={`text-sm font-bold ${isSelected ? 'text-background-dark' : 'text-slate-900 dark:text-white'}`}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="px-4 pb-2">
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 px-1">Report Configuration</h3>
          <div className="flex flex-col gap-3">
            {[
              { id: 'workHours', label: 'Work Hours', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
              { id: 'billingDetails', label: 'Billing Details', icon: Receipt, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { id: 'fuelExpenses', label: 'Fuel Expenses', icon: Fuel, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              { id: 'maintenanceLogs', label: 'Maintenance Logs', icon: Settings, color: 'text-red-500', bg: 'bg-red-500/10' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-surface-dark rounded-xl border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center rounded-lg ${item.bg} ${item.color} h-10 w-10`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{item.label}</span>
                </div>
                <button 
                  onClick={() => toggleConfig(item.id as keyof typeof configs)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${configs[item.id as keyof typeof configs] ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${configs[item.id as keyof typeof configs] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Section */}
        <div className="px-4 py-6">
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">Preview</h3>
            <button className="text-primary text-xs font-bold hover:underline flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Full View
            </button>
          </div>
          <div className="w-full bg-white rounded-xl shadow-lg p-4 relative overflow-hidden group border border-slate-100 dark:border-white/5">
            {/* PDF Preview Mockup */}
            <div className="absolute top-0 right-0 p-2 bg-yellow-100 rounded-bl-xl text-yellow-800 text-[10px] font-bold z-10">DRAFT</div>
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Tractor className="w-6 h-6" />
              </div>
              <div>
                <div className="h-3 w-32 bg-slate-800 rounded mb-1" />
                <div className="h-2 w-20 bg-slate-400 rounded" />
              </div>
              <div className="ml-auto text-right">
                <div className="h-2 w-16 bg-slate-300 rounded mb-1 ml-auto" />
                <div className="h-2 w-12 bg-slate-300 rounded ml-auto" />
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <div className="h-2 w-24 bg-slate-200 rounded" />
                <div className="h-2 w-8 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-2 w-20 bg-slate-200 rounded" />
                <div className="h-2 w-10 bg-slate-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-2 w-28 bg-slate-200 rounded" />
                <div className="h-2 w-8 bg-slate-200 rounded" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <div className="h-3 w-16 bg-slate-800 rounded" />
              <div className="h-4 w-20 bg-primary/80 rounded" />
            </div>
            {/* Overlay on Hover/Default */}
            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center">
              <div className="bg-white/90 dark:bg-slate-800/90 shadow-xl rounded-full p-3 transform transition-transform duration-300 hover:scale-110 cursor-pointer">
                <Search className="text-primary w-7 h-7" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto bg-white dark:bg-surface-dark border-t border-slate-100 dark:border-white/5 p-4 flex flex-col gap-3 z-20">
        <button className="w-full h-12 bg-primary hover:bg-green-500 active:bg-green-600 text-background-dark font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary/20">
          <Download className="w-5 h-5" />
          Generate & Download PDF
        </button>
        <button className="w-full h-12 bg-transparent border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
          <Share2 className="w-5 h-5" />
          Share via WhatsApp/Email
        </button>
      </div>


    </div>
  );
}
