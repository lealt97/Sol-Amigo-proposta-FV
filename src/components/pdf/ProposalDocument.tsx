import React from 'react';
import { Document, Page, StyleSheet, Image } from '@react-pdf/renderer';
import { Proposal } from '../../types/proposal';
import { CoverPage } from './sections/CoverPage';
import { ExecutiveSummary } from './sections/ExecutiveSummary';
import { TechnicalSection } from './sections/TechnicalSection';
import { FinancialSection } from './sections/FinancialSection';
import { PaybackSection } from './sections/PaybackSection';
import { TermsSection } from './sections/TermsSection';
import { AcceptanceSection } from './sections/AcceptanceSection';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    color: '#3f3f46',
    padding: 0,
  },
  section: {
    padding: 40,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
});

interface ProposalDocumentProps {
  proposal: Proposal;
  coverImage?: string | null;
}

export const ProposalDocument: React.FC<ProposalDocumentProps> = ({ proposal, coverImage }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {coverImage ? (
          <Image src={coverImage} style={styles.coverImage} />
        ) : (
          <CoverPage proposal={proposal} />
        )}
      </Page>
      
      <Page size="A4" style={[styles.page, styles.section]}>
        <ExecutiveSummary proposal={proposal} />
      </Page>
      
      <Page size="A4" style={[styles.page, styles.section]}>
        <TechnicalSection proposal={proposal} />
      </Page>
      
      <Page size="A4" style={[styles.page, styles.section]}>
        <FinancialSection proposal={proposal} />
        <PaybackSection proposal={proposal} />
      </Page>
      
      <Page size="A4" style={[styles.page, styles.section]}>
        <TermsSection proposal={proposal} />
        <AcceptanceSection proposal={proposal} />
      </Page>
    </Document>
  );
};
