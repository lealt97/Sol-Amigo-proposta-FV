import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { Proposal } from '../../../types/proposal';
import { SOLAR_SYSTEM_TYPE_LABELS } from '../../../types/solarKit';

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
  kitBox: {
    marginBottom: 18,
    padding: 14,
    backgroundColor: '#eff6ff',
    borderLeft: '4px solid #3b82f6',
    borderRadius: 8,
  },
  kitTitle: {
    fontSize: 12,
    color: '#1e3a8a',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kitText: {
    fontSize: 10,
    color: '#334155',
    lineHeight: 1.4,
  },
  hybridBox: {
    marginBottom: 18,
    padding: 14,
    backgroundColor: '#fef3c7',
    borderLeft: '4px solid #f59e0b',
    borderRadius: 8,
  },
  hybridTitle: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hybridText: {
    fontSize: 10,
    color: '#78350f',
    lineHeight: 1.4,
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

const formatMaybeNumber = (value: number | null | undefined, suffix: string) => {
  if (value == null || Number(value) <= 0) return null;
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${suffix}`;
};

export const EquipmentSection = ({ proposal }: { proposal: Proposal }) => {
  const solar = proposal.solar;
  const kit = proposal.solar_kit_snapshot || null;
  const systemType = kit?.system_type || proposal.system_type || 'on_grid';
  const hasStorage = systemType === 'hybrid' || systemType === 'off_grid';

  if (!solar) {
    return (
      <View>
        <Text style={styles.sectionTitle}>Sistema e Equipamentos</Text>
        <Text style={styles.intro}>Dados dos equipamentos ainda não disponíveis.</Text>
      </View>
    );
  }

  const moduleDescription = kit
    ? `${kit.module_quantity || 0} módulos ${kit.module_brand || ''} ${kit.module_model || ''} de ${kit.module_power_w || 0} W, totalizando ${Number(kit.kit_power_kwp || 0).toFixed(2)} kWp.`
    : `${solar.panel_count || 0} módulos de ${solar.panel_power_w || 0} W, totalizando ${solar.installed_power_kwp?.toFixed(2)} kWp instalados.`;

  const inverterDescription = kit
    ? `${kit.inverter_brand || 'Inversor'} ${kit.inverter_model || ''}${kit.inverter_power_kw ? ` de ${kit.inverter_power_kw} kW` : ''}.`
    : `Potência mínima recomendada de ${solar.min_inverter_power_kw?.toFixed(2)} kW, respeitando a relação DC/AC definida no dimensionamento.`;

  const structureDescription = kit?.structure_type
    ? `Estrutura de fixação para ${kit.structure_type}, conforme composição do kit escolhido.`
    : 'Estrutura compatível com o tipo de telhado/local de instalação, definida após conferência técnica do local.';

  const batteryCapacity = kit?.battery_capacity_kwh || proposal.battery_capacity_kwh;
  const usableBatteryCapacity = kit?.usable_battery_capacity_kwh || proposal.usable_battery_capacity_kwh;
  const backupPower = kit?.backup_power_kw || proposal.backup_power_kw;
  const autonomyHours = kit?.autonomy_hours || proposal.autonomy_hours;
  const essentialLoads = kit?.essential_loads_description || proposal.essential_loads_description;

  const rows = [
    ['Tipo de sistema', SOLAR_SYSTEM_TYPE_LABELS[systemType] || 'On-grid'],
    ['Módulos fotovoltaicos', moduleDescription],
    ['Inversor', inverterDescription],
    ['Estrutura de fixação', structureDescription],
    ['Proteções elétricas', 'Dispositivos de proteção, seccionamento, cabos, conectores e string box conforme necessidade do projeto executivo.'],
    ['Monitoramento', 'Sistema com possibilidade de acompanhamento da geração por aplicativo ou plataforma do fabricante do inversor.'],
  ];

  if (hasStorage) {
    rows.splice(3, 0,
      ['Banco de baterias', [
        formatMaybeNumber(batteryCapacity, 'kWh totais'),
        formatMaybeNumber(usableBatteryCapacity, 'kWh úteis'),
        kit?.battery_brand || null,
        kit?.battery_model || null,
      ].filter(Boolean).join(' · ') || 'Banco de baterias definido conforme projeto executivo.'],
      ['Backup e autonomia', [
        formatMaybeNumber(backupPower, 'kW de backup'),
        formatMaybeNumber(autonomyHours, 'h estimadas'),
        essentialLoads ? `Cargas essenciais: ${essentialLoads}` : null,
      ].filter(Boolean).join(' · ') || 'Backup para cargas essenciais, com autonomia estimada conforme perfil de uso.']
    );
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Sistema e Equipamentos</Text>
      <Text style={styles.intro}>
        A composição final dos equipamentos será confirmada no projeto executivo, respeitando disponibilidade de fornecedores,
        compatibilidade técnica e normas aplicáveis.
      </Text>

      {kit && (
        <View style={styles.kitBox}>
          <Text style={styles.kitTitle}>Kit solar selecionado: {kit.name}</Text>
          <Text style={styles.kitText}>
            {kit.supplier ? `Fornecedor: ${kit.supplier} · ` : ''}
            Tipo: {SOLAR_SYSTEM_TYPE_LABELS[kit.system_type || 'on_grid']} · Potência do kit: {Number(kit.kit_power_kwp || 0).toFixed(2)} kWp · Custo base: R$ {Number(kit.cost_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      )}

      {hasStorage && (
        <View style={styles.hybridBox}>
          <Text style={styles.hybridTitle}>Sistema com armazenamento e backup</Text>
          <Text style={styles.hybridText}>
            Esta proposta considera sistema {SOLAR_SYSTEM_TYPE_LABELS[systemType].toLowerCase()} com banco de baterias, inversor compatível e atendimento de cargas essenciais conforme escopo definido.
          </Text>
        </View>
      )}

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
