import React from "react";
import {
    Users,
    LayoutDashboard,
    TrendingUp,
    Settings,
    LogOut,
    ChevronRight,
    Share2
} from "lucide-react";
import { supabase } from "../../utils/supabase/client";

interface AdminLayoutProps {
    children: React.ReactNode;
    currentPath: string;
    onNavigate: (path: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPath, onNavigate }) => {
    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { id: "users", label: "Users", icon: Users, path: "/admin/users" },
        { id: "referrals", label: "Referrals", icon: Share2, path: "/admin/referrals" },
        { id: "analytics", label: "Analytics", icon: TrendingUp, path: "/admin/analytics" },
        { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    return (
        <div className="flex min-h-screen bg-[#0A0A0A] text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col fixed inset-y-0 left-0 z-50 bg-[#0A0A0A]">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white">A</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">Admin Flow</span>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = currentPath === item.path;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                                <span className="font-medium">{item.label}</span>
                                {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
