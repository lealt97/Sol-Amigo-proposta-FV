export async function generateSvgCoverImage(
  svgUrl: string, 
  template: any,
  proposal: any
): Promise<string | null> {
  try {
    const response = await fetch(svgUrl);
    let svgText = await response.text();
    
    // Replace colors
    svgText = svgText.replace(/var\(--primary-color, [^)]+\)/g, template.primary_color);
    svgText = svgText.replace(/var\(--secondary-color, [^)]+\)/g, template.secondary_color);
    svgText = svgText.replace(/var\(--accent-color, [^)]+\)/g, template.accent_color);
    svgText = svgText.replace(/var\(--background-color, [^)]+\)/g, template.background_color);
    
    // Helper to fetch and convert image to base64
    const urlToBase64 = async (url: string) => {
      if (!url) return '';
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Failed to load image for PDF cover:', url, e);
        return '';
      }
    };

    // Replace images with Base64 to prevent SVG external resource blocking & tainted canvas
    const logoSrc = template.logo_url ? await urlToBase64(template.logo_url) : '';
    const photoSrc = template.cover_photo_url ? await urlToBase64(template.cover_photo_url) : '';
    
    svgText = svgText.replace(/var\(--logo-url, '[^']*'\)/g, logoSrc);
    svgText = svgText.replace(/var\(--logo-url, ''\)/g, logoSrc);
    svgText = svgText.replace(/var\(--cover-photo-url, '[^']*'\)/g, photoSrc);
    svgText = svgText.replace(/var\(--cover-photo-url, ''\)/g, photoSrc);
    
    // Replace dynamic texts
    const clientName = proposal.client?.name || 'Cliente';
    const power = proposal.solar?.installed_power_kwp?.toFixed(2) || '0.00';
    const city = proposal.client?.city || 'Cidade';
    const state = proposal.client?.state || 'UF';
    const dateStr = new Date().toLocaleDateString('pt-BR');
    
    // The placeholder texts in the SVG:
    svgText = svgText.replace(/\[Nome do Cliente\]/g, clientName);
    svgText = svgText.replace(/\[Potência\]/g, power);
    svgText = svgText.replace(/\[Cidade\]/g, city);
    svgText = svgText.replace(/\[UF\]/g, state);
    svgText = svgText.replace(/\[Data da Proposta\]/g, dateStr);

    // Render to canvas to get a PNG data URL
    return new Promise((resolve, reject) => {
      // Must encode SVG text properly for data URL or Blob
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // SVG size is 794x1123 (A4 96dpi)
        canvas.width = 794;
        canvas.height = 1123;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          try {
            const pngUrl = canvas.toDataURL('image/png');
            URL.revokeObjectURL(url);
            resolve(pngUrl);
          } catch (e) {
            reject(new Error('Tainted canvas when rendering SVG'));
          }
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG into image'));
      };
      
      img.src = url;
    });

  } catch (err) {
    console.error('Error generating SVG cover image:', err);
    return null;
  }
}
