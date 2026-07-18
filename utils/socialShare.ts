/**
 * Social media sharing utilities for Rate My President
 */

const DEFAULT_SHARE_TEXT = 'Check out today's leaderboard on Rate My President!';

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp(text: string, url: string): void {
  const shareUrl = encodeURIComponent(`${text} ${url}`);
  window.open(`https://wa.me/?text=${shareUrl}`, '_blank', 'noopener,noreferrer');
}

/**
 * Share to Facebook
 */
export function shareToFacebook(text: string, url: string): void {
  const shareUrl = encodeURIComponent(url);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank', 'noopener,noreferrer');
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(text: string, url: string): void {
  const shareText = encodeURIComponent(text);
  const shareUrl = encodeURIComponent(url);
  window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, '_blank', 'noopener,noreferrer');
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(text: string, url: string): void {
  const shareUrl = encodeURIComponent(url);
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank', 'noopener,noreferrer');
}

/**
 * Copy link to clipboard
 */
export async function copyLinkToClipboard(url: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }
  return false;
}

/**
 * Native Web Share API (fallback to clipboard if not available)
 * Accepts the same positional (text, url) shape as the platform helpers for consistency.
 */
export async function nativeShare(text: string, url: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    const shareNavigator = navigator as ShareNavigator;
    if (typeof shareNavigator.share === 'function') {
      try {
        await shareNavigator.share({ title: DEFAULT_SHARE_TEXT, text, url });
        return true;
      } catch (error) {
        // User cancelled or share failed
        console.log('Native share cancelled or failed:', error);
        return false;
      }
    }
  }
  return false;
}

/**
 * Generic share function that tries native share first, then clipboard fallback
 */
export async function shareContent(text: string, url: string): Promise<{ method: string; success: boolean }> {
  // Try native share first
  const nativeSuccess = await nativeShare(text, url);
  if (nativeSuccess) {
    return { method: 'native', success: true };
  }

  // Fallback to clipboard
  const clipboardSuccess = await copyLinkToClipboard(url);
  if (clipboardSuccess) {
    return { method: 'clipboard', success: true };
  }

  return { method: 'none', success: false };
}
