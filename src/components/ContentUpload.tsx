import { useState } from 'react';
import { Upload, Link as LinkIcon, CheckCircle2, FileVideo, Cloud } from 'lucide-react';
import { Button } from './Button';
import { motion, AnimatePresence } from 'motion/react';

interface ContentUploadProps {
  onSubmit: () => void;
}

export function ContentUpload({ onSubmit }: ContentUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'file' | 'link' | null>(null);
  const [driveLink, setDriveLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = () => {
    setUploadMethod('file');
  };

  const handleSubmit = () => {
    setShowSuccess(true);
    setTimeout(() => {
      onSubmit();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <div className="border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 rounded-full mb-4">
              <FileVideo className="w-3 h-3 text-[#0ea5e9]" />
              <span className="text-xs text-[#0ea5e9] font-medium">Content Submission</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
              Upload Your Video
            </h1>
            <p className="text-sm text-slate-400">
              Share your content for review. We accept video files up to 500MB or cloud storage links.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {!showSuccess ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Upload Methods Grid */}
              <div className="grid grid-cols-1 gap-4">
                {/* File Upload Card */}
                <div
                  onClick={handleFileUpload}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileUpload();
                  }}
                  className={`relative bg-[#0D0D0D] border-2 border-dashed ${
                    isDragging ? 'border-[#0ea5e9] bg-[#0ea5e9]/5' : 'border-white/[0.08]'
                  } rounded-2xl p-12 cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.02] transition-all group`}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:border-[#0ea5e9]/30 transition-all">
                      <Upload className="w-8 h-8 text-[#0ea5e9]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Drop your video here
                    </h3>
                    <p className="text-sm text-slate-400 mb-4">
                      or click to browse your files
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                      <span>MP4, MOV, AVI</span>
                      <span>•</span>
                      <span>Max 500MB</span>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/[0.08]"></div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Or</span>
                  <div className="flex-1 h-px bg-white/[0.08]"></div>
                </div>

                {/* Cloud Link Card */}
                <div className="bg-[#0D0D0D] border border-white/[0.08] rounded-2xl p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
                      <Cloud className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Share from cloud storage
                      </h3>
                      <p className="text-sm text-slate-400">
                        Paste a link from Google Drive, Dropbox, or any cloud service
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={driveLink}
                      onChange={(e) => setDriveLink(e.target.value)}
                      placeholder="https://drive.google.com/file/..."
                      className="w-full h-12 px-4 bg-white/[0.03] border border-white/[0.08] focus:bg-white/[0.06] focus:border-[#0ea5e9]/50 rounded-lg focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0ea5e9]/50 text-white text-sm placeholder:text-slate-500 transition-all"
                    />
                    {driveLink && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!uploadMethod && !driveLink}
                >
                  Submit for Review
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="py-16 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Video Submitted Successfully
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                We've received your content and will review it shortly. You'll be notified once the review is complete.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}