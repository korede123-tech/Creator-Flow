import { CheckCircle2, AlertCircle, ExternalLink, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import logo from 'figma:asset/fcad7446971be733d3427a6b22f8f64253529daf.png';

interface ReviewContentProps {
  campaign: {
    title: string;
    brand: string;
    deliverable: string;
  };
  creator: {
    handle: string;
    hideContact?: boolean;
  };
  submission: {
    type: 'file' | 'drive_link';
    url: string;
    note?: string;
    version: number;
  };
  onApprove: () => void;
  onRequestChanges: (feedback: string, priority?: 'minor' | 'medium' | 'major') => void;
}

export function ReviewContent({ campaign, creator, submission, onApprove, onRequestChanges }: ReviewContentProps) {
  const [decision, setDecision] = useState<'approve' | 'changes' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [priority, setPriority] = useState<'minor' | 'medium' | 'major'>('medium');

  const handleSubmit = () => {
    if (decision === 'approve') {
      onApprove();
    } else if (decision === 'changes' && feedback.trim()) {
      onRequestChanges(feedback, priority);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#0D0D0D]/50 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Dobble Tap" className="h-8 w-8" />
              <span className="text-sm font-semibold text-white">Content Review</span>
            </div>
            <div className="text-xs text-slate-500">
              Version {submission.version}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Campaign Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{campaign.title}</h1>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>{campaign.brand}</span>
            <span>•</span>
            <span>{campaign.deliverable}</span>
            <span>•</span>
            <span>Creator: @{creator.handle}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Preview */}
          <div className="lg:col-span-2">
            <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6 mb-6">
              <h3 className="text-base font-semibold text-white mb-4">Content Preview</h3>
              
              {submission.type === 'file' ? (
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Video Player</p>
                    <p className="text-xs text-slate-600 mt-1">{submission.url}</p>
                  </div>
                </div>
              ) : (
                <a
                  href={submission.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block aspect-video bg-gradient-to-br from-[#0ea5e9]/20 to-purple-500/20 rounded-lg border-2 border-dashed border-white/[0.12] hover:border-white/[0.2] transition-colors"
                >
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <ExternalLink className="w-12 h-12 text-[#0ea5e9] mx-auto mb-3" />
                      <p className="text-sm font-medium text-white mb-1">View on Drive</p>
                      <p className="text-xs text-slate-500">Click to open link</p>
                    </div>
                  </div>
                </a>
              )}

              {submission.note && (
                <div className="mt-4 p-4 bg-white/[0.03] border border-white/[0.06] rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">Note from creator</div>
                  <p className="text-sm text-slate-300">{submission.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Decision Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6 sticky top-4">
              <h3 className="text-base font-semibold text-white mb-4">Your Decision</h3>

              {/* Decision Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setDecision('approve')}
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    decision === 'approve'
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:border-white/[0.12]'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Approve</div>
                </button>

                <button
                  onClick={() => setDecision('changes')}
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    decision === 'changes'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:border-white/[0.12]'
                  }`}
                >
                  <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">Request Changes</div>
                </button>
              </div>

              {/* Feedback Form */}
              {decision === 'changes' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs text-slate-500 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white focus:border-[#0ea5e9] focus:outline-none transition-colors"
                    >
                      <option value="minor">Minor</option>
                      <option value="medium">Medium</option>
                      <option value="major">Major</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-2">Feedback *</label>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Describe what needs to be changed..."
                      rows={6}
                      className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={!decision || (decision === 'changes' && !feedback.trim())}
                className="w-full mt-6 px-4 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
