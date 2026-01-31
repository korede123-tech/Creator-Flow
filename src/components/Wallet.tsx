import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { formatCurrency, Currency } from "../utils/currency";
import { useState } from "react";
import { WithdrawModal } from "./WithdrawModal";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  campaign?: string;
  date: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface WalletProps {
  balance: {
    available: number;
    pending: number;
    locked: number;
    lifetime: number;
  };
  transactions: Transaction[];
  onWithdraw: (
    amount: number,
    note?: string,
    opts?: { test?: boolean },
  ) => void | Promise<void>;
  isAuthenticated: boolean;
  currency?: Currency;
  bankAccount?: BankAccount;
  onAddBankDetails: () => void;
}

export function Wallet({
  balance,
  transactions,
  onWithdraw,
  isAuthenticated,
  currency,
  bankAccount,
  onAddBankDetails,
}: WalletProps) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const getTypeChip = (type: string) => {
    const styles =
      {
        campaign_earning:
          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        referral_commission:
          "bg-purple-500/10 text-purple-400 border-purple-500/20",
        referral_bonus: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        withdrawal: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        refund: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      }[type] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

    const labels =
      {
        campaign_earning: "Campaign",
        referral_commission: "Referral (2%)",
        referral_bonus: "Referral",
        withdrawal: "Withdrawal",
        refund: "Refund",
      }[type] || type;

    return (
      <span
        className={`px-2 py-0.5 rounded-md text-xs font-medium border ${styles}`}
      >
        {labels}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "cleared":
        return "text-emerald-400";
      case "pending":
        return "text-amber-400";
      case "reversed":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    return (
      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      {/* Header with Withdraw Button */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Wallet</h1>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!isAuthenticated}
          className="px-3 sm:px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span className="hidden sm:inline">Withdraw</span>
        </button>
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={balance.available}
        currency={currency || "NGN"}
        bankAccount={bankAccount}
        onWithdraw={onWithdraw}
        onAddBankDetails={onAddBankDetails}
      />

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 sm:mb-6 lg:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <div className="text-xs sm:text-sm text-slate-500 mb-2">
                Available Balance
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 break-words">
                {formatCurrency(balance.available, currency)}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500">Pending: </span>
                  <span className="text-amber-400 font-medium">
                    {formatCurrency(balance.pending, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Lifetime: </span>
                  <span className="text-emerald-400 font-medium">
                    {formatCurrency(balance.lifetime, currency)}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-[#0ea5e9]" />
            </div>
          </div>
          <div className="pt-3 sm:pt-4 border-t border-white/[0.06] text-xs text-slate-500">
            Ready to withdraw anytime
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-4 sm:p-5"
          >
            <div className="text-xs text-slate-500 mb-2">Pending</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 mb-1 break-words">
              {formatCurrency(balance.pending, currency)}
            </div>
            <div className="text-xs text-slate-500">Awaiting verification</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-4 sm:p-5"
          >
            <div className="text-xs text-slate-500 mb-2">Lifetime Earned</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mb-1 break-words">
              {formatCurrency(balance.lifetime, currency)}
            </div>
            <div className="text-xs text-slate-500">Total all-time</div>
          </motion.div>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          Transaction History
        </h2>

        {transactions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-sm text-slate-500">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.12] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {getTypeChip(transaction.type)}
                      {transaction.campaign && (
                        <span className="text-sm text-white truncate">
                          {transaction.campaign}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{transaction.date}</span>
                      <span className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div
                      className={`text-lg font-bold mb-1 ${
                        transaction.type === "withdrawal"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {transaction.type === "withdrawal" ? "-" : "+"}
                      {formatCurrency(transaction.amount, currency)}
                    </div>
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
