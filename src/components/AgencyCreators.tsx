import { Search, UserPlus, AlertCircle, Briefcase, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Creator } from "../App";
import { formatCurrency, Currency } from "../utils/currency";
import { AddCreatorModal } from "./AddCreatorModal";

interface AgencyCreatorsProps {
  creators: Creator[];
  onSelectCreator: (creator: Creator) => void;
  onAddCreator: (data: any) => void;
  onDeleteCreator?: (creatorId: string) => void;
  currency?: Currency;
}

export function AgencyCreators({
  creators,
  onSelectCreator,
  onAddCreator,
  onDeleteCreator,
  currency = "NGN",
}: AgencyCreatorsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "pending" | "inactive"
  >("all");
  const [showAddCreatorModal, setShowAddCreatorModal] = useState(false);

  const filteredCreators = creators.filter((creator) => {
    const matchesSearch =
      creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      creator.niche.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || creator.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles =
      {
        active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      }[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

    return (
      <span
        className={`px-2 py-0.5 rounded-md text-xs font-medium border ${styles}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Creator Roster</h1>
          <p className="text-sm text-slate-400">
            {creators.length} total creators
          </p>
        </div>
        <button
          className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
          onClick={() => setShowAddCreatorModal(true)}
        >
          <UserPlus className="w-4 h-4" />
          Add Creator
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-500 focus:border-[#0ea5e9] focus:outline-none transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Creator List */}
      <div className="space-y-3">
        {filteredCreators.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-base font-medium text-white mb-1">
              No creators found
            </h3>
            <p className="text-sm text-slate-500">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          filteredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => onSelectCreator(creator)}
              className="group bg-[#0D0D0D]/50 border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-5 cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0ea5e9] to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {creator.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white group-hover:text-[#0ea5e9] transition-colors truncate">
                        {creator.name}
                      </h3>
                      {getStatusBadge(creator.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      <span>{creator.platform}</span>
                      <span>•</span>
                      <span>{creator.followers} followers</span>
                      <span>•</span>
                      <span>{creator.niche}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Available</div>
                    <div className="text-base font-bold text-emerald-400">
                      {formatCurrency(creator.availableBalance, currency)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 mb-1">Active</div>
                    <div className="text-base font-bold text-white">
                      {creator.activeCampaigns}
                    </div>
                  </div>
                  {creator.activeCampaigns > 0 && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium">
                        Needs attention
                      </span>
                    </div>
                  )}
                </div>
                {onDeleteCreator && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const ok = window.confirm(
                        `Remove ${creator.name} from your roster?`,
                      );
                      if (!ok) return;
                      onDeleteCreator(creator.id);
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                    title="Remove creator"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Creator Modal */}
      <AddCreatorModal
        isOpen={showAddCreatorModal}
        onClose={() => setShowAddCreatorModal(false)}
        onSave={(data) => {
          onAddCreator(data);
          setShowAddCreatorModal(false);
        }}
        defaultCurrency={currency}
      />
    </div>
  );
}
