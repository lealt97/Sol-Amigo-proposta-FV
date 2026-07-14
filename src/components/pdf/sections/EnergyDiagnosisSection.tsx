import React from 'react';
import { View, Text, StyleSheet, Image, Svg, Line, G, Path, Text as SvgText } from '@react-pdf/renderer';
import { Proposal } from '../../../types/proposal';
import { DEFAULT_ROOF_LAYOUT_STRINGS, RoofLayoutData, RoofLayoutModule, RoofLayoutPerspective } from '../../../types/roofLayout';
import { getSectionTitleStyle, usePdfTheme } from '../pdfTheme';

const DEFAULT_PERSPECTIVE: RoofLayoutPerspective = {
  topLeftX: 0,
  topLeftY: 0,
  topRightX: 0,
  topRightY: 0,
  bottomRightX: 0,
  bottomRightY: 0,
  bottomLeftX: 0,
  bottomLeftY: 0,
};

const PERSPECTIVE_LIMIT = 45;
const MODULE_VIEWBOX_WIDTH = 16;
const MODULE_VIEWBOX_HEIGHT = 31;

type PdfPoint = { x: number; y: number };

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#18181b', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: '#3b82f6', paddingBottom: 5 },
  intro: { fontSize: 12, color: '#3f3f46', lineHeight: 1.5, marginBottom: 18 },
  grid: { display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  card: { width: '48%', backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderStyle: 'solid', borderColor: '#e4e4e7' },
  cardLabel: { fontSize: 9, color: '#71717a', textTransform: 'uppercase', marginBottom: 4 },
  cardValue: { fontSize: 17, fontWeight: 'bold', color: '#18181b' },
  roofSectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#18181b', marginBottom: 8, marginTop: 4 },
  roofInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  roofInfoCard: { width: '48%', backgroundColor: '#f8fafc', borderWidth: 1, borderStyle: 'solid', borderColor: '#e4e4e7', borderRadius: 8, padding: 9, marginBottom: 8 },
  roofInfoLabel: { fontSize: 8, color: '#71717a', textTransform: 'uppercase', marginBottom: 3 },
  roofInfoValue: { fontSize: 11, fontWeight: 'bold', color: '#18181b' },
  roofStatusBox: { borderRadius: 8, borderWidth: 1, borderStyle: 'solid', padding: 9, marginBottom: 10 },
  roofStatusText: { fontSize: 9, lineHeight: 1.35 },
  roofPlanningBox: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  roofImageBox: { width: '58%', height: 174, backgroundColor: '#f8fafc', borderWidth: 1, borderStyle: 'dashed', borderColor: '#94a3b8', borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' },
  roofImageLayer: { width: '100%', height: '100%', position: 'relative' },
  roofImage: { width: '100%', height: '100%', objectFit: 'cover' },
  roofOverlay: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
  placeholder: { padding: 14 },
  placeholderTitle: { fontSize: 12, fontWeight: 'bold', color: '#334155', marginBottom: 6, textAlign: 'center' },
  placeholderText: { fontSize: 9, color: '#64748b', lineHeight: 1.4, textAlign: 'center' },
  modulePlanBox: { width: '38%', height: 174, backgroundColor: '#f8fafc', borderWidth: 1, borderStyle: 'solid', borderColor: '#e4e4e7', borderRadius: 8, padding: 10 },
  planTitle: { fontSize: 10, fontWeight: 'bold', color: '#18181b', marginBottom: 6 },
  planSvg: { width: '100%', height: 92, borderRadius: 4 },
  overlayPlanSvg: { width: '100%', height: '100%' },
  legend: { marginTop: 7 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  legendDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  legendText: { fontSize: 8, color: '#52525b' },
  planNote: { fontSize: 7, color: '#71717a', lineHeight: 1.25, marginTop: 4 },
  objectiveBox: { backgroundColor: '#ecfdf5', borderLeftWidth: 4, borderLeftStyle: 'solid', borderLeftColor: '#10b981', padding: 16, borderRadius: 8, marginTop: 6 },
  objectiveTitle: { fontSize: 12, fontWeight: 'bold', color: '#047857', marginBottom: 6 },
  objectiveText: { fontSize: 11, color: '#065f46', lineHeight: 1.45 },
  note: { fontSize: 10, color: '#71717a', marginTop: 16, lineHeight: 1.4, fontStyle: 'italic' },
});

const formatMoney = (val: number | null | undefined) => {
  if (val === null || val === undefined) return 'N/A';
  return 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatKwh = (val: number | null | undefined) => {
  if (val === null || val === undefined) return 'N/A';
  return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kWh`;
};

const formatArea = (val: number | null | undefined) => {
  if (val === null || val === undefined || val <= 0) return 'A definir';
  return `${val.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const round = (value: number) => Number(value.toFixed(2));

const sourceLabel: Record<string, string> = {
  average: 'Consumo médio informado',
  historical: 'Histórico de consumo',
  load_survey: 'Levantamento de cargas',
};

function normalizePerspective(value?: Partial<RoofLayoutPerspective> | null): RoofLayoutPerspective {
  return {
    ...DEFAULT_PERSPECTIVE,
    ...value,
  };
}

function buildFallbackLayout(moduleCount: number): RoofLayoutData {
  const count = Math.min(Math.max(moduleCount || 8, 4), 24);
  const strings = DEFAULT_ROOF_LAYOUT_STRINGS.slice(0, 2);
  const modules: RoofLayoutModule[] = Array.from({ length: count }).map((_, index) => ({
    id: `fallback-${index}`,
    x: 8 + (index % 4) * 21,
    y: 12 + Math.floor(index / 4) * 18,
    width: 10,
    height: 15,
    rotation: 0,
    skewX: 0,
    skewY: 0,
    perspective: DEFAULT_PERSPECTIVE,
    stringId: strings[index % strings.length].id,
  }));

  return { version: 1, modules, strings };
}

function getStringColor(layout: RoofLayoutData, stringId: string, fallback: string) {
  return layout.strings.find((string) => string.id === stringId)?.color || fallback;
}

function getNormalizedModule(module: RoofLayoutModule): RoofLayoutModule {
  return {
    ...module,
    width: module.width || 10,
    height: module.height || 15,
    rotation: module.rotation || 0,
    skewX: module.skewX || 0,
    skewY: module.skewY || 0,
    perspective: normalizePerspective(module.perspective),
  };
}

function getModulePerspectivePoints(module: RoofLayoutModule): PdfPoint[] {
  const perspective = normalizePerspective(module.perspective);
  const toX = (value: number) => (value / 100) * module.width;
  const toY = (value: number) => (value / 100) * module.height;

  return [
    { x: toX(clamp(perspective.topLeftX, -PERSPECTIVE_LIMIT, PERSPECTIVE_LIMIT)), y: toY(clamp(perspective.topLeftY, -PERSPECTIVE_LIMIT, PERSPECTIVE_LIMIT)) },
    { x: toX(clamp(100 + perspective.topRightX, 100 - PERSPECTIVE_LIMIT, 100 + PERSPECTIVE_LIMIT)), y: toY(clamp(perspective.topRightY, -PERSPECTIVE_LIMIT, PERSPECTIVE_LIMIT)) },
    { x: toX(clamp(100 + perspective.bottomRightX, 100 - PERSPECTIVE_LIMIT, 100 + PERSPECTIVE_LIMIT)), y: toY(clamp(100 + perspective.bottomRightY, 100 - PERSPECTIVE_LIMIT, 100 + PERSPECTIVE_LIMIT)) },
    { x: toX(clamp(perspective.bottomLeftX, -PERSPECTIVE_LIMIT, PERSPECTIVE_LIMIT)), y: toY(clamp(100 + perspective.bottomLeftY, 100 - PERSPECTIVE_LIMIT, 100 + PERSPECTIVE_LIMIT)) },
  ];
}

function formatPoint(point: PdfPoint) {
  return `${point.x} ${point.y}`;
}

function mapOriginalModulePoint(points: PdfPoint[], x: number, y: number): PdfPoint {
  const u = x / MODULE_VIEWBOX_WIDTH;
  const v = y / MODULE_VIEWBOX_HEIGHT;
  const topLeft = points[0];
  const topRight = points[1];
  const bottomRight = points[2];
  const bottomLeft = points[3];

  const top = {
    x: topLeft.x + (topRight.x - topLeft.x) * u,
    y: topLeft.y + (topRight.y - topLeft.y) * u,
  };
  const bottom = {
    x: bottomLeft.x + (bottomRight.x - bottomLeft.x) * u,
    y: bottomLeft.y + (bottomRight.y - bottomLeft.y) * u,
  };

  return {
    x: round(top.x + (bottom.x - top.x) * v),
    y: round(top.y + (bottom.y - top.y) * v),
  };
}

function buildOriginalSvgDeformedPaths(points: PdfPoint[]) {
  const map = (x: number, y: number) => mapOriginalModulePoint(points, x, y);
  const p = (x: number, y: number) => formatPoint(map(x, y));

  const black = [
    `M ${p(7.93432, 14.0423)}`,
    `L ${p(0.770895, 1.79815)}`,
    `L ${p(0.770895, 30.2416)}`,
    `L ${p(15.2291, 30.2416)}`,
    `L ${p(15.2291, 1.77802)}`,
    `L ${p(7.93432, 14.0423)}`,
    'Z',
    `M ${p(16, 31)}`,
    `L ${p(0, 31)}`,
    `L ${p(0, 0)}`,
    `L ${p(16, 0)}`,
    `L ${p(16, 31)}`,
    'Z',
  ].join(' ');

  const accent = [
    `M ${p(0.770895, 1.79815)}`,
    `L ${p(0.770895, 30.2416)}`,
    `L ${p(15.2291, 30.2416)}`,
    `L ${p(15.2291, 1.77802)}`,
    `L ${p(7.93432, 14.0423)}`,
    `L ${p(0.770895, 1.79815)}`,
    'Z',
  ].join(' ');

  return {
    black,
    accent,
    label: map(7.93432, 26.8),
    center: map(7.93432, 14.0423),
  };
}

function pathFromPoints(points: PdfPoint[]) {
  return `M ${formatPoint(points[0])} L ${formatPoint(points[1])} L ${formatPoint(points[2])} L ${formatPoint(points[3])} Z`;
}

function RoofPlanSvg({ layout, showLabels = false, overlay = false }: { layout: RoofLayoutData; showLabels?: boolean; overlay?: boolean }) {
  const modules = (layout.modules || []).map(getNormalizedModule);
  const strings = layout.strings?.length ? layout.strings : DEFAULT_ROOF_LAYOUT_STRINGS;

  return (
    <Svg style={overlay ? styles.overlayPlanSvg : styles.planSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
      {strings.map((string) => {
        const stringModules = modules.filter((module) => module.stringId === string.id);
        return stringModules.slice(1).map((module, index) => {
          const previous = stringModules[index];
          const x1 = previous.x + previous.width / 2;
          const y1 = previous.y + previous.height / 2;
          const x2 = module.x + module.width / 2;
          const y2 = module.y + module.height / 2;

          return <Line key={`${string.id}-${module.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={string.color} strokeWidth={0.45} strokeDasharray="1 0.8" />;
        });
      })}

      {modules.map((module, index) => {
        const color = getStringColor(layout, module.stringId, '#B8B608');
        const moduleTransform = `translate(${module.x} ${module.y}) rotate(${module.rotation} ${module.width / 2} ${module.height / 2}) skewX(${module.skewX}) skewY(${module.skewY})`;
        const perspectivePoints = getModulePerspectivePoints(module);
        const paths = buildOriginalSvgDeformedPaths(perspectivePoints);

        return (
          <G key={module.id} transform={moduleTransform}>
            <Path d={paths.black} fill="#000000" />
            <Path d={paths.accent} fill={color} />
            {showLabels && (
              <SvgText x={paths.label.x} y={paths.label.y} fontSize={3} textAnchor="middle" fill="#000000">
                {index + 1}
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

export const EnergyDiagnosisSection = ({ proposal }: { proposal: Proposal }) => {
  const theme = usePdfTheme();
  const solar = proposal.solar;
  const generationTarget = solar?.generation_target_percent || 100;
  const roofImageUrl = proposal.roof_image_url || proposal.roof_photo_url || proposal.roof_plan_image_url || null;
  const roofType = proposal.roof_type || 'A definir';
  const savedLayout = proposal.roof_layout_json;
  const hasSavedLayout = !!savedLayout?.modules?.length;
  const layout = hasSavedLayout ? savedLayout : buildFallbackLayout(solar?.panel_count || 8);
  const moduleWidthM = proposal.module_width_m || 1.13;
  const moduleHeightM = proposal.module_height_m || 2.28;
  const moduleArea = moduleWidthM * moduleHeightM;
  const occupiedArea = moduleArea * (layout.modules?.length || solar?.panel_count || 0);
  const roofArea = proposal.roof_area_m2 || 0;
  const hasAreaWarning = roofArea > 0 && occupiedArea > roofArea;
  const roofAreaStatus = roofArea <= 0
    ? 'Área útil ainda não informada. A validação final deve ser confirmada na visita técnica.'
    : hasAreaWarning
      ? 'A área ocupada estimada ultrapassa a área útil informada. Revise quantidade, dimensões ou área disponível.'
      : 'Área útil compatível com a quantidade de módulos posicionada na planimetria.';
  const stringsWithModules = layout.strings.filter((string) => layout.modules.some((module) => module.stringId === string.id));

  return (
    <View>
      <Text style={[styles.sectionTitle, getSectionTitleStyle(theme)]}>Diagnóstico Energético</Text>
      <Text style={styles.intro}>Esta etapa resume a situação de consumo considerada no dimensionamento e os dados usados para estimar a economia do sistema.</Text>

      <View style={styles.grid}>
        <View style={[styles.card, { borderColor: theme.border }]}> 
          <Text style={styles.cardLabel}>Método de consumo</Text>
          <Text style={[styles.cardValue, { color: theme.neutral }]}>{sourceLabel[proposal.consumption_source || 'average'] || 'Consumo informado'}</Text>
        </View>
        <View style={[styles.card, { borderColor: theme.border }]}> 
          <Text style={styles.cardLabel}>Consumo mensal considerado</Text>
          <Text style={[styles.cardValue, { color: theme.neutral }]}>{formatKwh(solar?.monthly_consumption_kwh || proposal.monthly_consumption_kwh)}</Text>
        </View>
        <View style={[styles.card, { borderColor: theme.border }]}> 
          <Text style={styles.cardLabel}>Valor médio da conta</Text>
          <Text style={[styles.cardValue, { color: theme.neutral }]}>{formatMoney(proposal.bill_amount || solar?.current_bill_value)}</Text>
        </View>
        <View style={[styles.card, { borderColor: theme.border }]}> 
          <Text style={styles.cardLabel}>Tarifa estimada</Text>
          <Text style={[styles.cardValue, { color: theme.neutral }]}>{formatMoney(proposal.energy_tariff || solar?.energy_tariff)}/kWh</Text>
        </View>
      </View>

      <Text style={[styles.roofSectionTitle, { color: theme.neutral }]}>Local de instalação e planimetria dos módulos</Text>

      <View style={styles.roofInfoGrid}>
        <View style={[styles.roofInfoCard, { borderColor: theme.border }]}> 
          <Text style={styles.roofInfoLabel}>Tipo de telhado/local</Text>
          <Text style={[styles.roofInfoValue, { color: theme.neutral }]}>{roofType}</Text>
        </View>
        <View style={[styles.roofInfoCard, { borderColor: theme.border }]}> 
          <Text style={styles.roofInfoLabel}>Área útil informada</Text>
          <Text style={[styles.roofInfoValue, { color: theme.neutral }]}>{formatArea(proposal.roof_area_m2)}</Text>
        </View>
        <View style={[styles.roofInfoCard, { borderColor: theme.border }]}> 
          <Text style={styles.roofInfoLabel}>Dimensão do módulo</Text>
          <Text style={[styles.roofInfoValue, { color: theme.neutral }]}>{moduleWidthM.toFixed(2)} × {moduleHeightM.toFixed(2)} m</Text>
        </View>
        <View style={[styles.roofInfoCard, { borderColor: theme.border }]}> 
          <Text style={styles.roofInfoLabel}>Área ocupada estimada</Text>
          <Text style={[styles.roofInfoValue, { color: theme.neutral }]}>{formatArea(occupiedArea)}</Text>
        </View>
      </View>

      <View style={[styles.roofStatusBox, { borderColor: hasAreaWarning ? '#f97316' : theme.border, backgroundColor: hasAreaWarning ? '#fff7ed' : '#f8fafc' }]}> 
        <Text style={[styles.roofStatusText, { color: hasAreaWarning ? '#9a3412' : theme.neutral }]}>{roofAreaStatus}</Text>
      </View>

      <View style={styles.roofPlanningBox}>
        <View style={[styles.roofImageBox, { borderColor: theme.primary }]}> 
          {roofImageUrl ? (
            <View style={styles.roofImageLayer}>
              <Image src={roofImageUrl} style={styles.roofImage} />
              {hasSavedLayout && (
                <View style={styles.roofOverlay}>
                  <RoofPlanSvg layout={layout} showLabels overlay />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={[styles.placeholderTitle, { color: theme.neutral }]}>Espaço para foto do telhado do cliente</Text>
              <Text style={styles.placeholderText}>Área reservada para inserir a imagem real do local de instalação, com visão do telhado ou área onde os módulos serão posicionados.</Text>
            </View>
          )}
        </View>

        <View style={[styles.modulePlanBox, { borderColor: theme.border }]}> 
          <Text style={[styles.planTitle, { color: theme.neutral }]}>Strings e módulos</Text>
          <RoofPlanSvg layout={layout} showLabels />
          <View style={styles.legend}>
            {stringsWithModules.slice(0, 4).map((string) => {
              const count = layout.modules.filter((module) => module.stringId === string.id).length;
              return (
                <View key={string.id} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: string.color }]} />
                  <Text style={styles.legendText}>{string.name}: {count} módulos</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.planNote}>Representação da planimetria criada no editor. A posição final depende da visita técnica, orientação, sombreamento e estrutura.</Text>
        </View>
      </View>

      <View style={[styles.objectiveBox, { backgroundColor: theme.secondarySoft, borderLeftColor: theme.secondary }]}> 
        <Text style={[styles.objectiveTitle, { color: theme.secondary }]}>Objetivo da solução</Text>
        <Text style={[styles.objectiveText, { color: theme.neutral }]}>Dimensionar um sistema fotovoltaico capaz de atender aproximadamente {generationTarget.toFixed(0)}% do consumo considerado, respeitando os parâmetros técnicos de irradiação solar, rendimento, potência dos módulos e relação DC/AC do inversor.</Text>
      </View>

      <Text style={styles.note}>Observação: valores de consumo, tarifa e economia podem variar conforme hábitos de uso, reajustes tarifários, bandeiras, impostos, disponibilidade solar e regras de compensação vigentes.</Text>
    </View>
  );
};
