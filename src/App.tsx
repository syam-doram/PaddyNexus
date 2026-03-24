import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, Role } from './context/AuthContext';
import { MachineProvider } from './context/MachineContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LoadingProvider } from './context/LoadingContext';
import { App as CapApp } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
import * as Lazy from './screens/lazy';

import MainLayout from './components/MainLayout';
import SplashScreen from './components/SplashScreen';

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


import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const { theme } = useTheme();
  const { loading } = useAuth();
  const [splashLoading, setSplashLoading] = React.useState(true);
  const lastBackPressTime = React.useRef(0);
  
  React.useEffect(() => {
    // 2. Control the web-splash duration (minimum 3 seconds)
    const splashTimer = setTimeout(() => {
      setSplashLoading(false);
    }, 3000);

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
      backButtonListener.then(l => l.remove());
    };
  }, []);

  if (loading || splashLoading) {
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
            <Route path="/farmer-harvest-list" element={<ProtectedRoute allowedRoles={['machine_harvest', 'trader']}><Lazy.FarmerHarvestList /></ProtectedRoute>} />


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
        <LoadingProvider>
          <MachineProvider>
            <Router>
              <AppContent />
            </Router>
          </MachineProvider>
        </LoadingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
