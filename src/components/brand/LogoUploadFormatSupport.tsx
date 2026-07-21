import { useEffect } from 'react';

const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,.svg';

type LogoUploadContext = 'first-use' | 'settings';

const CONTEXT_CONFIG: Record<LogoUploadContext, {
  inputId: string;
  currentCopy: string;
  svgCopy: string;
}> = {
  'first-use': {
    inputId: 'first-use-logo',
    currentCopy: 'Formatos PNG, JPG ou WebP. Após o primeiro upload, você já poderá continuar.',
    svgCopy: 'Formatos PNG, JPG, WebP ou SVG. Após o primeiro upload, você já poderá continuar.',
  },
  settings: {
    inputId: 'logo-upload',
    currentCopy: 'Suporta PNG e JPG de até 5MB. Você pode adicionar múltiplos logotipos.',
    svgCopy: 'Suporta PNG, JPG, WebP e SVG de até 5 MB. Você pode adicionar múltiplos logotipos.',
  },
};

function applySvgLogoSupport(context: LogoUploadContext) {
  const config = CONTEXT_CONFIG[context];
  const input = document.getElementById(config.inputId);

  if (input instanceof HTMLInputElement && input.accept !== LOGO_ACCEPT) {
    input.accept = LOGO_ACCEPT;
  }

  for (const paragraph of document.querySelectorAll('p')) {
    if (paragraph.textContent?.trim() === config.currentCopy) {
      paragraph.textContent = config.svgCopy;
      paragraph.dataset.logoFormatSupport = 'svg';
    }
  }
}

export function LogoUploadFormatSupport({ context }: { context: LogoUploadContext }) {
  useEffect(() => {
    const apply = () => applySvgLogoSupport(context);
    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [context]);

  return null;
}
