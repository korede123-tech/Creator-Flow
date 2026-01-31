import { X, AlertCircle, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { formatCurrency, Currency } from "../utils/currency";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  currency: Currency;
  bankAccount?: BankAccount;
  onWithdraw: (
    amount: number,
    note?: string,
    opts?: { test?: boolean },
  ) => void | Promise<void>;
  onAddBankDetails: () => void;
}

export function WithdrawModal({
  isOpen,
  onClose,
  availableBalance,
  currency,
  bankAccount,
  onWithdraw,
  onAddBankDetails,
}: WithdrawModalProps) {
  const [amount, setAmount] = useState(availableBalance.toString());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testWithdraw, setTestWithdraw] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setAmount(availableBalance.toString());
      setTestWithdraw(false);
    }
  }, [isOpen, availableBalance]);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError("");
  };

  const handleContinue = async () => {
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (withdrawAmount > availableBalance) {
      setError("Amount exceeds available balance");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onWithdraw(withdrawAmount, note || undefined, {
        test: testWithdraw,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return `****${accountNumber.slice(-4)}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0D0D0D] border border-white/[0.12] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Available Balance */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">
                  Available Balance
                </div>
                <div className="text-2xl font-bold text-white">
                  {formatCurrency(availableBalance, currency)}
                </div>
              </div>

              {/* Bank Account Check */}
              {!bankAccount ? (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white mb-1">
                        Bank details required
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Add your bank account to receive withdrawals
                      </p>
                      <button
                        onClick={onAddBankDetails}
                        className="px-3 py-1.5 bg-white text-black rounded-lg text-xs font-semibold hover:bg-white/90 transition-colors"
                      >
                        Add Bank Details
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Bank Destination */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">
                      Destination Account
                    </label>
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0">
                          <CreditCard className="w-5 h-5 text-[#0ea5e9]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white mb-0.5">
                            {bankAccount.accountName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {bankAccount.bankName} •{" "}
                            {maskAccountNumber(bankAccount.accountNumber)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">
                      Withdrawal Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-base text-white font-semibold placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                      />
                      <button
                        onClick={() => setAmount(availableBalance.toString())}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.06] rounded text-xs text-slate-400 font-medium transition-colors"
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">
                      Note (optional)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note for your records"
                      className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Test withdrawal */}
                  <label className="flex items-center gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testWithdraw}
                      onChange={(e) => setTestWithdraw(e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/50"
                    />
                    <span className="text-sm text-slate-300">
                      Test withdrawal (no real transfer, marks completed
                      immediately)
                    </span>
                  </label>
                </>
              )}
            </div>

            {/* Actions */}
            {bankAccount && (
              <div className="p-6 border-t border-white/[0.06] space-y-3">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={
                    submitting ||
                    !amount ||
                    parseFloat(amount) <= 0 ||
                    parseFloat(amount) > availableBalance
                  }
                  className="w-full px-4 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      {testWithdraw
                        ? "Test withdrawal"
                        : "Continue to Paystack"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 text-slate-400 text-sm font-medium hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
