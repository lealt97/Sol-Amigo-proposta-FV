import React from 'react';
import { Document, Page, StyleSheet, Image } from '@react-pdf/renderer';
import { Proposal } from '../../types/proposal';
import { CoverPage } from './sections/CoverPage';
import { IntroLetterSection } from './sections/IntroLetterSection';
import { ExecutiveSummary } from './sections/ExecutiveSummary';
import { EnergyDiagnosisSection } from './sections/EnergyDiagnosisSection';
import { SolarSolutionSection } from './sections/SolarSolutionSection';
import { EquipmentSection } from './sections/EquipmentSection';
import { GenerationSection } from './sections/GenerationSection';
import { FinancialSection } from './sections/FinancialSection';
import { PaybackSection } from './sections/PaybackSection';
import { TermsSection } from './sections/TermsSection';
import { WarrantyAndNextStepsSection } from './sections/WarrantyAndNextStepsSection';
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

const PageSection = ({ children }: { children: React.ReactNode }) => (
  <Page size="A4" style={[styles.page, styles.section]}>
    {children}
  </Page>
);

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

      <PageSection>
        <IntroLetterSection proposal={proposal} />
      </PageSection>

      <PageSection>
        <ExecutiveSummary proposal={proposal} />
      </PageSection>

      <PageSection>
        <EnergyDiagnosisSection proposal={proposal} />
      </PageSection>

      <PageSection>
        <SolarSolutionSection proposal={proposal} />
      </PageSection>

      <PageSection>
        <EquipmentSection proposal={proposal} />
      </PageSection>

      <PageSection>
        <GenerationSection proposal={proposal} />
      </PageSection>

      <PageSection>
        <FinancialSection proposal={proposal} />
      </PageSection>

      <PageSection>
        <PaybackSection proposal={proposal} />
      </PageSection>

      <PageSection>
        <TermsSection proposal={proposal} />
      </PageSection>

      <PageSection>
        <WarrantyAndNextStepsSection proposal={proposal} />
        <AcceptanceSection proposal={proposal} />
      </PageSection>
    </Document>
  );
};
