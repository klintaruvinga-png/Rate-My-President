/**
 * Social media sharing utilities for Rate My President
 */

export interface ShareContent {
  title: string;
  text: string;
  url: string;
}

const DEFAULT_SHARE_TEXT = 'Check out today\'s leaderboard on Rate My President!';

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp(content: ShareContent): void {
  const { text, url } = content;
  const shareUrl = encodeURIComponent(`${text} ${url}`);
  window.open(`https://wa.me/?text=${shareUrl}`, '_blank', 'noopener,noreferrer');
}

/**
 * Share to Facebook
 */
export function shareToFacebook(content: ShareContent): void {
  const { url } = content;
  const shareUrl = encodeURIComponent(url);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank', 'noopener,noreferrer');
}

/**
 * Share to Twitter/X
 */
export function shareToTwitter(content: ShareContent): void {
  const { text, url } = content;
  const shareText = encodeURIComponent(text);
  const shareUrl = encodeURIComponent(url);
  window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, '_blank', 'noopener,noreferrer');
}

/**
 * Share to LinkedIn
 */
export function shareToLinkedIn(content: ShareContent): void {
  const { url } = content;
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
 */
export async function nativeShare(content: ShareContent): Promise<boolean> {
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      await (navigator as ShareNavigator).share(content);
      return true;
    } catch (error) {
      // User cancelled or share failed
      console.log('Native share cancelled or failed:', error);
      return false;
    }
  }
  return false;
}

/**
 * Generic share function that tries native share first, then clipboard fallback
 */
export async function shareContent(content: ShareContent): Promise<{ method: string; success: boolean }> {
  // Try native share first
  const nativeSuccess = await nativeShare(content);
  if (nativeSuccess) {
    return { method: 'native', success: true };
  }

  // Fallback to clipboard
  const clipboardSuccess = await copyLinkToClipboard(content.url);
  if (clipboardSuccess) {
    return { method: 'clipboard', success: true };
  }

  return { method: 'none', success: false };
}
