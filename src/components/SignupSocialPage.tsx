import { useState } from 'react';
import { ChevronLeft, Plus, X } from 'lucide-react';
import type { SocialProfile } from '../App';
import logo from 'figma:asset/136d294c79c3778ac95b0b1978b968aedfe25bbd.png';

interface SignupSocialPageProps {
  initialProfiles: SocialProfile[];
  onComplete: (profiles: SocialProfile[]) => void;
  onBack: () => void;
}

const PLATFORMS = ['TikTok', 'Instagram', 'YouTube', 'X', 'Facebook'];

export function SignupSocialPage({
  initialProfiles,
  onComplete,
  onBack,
}: SignupSocialPageProps) {
  const [profiles, setProfiles] = useState<SocialProfile[]>(
    initialProfiles.length > 0
      ? initialProfiles
      : [
          {
            id: crypto.randomUUID(),
            platform: '',
            handle: '',
            followerCount: '',
            isPrimary: false,
          },
        ]
  );

  const addProfile = () => {
    setProfiles([
      ...profiles,
      {
        id: crypto.randomUUID(),
        platform: '',
        handle: '',
        followerCount: '',
        isPrimary: false,
      },
    ]);
  };

  const removeProfile = (id: string) => {
    if (profiles.length > 1) {
      setProfiles(profiles.filter((p) => p.id !== id));
    }
  };

  const updateProfile = (id: string, field: keyof SocialProfile, value: any) => {
    setProfiles(
      profiles.map((p) => {
        if (p.id === id) {
          // If setting as primary, unset all others
          if (field === 'isPrimary' && value === true) {
            setProfiles(profiles.map((profile) => ({ ...profile, isPrimary: false })));
          }
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleContinue = () => {
    // Filter out empty profiles
    const validProfiles = profiles.filter(
      (p) => p.platform && p.handle && p.followerCount
    );
    onComplete(validProfiles);
  };

  const handleSkip = () => {
    onComplete([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
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
            <h1 className="text-2xl font-semibold mb-2">Add your social profiles</h1>
            <p className="text-sm text-white/60">
              Add the platforms you're active on. You can add more later.
            </p>
          </div>

          {/* Profiles */}
          <div className="space-y-4 mb-6">
            {profiles.map((profile, index) => (
              <div
                key={profile.id}
                className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4"
              >
                {/* Platform and Remove */}
                <div className="flex items-center gap-3">
                  <select
                    value={profile.platform}
                    onChange={(e) => updateProfile(profile.id, 'platform', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#0A0A0A]">
                      Select platform
                    </option>
                    {PLATFORMS.map((platform) => (
                      <option key={platform} value={platform} className="bg-[#0A0A0A]">
                        {platform}
                      </option>
                    ))}
                  </select>
                  {profiles.length > 1 && (
                    <button
                      onClick={() => removeProfile(profile.id)}
                      className="text-white/40 hover:text-red-400 transition-colors p-2"
                      aria-label="Remove profile"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                {/* Handle */}
                <div>
                  <input
                    type="text"
                    value={profile.handle}
                    onChange={(e) => updateProfile(profile.id, 'handle', e.target.value)}
                    placeholder="@username or profile link"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                  />
                </div>

                {/* Follower Count */}
                <div>
                  <input
                    type="number"
                    value={profile.followerCount}
                    onChange={(e) =>
                      updateProfile(profile.id, 'followerCount', e.target.value)
                    }
                    placeholder="Follower count"
                    min="0"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] transition-all"
                  />
                </div>

                {/* Primary Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateProfile(profile.id, 'isPrimary', !profile.isPrimary)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:ring-offset-2 focus:ring-offset-[#0A0A0A] ${
                      profile.isPrimary ? 'bg-[#0ea5e9]' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profile.isPrimary ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-white/80">Primary platform</span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Another Button */}
          <button
            onClick={addProfile}
            className="flex items-center gap-2 text-[#0ea5e9] hover:text-[#0ea5e9]/80 transition-colors mb-8 text-sm font-medium"
          >
            <Plus size={16} />
            Add another platform
          </button>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-white/90 transition-all focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
            >
              Continue
            </button>
            <button
              onClick={handleSkip}
              className="w-full text-white/60 hover:text-white text-sm transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}