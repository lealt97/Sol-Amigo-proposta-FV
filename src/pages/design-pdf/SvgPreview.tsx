import React, { useEffect, useState } from 'react';

interface SvgPreviewProps {
  svgUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  logoUrl: string;
  coverPhotoUrl: string;
}

export function SvgPreview({
  svgUrl,
  primaryColor,
  secondaryColor,
  accentColor,
  backgroundColor,
  logoUrl,
  coverPhotoUrl
}: SvgPreviewProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSvg() {
      if (!svgUrl) {
        setSvgContent(null);
        return;
      }
      try {
        const response = await fetch(svgUrl);
        let text = await response.text();
        
        // Em um ambiente de produção real, as variáveis CSS podem não funcionar corretamente em renderizadores de PDF,
        // então poderíamos substituir os valores diretamente no SVG text, mas para a preview web:
        // podemos usar variáveis CSS ou substituir diretamente.
        // Vamos substituir as URLs de imagem para garantir.
        
        if (logoUrl) {
           text = text.replace(/var\(--logo-url, '[^']*'\)/g, logoUrl);
           text = text.replace(/var\(--logo-url, ''\)/g, logoUrl);
        }
        
        if (coverPhotoUrl) {
           text = text.replace(/var\(--cover-photo-url, '[^']*'\)/g, coverPhotoUrl);
           text = text.replace(/var\(--cover-photo-url, ''\)/g, coverPhotoUrl);
        }
        
        setSvgContent(text);
      } catch (error) {
        console.error('Error fetching SVG:', error);
        setSvgContent('<div class="p-4 text-red-400">Erro ao carregar template SVG</div>');
      }
    }
    
    fetchSvg();
  }, [svgUrl, logoUrl, coverPhotoUrl]);

  if (!svgContent) {
    return <div className="text-slate-500">Nenhum template selecionado</div>;
  }

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-auto p-4"
      style={{
        // Define as variáveis CSS no container que abriga o SVG
        '--primary-color': primaryColor,
        '--secondary-color': secondaryColor,
        '--accent-color': accentColor,
        '--background-color': backgroundColor,
      } as React.CSSProperties}
    >
      <div 
        className="shadow-2xl border border-brand-border bg-white max-w-full max-h-full aspect-[1/1.414]"
        style={{ width: 'auto', height: '100%', minHeight: '600px' }}
        dangerouslySetInnerHTML={{ __html: svgContent }} 
      />
    </div>
  );
}
