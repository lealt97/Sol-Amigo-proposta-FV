import React, { useMemo } from 'react';
import { PdfUserModel } from '../../types/pdfModels';
import { pdfModelService } from '../../services/pdfModelService';

interface PdfPreviewProps {
  model: PdfUserModel;
}

export function PdfPreview({ model }: PdfPreviewProps) {
  const preset = useMemo(() => pdfModelService.getPreset(model.preset_id), [model.preset_id]);

  const finalSvgContent = useMemo(() => {
    if (!preset) return '';

    let svg = preset.svg_content;

    // Apply colors
    svg = svg.replace(/var\(--pdf-primary\)/g, model.theme.primary);
    svg = svg.replace(/var\(--pdf-secondary\)/g, model.theme.secondary);
    svg = svg.replace(/var\(--pdf-accent\)/g, model.theme.accent);
    svg = svg.replace(/var\(--pdf-neutral\)/g, model.theme.neutral);

    // Parse SVG to manipulate elements safely (for browser)
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, 'image/svg+xml');

    // Setup Cover Image
    const coverImage = doc.getElementById('cover-photo-image');
    if (coverImage) {
      if (model.cover_image_url) {
        coverImage.setAttribute('href', model.cover_image_url);
        
        // Apply transform
        const imgW = parseFloat(coverImage.getAttribute('width') || '794');
        const imgH = parseFloat(coverImage.getAttribute('height') || '600');
        const cx = imgW / 2;
        const cy = imgH / 2;
        const t = model.cover_image_transform;
        // Basic transform approximation
        coverImage.setAttribute('transform', `translate(${t.x}, ${t.y}) translate(${cx}, ${cy}) scale(${t.zoom}) rotate(${t.rotate}) translate(${-cx}, ${-cy})`);
      } else {
        // Fallback or hide
        coverImage.setAttribute('href', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
      }
    }

    // Replace text placeholders for preview
    const clientName = doc.getElementById('client-name');
    if (clientName) clientName.textContent = 'Cliente Exemplo Ltda';

    const projectPower = doc.getElementById('project-power');
    if (projectPower) projectPower.textContent = 'Potência: 12.5 kWp';

    const cityState = doc.getElementById('city-state');
    if (cityState) cityState.textContent = 'São Paulo, SP';

    const proposalDate = doc.getElementById('proposal-date');
    if (proposalDate) proposalDate.textContent = new Date().toLocaleDateString('pt-BR');

    // Setup Logo (if applicable, though in my basic preset I just used text for company name)
    // If there is a logo image element
    const logoImage = doc.getElementById('company-logo');
    if (logoImage) {
      if (model.logo_url) {
        logoImage.setAttribute('href', model.logo_url);
        const lt = model.logo_transform;
        logoImage.setAttribute('transform', `translate(${lt.x}, ${lt.y}) scale(${lt.zoom})`);
      }
    }

    return new XMLSerializer().serializeToString(doc);
  }, [preset, model]);

  if (!preset) return <div className="text-slate-500">Preset não encontrado.</div>;

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div 
        className="shadow-2xl border border-brand-border bg-white max-w-full max-h-full aspect-[1/1.414]"
        style={{ width: 'auto', height: '100%', minHeight: '500px' }}
        dangerouslySetInnerHTML={{ __html: finalSvgContent }}
      />
    </div>
  );
}
