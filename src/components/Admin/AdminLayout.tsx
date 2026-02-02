import React, { useState, useEffect } from "react";
import {
    Users,
    LayoutDashboard,
    TrendingUp,
    Settings,
    ChevronRight,
    Share2,
    Menu,
    X,
    Monitor,
    Bell,
    Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
    children: React.ReactNode;
    currentPath: string;
    onNavigate: (path: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, currentPath, onNavigate }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const menuItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
        { id: "users", label: "Users", icon: Users, path: "/admin/users" },
        { id: "referrals", label: "Referrals", icon: Share2, path: "/admin/referrals" },
        { id: "analytics", label: "Analytics", icon: TrendingUp, path: "/admin/analytics" },
        { id: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
    ];

    const NavItem = ({ item, collapsed = false }: { item: typeof menuItems[0], collapsed?: boolean }) => {
        const isActive = currentPath === item.path;
        const Icon = item.icon;

        return (
            <button
                onClick={() => {
                    onNavigate(item.path);
                    if (isMobile) setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    } ${collapsed ? "justify-center px-0" : ""}`}
            >
                <Icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-white"} />
                {!collapsed && <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>}
                {isActive && !collapsed && <div className="ml-auto w-1 h-4 rounded-full bg-white/50" />}
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileOpen(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={{
                    width: isMobile ? 300 : (isSidebarOpen ? 260 : 80),
                    x: isMobile ? (isMobileOpen ? 0 : -300) : 0
                }}
                className={`
                    fixed lg:relative inset-y-0 left-0 bg-[#0A0A0A] border-r border-white/5 flex flex-col z-[110]
                    transition-all duration-300 ease-out
                `}
            >
                <div className="h-16 flex items-center px-6 border-b border-white/5 flex-shrink-0 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="font-bold text-white uppercase text-xs">A</span>
                        </div>
                        {(isSidebarOpen || isMobile) && (
                            <span className="font-bold text-lg tracking-tight whitespace-nowrap overflow-hidden">
                                Admin Console
                            </span>
                        )}
                    </div>
                    {isMobile && (
                        <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400">
                            <X size={20} />
                        </button>
                    )}
                </div>

                <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => (
                        <NavItem key={item.id} item={item} collapsed={!isSidebarOpen && !isMobile} />
                    ))}

                    <div className="pt-8 mt-8 border-t border-white/5 px-2">
                        <NavItem
                            item={{ id: "creator", label: "Creator App", icon: Monitor, path: "/app" }}
                            collapsed={!isSidebarOpen && !isMobile}
                        />
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5 bg-[#0D0D0D]">
                    <div className={`flex items-center ${isSidebarOpen || isMobile ? "gap-3 px-2" : "justify-center"}`}>
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-xs ring-1 ring-blue-500/20">
                            S
                        </div>
                        {(isSidebarOpen || isMobile) && (
                            <div className="overflow-hidden">
                                <p className="text-xs font-semibold text-white truncate">Solomon</p>
                                <p className="text-[10px] text-slate-500 truncate">Administrator</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#050505]">
                {/* Clean Header */}
                <header className="h-16 flex items-center px-6 border-b border-white/5 bg-[#0D0D0D] flex-shrink-0 z-50">
                    <button
                        onClick={() => {
                            if (isMobile) setIsMobileOpen(true);
                            else setIsSidebarOpen(!isSidebarOpen);
                        }}
                        className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-3"
                    >
                        {isMobile ? <Menu size={20} /> : (isSidebarOpen ? <X size={20} /> : <Menu size={20} />)}
                    </button>

                    <div className="ml-auto flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            <Globe size={14} className="text-green-500" />
                            <span>System Online</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
                            <Bell size={18} />
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </div>
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};
