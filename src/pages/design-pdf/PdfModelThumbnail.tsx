import React, { useEffect, useMemo, useState } from 'react';
import { PdfTemplatePreset, PdfUserModel } from '../../types/pdfModels';
import { pdfModelService } from '../../services/pdfModelService';
import { buildCoverSvg } from '../../lib/pdf/utils/coverSvgEngine';

interface PdfModelThumbnailProps {
  preset: PdfTemplatePreset;
  model?: PdfUserModel;
  className?: string;
}

export function PdfModelThumbnail({ preset, model, className = '' }: PdfModelThumbnailProps) {
  const [svgSource, setSvgSource] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSvg() {
      try {
        const text = await pdfModelService.getPresetSvgContent(preset.id);
        if (active) setSvgSource(text);
      } catch (error) {
        console.error('Erro ao carregar thumbnail do modelo PDF:', error);
        if (active) setSvgSource('');
      }
    }

    loadSvg();
    return () => {
      active = false;
    };
  }, [preset.id]);

  const svg = useMemo(() => {
    if (!svgSource) return '';

    return buildCoverSvg(
      svgSource,
      {
        current: model?.theme || preset.default_theme,
        original: preset.default_theme,
      },
      {
        clientName: 'Cliente Exemplo',
        powerKwp: '12,50 kWp',
        cityState: 'Cidade - UF',
        date: new Date().toLocaleDateString('pt-BR'),
        logoUrl: model?.logo_url,
        coverImageUrl: model?.cover_image_url,
        logoTransform: model?.logo_transform,
        coverImageTransform: model?.cover_image_transform,
      }
    );
  }, [svgSource, preset, model]);

  if (!svg) {
    return <div className={`w-full h-full flex items-center justify-center text-slate-400 ${className}`}>Carregando...</div>;
  }

  return (
    <div
      className={`w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
