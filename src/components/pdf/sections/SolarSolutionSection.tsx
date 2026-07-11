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
  hero: {
    backgroundColor: '#eff6ff',
    borderLeft: '4px solid #3b82f6',
    padding: 18,
    borderRadius: 8,
    marginBottom: 18,
  },
  heroLabel: {
    fontSize: 10,
    color: '#2563eb',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  heroValue: {
    fontSize: 28,
    color: '#1e3a8a',
    fontWeight: 'bold',
  },
  heroText: {
    fontSize: 11,
    color: '#1e3a8a',
    lineHeight: 1.45,
    marginTop: 8,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181b',
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 10,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: 10,
    textAlign: 'center',
    paddingTop: 5,
    marginRight: 10,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 11,
    color: '#3f3f46',
    lineHeight: 1.45,
  },
});

const formatKwh = (val: number | null | undefined) => {
  if (val === null || val === undefined) return 'N/A';
  return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh`;
};

export const SolarSolutionSection = ({ proposal }: { proposal: Proposal }) => {
  const solar = proposal.solar;

  if (!solar) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Solução Fotovoltaica Proposta</Text>
        <Text style={styles.heroText}>Dados técnicos ainda não disponíveis.</Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Solução Fotovoltaica Proposta</Text>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Potência total instalada</Text>
        <Text style={styles.heroValue}>{solar.installed_power_kwp?.toFixed(2)} kWp</Text>
        <Text style={styles.heroText}>
          Sistema dimensionado para gerar aproximadamente {formatKwh(solar.estimated_monthly_generation_kwh)} por mês,
          considerando a irradiação solar local e o fator de rendimento informado.
        </Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Potência necessária</Text>
          <Text style={styles.cardValue}>{solar.required_power_kwp?.toFixed(2)} kWp</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Quantidade de módulos</Text>
          <Text style={styles.cardValue}>{solar.panel_count || 0} unidades</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Potência mínima do inversor</Text>
          <Text style={styles.cardValue}>{solar.min_inverter_power_kw?.toFixed(2)} kW</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Área estimada necessária</Text>
          <Text style={styles.cardValue}>{((solar.panel_count || 0) * 2.5).toFixed(0)} m²</Text>
        </View>
      </View>

      <Text style={styles.stepsTitle}>Como a solução foi dimensionada</Text>
      <View style={styles.step}>
        <Text style={styles.stepNumber}>1</Text>
        <Text style={styles.stepText}>Primeiro, o sistema identifica o consumo mensal e a meta de geração desejada para a proposta.</Text>
      </View>
      <View style={styles.step}>
        <Text style={styles.stepNumber}>2</Text>
        <Text style={styles.stepText}>Depois, calcula a potência necessária usando HSP, dias do mês e fator de rendimento do sistema.</Text>
      </View>
      <View style={styles.step}>
        <Text style={styles.stepNumber}>3</Text>
        <Text style={styles.stepText}>Por fim, ajusta a potência instalada conforme a quantidade inteira de módulos e a relação DC/AC do inversor.</Text>
      </View>
    </View>
  );
};
