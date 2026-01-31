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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                // In a real app, these would be RPCs or aggregated queries
                const { count: usersCount } = await supabase
                    .from("profiles")
                    .select("*", { count: "exact", head: true });

                const { count: creatorsCount } = await supabase
                    .from("creators")
                    .select("*", { count: "exact", head: true });

                setStats({
                    totalUsers: usersCount || 0,
                    newUsersToday: 12, // Mock 
                    activeCampaigns: 45, // Mock
                    platformEarnings: 1250000, // Mock
                });
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
        { label: "New Users (Today)", value: `+${stats.newUsersToday}`, icon: UserPlus, color: "text-green-500", bg: "bg-green-500/10" },
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
                        {/* Table or list would go here */}
                        <p className="text-slate-500 italic text-sm">Loading recent user activity...</p>
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
