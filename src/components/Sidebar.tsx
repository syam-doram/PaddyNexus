import { Home, Server, IndianRupee, User, Package, Tractor, Truck, Factory, PlusCircle, Users as UsersIcon, LogOut, Settings, Sun, Moon, ListFilter } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const machineNavItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
     { icon: Server, label: 'Machines', path: '/machines' },
     { icon: ListFilter, label: 'Harvest Logs', path: '/farmer-harvest-list' },
     { icon: IndianRupee, label: 'Settlement', path: '/machine-settlement' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const paddyNavItems = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Package, label: 'Lots', path: '/lots' },
    { icon: Tractor, label: 'Farmer Settlement', path: '/farmer-settlements' },
    { icon: Truck, label: 'Load Mill', path: '/lot-stages' },
    { icon: Factory, label: 'Mill Settlement', path: '/mill-settlements' },
  ];

  const traderNavItems = [
    { icon: Home, label: 'Overview', path: '/dashboard' },
     { icon: Server, label: 'Machines', path: '/machines' },
     { icon: ListFilter, label: 'Harvest Logs', path: '/farmer-harvest-list' },
     { icon: IndianRupee, label: 'Settlement', path: '/machine-settlement' },
    { icon: Tractor, label: 'Machine Earn', path: '/trader/machine-earn' },
    { icon: PlusCircle, label: 'Main Entries', path: '/trader/entries' },
    { icon: Package, label: 'Paddy Earn', path: '/trader/paddy-earn' },
    { icon: UsersIcon, label: 'Team Management', path: '/trader/users' },
  ];

  const navItems = user?.role === 'machine_harvest' 
    ? machineNavItems 
    : user?.role === 'trader' 
      ? traderNavItems 
      : paddyNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-72 h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/5 sticky top-0 overflow-hidden shadow-2xl z-[60]">
      {/* Sidebar Header */}
      <div className="p-8 pb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Tractor className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">PaddyManager</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Industrial Suite</p>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-6 mb-8">
        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-[24px] border border-slate-100 dark:border-white/5 flex items-center gap-4">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop" 
              alt="Profile" 
              className="w-10 h-10 rounded-full border-2 border-emerald-500/20"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-50 dark:border-slate-800" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-black text-slate-900 dark:text-white truncate uppercase">{user?.name || 'Loading...'}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate opacity-70">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-[20px] transition-all duration-300 relative group
                ${isActive 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'fill-white/10' : ''}`} />
              <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-6 space-y-2 border-t border-slate-100 dark:border-white/5">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-5 py-3 rounded-[16px] bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all text-[10px] font-black uppercase tracking-widest relative overflow-hidden group"
        >
          <div className="flex items-center gap-3.5">
            <div className="relative w-4 h-4">
              <AnimatePresence mode="wait">
                {theme === 'light' ? (
                  <motion.div
                    key="sun"
                    initial={{ scale: 0, rotate: -90, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4 text-orange-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ scale: 0, rotate: -90, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span>{theme === 'light' ? 'Daylight' : 'Dark Mode'}</span>
          </div>
          <div className={`w-8 h-4 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-primary/20' : 'bg-slate-200'}`}>
            <motion.div 
              animate={{ x: theme === 'dark' ? 16 : 0 }}
              className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-primary' : 'bg-slate-400'}`}
            />
          </div>
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3.5 px-5 py-3 rounded-[16px] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3.5 px-5 py-3 rounded-[16px] text-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
