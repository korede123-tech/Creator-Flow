import React, { useState } from "react";
import {
    Users,
    LayoutDashboard,
    TrendingUp,
    Settings,
    ChevronRight,
    Share2,
    Menu,
    X,
    ChevronLeft,
    Monitor
} from "lucide-react";

interface AdminLayoutProps {
    children: React.ReactNode;
    currentPath: string;
    onNavigate: (path: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPath, onNavigate }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { id: "users", label: "Users", icon: Users, path: "/admin/users" },
        { id: "referrals", label: "Referrals", icon: Share2, path: "/admin/referrals" },
        { id: "analytics", label: "Analytics", icon: TrendingUp, path: "/admin/analytics" },
        { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
    ];

    const switchItems = [
        { id: "creator", label: "Creator View", icon: Monitor, path: "/app" },
    ];


    const NavItem = ({ item }: { item: typeof menuItems[0] }) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;
        return (
            <button
                key={item.id}
                onClick={() => {
                    onNavigate(item.path);
                    setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                    } ${isCollapsed && !isMobileOpen ? "justify-center px-2" : ""}`}
                title={isCollapsed ? item.label : ""}
            >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                {(!isCollapsed || isMobileOpen) && (
                    <>
                        <span className="font-medium whitespace-nowrap">{item.label}</span>
                        {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
                    </>
                )}
            </button>
        );
    };

    return (
        <div className="flex min-h-screen bg-[#0A0A0A] text-white">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A0A0A] border-b border-white/10 flex items-center justify-between px-6 z-40">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-white text-xs">A</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Admin</span>
                </div>
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`flex-shrink-0 border-r border-white/10 flex flex-col h-screen bg-[#0A0A0A] transition-all duration-300 ease-in-out
                ${isMobileOpen
                        ? "fixed inset-y-0 left-0 z-50 w-64 translate-x-0"
                        : "fixed lg:sticky top-0 inset-y-0 left-0 z-50 lg:z-30 -translate-x-full lg:translate-x-0"
                    }
                ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
            >
                <div className={`p-6 flex items-center justify-between gap-3 ${isCollapsed ? "lg:px-4" : ""}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 flex-shrink-0 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-white">A</span>
                        </div>
                        {(!isCollapsed || isMobileOpen) && (
                            <span className="font-bold text-xl tracking-tight whitespace-nowrap">Admin Flow</span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white border border-white/10 transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                <nav className={`flex-1 px-4 py-4 space-y-1 ${isCollapsed ? "lg:px-2" : ""}`}>
                    {menuItems.map((item) => (
                        <NavItem key={item.id} item={item} />
                    ))}
                    <div className="pt-4 pb-2 border-t border-white/5 mt-4">
                        <div className={`px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${isCollapsed && !isMobileOpen ? "hidden" : ""}`}>
                            Views
                        </div>
                        {switchItems.map((item) => (
                            <NavItem key={item.id} item={item} />
                        ))}
                    </div>
                </nav>

            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen pt-16 lg:pt-0 overflow-x-hidden">
                <div className="p-8 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
