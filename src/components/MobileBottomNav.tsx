import {
  Home as HomeIcon,
  Briefcase,
  Wallet as WalletIcon,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import type { AccountType, Screen } from "../App";

interface MobileBottomNavProps {
  currentScreen: Screen;
  accountType: AccountType;
  onNavigate: (screen: Screen) => void;
}

export function MobileBottomNav({
  currentScreen,
  accountType,
  onNavigate,
}: MobileBottomNavProps) {
  const navItems: Array<{
    screen: Screen;
    label: string;
    icon: any;
    show: boolean;
  }> = [
    { screen: "home", label: "Home", icon: HomeIcon, show: true },
    {
      screen: "agency-creators",
      label: "Creators",
      icon: Users,
      show: accountType === "agency",
    },
    { screen: "campaigns", label: "Campaigns", icon: Briefcase, show: true },
    { screen: "wallet", label: "Wallet", icon: WalletIcon, show: true },
    { screen: "insights", label: "Insights", icon: TrendingUp, show: true },
    { screen: "profile", label: "Profile", icon: User, show: true },
  ];

  const visible = navItems.filter((i) => i.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-2">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))`,
          }}
        >
          {visible.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen;
            return (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={`py-3 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500"}`}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="mt-1 h-0.5 w-6 bg-white rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
