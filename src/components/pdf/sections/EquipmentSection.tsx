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
  intro: {
    fontSize: 12,
    color: '#3f3f46',
    lineHeight: 1.5,
    marginBottom: 18,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  row: {
    flexDirection: 'row',
  },
  colHeader: {
    width: '36%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f4f4f5',
    padding: 9,
  },
  col: {
    width: '64%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 9,
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#3f3f46',
  },
  text: {
    fontSize: 10,
    color: '#52525b',
    lineHeight: 1.4,
  },
  noteBox: {
    marginTop: 18,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #94a3b8',
    borderRadius: 8,
  },
  note: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.4,
  },
});

export const EquipmentSection = ({ proposal }: { proposal: Proposal }) => {
  const solar = proposal.solar;

  if (!solar) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Sistema e Equipamentos</Text>
        <Text style={styles.intro}>Dados dos equipamentos ainda não disponíveis.</Text>
      </View>
    );
  }

  const rows = [
    ['Módulos fotovoltaicos', `${solar.panel_count || 0} módulos de ${solar.panel_power_w || 0} W, totalizando ${solar.installed_power_kwp?.toFixed(2)} kWp instalados.`],
    ['Inversor', `Potência mínima recomendada de ${solar.min_inverter_power_kw?.toFixed(2)} kW, respeitando a relação DC/AC definida no dimensionamento.`],
    ['Estrutura de fixação', 'Estrutura compatível com o tipo de telhado/local de instalação, definida após conferência técnica do local.'],
    ['Proteções elétricas', 'Dispositivos de proteção, seccionamento, cabos, conectores e string box conforme necessidade do projeto executivo.'],
    ['Monitoramento', 'Sistema com possibilidade de acompanhamento da geração por aplicativo ou plataforma do fabricante do inversor.'],
  ];

  return (
    <View>
      <Text style={styles.sectionTitle}>Sistema e Equipamentos</Text>
      <Text style={styles.intro}>
        A composição final dos equipamentos será confirmada no projeto executivo, respeitando disponibilidade de fornecedores,
        compatibilidade técnica e normas aplicáveis.
      </Text>

      <View style={styles.table}>
        {rows.map(([label, value]) => (
          <View style={styles.row} key={label}>
            <View style={styles.colHeader}>
              <Text style={styles.headerText}>{label}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.text}>{value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.noteBox}>
        <Text style={styles.note}>
          Observação: marcas, modelos e garantias específicas podem variar conforme o kit escolhido, estoque do distribuidor e aprovação final do cliente.
        </Text>
      </View>
    </View>
  );
};
