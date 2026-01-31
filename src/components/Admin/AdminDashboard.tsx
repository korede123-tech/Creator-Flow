import React, { useEffect, useState } from "react";
import { Users, TrendingUp, DollarSign, UserPlus } from "lucide-react";
import { supabase } from "../../utils/supabase/client";

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsersToday: 0,
        activeCampaigns: 0,
        platformEarnings: 0,
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // Get absolute total
                const { count: usersCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true });

                // Get today's users count
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { count: todayCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true })
                    .gte("created_at", today.toISOString());

                // Get actual recent users
                const { data: recent } = await supabase
                    .from("profiles")
                    .select("full_name, email, created_at")
                    .order("created_at", { ascending: false })
                    .limit(5);

                setStats({
                    totalUsers: usersCount || 0,
                    newUsersToday: todayCount || 0,
                    activeCampaigns: 45, // Keep mock for now
                    platformEarnings: 1250000, // Keep mock for now
                });
                setRecentUsers(recent || []);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "New Users (Today)", value: `+${stats.newUsersToday}`, icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Active Campaigns", value: stats.activeCampaigns, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Total Volume", value: `₦${stats.platformEarnings.toLocaleString()}`, icon: DollarSign, color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Platform Overview</h1>
                <p className="text-slate-400">Welcome back, Admin. Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 font-medium">{card.label}</p>
                                <p className="text-2xl font-bold">{loading ? "..." : card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-6">Recent Signups</h3>
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-slate-500 italic text-sm">Loading activity...</p>
                        ) : recentUsers.length === 0 ? (
                            <p className="text-slate-500 text-sm">No recent signups yet.</p>
                        ) : (
                            recentUsers.map((user, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold">
                                            {user.full_name?.[0] || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{user.full_name || 'New User'}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-6">System Health</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Database Status</span>
                            <span className="text-green-500 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Operational
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Supabase Auth</span>
                            <span className="text-green-500 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Operational
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Edge Functions</span>
                            <span className="text-green-500 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                Operational
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
