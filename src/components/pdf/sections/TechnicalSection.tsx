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
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f4f4f5',
    padding: 8,
  },
  tableCol: {
    width: '50%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3f3f46',
  },
  tableCell: {
    fontSize: 10,
    color: '#52525b',
  },
  note: {
    fontSize: 10,
    color: '#71717a',
    marginTop: 20,
    fontStyle: 'italic',
  }
});

export const TechnicalSection = ({ proposal }: { proposal: Proposal }) => {
  const solar = proposal.solar;

  if (!solar) return null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Solução Técnica</Text>
      
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Especificação</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Detalhes</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Potência de Cada Painel</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{solar.panel_power_w} W</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Quantidade de Painéis</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{solar.panel_count} unidades</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Potência Total Instalada</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{solar.installed_power_kwp?.toFixed(2)} kWp</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Inversor Recomendado (Mínimo)</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{solar.min_inverter_power_kw?.toFixed(2)} kW</Text>
          </View>
        </View>

        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Área Estimada Necessária</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{((solar.panel_count || 0) * 2.5).toFixed(0)} m²</Text>
          </View>
        </View>
        
        <View style={styles.tableRow}>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>Índice de Irradiação (HSP)</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={styles.tableCell}>{solar.hsp?.toFixed(2)} kWh/m².dia</Text>
          </View>
        </View>
      </View>

      <Text style={styles.note}>
        * A área estimada considera 2,5 m² por painel, incluindo espaçamento. A definição exata da estrutura de fixação será feita após visita técnica no local.
      </Text>
    </View>
  );
};
