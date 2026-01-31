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
    const [isOpen, setIsOpen] = useState(true);
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
        <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    flex-shrink-0 bg-[#0A0A0A] border-r border-white/10 flex flex-col
                    transition-all duration-300 ease-in-out z-[70]
                    ${isMobileOpen
                        ? "fixed inset-y-0 left-0 w-72 translate-x-0"
                        : "fixed lg:relative inset-y-0 left-0 -translate-x-full lg:translate-x-0"
                    }
                    ${!isOpen && !isMobileOpen ? "lg:w-0 lg:opacity-0 lg:pointer-events-none" : "lg:w-64"}
                `}
            >
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-white">A</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">Admin Flow</span>
                    </div>
                    {/* Explicit Close Button for Mobile */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <NavItem key={item.id} item={item} />
                    ))}
                    <div className="pt-6 pb-2 border-t border-white/5 mt-6">
                        <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Views
                        </div>
                        {switchItems.map((item) => (
                            <NavItem key={item.id} item={item} />
                        ))}
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                {/* Fixed Top bar for Toggle */}
                <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-md sticky top-0 z-30 flex-shrink-0">
                    <button
                        onClick={() => {
                            if (window.innerWidth < 1024) setIsMobileOpen(true);
                            else setIsOpen(!isOpen);
                        }}
                        className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all flex items-center gap-3 group"
                    >
                        <Menu className={`w-6 h-6 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`} />
                        {!isOpen && <span className="font-bold text-lg lg:block hidden group-hover:text-blue-400">Expand Menu</span>}
                    </button>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="text-right lg:block hidden">
                            <p className="text-sm font-semibold">Admin Panel</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Version 1.0.5</p>
                        </div>
                    </div>
                </header>

                {/* Sub-header text if menu is closed to remind user what page they are on */}
                {!isOpen && (
                    <div className="px-10 pt-4 hidden lg:block">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em]">
                            {menuItems.find(i => i.path === currentPath)?.label || "Admin"}
                        </span>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 md:p-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
