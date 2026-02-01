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
    Monitor
} from "lucide-react";

interface AdminLayoutProps {
    children: React.ReactNode;
    currentPath: string;
    onNavigate: (path: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPath, onNavigate }) => {
    // Desktop preference
    const [isDesktopOpen, setIsDesktopOpen] = useState(true);
    // Mobile visibility
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
                    }`}
            >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
                {isActive && <ChevronRight className="ml-auto w-4 h-4" />}
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden font-sans">
            {/* 1. MOBILE OVERLAY (BACKDROP) */}
            <div
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden transition-opacity duration-300 ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={() => setIsMobileOpen(false)}
            />

            {/* 2. SIDEBAR (Unified Container) */}
            <aside
                className={`
                    /* Fixed on mobile, Relative on desktop */
                    fixed lg:relative inset-y-0 left-0 h-full bg-[#0A0A0A] border-r border-white/10 flex flex-col z-[110]
                    transition-all duration-300 ease-in-out overflow-hidden
                    
                    /* Mobile behavior */
                    ${isMobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"}
                    
                    /* Desktop behavior - Control width */
                    ${isDesktopOpen ? "lg:w-64" : "lg:w-0 lg:border-none"}
                `}
            >
                {/* Brand Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-white text-xs uppercase">A</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight whitespace-nowrap">Admin Flow</span>
                    </div>
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-1 rounded-md hover:bg-white/5 text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Sidebar Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    {menuItems.map((item) => (
                        <NavItem key={item.id} item={item} />
                    ))}
                    <div className="pt-8 pb-2 border-t border-white/5 mt-8">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">
                            Switch View
                        </div>
                        {switchItems.map((item) => (
                            <NavItem key={item.id} item={item} />
                        ))}
                    </div>
                </nav>

                {/* Sidebar Footer (Optional) */}
                <div className="p-4 border-t border-white/5 bg-[#0D0D0D]">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs ring-1 ring-blue-500/20">
                            S
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-white truncate">Solomon</p>
                            <p className="text-[10px] text-slate-500 truncate">Administrator</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 3. MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A] relative">
                {/* Content Header */}
                <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0D0D0D]/50 backdrop-blur-xl sticky top-0 z-50 flex-shrink-0">
                    <button
                        onClick={() => {
                            if (window.innerWidth < 1024) setIsMobileOpen(true);
                            else setIsDesktopOpen(!isDesktopOpen);
                        }}
                        className="p-2 -ml-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 group"
                    >
                        <Menu size={20} className={`transition-transform duration-300 ${!isDesktopOpen ? "scale-110" : "scale-100"}`} />
                        {!isDesktopOpen && (
                            <span className="font-bold text-sm hidden lg:block tracking-tight text-blue-400 group-hover:text-blue-300">
                                Expand Dashboard
                            </span>
                        )}
                    </button>

                    <div className="ml-auto flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-tight">System Status</p>
                            <p className="text-sm font-semibold text-white">Full Access Granted</p>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-semibold text-slate-400">DobbleTap Admin</p>
                                <p className="text-[9px] text-slate-600 font-mono">v1.2.0-stable</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Actual Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {/* Interior Wrapper for Padding and Max-Width */}
                    <div className="py-8 px-6 md:px-10 lg:px-12 max-w-7xl mx-auto w-full min-h-full flex flex-col">
                        {children}
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </div>
    );
};
