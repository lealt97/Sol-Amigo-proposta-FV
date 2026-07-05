import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { Proposal } from '../../../types/proposal';

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#18181b', // zinc-900
    borderBottom: '2px solid #3b82f6',
    paddingBottom: 5,
  },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: '#f4f4f5', // zinc-100
    padding: 15,
    borderRadius: 6,
    marginBottom: 15,
    borderLeft: '4px solid #3b82f6',
  },
  cardLabel: {
    fontSize: 10,
    color: '#71717a', // zinc-500
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
    color: '#10b981', // emerald-500
  },
  cardValueBlue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6', // blue-500
  },
  summaryText: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 1.5,
    marginTop: 20,
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
          <Text style={styles.cardLabel}>Retorno do Investimento (Payback)</Text>
          <Text style={styles.cardValue}>{solar.payback_formatted || 'N/A'}</Text>
        </View>
      </View>

      <Text style={styles.summaryText}>
        Este sistema foi dimensionado para atender o consumo médio mensal de {solar.projected_consumption_kwh?.toFixed(0)} kWh 
        (com base no consumo atual de {solar.monthly_consumption_kwh?.toFixed(0)} kWh e fator de segurança).
        A proposta considera uma tarifa de energia de {formatMoney(solar.energy_tariff)} por kWh.
      </Text>
    </View>
  );
};
