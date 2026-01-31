import { Upload, Link as LinkIcon, ArrowLeft, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef } from 'react';
import logo from 'figma:asset/fcad7446971be733d3427a6b22f8f64253529daf.png';

interface UploadContentProps {
  campaign: {
    id: string;
    title: string;
    brand: string;
    platform?: string;
    status: string;
  };
  version?: number;
  lastFeedback?: string;
  onBack: () => void;
  onSubmit: (data: { type: 'file' | 'drive_link'; url: string; note?: string; fileName?: string; fileSize?: number }) => void;
}

type UploadMode = 'upload' | 'drive_link';

export function UploadContent({ campaign, version = 1, lastFeedback, onBack, onSubmit }: UploadContentProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>('upload');
  const [driveLink, setDriveLink] = useState('');
  const [driveLinkError, setDriveLinkError] = useState('');
  const [note, setNote] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validateDriveLink = (url: string): boolean => {
    if (!url) return false;
    const validPatterns = [
      /^https:\/\/drive\.google\.com\//,
      /^https:\/\/www\.dropbox\.com\//,
      /^https:\/\/onedrive\.live\.com\//,
      /^https:\/\/1drv\.ms\//
    ];
    return validPatterns.some(pattern => pattern.test(url));
  };

  const handleFileSelect = (file: File) => {
    setUploadError('');
    
    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid video file (MP4, MOV, WEBM, or AVI)');
      return;
    }

    // Validate file size (250MB max)
    const maxSize = 250 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError('File size must be under 250MB');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    
    // Simulate upload progress
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleReplaceFile = () => {
    setFileName('');
    setFileSize(0);
    setUploadProgress(0);
    setUploadError('');
    fileInputRef.current?.click();
  };

  const handleDriveLinkChange = (value: string) => {
    setDriveLink(value);
    setDriveLinkError('');
  };

  const handleDriveLinkBlur = () => {
    if (driveLink && !validateDriveLink(driveLink)) {
      setDriveLinkError('Enter a valid link from Google Drive, Dropbox, or OneDrive');
    }
  };

  const canSubmit = (): boolean => {
    if (uploadMode === 'upload') {
      return fileName !== '' && uploadProgress === 100 && !isUploading;
    } else {
      return driveLink !== '' && validateDriveLink(driveLink);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;

    if (uploadMode === 'drive_link' && !validateDriveLink(driveLink)) {
      setDriveLinkError('Enter a valid link from Google Drive, Dropbox, or OneDrive');
      return;
    }

    // Submit data
    onSubmit({
      type: uploadMode === 'upload' ? 'file' : 'drive_link',
      url: uploadMode === 'upload' ? fileName : driveLink,
      note: note || undefined,
      fileName: uploadMode === 'upload' ? fileName : undefined,
      fileSize: uploadMode === 'upload' ? fileSize : undefined
    });

    // Show success state
    setIsSubmitted(true);
  };

  // Success state screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto px-4 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Submitted for review</h2>
          <p className="text-base text-slate-400 mb-8">
            We have sent your content for review. You will get feedback here if changes are needed.
          </p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Back to Campaign
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#0D0D0D]/50 border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Dobble Tap" className="h-7 w-7" />
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Campaigns
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload content</h1>
          <p className="text-base text-slate-400 mb-3">
            Submit a watermarked draft for review.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-white/[0.06] rounded-lg text-sm text-slate-300">
            <span className="font-medium">{campaign.title}</span>
            {campaign.platform && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{campaign.platform}</span>
              </>
            )}
          </div>
        </div>

        {/* Last Feedback */}
        {lastFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white mb-1">Feedback from last review</div>
                <p className="text-sm text-slate-300">{lastFeedback}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Selector */}
        <div className="mb-8 flex items-center gap-2 border-b border-white/[0.06] pb-px">
          <button
            onClick={() => setUploadMode('upload')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              uploadMode === 'upload'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Upload video
            {uploadMode === 'upload' && (
              <motion.div
                layoutId="uploadModeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              />
            )}
          </button>
          <button
            onClick={() => setUploadMode('drive_link')}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              uploadMode === 'drive_link'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Paste Drive link
            {uploadMode === 'drive_link' && (
              <motion.div
                layoutId="uploadModeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
              />
            )}
          </button>
        </div>

        {/* Upload Area */}
        <AnimatePresence mode="wait">
          {uploadMode === 'upload' ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {!fileName ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#0ea5e9] bg-[#0ea5e9]/5'
                      : 'border-white/[0.12] hover:border-white/[0.2] bg-white/[0.02]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,.mp4,.mov,.webm,.avi"
                    onChange={handleFileInputChange}
                  />
                  <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <p className="text-base font-medium text-white mb-2">
                    Drop watermarked video here
                  </p>
                  <p className="text-sm text-slate-500 mb-4">or click to browse</p>
                  <p className="text-xs text-slate-600">
                    Accepted formats: MP4, MOV, WEBM • Max size: 250MB
                  </p>
                </div>
              ) : (
                <div className="bg-[#0D0D0D]/50 border border-white/[0.06] rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-5 h-5 text-[#0ea5e9]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="text-sm font-medium text-white truncate">{fileName}</p>
                        {uploadProgress === 100 && !isUploading && (
                          <button
                            onClick={handleReplaceFile}
                            className="text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
                          >
                            Replace file
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{formatFileSize(fileSize)}</p>
                    </div>
                  </div>

                  {isUploading && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#0ea5e9]"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadProgress === 100 && !isUploading && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Upload complete</span>
                    </div>
                  )}
                </div>
              )}

              {uploadError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center gap-2 text-sm text-red-400"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{uploadError}</span>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="drive_link"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Drive link
                </label>
                <input
                  type="url"
                  value={driveLink}
                  onChange={(e) => handleDriveLinkChange(e.target.value)}
                  onBlur={handleDriveLinkBlur}
                  placeholder="Paste Google Drive, Dropbox, or OneDrive link"
                  className={`w-full px-4 py-3 bg-white/[0.03] border rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none transition-colors ${
                    driveLinkError
                      ? 'border-red-500/50 focus:border-red-500'
                      : 'border-white/[0.06] focus:border-[#0ea5e9]'
                  }`}
                />
                {driveLinkError ? (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 flex items-center gap-2 text-xs text-red-400"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {driveLinkError}
                  </motion.p>
                ) : (
                  <p className="mt-2 text-xs text-slate-500">
                    Make sure link access is set to Anyone with the link can view.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Note Field */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-white mb-3">
            Note for reviewer <span className="text-slate-500">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Mention key changes or context"
            rows={4}
            className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white placeholder-slate-600 focus:border-[#0ea5e9] focus:outline-none transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 text-slate-400 text-sm font-medium hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="px-6 py-3 bg-white text-black rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            Submit for review
          </button>
        </div>
        
        {!canSubmit() && (uploadMode === 'upload' ? !fileName : !driveLink) && (
          <p className="mt-3 text-right text-xs text-slate-500">
            {uploadMode === 'upload' 
              ? 'Upload a video file to continue' 
              : 'Enter a valid drive link to continue'}
          </p>
        )}
      </div>
    </div>
  );
}
