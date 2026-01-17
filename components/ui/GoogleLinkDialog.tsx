import React from 'react';
import { Link2, X, Settings, AlertTriangle } from 'lucide-react';

/**
 * GoogleLinkDialog - Confirmation dialog for Google Account Linking
 * 
 * Shows when a user tries to use a Google-dependent feature (Calendar sync,
 * Trip export) without having their Google account linked.
 * 
 * Usage:
 * <GoogleLinkDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onGoToSettings={() => navigate('/settings#google-linking')}
 *   featureName="Calendar sync"
 * />
 */

interface GoogleLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
  featureName?: string;
}

const GoogleLinkDialog: React.FC<GoogleLinkDialogProps> = ({
  isOpen,
  onClose,
  onGoToSettings,
  featureName = 'This feature'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-white/20 dark:border-slate-700 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/30">
            <Link2 className="w-8 h-8 text-amber-500" />
          </div>
          
          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Google Account Not Linked
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              {featureName} requires a linked Google account.
              <br />
              Would you like to go to Settings to link your Google account now?
            </p>
          </div>

          {/* Google Icon indicator */}
          <div className="flex items-center gap-2 py-2 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5" 
            />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Link to enable Calendar features
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 w-full pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={onGoToSettings}
              className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-sky-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Go to Settings
            </button>
          </div>

          {/* Info note */}
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Your data stays secure with Google OAuth
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleLinkDialog;
