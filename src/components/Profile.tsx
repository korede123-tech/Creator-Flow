import {
  Camera,
  Copy,
  CheckCircle2,
  Share2,
  User,
  CreditCard,
  Bell,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PriceCalculator } from "./PriceCalculator";
import { ManagedCreatorsList } from "./ManagedCreatorsList";
import { AddCreatorModal } from "./AddCreatorModal";
import { ManageCreatorModal } from "./ManageCreatorModal";
import { BankSelector } from "./BankSelector";
import { useBanks } from "../hooks/useBanks";
import { formatCurrency, Currency, CURRENCIES } from "../utils/currency";
import { CreatorProfile } from "./CreatorProfile";
import { ProfileAccountSections } from "./ProfileAccountSections";
import type {
  CreatorProfileRow,
  CreatorSocialRow,
  CreatorPackageRow,
} from "./CreatorProfile/types";

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
}

interface BankAccountData {
  id: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountName: string;
}

interface ManagedCreatorData {
  id: string;
  displayName: string;
  niche?: string;
  baseRate: number;
  currency: Currency;
  socialAccounts: Array<{
    id: string;
    platform: "tiktok" | "instagram" | "youtube";
    handle: string;
    followers: number;
    rateOverride?: number;
  }>;
  status: "active" | "inactive";
}

interface ProfileProps {
  referralData: {
    referralCode: string;
    totalEarnings: number;
    totalReferred: number;
    referrals: Array<{
      id: string;
      name: string;
      joinedDate: string;
      earnings: number;
      status: "active" | "inactive";
    }>;
  };
  isAuthenticated: boolean;
  onRequestAuth: (action: string) => void;
  currency?: Currency;
  onCurrencyChange?: (currency: Currency) => void;
  profile?: ProfileData;
  bankAccount?: BankAccountData;
  onSaveProfile?: (data: ProfileData) => void | Promise<void>;
  onSaveBankAccount?: (data: BankAccountData) => void | Promise<void>;
  managedCreators?: ManagedCreatorData[];
  onAddCreator?: (data: any) => void;
  onUpdateCreator?: (
    creatorId: string,
    data: Partial<ManagedCreatorData>,
  ) => void;
  onDeleteCreator?: (creatorId: string) => void;
  onAddSocialAccount?: (creatorId: string, account: any) => void;
  onUpdateSocialAccount?: (
    creatorId: string,
    accountId: string,
    data: any,
  ) => void;
  onDeleteSocialAccount?: (creatorId: string, accountId: string) => void;
  onManageCreator?: (creatorId: string) => void;
  onViewCampaigns?: (creatorId: string) => void;
  accountType?: "creator" | "agency";
  /** Creator Profile module (creators only) */
  creatorProfile?: CreatorProfileRow | null;
  creatorSocial?: CreatorSocialRow[];
  creatorPackages?: CreatorPackageRow[];
  onRefreshCreatorProfile?: () => void;
  userId?: string;
  creatorId?: string;
  onSaveCreatorProfile?: (data: {
    display_name: string;
    location: string;
    niches: string[];
    audience_region: string;
    gender: string;
  }) => void | Promise<void>;
}

export function Profile({
  referralData,
  isAuthenticated,
  onRequestAuth,
  currency = "NGN",
  onCurrencyChange,
  profile,
  bankAccount,
  onSaveProfile = () => {},
  onSaveBankAccount = () => {},
  managedCreators = [],
  onAddCreator = () => {},
  onUpdateCreator = () => {},
  onDeleteCreator = () => {},
  onAddSocialAccount = () => {},
  onUpdateSocialAccount = () => {},
  onDeleteSocialAccount = () => {},
  onManageCreator = () => {},
  onViewCampaigns = () => {},
  accountType = "creator",
  creatorProfile = null,
  creatorSocial = [],
  creatorPackages = [],
  onRefreshCreatorProfile = () => {},
  userId = "",
  creatorId = "",
  onSaveCreatorProfile = () => {},
}: ProfileProps) {
  const [creatorTab, setCreatorTab] = useState<"creator" | "account">(
    "account",
  );
  const [showCalculator, setShowCalculator] = useState(false);
  const [showAddCreatorModal, setShowAddCreatorModal] = useState(false);
  const [showManageCreatorModal, setShowManageCreatorModal] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(
    null,
  );
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const [editMode, setEditMode] = useState(false);
  const { banks, loading: banksLoading } = useBanks();

  const [draftProfile, setDraftProfile] = useState<ProfileData>({
    fullName: profile?.fullName ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
  });

  const [draftBank, setDraftBank] = useState<BankAccountData>({
    id: bankAccount?.id ?? "",
    bankName: bankAccount?.bankName ?? "",
    bankCode: bankAccount?.bankCode ?? "",
    accountNumber: bankAccount?.accountNumber ?? "",
    accountName: bankAccount?.accountName ?? "",
  });

  useEffect(() => {
    if (editMode) return;
    setDraftProfile({
      fullName: profile?.fullName ?? "",
      email: profile?.email ?? "",
      phone: profile?.phone ?? "",
    });
    setDraftBank({
      id: bankAccount?.id ?? "",
      bankName: bankAccount?.bankName ?? "",
      bankCode: bankAccount?.bankCode ?? "",
      accountNumber: bankAccount?.accountNumber ?? "",
      accountName: bankAccount?.accountName ?? "",
    });
  }, [
    profile?.fullName,
    profile?.email,
    profile?.phone,
    bankAccount?.id,
    bankAccount?.bankName,
    bankAccount?.bankCode,
    bankAccount?.accountNumber,
    bankAccount?.accountName,
    editMode,
  ]);

  const initials = useMemo(() => {
    const parts = (draftProfile.fullName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return (
      (parts[0]?.[0] ?? "D").toUpperCase() +
      (parts[1]?.[0] ?? "T").toUpperCase()
    );
  }, [draftProfile.fullName]);

  const selectedCreator =
    managedCreators.find((c) => c.id === selectedCreatorId) || null;

  const handleManageCreator = (creatorId: string) => {
    setSelectedCreatorId(creatorId);
    setShowManageCreatorModal(true);
    onManageCreator(creatorId);
  };

  const handleCloseManageModal = () => {
    setShowManageCreatorModal(false);
    setSelectedCreatorId(null);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://dobbletap.com";
  const referralLink = `${baseUrl}/join/${referralData.referralCode || ""}`;

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      /* clipboard API failed (e.g. non-secure context) */
    }
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopyCode = async () => {
    if (!referralData.referralCode) return;
    if (await copyToClipboard(referralData.referralCode)) {
      setCopied("code");
      toast.success("Code copied");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleCopyLink = async () => {
    if (!referralData.referralCode) return;
    if (await copyToClipboard(referralLink)) {
      setCopied("link");
      toast.success("Link copied");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleShareReferral = async () => {
    if (!referralData.referralCode) return;
    const sharePayload = {
      title: "Join Dobble Tap",
      text: `Join me on Dobble Tap and earn from brand campaigns. Use my code: ${referralData.referralCode}`,
      url: referralLink,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(sharePayload);
        setCopied("link");
        setTimeout(() => setCopied(null), 2000);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          if (await copyToClipboard(referralLink)) {
            setCopied("link");
            setTimeout(() => setCopied(null), 2000);
          }
        }
      }
    } else {
      if (await copyToClipboard(referralLink)) {
        setCopied("link");
        setTimeout(() => setCopied(null), 2000);
      }
    }
  };

  const handlePhotoUpload = () => {
    if (!isAuthenticated) {
      onRequestAuth("upload profile photo");
    } else {
      // Handle upload
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      onRequestAuth("save profile");
    } else {
      await onSaveProfile(draftProfile);
      if (
        draftBank.bankName &&
        draftBank.accountNumber &&
        draftBank.accountName
      ) {
        await onSaveBankAccount(draftBank);
      }
      setEditMode(false);
    }
  };

  /** Creators: Creator Profile | Account tabs. Agencies: single page. */
  if (accountType === "creator") {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>
        <div className="flex gap-1 mb-6 border-b border-white/[0.06]">
          <button
            type="button"
            onClick={() => setCreatorTab("account")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              creatorTab === "account"
                ? "text-white border-[#0ea5e9]"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            Account
          </button>
          <button
            type="button"
            onClick={() => setCreatorTab("creator")}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              creatorTab === "creator"
                ? "text-white border-[#0ea5e9]"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            Creator Profile
          </button>
        </div>
        {creatorTab === "creator" && userId && creatorId && (
          <CreatorProfile
            userId={userId}
            creatorId={creatorId}
            initialProfile={creatorProfile ?? null}
            initialSocial={creatorSocial}
            initialPackages={creatorPackages}
            currency={currency ?? "NGN"}
            onRefresh={onRefreshCreatorProfile}
          />
        )}
        {creatorTab === "account" && (
          <div className="space-y-6">
            <div className="mb-6">
              <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Preferred Currency
                    </h3>
                    <p className="text-xs text-slate-500">
                      Set your default currency for payments and earnings
                    </p>
                  </div>
                  <select
                    value={currency}
                    onChange={(e) =>
                      onCurrencyChange?.(e.target.value as Currency)
                    }
                    className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
                  >
                    {Object.entries(CURRENCIES).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.symbol} {info.name} ({code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <ProfileAccountSections
              profile={profile}
              bankAccount={bankAccount}
              draftProfile={draftProfile}
              setDraftProfile={setDraftProfile}
              draftBank={draftBank}
              setDraftBank={setDraftBank}
              editMode={editMode}
              setEditMode={setEditMode}
              onSave={handleSave}
              onPhotoUpload={handlePhotoUpload}
              initials={initials}
              referralData={referralData}
              copied={copied}
              onCopyCode={handleCopyCode}
              onCopyLink={handleCopyLink}
              onShareReferral={handleShareReferral}
              isAuthenticated={isAuthenticated}
              onRequestAuth={onRequestAuth}
              banks={banks}
              banksLoading={banksLoading}
              currency={currency}
              creatorProfile={creatorProfile}
              userId={userId}
              creatorId={creatorId}
              onSaveCreatorProfile={
                accountType === "creator" ? onSaveCreatorProfile : undefined
              }
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>

      {/* Currency Selector */}
      <div className="mb-6">
        <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                Preferred Currency
              </h3>
              <p className="text-xs text-slate-500">
                Set your default currency for payments and earnings
              </p>
            </div>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange?.(e.target.value as Currency)}
              className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
            >
              {Object.entries(CURRENCIES).map(([code, info]) => (
                <option key={code} value={code}>
                  {info.symbol} {info.name} ({code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-semibold text-white">Profile</h2>
            </div>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-6">
            {/* Profile Photo */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0ea5e9] to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                {initials}
              </div>
              <button
                onClick={handlePhotoUpload}
                className="absolute bottom-0 right-0 w-7 h-7 bg-white text-black rounded-full flex items-center justify-center hover:bg-white/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Fields */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={draftProfile.fullName}
                    onChange={(e) =>
                      setDraftProfile((p) => ({
                        ...p,
                        fullName: e.target.value,
                      }))
                    }
                    disabled={!editMode}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white disabled:text-slate-400 disabled:cursor-not-allowed focus:border-white/[0.12] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={draftProfile.email}
                    onChange={(e) =>
                      setDraftProfile((p) => ({ ...p, email: e.target.value }))
                    }
                    disabled={!editMode}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white disabled:text-slate-400 disabled:cursor-not-allowed focus:border-white/[0.12] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={draftProfile.phone}
                    onChange={(e) =>
                      setDraftProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    disabled={!editMode}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white disabled:text-slate-400 disabled:cursor-not-allowed focus:border-white/[0.12] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Primary Platform
                  </label>
                  <select
                    defaultValue="TikTok"
                    disabled={!editMode}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white disabled:text-slate-400 disabled:cursor-not-allowed focus:border-white/[0.12] focus:outline-none transition-colors"
                  >
                    <option>TikTok</option>
                    <option>Instagram</option>
                    <option>YouTube</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Niche
                  </label>
                  <input
                    type="text"
                    defaultValue="Beauty & Lifestyle"
                    disabled={!editMode}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white disabled:text-slate-400 disabled:cursor-not-allowed focus:border-white/[0.12] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-2">
                    Followers
                  </label>
                  <input
                    type="text"
                    defaultValue="125K"
                    disabled={!editMode}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white disabled:text-slate-400 disabled:cursor-not-allowed focus:border-white/[0.12] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bank Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-semibold text-white">Bank Details</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-slate-500 mb-2">
                  Bank
                </label>
                <BankSelector
                  banks={banks}
                  loading={banksLoading}
                  value={
                    draftBank.bankName && draftBank.bankCode
                      ? {
                          bankName: draftBank.bankName,
                          bankCode: draftBank.bankCode,
                        }
                      : null
                  }
                  onChange={(v) =>
                    setDraftBank((b) => ({
                      ...b,
                      bankName: v.bankName,
                      bankCode: v.bankCode,
                    }))
                  }
                  disabled={!editMode}
                  placeholder="Select bank…"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={draftBank.accountNumber}
                  onChange={(e) =>
                    setDraftBank((b) => ({
                      ...b,
                      accountNumber: e.target.value,
                    }))
                  }
                  disabled={!editMode}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:border-white/[0.12] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={draftBank.accountName}
                  onChange={(e) =>
                    setDraftBank((b) => ({ ...b, accountName: e.target.value }))
                  }
                  disabled={!editMode}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:border-white/[0.12] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-slate-500 mb-3">
                Withdrawals will be sent to this bank account
              </p>
              <button
                onClick={() => {
                  if (!isAuthenticated)
                    return onRequestAuth("save bank details");
                  if (!editMode) return setEditMode(true);
                  void handleSave();
                }}
                className="px-4 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
              >
                {editMode ? "Save Bank Details" : "Edit Bank Details"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Referral Program */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-semibold text-white">
              Referral Program
            </h2>
          </div>
          <p className="text-sm text-slate-500 mb-5">
            Share your link or code. You earn 2% of every payment referrals
            receive for 6 months.
          </p>

          {/* Referral code + actions */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-500 mb-1.5">
                  Your referral code
                </div>
                <div className="font-mono text-lg font-bold text-white tracking-wider truncate bg-white/[0.04] rounded-lg px-4 py-3 border border-white/[0.06]">
                  {referralData.referralCode || "—"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                  {copied === "code" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy code
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm font-medium text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
                >
                  {copied === "link" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleShareReferral}
                  className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm font-medium text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
            </div>
            <div
              className="text-xs text-slate-500 truncate"
              title={referralLink}
            >
              {referralLink || "—"}
            </div>
          </div>

          {/* Stats: Earnings | Referral count */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/[0.03] rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">
                Earnings from referrals
              </div>
              <div className="text-xl font-bold text-purple-400">
                {formatCurrency(referralData.totalEarnings, currency)}
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Referral count</div>
              <div className="text-xl font-bold text-white">
                {referralData.totalReferred}
              </div>
            </div>
          </div>

          {/* Referral history */}
          <div className="pt-4 border-t border-white/[0.06]">
            <div className="text-sm font-medium text-white mb-3">
              Referral history
            </div>
            {referralData.referrals.length === 0 ? (
              <div className="py-6 text-center rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <p className="text-sm text-slate-500 mb-1">No referrals yet</p>
                <p className="text-xs text-slate-600">
                  Share your link or code to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {referralData.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between py-2.5 px-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">
                        {referral.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Joined {referral.joinedDate}
                        {referral.status === "active" && (
                          <span className="ml-2 text-emerald-500">Active</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-purple-400">
                      +{formatCurrency(referral.earnings, currency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-semibold text-white">
              Notifications
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white mb-0.5">WhatsApp</div>
                <div className="text-xs text-slate-500">
                  Primary notification channel
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white mb-0.5">Email</div>
                <div className="text-xs text-slate-500">
                  Campaign updates and receipts
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-white mb-0.5">SMS</div>
                <div className="text-xs text-slate-500">
                  Urgent notifications only
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </motion.div>

        {/* Managed Creators */}
        {accountType === "agency" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
          >
            <ManagedCreatorsList
              creators={managedCreators}
              onAddCreator={() => setShowAddCreatorModal(true)}
              onManageCreator={handleManageCreator}
              onViewCampaigns={onViewCampaigns}
            />
          </motion.div>
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

      {/* Manage Creator Modal */}
      <ManageCreatorModal
        isOpen={showManageCreatorModal}
        onClose={handleCloseManageModal}
        creator={selectedCreator}
        onSave={(data) => {
          if (selectedCreatorId) {
            onUpdateCreator(selectedCreatorId, data);
          }
          handleCloseManageModal();
        }}
        onDelete={() => {
          if (selectedCreatorId) {
            onDeleteCreator(selectedCreatorId);
          }
          handleCloseManageModal();
        }}
        onAddSocialAccount={(account) => {
          if (selectedCreatorId) {
            onAddSocialAccount(selectedCreatorId, account);
          }
        }}
        onUpdateSocialAccount={(accountId, data) => {
          if (selectedCreatorId) {
            onUpdateSocialAccount(selectedCreatorId, accountId, data);
          }
        }}
        onDeleteSocialAccount={(accountId) => {
          if (selectedCreatorId) {
            onDeleteSocialAccount(selectedCreatorId, accountId);
          }
        }}
      />
    </div>
  );
}
