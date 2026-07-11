import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { Proposal } from '../../../types/proposal';
import { classificarPayback } from '../../../lib/calculations/payback';

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#18181b',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 5,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  card: {
    width: '48%',
    backgroundColor: '#f4f4f5',
    padding: 15,
    borderRadius: 6,
    marginBottom: 15,
    borderLeft: '4px solid #3b82f6',
  },
  cardLabel: {
    fontSize: 10,
    color: '#71717a',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18181b',
  },
  cardValueGreen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  cardValueBlue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  viabilityBox: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    marginBottom: 18,
  },
  viabilityLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  viabilityValue: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  viabilityDescription: {
    fontSize: 10,
    lineHeight: 1.35,
  },
  summaryText: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 1.5,
    marginTop: 12,
  }
});

const formatMoney = (val: number | null | undefined) => {
  if (val === null || val === undefined) return 'N/A';
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const ExecutiveSummary = ({ proposal }: { proposal: Proposal }) => {
  const solar = proposal.solar;

  if (!solar) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Resumo Executivo</Text>
        <Text style={styles.summaryText}>Dados solares não disponíveis.</Text>
      </View>
    );
  }

  const investimento = proposal.final_price || 0;
  const economiaAnual = solar.annual_savings || 0;
  const paybackDecimal = investimento > 0 && economiaAnual > 0 ? investimento / economiaAnual : null;
  const viability = classificarPayback(paybackDecimal);

  return (
    <View>
      <Text style={styles.sectionTitle}>Resumo Executivo</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Potência Instalada</Text>
          <Text style={styles.cardValue}>{solar.installed_power_kwp?.toFixed(2)} kWp</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Geração Média Mensal</Text>
          <Text style={styles.cardValueBlue}>{solar.estimated_monthly_generation_kwh?.toFixed(0)} kWh</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Economia Mensal Estimada</Text>
          <Text style={styles.cardValueGreen}>{formatMoney(solar.monthly_savings)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Economia Anual Estimada</Text>
          <Text style={styles.cardValueGreen}>{formatMoney(solar.annual_savings)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Investimento Total</Text>
          <Text style={styles.cardValue}>{formatMoney(proposal.final_price)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Retorno do Investimento</Text>
          <Text style={styles.cardValue}>{solar.payback_formatted || 'N/A'}</Text>
        </View>
      </View>

      <View style={[styles.viabilityBox, { backgroundColor: viability.backgroundColor, borderColor: viability.borderColor }]}> 
        <Text style={[styles.viabilityLabel, { color: viability.color }]}>Status de viabilidade</Text>
        <Text style={[styles.viabilityValue, { color: viability.color }]}>{viability.label}</Text>
        <Text style={[styles.viabilityDescription, { color: viability.color }]}>{viability.description}</Text>
      </View>

      <Text style={styles.summaryText}>
        Este sistema foi dimensionado para atender uma meta de geração de {solar.generation_target_percent?.toFixed(0)}%, com base no consumo mensal considerado de {solar.monthly_consumption_kwh?.toFixed(0)} kWh.
        A proposta utiliza tarifa estimada de {formatMoney(solar.energy_tariff)} por kWh para calcular economia e retorno financeiro.
      </Text>
    </View>
  );
};
