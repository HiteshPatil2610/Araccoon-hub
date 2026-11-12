type Toast = (kind: 'success' | 'error', message: string) => void;

/**
 * Shares a link: phones and tablets get the device share sheet; elsewhere the link is copied and a
 * toast says so. A visitor closing the share sheet is not an error.
 */
export async function shareLink(url: string, title: string, toast: Toast, copied: string) {
  try {
    if (typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast('success', copied);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return;
    toast('error', `Could not copy the link: ${url}`);
  }
}
