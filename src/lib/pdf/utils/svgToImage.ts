import { PdfUserModel } from '../../../types/pdfModels';
import { pdfModelService } from '../../../services/pdfModelService';

export async function generateSvgCoverImage(
  model: PdfUserModel,
  proposal: any
): Promise<string | null> {
  try {
    const preset = pdfModelService.getPreset(model.preset_id);
    if (!preset) return null;

    let svgText = preset.svg_content;

    // Replace colors
    svgText = svgText.replace(/var\(--pdf-primary\)/g, model.theme.primary);
    svgText = svgText.replace(/var\(--pdf-secondary\)/g, model.theme.secondary);
    svgText = svgText.replace(/var\(--pdf-accent\)/g, model.theme.accent);
    svgText = svgText.replace(/var\(--pdf-neutral\)/g, model.theme.neutral);

    // Helper to fetch and convert image to base64
    const urlToBase64 = async (url: string) => {
      if (!url) return '';
      if (url.startsWith('data:')) return url;
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

    // Parse SVG to manipulate elements
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');

    // Images
    const coverImage = doc.getElementById('cover-photo-image');
    if (coverImage) {
      if (model.cover_image_url) {
        const b64 = await urlToBase64(model.cover_image_url);
        coverImage.setAttribute('href', b64);
        
        const imgW = parseFloat(coverImage.getAttribute('width') || '794');
        const imgH = parseFloat(coverImage.getAttribute('height') || '600');
        const cx = imgW / 2;
        const cy = imgH / 2;
        const t = model.cover_image_transform;
        coverImage.setAttribute('transform', `translate(${t.x}, ${t.y}) translate(${cx}, ${cy}) scale(${t.zoom}) rotate(${t.rotate}) translate(${-cx}, ${-cy})`);
      }
    }

    const logoImage = doc.getElementById('company-logo');
    if (logoImage) {
      if (model.logo_url) {
        const b64 = await urlToBase64(model.logo_url);
        logoImage.setAttribute('href', b64);
        const lt = model.logo_transform;
        logoImage.setAttribute('transform', `translate(${lt.x}, ${lt.y}) scale(${lt.zoom})`);
      }
    }

    // Dynamic Texts
    const clientName = proposal.client?.name || 'Cliente';
    const power = proposal.solar?.installed_power_kwp?.toFixed(2) || '0.00';
    const city = proposal.client?.city || '';
    const state = proposal.client?.state || '';
    const dateStr = new Date().toLocaleDateString('pt-BR');

    const clientNode = doc.getElementById('client-name');
    if (clientNode) clientNode.textContent = clientNode.textContent?.replace('{client_name}', clientName) || clientName;

    const powerNode = doc.getElementById('project-power');
    if (powerNode) powerNode.textContent = powerNode.textContent?.replace('{power}', power) || `Potência: ${power} kWp`;

    const cityNode = doc.getElementById('city-state');
    if (cityNode) cityNode.textContent = cityNode.textContent?.replace('{city}', `${city} - ${state}`) || `${city} - ${state}`;

    const dateNode = doc.getElementById('proposal-date');
    if (dateNode) dateNode.textContent = dateNode.textContent?.replace('{date}', dateStr) || dateStr;

    const finalSvg = new XMLSerializer().serializeToString(doc);

    // Render to canvas to get a PNG data URL
    return new Promise((resolve, reject) => {
      const svgBlob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
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
