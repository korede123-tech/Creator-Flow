import { useState, useEffect } from "react";
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
import { BankSelector } from "./BankSelector";
import { formatCurrency, Currency } from "../utils/currency";
import { NICHES, AUDIENCE_REGIONS, GENDERS } from "./CreatorProfile/constants";
import type { CreatorProfileRow } from "./CreatorProfile/types";

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

interface ProfileAccountSectionsProps {
  profile?: ProfileData;
  bankAccount?: BankAccountData;
  draftProfile: ProfileData;
  setDraftProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  draftBank: {
    bankName: string;
    bankCode?: string;
    accountNumber: string;
    accountName: string;
  };
  setDraftBank: React.Dispatch<
    React.SetStateAction<{
      bankName: string;
      bankCode?: string;
      accountNumber: string;
      accountName: string;
    }>
  >;
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  onSave: () => void | Promise<void>;
  onPhotoUpload: () => void;
  initials: string;
  referralData: {
    referralCode: string;
    totalEarnings: number;
    totalReferred: number;
    referrals: Array<{
      id: string;
      name: string;
      joinedDate: string;
      earnings: number;
      status: string;
    }>;
  };
  copied: "code" | "link" | null;
  onCopyCode: () => void;
  onCopyLink: () => void;
  onShareReferral: () => void;
  isAuthenticated: boolean;
  onRequestAuth: (action: string) => void;
  banks: { name: string; code: string }[];
  banksLoading: boolean;
  currency: Currency;
  creatorProfile?: CreatorProfileRow | null;
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

const baseInput =
  "w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white disabled:text-slate-400 disabled:cursor-not-allowed focus:border-white/[0.12] focus:outline-none transition-colors placeholder:text-slate-500";
const baseLabel = "block text-xs text-slate-500 mb-2";

export function ProfileAccountSections({
  draftProfile,
  setDraftProfile,
  draftBank,
  setDraftBank,
  editMode,
  setEditMode,
  onSave,
  onPhotoUpload,
  initials,
  referralData,
  copied,
  onCopyCode,
  onCopyLink,
  onShareReferral,
  isAuthenticated,
  onRequestAuth,
  banks,
  banksLoading,
  currency,
  creatorProfile = null,
  userId = "",
  creatorId = "",
  onSaveCreatorProfile,
}: ProfileAccountSectionsProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${baseUrl}/join/${referralData.referralCode || ""}`;

  const [location, setLocation] = useState(creatorProfile?.location ?? "");
  const [niches, setNiches] = useState<string[]>(creatorProfile?.niches ?? []);
  const [customNiche, setCustomNiche] = useState("");
  const [audienceRegion, setAudienceRegion] = useState(
    creatorProfile?.audience_region ?? "Nigeria",
  );
  const [gender, setGender] = useState(creatorProfile?.gender ?? "");

  useEffect(() => {
    if (!creatorProfile) return;
    setLocation(creatorProfile.location ?? "");
    setNiches(creatorProfile.niches ?? []);
    setAudienceRegion(creatorProfile.audience_region ?? "Nigeria");
    setGender(creatorProfile.gender ?? "");
  }, [
    creatorProfile?.id,
    creatorProfile?.updated_at,
    creatorProfile?.location,
    creatorProfile?.niches,
    creatorProfile?.audience_region,
    creatorProfile?.gender,
  ]);

  const isCreator = Boolean(onSaveCreatorProfile);
  const creatorValid =
    !isCreator || (location.trim().length > 0 && niches.length >= 1);
  const addNiche = (n: string) => {
    const v = n.trim();
    if (!v || niches.includes(v)) return;
    setNiches((prev) => [...prev, v]);
  };
  const removeNiche = (n: string) =>
    setNiches((prev) => prev.filter((x) => x !== n));
  const addCustomNiche = () => {
    const v = customNiche.trim();
    if (!v || niches.includes(v)) return;
    setNiches((prev) => [...prev, v]);
    setCustomNiche("");
  };

  const handleSave = async () => {
    await onSave();
    if (onSaveCreatorProfile) {
      await onSaveCreatorProfile({
        display_name: draftProfile.fullName.trim(),
        location: location.trim(),
        niches,
        audience_region: audienceRegion,
        gender: gender || "",
      });
    }
  };

  return (
    <div className="space-y-6">
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
                onClick={() => void handleSave()}
                disabled={!creatorValid}
                className="px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>
        <div className="flex items-start gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0ea5e9] to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <button
              onClick={onPhotoUpload}
              className="absolute bottom-0 right-0 w-7 h-7 bg-white text-black rounded-full flex items-center justify-center hover:bg-white/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={baseLabel}>Name</label>
                <input
                  type="text"
                  value={draftProfile.fullName}
                  onChange={(e) =>
                    setDraftProfile((p) => ({ ...p, fullName: e.target.value }))
                  }
                  disabled={!editMode}
                  className={baseInput}
                />
              </div>
              <div>
                <label className={baseLabel}>Email</label>
                <input
                  type="email"
                  value={draftProfile.email}
                  onChange={(e) =>
                    setDraftProfile((p) => ({ ...p, email: e.target.value }))
                  }
                  disabled={!editMode}
                  className={baseInput}
                />
              </div>
              <div>
                <label className={baseLabel}>Phone</label>
                <input
                  type="tel"
                  value={draftProfile.phone}
                  onChange={(e) =>
                    setDraftProfile((p) => ({ ...p, phone: e.target.value }))
                  }
                  disabled={!editMode}
                  className={baseInput}
                />
              </div>
            </div>
            {isCreator && (
              <>
                <div>
                  <label className={baseLabel}>
                    Location — City, Country (required)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!editMode}
                    placeholder="e.g. Lagos, Nigeria"
                    className={baseInput}
                  />
                </div>
                <div>
                  <label className={baseLabel}>
                    Primary niches (required) — select at least one
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(NICHES as readonly string[]).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          editMode
                            ? niches.includes(n)
                              ? removeNiche(n)
                              : addNiche(n)
                            : undefined
                        }
                        disabled={!editMode}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                          niches.includes(n)
                            ? "bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/40"
                            : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:border-white/[0.12]"
                        } ${!editMode ? "cursor-default" : ""}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {niches
                      .filter((n) => !(NICHES as readonly string[]).includes(n))
                      .map((n) => (
                        <span
                          key={n}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm"
                        >
                          {n}
                          {editMode && (
                            <button
                              type="button"
                              onClick={() => removeNiche(n)}
                              className="hover:opacity-80"
                              aria-label={`Remove ${n}`}
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                  </div>
                  {editMode && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customNiche}
                        onChange={(e) => setCustomNiche(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addCustomNiche())
                        }
                        placeholder="Custom niche"
                        className={`${baseInput} max-w-[200px]`}
                      />
                      <button
                        type="button"
                        onClick={addCustomNiche}
                        className="px-3 py-2 rounded-lg bg-white/[0.06] text-slate-400 text-sm hover:bg-white/[0.1] hover:text-white transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className={baseLabel}>Audience region</label>
                  <select
                    value={audienceRegion}
                    onChange={(e) => setAudienceRegion(e.target.value)}
                    disabled={!editMode}
                    className={baseInput}
                  >
                    {AUDIENCE_REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={baseLabel}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={!editMode}
                    className={baseInput}
                  >
                    <option value="">—</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

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
              <label className="block text-xs text-slate-500 mb-2">Bank</label>
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
                  setDraftBank((b) => ({ ...b, accountNumber: e.target.value }))
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
                if (!isAuthenticated) return onRequestAuth("save bank details");
                if (!editMode) return setEditMode(true);
                void onSave();
              }}
              className="px-4 py-2 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
            >
              {editMode ? "Save Bank Details" : "Edit Bank Details"}
            </button>
          </div>
        </div>
      </motion.div>

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
                onClick={onCopyCode}
                className="px-4 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
              >
                {copied === "code" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy code
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCopyLink}
                className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm font-medium text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
              >
                {copied === "link" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy link
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onShareReferral}
                className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm font-medium text-white hover:bg-white/[0.08] transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-500 truncate" title={referralLink}>
            {referralLink || "—"}
          </div>
        </div>
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
              {referralData.referrals.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2.5 px-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-white">
                      {r.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      Joined {r.joinedDate}{" "}
                      {r.status === "active" && (
                        <span className="ml-2 text-emerald-500">Active</span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-purple-400">
                    +{formatCurrency(r.earnings, currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-slate-400" />
          <h2 className="text-base font-semibold text-white">Notifications</h2>
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
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
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
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
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
              <div className="w-11 h-6 bg-white/[0.06] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
