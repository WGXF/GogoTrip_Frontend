import { useState, useCallback } from 'react';
import { User } from '../types';

/**
 * useGoogleLink - Hook for managing Google Account Linking flow
 * 
 * Provides utilities to:
 * 1. Check if user has Google linked
 * 2. Gate features that require Google linking
 * 3. Show link dialog when needed
 * 4. Handle navigation to settings
 * 
 * Usage:
 * const { requireGoogleLink, showLinkDialog, ... } = useGoogleLink({ user, onShowWarning });
 * 
 * // Before using a Google-dependent feature:
 * const handleSync = () => {
 *   if (!requireGoogleLink('Calendar sync')) return;
 *   // ... proceed with sync
 * };
 */

interface UseGoogleLinkOptions {
  user: User | null;
  onShowWarning?: (message: string) => void;
  onNavigateToSettings?: () => void;
}

interface UseGoogleLinkReturn {
  /** Check if user has Google account linked */
  isGoogleLinked: () => boolean;
  /** Gate a feature - returns true if allowed, false if dialog shown */
  requireGoogleLink: (featureName: string) => boolean;
  /** Whether the link dialog is currently open */
  showLinkDialog: boolean;
  /** The feature name that triggered the dialog */
  pendingFeature: string;
  /** Handler for "Go to Settings" button */
  handleGoToSettings: () => void;
  /** Handler for "Cancel" button - shows warning toast */
  handleCancelLink: () => void;
  /** Close the dialog without showing warning */
  closeLinkDialog: () => void;
}

export const useGoogleLink = ({ 
  user, 
  onShowWarning,
  onNavigateToSettings 
}: UseGoogleLinkOptions): UseGoogleLinkReturn => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [pendingFeature, setPendingFeature] = useState<string>('');

  /**
   * Check if user has Google account linked
   * - Google login users are always linked (authProvider === 'google')
   * - Email users need explicit linking (hasGoogleLinked === true)
   */
  const isGoogleLinked = useCallback((): boolean => {
    if (!user) return false;
    
    // Google login users are always linked
    if (user.authProvider === 'google') return true;
    
    // Email users need explicit linking
    return user.hasGoogleLinked === true;
  }, [user]);

  /**
   * Gate a feature that requires Google linking
   * Returns true if user can proceed, false if blocked (dialog shown)
   */
  const requireGoogleLink = useCallback((featureName: string): boolean => {
    if (isGoogleLinked()) {
      return true; // User can proceed
    }
    
    // Show dialog to prompt linking
    setPendingFeature(featureName);
    setShowLinkDialog(true);
    return false; // Block the action
  }, [isGoogleLinked]);

  /**
   * Handle "Go to Settings" - navigate to settings with hash for scrolling
   */
  const handleGoToSettings = useCallback(() => {
    setShowLinkDialog(false);
    setPendingFeature('');
    
    if (onNavigateToSettings) {
      onNavigateToSettings();
    } else {
      // Default: navigate with hash to scroll to Google section
      window.location.href = '/settings#google-linking';
    }
  }, [onNavigateToSettings]);

  /**
   * Handle "Cancel" - close dialog and show warning toast
   */
  const handleCancelLink = useCallback(() => {
    setShowLinkDialog(false);
    setPendingFeature('');
    
    if (onShowWarning) {
      onShowWarning(
        'Google account not linked. This feature cannot be used until you link your Google account in Settings.'
      );
    }
  }, [onShowWarning]);

  /**
   * Close dialog without showing warning (e.g., clicking outside)
   */
  const closeLinkDialog = useCallback(() => {
    setShowLinkDialog(false);
    setPendingFeature('');
  }, []);

  return {
    isGoogleLinked,
    requireGoogleLink,
    showLinkDialog,
    pendingFeature,
    handleGoToSettings,
    handleCancelLink,
    closeLinkDialog,
  };
};

export default useGoogleLink;
