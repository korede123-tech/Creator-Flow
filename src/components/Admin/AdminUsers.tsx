import React, { useEffect, useState } from "react";
import { Search, Filter, MoreVertical, BadgeCheck } from "lucide-react";
import { supabase } from "../../utils/supabase/client";

interface Profile {
    user_id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
    created_at: string;
}

export const AdminUsers: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("user_id, full_name, email, role, created_at")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (userId: string, currentRole: string | null) => {
        setUpdatingId(userId);
        const nextRole = currentRole === "admin" ? "creator" : "admin";
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ role: nextRole })
                .eq("user_id", userId);

            if (error) throw error;
            setUsers(users.map(u => u.user_id === userId ? { ...u, role: nextRole } : u));
        } catch (error) {
            console.error("Error updating role:", error);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredUsers = users.filter((u) =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Manage Users</h1>
                    <p className="text-slate-400">View and manage all platform accounts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all w-full md:w-64"
                        />
                    </div>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                        <Filter className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/[0.02]">
                                <th className="px-6 py-4 text-sm font-semibold text-slate-400">User</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-400">Role</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-400">Joined</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                                        Loading users records...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.user_id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold">
                                                    {user.full_name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-white">{user.full_name || "N/A"}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin'
                                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {user.role === 'admin' && <BadgeCheck className="w-3 h-3" />}
                                                {user.role || 'creator'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => toggleRole(user.user_id, user.role)}
                                                    disabled={!!updatingId}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${user.role === 'admin'
                                                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                                                        : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20'
                                                        }`}
                                                >
                                                    {updatingId === user.user_id ? "..." : user.role === 'admin' ? "Make Creator" : "Make Admin"}
                                                </button>
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
