import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { PayoutData } from '../App';
import logo from 'figma:asset/136d294c79c3778ac95b0b1978b968aedfe25bbd.png';

interface SignupPayoutPageProps {
  onComplete: (data: PayoutData) => void;
  onBack: () => void;
}

const COUNTRIES = [
  { value: 'nigeria', label: 'Nigeria', supportsMobile: false },
  { value: 'ghana', label: 'Ghana', supportsMobile: true },
  { value: 'kenya', label: 'Kenya', supportsMobile: true },
  { value: 'south-africa', label: 'South Africa', supportsMobile: false },
  { value: 'other', label: 'Other Africa', supportsMobile: false },
];

const GHANA_NETWORKS = ['MTN', 'Vodafone', 'AirtelTigo'];
const NIGERIAN_BANKS = [
  'Access Bank',
  'GTBank',
  'First Bank',
  'Zenith Bank',
  'UBA',
  'Kuda Bank',
  'Other',
];

export function SignupPayoutPage({ onComplete, onBack }: SignupPayoutPageProps) {
  const [country, setCountry] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank' | 'mobile'>('bank');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [mobileMoneyNetwork, setMobileMoneyNetwork] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCountry = COUNTRIES.find((c) => c.value === country);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!country) newErrors.country = 'Please select a country';
    if (!confirmed) newErrors.confirmed = 'Please confirm your payout details';

    if (country === 'nigeria') {
      if (!bankName) newErrors.bankName = 'Bank name is required';
      if (!accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!accountName) newErrors.accountName = 'Account name is required';
    } else if (country === 'ghana') {
      if (payoutMethod === 'bank') {
        if (!bankName) newErrors.bankName = 'Bank name is required';
        if (!accountNumber) newErrors.accountNumber = 'Account number is required';
        if (!accountName) newErrors.accountName = 'Account name is required';
      } else {
        if (!mobileMoneyNetwork) newErrors.mobileMoneyNetwork = 'Network is required';
        if (!mobileMoneyNumber)
          newErrors.mobileMoneyNumber = 'Mobile money number is required';
        if (!accountName) newErrors.accountName = 'Account name is required';
      }
    } else if (country === 'kenya') {
      if (payoutMethod === 'mobile') {
        if (!mpesaNumber) newErrors.mpesaNumber = 'M-Pesa number is required';
        if (!accountName) newErrors.accountName = 'Account name is required';
      } else {
        if (!bankName) newErrors.bankName = 'Bank name is required';
        if (!accountNumber) newErrors.accountNumber = 'Account number is required';
        if (!accountName) newErrors.accountName = 'Account name is required';
      }
    } else if (country === 'south-africa' || country === 'other') {
      if (!bankName) newErrors.bankName = 'Bank name is required';
      if (!accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!accountName) newErrors.accountName = 'Account name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete({
        country,
        payoutMethod,
        bankName,
        accountNumber,
        accountName,
        mobileMoneyNetwork,
        mobileMoneyNumber,
        mpesaNumber,
        confirmed,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={logo} alt="DobbleTap" className="w-10 h-10" />
          <span className="text-2xl font-semibold">DobbleTap</span>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">Back</span>
        </button>

        {/* Auth Card */}
        <div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold mb-2">Set up payouts</h1>
            <p className="text-sm text-white/60">
              Add your payout details to receive payments. You can update anytime.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-2">
                Country
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  // Reset payout method when country changes
                  const newCountry = COUNTRIES.find((c) => c.value === e.target.value);
                  if (newCountry && !newCountry.supportsMobile) {
                    setPayoutMethod('bank');
                  }
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0A0A0A]">
                  Select country
                </option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#0A0A0A]">
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="text-red-400 text-xs mt-1">{errors.country}</p>
              )}
            </div>

            {/* Payout Method - Only show if country supports mobile money */}
            {selectedCountry && selectedCountry.supportsMobile && (
              <div>
                <label className="block text-sm font-medium mb-2">Payout method</label>
                <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('bank')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      payoutMethod === 'bank'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMethod('mobile')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      payoutMethod === 'mobile'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Mobile Money
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Fields Based on Country and Method */}
            {country && (
              <>
                {/* Nigeria - Bank Only */}
                {country === 'nigeria' && (
                  <>
                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium mb-2">
                        Bank name
                      </label>
                      <select
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#0A0A0A]">
                          Select bank
                        </option>
                        {NIGERIAN_BANKS.map((bank) => (
                          <option key={bank} value={bank} className="bg-[#0A0A0A]">
                            {bank}
                          </option>
                        ))}
                      </select>
                      {errors.bankName && (
                        <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium mb-2"
                      >
                        Account number
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="0123456789"
                      />
                      {errors.accountNumber && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium mb-2">
                        Account name
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="John Doe"
                      />
                      {errors.accountName && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountName}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Ghana - Bank or Mobile Money */}
                {country === 'ghana' && payoutMethod === 'bank' && (
                  <>
                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium mb-2">
                        Bank name
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="Enter bank name"
                      />
                      {errors.bankName && (
                        <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium mb-2"
                      >
                        Account number
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="0123456789"
                      />
                      {errors.accountNumber && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium mb-2">
                        Account name
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="John Doe"
                      />
                      {errors.accountName && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountName}</p>
                      )}
                    </div>
                  </>
                )}

                {country === 'ghana' && payoutMethod === 'mobile' && (
                  <>
                    <div>
                      <label
                        htmlFor="mobileMoneyNetwork"
                        className="block text-sm font-medium mb-2"
                      >
                        Mobile money network
                      </label>
                      <select
                        id="mobileMoneyNetwork"
                        value={mobileMoneyNetwork}
                        onChange={(e) => setMobileMoneyNetwork(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#0A0A0A]">
                          Select network
                        </option>
                        {GHANA_NETWORKS.map((network) => (
                          <option key={network} value={network} className="bg-[#0A0A0A]">
                            {network}
                          </option>
                        ))}
                      </select>
                      {errors.mobileMoneyNetwork && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.mobileMoneyNetwork}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="mobileMoneyNumber"
                        className="block text-sm font-medium mb-2"
                      >
                        Mobile money number
                      </label>
                      <input
                        type="tel"
                        id="mobileMoneyNumber"
                        value={mobileMoneyNumber}
                        onChange={(e) => setMobileMoneyNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="0XX XXX XXXX"
                      />
                      {errors.mobileMoneyNumber && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.mobileMoneyNumber}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium mb-2">
                        Account name
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="John Doe"
                      />
                      {errors.accountName && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountName}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Kenya - M-Pesa or Bank */}
                {country === 'kenya' && payoutMethod === 'mobile' && (
                  <>
                    <div>
                      <label htmlFor="mpesaNumber" className="block text-sm font-medium mb-2">
                        M-Pesa number
                      </label>
                      <input
                        type="tel"
                        id="mpesaNumber"
                        value={mpesaNumber}
                        onChange={(e) => setMpesaNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="+254 XXX XXX XXX"
                      />
                      {errors.mpesaNumber && (
                        <p className="text-red-400 text-xs mt-1">{errors.mpesaNumber}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium mb-2">
                        Account name
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="John Doe"
                      />
                      {errors.accountName && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountName}</p>
                      )}
                    </div>
                  </>
                )}

                {country === 'kenya' && payoutMethod === 'bank' && (
                  <>
                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium mb-2">
                        Bank name
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="Enter bank name"
                      />
                      {errors.bankName && (
                        <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium mb-2"
                      >
                        Account number
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="0123456789"
                      />
                      {errors.accountNumber && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium mb-2">
                        Account name
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="John Doe"
                      />
                      {errors.accountName && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountName}</p>
                      )}
                    </div>
                  </>
                )}

                {/* South Africa and Other - Bank Only */}
                {(country === 'south-africa' || country === 'other') && (
                  <>
                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium mb-2">
                        Bank name
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="Enter bank name"
                      />
                      {errors.bankName && (
                        <p className="text-red-400 text-xs mt-1">{errors.bankName}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="accountNumber"
                        className="block text-sm font-medium mb-2"
                      >
                        Account number
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="0123456789"
                      />
                      {errors.accountNumber && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountNumber}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium mb-2">
                        Account name
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                        placeholder="John Doe"
                      />
                      {errors.accountName && (
                        <p className="text-red-400 text-xs mt-1">{errors.accountName}</p>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Confirmation Checkbox */}
            {country && (
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="confirmed"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9] focus:ring-offset-0"
                />
                <label htmlFor="confirmed" className="text-sm text-white/80">
                  I confirm these payout details are mine
                </label>
              </div>
            )}
            {errors.confirmed && (
              <p className="text-red-400 text-xs -mt-2">{errors.confirmed}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 transition-all focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] mt-6"
            >
              Finish
            </button>

            {/* Security Note */}
            <p className="text-xs text-white/50 text-center">
              Your payout details are encrypted and stored securely.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}