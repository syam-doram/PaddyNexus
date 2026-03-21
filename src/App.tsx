import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, Role } from './context/AuthContext';
import { MachineProvider } from './context/MachineContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SplashScreen as CapSplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import * as Lazy from './screens/lazy';

import MainLayout from './components/MainLayout';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactElement, allowedRoles?: Role[] }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

const RoleBasedHome = () => {
  const { isAuthenticated, loading } = useAuth();
  const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true';

  if (loading) return null;

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

const SplashScreen = () => (
  <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-900 overflow-hidden relative">
    {/* Animated background elements */}
    <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
    <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
    
    <div className="relative z-10 flex flex-col items-center">
      <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/20 mb-8 animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m13 2-2 10h9l-11 10 2-10H2Z"/></svg>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Paddy<span className="text-primary">Nexus</span></h1>
      </div>
      <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-primary animate-[shimmer_2s_infinite]" style={{ width: '40%' }} />
      </div>
      <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">AgriNexus Systems • v2.4.0</p>
    </div>

    <style>{`
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(250%); }
      }
    `}</style>
  </div>
);

import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { theme } = useTheme();
  const { loading } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);
  const lastBackPressTime = React.useRef(0);
  
  React.useEffect(() => {
    // 1. Hide native splash after React starts mounting
    CapSplashScreen.hide().catch(() => {});

    // 2. Control the web-splash duration
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    // 3. Handle System Back Button (Exit only on double click within 3sec)
    const backButtonListener = CapApp.addListener('backButton', async (data) => {
      const now = Date.now();
      if (now - lastBackPressTime.current < 3000) {
        CapApp.exitApp();
      } else {
        lastBackPressTime.current = now;
        Toast.show({
          text: 'Press back again to exit',
          duration: 'short',
          position: 'center'
        }).catch(() => {});
      }
    });

    return () => {
      clearTimeout(timer);
      backButtonListener.then(l => l.remove());
    };
  }, []);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
      <div className={`h-screen w-full transition-colors duration-300 font-sans ${theme === 'dark' ? 'dark bg-background-dark text-white' : 'bg-[#f8fafc] text-slate-900'}`}>
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            {/* Root Route: Shows Onboarding only once */}
            <Route path="/" element={<RoleBasedHome />} />

            <Route path="/onboarding" element={<Lazy.Onboarding />} />

            <Route path="/login" element={
              localStorage.getItem('app_user') ? <Navigate to="/dashboard" replace /> : <Lazy.Login />
            } />
            <Route path="/signup" element={
              localStorage.getItem('app_user') ? <Navigate to="/dashboard" replace /> : <Lazy.SignUp />
            } />

            {/* Dashboard & Profile */}
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['machine_harvest', 'paddy_harvest', 'trader']}><Lazy.Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['machine_harvest', 'paddy_harvest', 'trader']}><Lazy.Profile /></ProtectedRoute>} />
            <Route path="/profile/personal-info" element={<ProtectedRoute allowedRoles={['machine_harvest', 'paddy_harvest', 'trader']}><Lazy.PersonalInformation /></ProtectedRoute>} />

            {/* Machine Harvest Roles */}
            <Route path="/machines" element={<ProtectedRoute allowedRoles={['machine_harvest', 'trader']}><Lazy.MachineList /></ProtectedRoute>} />
            <Route path="/machine-logs" element={<ProtectedRoute allowedRoles={['machine_harvest']}><Lazy.MachineLog /></ProtectedRoute>} />
            <Route path="/machine-log/:machineId" element={<ProtectedRoute allowedRoles={['machine_harvest', 'trader']}><Lazy.MachineLog /></ProtectedRoute>} />
            <Route path="/add-machine" element={<ProtectedRoute allowedRoles={['machine_harvest', 'trader']}><Lazy.AddMachine /></ProtectedRoute>} />
            <Route path="/machine-settlement" element={<ProtectedRoute allowedRoles={['machine_harvest', 'trader']}><Lazy.MachineSettlement /></ProtectedRoute>} />
            <Route path="/machine-settlement/:machineId" element={<ProtectedRoute allowedRoles={['machine_harvest', 'trader']}><Lazy.MachineSettleDetail /></ProtectedRoute>} />
            <Route path="/maintenance" element={<ProtectedRoute allowedRoles={['machine_harvest', 'paddy_harvest', 'trader']}><Lazy.MaintenanceAlerts /></ProtectedRoute>} />
            <Route path="/farmer-harvest" element={<ProtectedRoute allowedRoles={['machine_harvest', 'trader']}><Lazy.FarmerHarvest /></ProtectedRoute>} />

            {/* Paddy Harvest Roles */}
            <Route path="/lots" element={<ProtectedRoute allowedRoles={['paddy_harvest', 'trader']}><Lazy.Lots /></ProtectedRoute>} />
            <Route path="/lotdetails" element={<ProtectedRoute allowedRoles={['paddy_harvest', 'trader']}><Lazy.LotDetails /></ProtectedRoute>} />
            <Route path="/edit-batch" element={<ProtectedRoute allowedRoles={['paddy_harvest', 'trader']}><Lazy.EditBatch /></ProtectedRoute>} />
            <Route path="/add-lot" element={<ProtectedRoute allowedRoles={['paddy_harvest', 'trader']}><Lazy.AddLot /></ProtectedRoute>} />
            <Route path="/add-entry" element={<ProtectedRoute allowedRoles={['paddy_harvest', 'machine_harvest', 'trader']}><Lazy.AddMachineEntry /></ProtectedRoute>} />
            <Route path="/farmer-settlements" element={<ProtectedRoute allowedRoles={['paddy_harvest', 'trader']}><Lazy.FarmerSettlement /></ProtectedRoute>} />
            <Route path="/mill-settlements" element={<ProtectedRoute allowedRoles={['paddy_harvest']}><Lazy.MillSettlementList /></ProtectedRoute>} />
            <Route path="/lot-stages" element={<ProtectedRoute allowedRoles={['paddy_harvest', 'trader']}><Lazy.LotStages /></ProtectedRoute>} />
            <Route path="/warehouse" element={<ProtectedRoute allowedRoles={['paddy_harvest', 'trader']}><Lazy.WarehouseCapacity /></ProtectedRoute>} />
            <Route path="/receipt" element={<ProtectedRoute allowedRoles={['machine_harvest', 'paddy_harvest', 'trader']}><Lazy.SaleReceipt /></ProtectedRoute>} />

            {/* Common Protected */}
            <Route path="/tracking" element={<ProtectedRoute allowedRoles={['machine_harvest', 'paddy_harvest', 'trader']}><Lazy.Tracking /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['machine_harvest', 'paddy_harvest', 'trader']}><Lazy.ReportGenerator /></ProtectedRoute>} />
            {/* Trader Only */}
            <Route path="/trader/users" element={<ProtectedRoute allowedRoles={['trader']}><Lazy.TraderUsers /></ProtectedRoute>} />
            <Route path="/trader/machine-earn" element={<ProtectedRoute allowedRoles={['trader']}><Lazy.MachineEarn /></ProtectedRoute>} />
            <Route path="/trader/paddy-earn" element={<ProtectedRoute allowedRoles={['trader']}><Lazy.PaddyEarn /></ProtectedRoute>} />
            <Route path="/trader/entries" element={<ProtectedRoute allowedRoles={['trader']}><Lazy.TraderEntries /></ProtectedRoute>} />
            <Route path="/trader/fleet" element={<ProtectedRoute allowedRoles={['trader']}><Lazy.TraderFleet /></ProtectedRoute>} />
            <Route path="/trader/logs" element={<ProtectedRoute allowedRoles={['trader']}><Lazy.TraderLogs /></ProtectedRoute>} />
            <Route path="/add-mill" element={<ProtectedRoute allowedRoles={['trader']}><Lazy.AddMill /></ProtectedRoute>} />
            <Route path="/mill-settlement/:millId" element={<ProtectedRoute allowedRoles={['paddy_harvest']}><Lazy.MillSettlement /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<RoleBasedHome />} />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MachineProvider>
          <Router>
            <AppContent />
          </Router>
        </MachineProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
