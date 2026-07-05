import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { Proposal } from '../../../types/proposal';

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#18181b',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 5,
  },
  highlightBox: {
    backgroundColor: '#eff6ff', // blue-50
    padding: 20,
    borderRadius: 8,
    borderLeft: '4px solid #3b82f6',
    marginBottom: 20,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#3b82f6',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  highlightValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a8a', // blue-900
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: '#f4f4f5',
    padding: 15,
    borderRadius: 6,
  },
  cardLabel: {
    fontSize: 10,
    color: '#71717a',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981', // emerald-500
  },
  discountText: {
    fontSize: 12,
    color: '#ef4444', // red-500
    marginTop: 10,
  },
  note: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 20,
    fontStyle: 'italic',
  }
});

const formatMoney = (val: number | null | undefined) => {
  if (val === null || val === undefined) return 'N/A';
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const FinancialSection = ({ proposal }: { proposal: Proposal }) => {
  const solar = proposal.solar;

  return (
    <View style={{ marginBottom: 40 }}>
      <Text style={styles.sectionTitle}>Investimento</Text>
      
      <View style={styles.highlightBox}>
        <Text style={styles.highlightLabel}>Investimento Total do Sistema</Text>
        <Text style={styles.highlightValue}>{formatMoney(proposal.final_price)}</Text>
        {proposal.discount_value && proposal.discount_value > 0 && (
          <Text style={styles.discountText}>* Inclui desconto especial de {formatMoney(proposal.discount_value)}</Text>
        )}
      </View>

      {solar && (
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Economia Estimada no Primeiro Ano</Text>
            <Text style={styles.cardValue}>{formatMoney(solar.annual_savings)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Economia Estimada em 25 Anos</Text>
            <Text style={styles.cardValue}>{formatMoney(solar.return_25_years)}</Text>
          </View>
        </View>
      )}

      <Text style={styles.note}>
        * Os valores de economia são projeções baseadas na tarifa atual e podem variar de acordo com o consumo real, condições climáticas e reajustes tarifários da concessionária.
      </Text>
    </View>
  );
};
