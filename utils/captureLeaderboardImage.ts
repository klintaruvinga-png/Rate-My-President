import html2canvas from 'html2canvas';

export interface CaptureOptions {
  disclaimer?: string;
  backgroundColor?: string;
}

export async function captureLeaderboardImage(
  element: HTMLElement,
  options: CaptureOptions = {}
): Promise<Blob> {
  const {
    disclaimer = 'Entertainment product. Reflects activity of app users only — not a scientific or representative poll.',
    backgroundColor = '#0d1b2a'
  } = options;

  // Create a wrapper to add disclaimer
  const wrapper = document.createElement('div');
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.backgroundColor = backgroundColor;
  wrapper.style.padding = '20px';
  wrapper.style.fontFamily = 'Inter, system-ui, sans-serif';
  
  // Clone the element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.width = element.offsetWidth + 'px';
  
  wrapper.appendChild(clone);
  
  // Add disclaimer footer
  const disclaimerEl = document.createElement('div');
  disclaimerEl.style.marginTop = '16px';
  disclaimerEl.style.paddingTop = '16px';
  disclaimerEl.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
  disclaimerEl.style.fontSize = '10px';
  disclaimerEl.style.color = 'rgba(255, 255, 255, 0.5)';
  disclaimerEl.style.textAlign = 'center';
  disclaimerEl.textContent = disclaimer;
  
  wrapper.appendChild(disclaimerEl);
  
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      backgroundColor,
      scale: 2,
      logging: false,
      useCORS: true,
    });

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

    if (!blob) throw new Error('Failed to create blob');
    return blob;
  } finally {
    document.body.removeChild(wrapper);
  }
}
