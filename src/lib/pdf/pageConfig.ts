import { PdfPageConfig } from '../../types/pdfModels';

export type PdfPageId = 'cover' | 'intro' | 'technical' | 'financial' | 'payback' | 'terms' | 'acceptance';

export const PDF_PAGE_DEFINITIONS: Array<{ id: PdfPageId; label: string; description: string; required?: boolean }> = [
  { id: 'cover', label: 'Capa', description: 'Capa comercial com modelo A4 e dados principais.', required: true },
  { id: 'intro', label: 'Resumo Executivo', description: 'Resumo da proposta e visão geral para o cliente.' },
  { id: 'technical', label: 'Dados Técnicos', description: 'Dimensionamento, potência, módulos e geração estimada.' },
  { id: 'financial', label: 'Investimento', description: 'Custos, preço final, desconto e margem.' },
  { id: 'payback', label: 'Payback', description: 'Retorno financeiro e economia estimada.' },
  { id: 'terms', label: 'Termos', description: 'Condições comerciais e observações da proposta.' },
  { id: 'acceptance', label: 'Aceite', description: 'Página de aprovação e assinatura do cliente.' },
];

export const DEFAULT_PDF_PAGE_ORDER = PDF_PAGE_DEFINITIONS.map(page => page.id);

export const DEFAULT_PDF_VISIBLE_PAGES = PDF_PAGE_DEFINITIONS.reduce<Record<string, boolean>>((acc, page) => {
  acc[page.id] = true;
  return acc;
}, {});

export function normalizePdfPageConfig(pageConfig?: Partial<PdfPageConfig> | null): PdfPageConfig {
  const incomingOrder = Array.isArray(pageConfig?.order) ? pageConfig?.order || [] : [];
  const knownIds = new Set(DEFAULT_PDF_PAGE_ORDER);
  const order = [
    ...incomingOrder.filter(pageId => knownIds.has(pageId as PdfPageId)),
    ...DEFAULT_PDF_PAGE_ORDER.filter(pageId => !incomingOrder.includes(pageId)),
  ];

  return {
    order,
    visiblePages: {
      ...DEFAULT_PDF_VISIBLE_PAGES,
      ...(pageConfig?.visiblePages || {}),
      cover: true,
    },
  };
}

export function getPdfPageLabel(pageId: string) {
  return PDF_PAGE_DEFINITIONS.find(page => page.id === pageId)?.label || pageId;
}

export function getPdfPageDescription(pageId: string) {
  return PDF_PAGE_DEFINITIONS.find(page => page.id === pageId)?.description || '';
}
