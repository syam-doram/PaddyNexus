import { useAuth } from '../../context/AuthContext';
import MachineDashboard from './dashboards/MachineDashboard';
import PaddyDashboard from './dashboards/PaddyDashboard';
import TraderDashboard from '../trader/TraderDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  
  if (user?.role === 'trader') {
    return <TraderDashboard />;
  }

  if (user?.role === 'machine_harvest') {
    return <MachineDashboard />;
  }

  // Default to Paddy Dashboard (used for paddy_harvest or generic)
  return <PaddyDashboard />;
}
