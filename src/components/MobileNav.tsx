import { X, Home as HomeIcon, Briefcase, Wallet as WalletIcon, TrendingUp, User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen, AccountType } from '../App';
import logo from 'figma:asset/fcad7446971be733d3427a6b22f8f64253529daf.png';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreen: Screen;
  accountType: AccountType;
  onNavigate: (screen: Screen) => void;
  isAuthenticated: boolean;
  onToggleAuth: () => void;
  onToggleAccountType: () => void;
  role?: string | null;
  onNavigateToAdmin?: () => void;
}

export function MobileNav({
  isOpen,
  onClose,
  currentScreen,
  accountType,
  onNavigate,
  isAuthenticated,
  onToggleAuth,
  onToggleAccountType,
  role,
  onNavigateToAdmin
}: MobileNavProps) {
  const handleNavigate = (screen: Screen) => {
    onNavigate(screen);
    onClose();
  };

  const navItems = [
    { screen: 'home' as Screen, label: 'Home', icon: HomeIcon, show: true },
    { screen: 'agency-creators' as Screen, label: 'Creators', icon: Users, show: accountType === 'agency' },
    { screen: 'campaigns' as Screen, label: 'Campaigns', icon: Briefcase, show: true },
    { screen: 'wallet' as Screen, label: 'Wallet', icon: WalletIcon, show: true },
    { screen: 'insights' as Screen, label: 'Insights', icon: TrendingUp, show: true },
    { screen: 'profile' as Screen, label: 'Profile', icon: User, show: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-[280px] bg-[#0D0D0D] border-l border-white/[0.06] z-50 lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Dobble Tap" className="h-7 w-7" />
                <span className="text-sm font-semibold text-white">Dobble Tap</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.filter(item => item.show).map(item => {
                const Icon = item.icon;
                const isActive = currentScreen === item.screen;

                return (
                  <button
                    key={item.screen}
                    onClick={() => handleNavigate(item.screen)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? 'bg-white text-black'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 space-y-2 border-t border-white/[0.06]">
              <button
                onClick={() => {
                  onToggleAccountType();
                  onClose();
                }}
                className="w-full px-4 py-2.5 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-lg text-sm font-medium hover:bg-[#0ea5e9]/20 transition-colors border border-[#0ea5e9]/20"
              >
                {accountType === 'creator' ? 'Switch to Agency' : 'Switch to Creator'}
              </button>
              <button
                onClick={() => {
                  onToggleAuth();
                  onClose();
                }}
                className="w-full px-4 py-2.5 bg-white/[0.05] text-slate-300 rounded-lg text-sm font-medium hover:bg-white/[0.08] transition-colors border border-white/[0.08]"
              >
                {isAuthenticated ? 'Account' : 'Login'}
              </button>
              {role === 'admin' && onNavigateToAdmin && (
                <button
                  onClick={() => {
                    onNavigateToAdmin();
                    onClose();
                  }}
                  className="w-full px-4 py-2.5 bg-blue-600/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-600/20 transition-colors border border-blue-600/20"
                >
                  Admin Dashboard
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
