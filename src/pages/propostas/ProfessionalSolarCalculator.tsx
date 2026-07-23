import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Gauge,
  Grid3X3,
  PanelsTopLeft,
  SunMedium,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import {
  calculateProfessionalSolar,
  SOLAR_MONTHS,
  type MonthlySolarInput,
  type ProfessionalSolarInput,
} from '../../lib/calculations/professionalSolar';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

const DEFAULT_CONSUMPTION = [
  520, 510, 495, 480, 465, 450, 455, 470, 490, 505, 515, 525,
];
const DEFAULT_HSP = [
  5.45, 5.38, 5.12, 4.82, 4.46, 4.25, 4.39, 4.78, 5.05, 5.28, 5.42, 5.51,
];

const createMonthlyData = (): MonthlySolarInput[] => SOLAR_MONTHS.map((month, index) => ({
  month: month.key,
  consumptionKwh: DEFAULT_CONSUMPTION[index],
  hsp: DEFAULT_HSP[index],
}));

const STEPS = [
  { title: 'Consumo', icon: Zap },
  { title: 'Projeto solar', icon: SunMedium },
  { title: 'Módulos e inversor', icon: PanelsTopLeft },
  { title: 'Resultados', icon: BarChart3 },
] as const;

function NumericField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 0.01,
  helper,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  helper?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-brand-dark">{label}</span>
      <div className="relative">
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(event) => onChange(Number(event.target.value))}
          className={suffix ? 'pr-16' : undefined}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">
            {suffix}
          </span>
        )}
      </div>
      {helper && <p className="text-xs leading-5 text-slate-500">{helper}</p>}
    </label>
  );
}

export function ProfessionalSolarCalculator() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [monthlyData, setMonthlyData] = useState<MonthlySolarInput[]>(createMonthlyData);
  const [minimumGridConsumptionKwh, setMinimumGridConsumptionKwh] = useState(30);
  const [generationAdditionalPercent, setGenerationAdditionalPercent] = useState(0);
  const [totalLossPercent, setTotalLossPercent] = useState(20);
  const [energyTariff, setEnergyTariff] = useState(0.95);
  const [modulePowerW, setModulePowerW] = useState(550);
  const [moduleWidthM, setModuleWidthM] = useState(2.278);
  const [moduleHeightM, setModuleHeightM] = useState(1.134);
  const [spacingFactor, setSpacingFactor] = useState(1.1);
  const [availableAreaM2, setAvailableAreaM2] = useState(60);
  const [desiredDcAcRatio, setDesiredDcAcRatio] = useState(1.2);
  const [selectedInverterPowerKw, setSelectedInverterPowerKw] = useState(0);

  const calculationInput: ProfessionalSolarInput = {
    monthlyData,
    minimumGridConsumptionKwh,
    generationAdditionalPercent,
    totalLossPercent,
    energyTariff,
    modulePowerW,
    moduleWidthM,
    moduleHeightM,
    spacingFactor,
    availableAreaM2,
    desiredDcAcRatio,
    selectedInverterPowerKw: selectedInverterPowerKw || null,
  };

  const calculation = useMemo(() => {
    try {
      return { result: calculateProfessionalSolar(calculationInput), error: null };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Não foi possível calcular o dimensionamento.',
      };
    }
  }, [
    monthlyData,
    minimumGridConsumptionKwh,
    generationAdditionalPercent,
    totalLossPercent,
    energyTariff,
    modulePowerW,
    moduleWidthM,
    moduleHeightM,
    spacingFactor,
    availableAreaM2,
    desiredDcAcRatio,
    selectedInverterPowerKw,
  ]);

  const updateMonth = (index: number, field: 'consumptionKwh' | 'hsp', value: number) => {
    setMonthlyData((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const result = calculation.result;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-brand-blue">
            <Calculator className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Motor profissional</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-dark">Calculadora de Dimensionamento Fotovoltaico</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Cálculo anual com consumo e HSP mês a mês, perdas totais informadas diretamente, geração adicional, módulos, área e relação DC/AC.
          </p>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={() => navigate('/propostas')}>
          <ArrowLeft className="h-4 w-4" /> Voltar para propostas
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-brand-dark">Progresso</span>
                <span className="text-brand-blue">{Math.round(progress)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-gray">
                <div className="h-full rounded-full bg-brand-blue transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <nav className="space-y-2" aria-label="Etapas da calculadora">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const active = currentStep === index;
                const completed = index < currentStep;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${
                      active
                        ? 'border-brand-blue/30 bg-brand-blue/10 text-brand-blue'
                        : 'border-transparent text-slate-500 hover:bg-brand-gray'
                    }`}
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${completed ? 'bg-emerald-100 text-emerald-600' : active ? 'bg-brand-blue text-white' : 'bg-brand-gray text-slate-500'}`}>
                      {completed ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="font-semibold">{step.title}</span>
                  </button>
                );
              })}
            </nav>
          </Card>

          {result && (
            <Card className="border-brand-blue/20 bg-brand-blue/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-blue">Prévia instantânea</p>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Potência instalada</dt>
                  <dd className="font-bold text-brand-dark">{number.format(result.installedPowerKwp)} kWp</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Módulos</dt>
                  <dd className="font-bold text-brand-dark">{result.moduleCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Geração anual</dt>
                  <dd className="font-bold text-brand-dark">{number.format(result.estimatedAnnualGenerationKwh)} kWh</dd>
                </div>
              </dl>
            </Card>
          )}
        </aside>

        <main>
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-brand-border bg-gradient-to-r from-brand-blue/10 via-brand-surface to-brand-yellow/10">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-blue text-white">
                  {currentStep === 0 && <Zap className="h-5 w-5" />}
                  {currentStep === 1 && <SunMedium className="h-5 w-5" />}
                  {currentStep === 2 && <PanelsTopLeft className="h-5 w-5" />}
                  {currentStep === 3 && <BarChart3 className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">Etapa {currentStep + 1} de {STEPS.length}</p>
                  <CardTitle className="text-xl">{STEPS[currentStep].title}</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {calculation.error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{calculation.error}</p>
                </div>
              )}

              {currentStep === 0 && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-brand-dark">Consumo mensal da unidade</h2>
                    <p className="mt-1 text-sm text-slate-500">Informe os 12 meses. O motor calcula o consumo compensável após descontar o mínimo não compensável.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {monthlyData.map((item, index) => (
                      <label key={item.month} className="rounded-xl border border-brand-border bg-brand-gray/40 p-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{SOLAR_MONTHS[index].label}</span>
                        <div className="relative mt-2">
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            value={item.consumptionKwh}
                            onChange={(event) => updateMonth(index, 'consumptionKwh', Number(event.target.value))}
                            className="pr-14"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">kWh</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <NumericField
                      label="Consumo mínimo não compensável"
                      value={minimumGridConsumptionKwh}
                      onChange={setMinimumGridConsumptionKwh}
                      suffix="kWh/mês"
                      step={1}
                      helper="Parcela mensal mantida fora da compensação. Exemplo residencial monofásico: 30 kWh."
                    />
                    <NumericField
                      label="Tarifa de energia"
                      value={energyTariff}
                      onChange={setEnergyTariff}
                      suffix="R$/kWh"
                      step={0.01}
                      helper="Usada somente na estimativa de economia. Não altera o dimensionamento físico."
                    />
                  </div>
                </section>
              )}

              {currentStep === 1 && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-brand-dark">Recurso solar e premissas de geração</h2>
                    <p className="mt-1 text-sm text-slate-500">Use HSP média diária mensal. As perdas são informadas em um único campo e convertidas automaticamente em fator de rendimento.</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {monthlyData.map((item, index) => (
                      <label key={item.month} className="rounded-xl border border-brand-border bg-brand-gray/40 p-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">HSP {SOLAR_MONTHS[index].label}</span>
                        <div className="relative mt-2">
                          <Input
                            type="number"
                            min={0.1}
                            step={0.01}
                            value={item.hsp}
                            onChange={(event) => updateMonth(index, 'hsp', Number(event.target.value))}
                            className="pr-12"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">h/d</span>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <NumericField
                      label="Geração adicional desejada"
                      value={generationAdditionalPercent}
                      onChange={setGenerationAdditionalPercent}
                      suffix="%"
                      step={1}
                      helper={`Meta total calculada: ${number.format(100 + generationAdditionalPercent)}% do consumo compensável.`}
                    />
                    <NumericField
                      label="Perdas totais estimadas"
                      value={totalLossPercent}
                      onChange={setTotalLossPercent}
                      suffix="%"
                      max={99}
                      step={0.5}
                      helper={`Fator de rendimento resultante: ${number.format(Math.max(0, 100 - totalLossPercent))}%. Considere temperatura, sujeira, sombreamento, mismatch, cabos e inversor.`}
                    />
                  </div>
                </section>
              )}

              {currentStep === 2 && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-brand-dark">Módulos, área e inversor</h2>
                    <p className="mt-1 text-sm text-slate-500">A quantidade é arredondada para cima. A relação DC/AC desejada sugere a potência CA mínima do inversor.</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <NumericField label="Potência do módulo" value={modulePowerW} onChange={setModulePowerW} suffix="W" step={5} />
                    <NumericField label="Largura do módulo" value={moduleWidthM} onChange={setModuleWidthM} suffix="m" step={0.001} />
                    <NumericField label="Altura do módulo" value={moduleHeightM} onChange={setModuleHeightM} suffix="m" step={0.001} />
                    <NumericField label="Fator de espaçamento" value={spacingFactor} onChange={setSpacingFactor} suffix="x" min={1} step={0.01} helper="1,10 adiciona 10% para afastamentos e montagem." />
                    <NumericField label="Área disponível" value={availableAreaM2} onChange={setAvailableAreaM2} suffix="m²" step={0.1} />
                    <NumericField label="Relação DC/AC desejada" value={desiredDcAcRatio} onChange={setDesiredDcAcRatio} suffix="Pcc/Pca" min={0.1} step={0.01} helper="Valor inicial recomendado para sugestão: 1,20." />
                    <NumericField label="Potência CA do inversor selecionado" value={selectedInverterPowerKw} onChange={setSelectedInverterPowerKw} suffix="kW" step={0.1} helper="Opcional. Ao informar, o sistema calcula a relação DC/AC real." />
                  </div>

                  {result && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-xl border border-brand-border bg-brand-gray/40 p-4">
                        <Grid3X3 className="h-5 w-5 text-brand-blue" />
                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">Área necessária</p>
                        <p className="mt-1 text-xl font-bold text-brand-dark">{number.format(result.areaRequiredM2)} m²</p>
                      </div>
                      <div className="rounded-xl border border-brand-border bg-brand-gray/40 p-4">
                        <Gauge className="h-5 w-5 text-brand-blue" />
                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">Inversor sugerido</p>
                        <p className="mt-1 text-xl font-bold text-brand-dark">≥ {number.format(result.recommendedInverterPowerKw)} kW</p>
                      </div>
                      <div className="rounded-xl border border-brand-border bg-brand-gray/40 p-4">
                        <PanelsTopLeft className="h-5 w-5 text-brand-blue" />
                        <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">Relação DC/AC real</p>
                        <p className="mt-1 text-xl font-bold text-brand-dark">{result.realDcAcRatio == null ? 'Não informada' : number.format(result.realDcAcRatio)}</p>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {currentStep === 3 && result && (
                <section className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-brand-dark">Resultado técnico preliminar</h2>
                    <p className="mt-1 text-sm text-slate-500">A tela, o futuro PDF e os gráficos deverão consumir este mesmo resultado do motor de cálculo.</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: 'Potência necessária', value: `${number.format(result.requiredPowerKwp)} kWp`, icon: Calculator },
                      { label: 'Potência instalada', value: `${number.format(result.installedPowerKwp)} kWp`, icon: SunMedium },
                      { label: 'Quantidade de módulos', value: String(result.moduleCount), icon: PanelsTopLeft },
                      { label: 'Cobertura anual', value: `${number.format(result.generationCoveragePercent)}%`, icon: Gauge },
                      { label: 'Geração anual', value: `${number.format(result.estimatedAnnualGenerationKwh)} kWh`, icon: Zap },
                      { label: 'Meta anual', value: `${number.format(result.annualTargetGenerationKwh)} kWh`, icon: BarChart3 },
                      { label: 'Economia estimada', value: currency.format(result.estimatedAnnualSavings), icon: CircleDollarSign },
                      { label: 'Saldo final de créditos', value: `${number.format(result.finalCreditBalanceKwh)} kWh`, icon: Grid3X3 },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="rounded-xl border border-brand-border bg-brand-gray/40 p-4">
                          <Icon className="h-5 w-5 text-brand-blue" />
                          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">{item.label}</p>
                          <p className="mt-1 text-lg font-bold text-brand-dark">{item.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {result.warnings.length > 0 && (
                    <div className="space-y-3">
                      {result.warnings.map((warning) => (
                        <div key={warning.code} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${warning.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                          <p>{warning.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-xl border border-brand-border">
                    <table className="w-full min-w-[1050px] text-left text-sm">
                      <thead className="bg-brand-gray text-[10px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3 py-3">Mês</th>
                          <th className="px-3 py-3">Consumo</th>
                          <th className="px-3 py-3">Compensável</th>
                          <th className="px-3 py-3">HSP</th>
                          <th className="px-3 py-3">Geração</th>
                          <th className="px-3 py-3">Compensada</th>
                          <th className="px-3 py-3">Excedente</th>
                          <th className="px-3 py-3">Déficit</th>
                          <th className="px-3 py-3">Crédito final</th>
                          <th className="px-3 py-3">Economia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.monthly.map((month) => (
                          <tr key={month.month} className="border-t border-brand-border">
                            <td className="px-3 py-3 font-bold text-brand-dark">{month.label}</td>
                            <td className="px-3 py-3">{number.format(month.consumptionKwh)} kWh</td>
                            <td className="px-3 py-3">{number.format(month.compensableConsumptionKwh)} kWh</td>
                            <td className="px-3 py-3">{number.format(month.hsp)}</td>
                            <td className="px-3 py-3 font-semibold text-brand-blue">{number.format(month.generationKwh)} kWh</td>
                            <td className="px-3 py-3">{number.format(month.compensatedEnergyKwh)} kWh</td>
                            <td className="px-3 py-3 text-emerald-600">{number.format(month.surplusKwh)} kWh</td>
                            <td className="px-3 py-3 text-red-600">{number.format(month.deficitKwh)} kWh</td>
                            <td className="px-3 py-3">{number.format(month.closingCreditKwh)} kWh</td>
                            <td className="px-3 py-3">{currency.format(month.estimatedSavings)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl border border-brand-blue/20 bg-brand-blue/5 p-4 text-sm leading-6 text-slate-600">
                    Esta primeira entrega reativa o motor técnico e a visualização. Cadastro do cliente, custos, análise financeira completa, persistência da proposta e PDF serão conectados nas próximas etapas sem duplicar os cálculos.
                  </div>
                </section>
              )}
            </CardContent>

            <div className="flex flex-col-reverse gap-3 border-t border-brand-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <Button type="button" variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep((step) => Math.max(0, step - 1))} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" disabled={Boolean(calculation.error)} onClick={() => setCurrentStep((step) => Math.min(STEPS.length - 1, step + 1))} className="gap-2">
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => setCurrentStep(0)} className="gap-2">
                  Revisar entradas
                </Button>
              )}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
