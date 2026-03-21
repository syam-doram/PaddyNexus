import { Home, LayoutGrid, CreditCard, BarChart3, User, Server, Package, Truck, Factory, Tractor, IndianRupee, Users as UsersIcon, PlusCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const machineNavItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Server, label: 'Machines', path: '/machines' },
    { icon: IndianRupee, label: 'Settlement', path: '/machine-settlement' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const paddyNavItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Package, label: 'Lots', path: '/lots' },
    { icon: Tractor, label: 'Farmer', path: '/farmer-settlements' },
    { icon: Truck, label: 'Load Mill', path: '/lot-stages' },
    { icon: Factory, label: 'Mill', path: '/mill-settlements' },
  ];

  const traderNavItems = [
    { icon: Home, label: 'Overview', path: '/dashboard' },
    { icon: Tractor, label: 'Machine Earn', path: '/trader/machine-earn' },
    { icon: PlusCircle, label: 'Entries', path: '/trader/entries' },
    { icon: Package, label: 'Paddy Earn', path: '/trader/paddy-earn' },
    { icon: UsersIcon, label: 'Team', path: '/trader/users' },
  ];

  const navItems = user?.role === 'machine_harvest' 
    ? machineNavItems 
    : user?.role === 'trader' 
      ? traderNavItems 
      : paddyNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/80 dark:bg-[#112116]/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 pb-6 pt-3 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[100]">
      <div className="flex justify-between items-center relative max-w-md mx-auto w-full">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 group pb-1 ${isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-emerald-500/80'}`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'fill-emerald-500/10' : ''}`} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
