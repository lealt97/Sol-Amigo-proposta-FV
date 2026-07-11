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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  card: {
    width: '48%',
    backgroundColor: '#f8fafc',
    border: '1px solid #e4e4e7',
    padding: 14,
    borderRadius: 8,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 9,
    color: '#71717a',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18181b',
  },
  cardValueBlue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  cardValueGreen: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  formulaBox: {
    backgroundColor: '#f4f4f5',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  formulaTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 8,
  },
  formulaText: {
    fontSize: 11,
    color: '#3f3f46',
    lineHeight: 1.45,
  },
  note: {
    fontSize: 10,
    color: '#71717a',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
});

const formatKwh = (val: number | null | undefined) => {
  if (val === null || val === undefined) return 'N/A';
  return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh`;
};

export const GenerationSection = ({ proposal }: { proposal: Proposal }) => {
  const solar = proposal.solar;

  if (!solar) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Estimativa de Geração</Text>
        <Text style={styles.note}>Dados de geração ainda não disponíveis.</Text>
      </View>
    );
  }

  const balanceLabel = (solar.excess_kwh || 0) >= 0 ? 'Saldo estimado positivo' : 'Déficit estimado';

  return (
    <View>
      <Text style={styles.sectionTitle}>Estimativa de Geração</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Geração mensal estimada</Text>
          <Text style={styles.cardValueBlue}>{formatKwh(solar.estimated_monthly_generation_kwh)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Consumo mensal considerado</Text>
          <Text style={styles.cardValue}>{formatKwh(solar.monthly_consumption_kwh)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Meta de geração</Text>
          <Text style={styles.cardValue}>{solar.generation_target_percent?.toFixed(0)}%</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{balanceLabel}</Text>
          <Text style={(solar.excess_kwh || 0) >= 0 ? styles.cardValueGreen : styles.cardValue}>{formatKwh(solar.excess_kwh)}</Text>
        </View>
      </View>

      <View style={styles.formulaBox}>
        <Text style={styles.formulaTitle}>Base de cálculo utilizada</Text>
        <Text style={styles.formulaText}>
          Geração mensal estimada = potência instalada ({solar.installed_power_kwp?.toFixed(2)} kWp) × HSP ({solar.hsp?.toFixed(2)}) × 30 dias × fator de rendimento ({solar.yield_factor?.toFixed(2)}).
        </Text>
      </View>

      <Text style={styles.note}>
        A geração apresentada é uma estimativa média. A geração real pode variar conforme orientação dos módulos, sombreamento,
        temperatura, perdas elétricas, limpeza dos módulos, clima e disponibilidade da rede da concessionária.
      </Text>
    </View>
  );
};
