import React, { createContext, useContext } from 'react';
import { PdfTheme } from '../../types/pdfModels';

export interface PdfDocumentTheme {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  text: string;
  muted: string;
  surface: string;
  border: string;
  primarySoft: string;
  secondarySoft: string;
  accentSoft: string;
}

const DEFAULT_THEME: PdfDocumentTheme = {
  primary: '#0A2249',
  secondary: '#C49133',
  accent: '#FACB5C',
  neutral: '#1F2A2A',
  text: '#3f3f46',
  muted: '#71717a',
  surface: '#f8fafc',
  border: '#e4e4e7',
  primarySoft: '#eff6ff',
  secondarySoft: '#fff7ed',
  accentSoft: '#fef9c3',
};

export function resolvePdfDocumentTheme(theme?: Partial<PdfTheme> | null): PdfDocumentTheme {
  return {
    ...DEFAULT_THEME,
    primary: theme?.primary || DEFAULT_THEME.primary,
    secondary: theme?.secondary || DEFAULT_THEME.secondary,
    accent: theme?.accent || DEFAULT_THEME.accent,
    neutral: theme?.neutral || DEFAULT_THEME.neutral,
  };
}

const PdfThemeContext = createContext<PdfDocumentTheme>(DEFAULT_THEME);

export const PdfThemeProvider = ({
  theme,
  children,
}: {
  theme?: Partial<PdfTheme> | null;
  children: React.ReactNode;
}) => {
  return (
    <PdfThemeContext.Provider value={resolvePdfDocumentTheme(theme)}>
      {children}
    </PdfThemeContext.Provider>
  );
};

export function usePdfTheme() {
  return useContext(PdfThemeContext);
}

export function getSectionTitleStyle(theme: PdfDocumentTheme) {
  return {
    color: theme.neutral,
    borderBottomColor: theme.primary,
  };
}

export function getPrimaryAccentStyle(theme: PdfDocumentTheme) {
  return {
    borderLeftColor: theme.primary,
    color: theme.primary,
  };
}
