import { useWatch, useFormContext } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { calcularSistemaSolar } from '../../lib/calculations/solar';
import { ProposalFormValues } from '../../lib/validations/proposal.schema';

const formatNumber = (val: any) => {
  if (val === '' || val === null || val === undefined) return null;
  return Number(val);
};

export function SolarCalculationPreview() {
  const { control } = useFormContext<ProposalFormValues>();
  
  const watchedValues = useWatch({
    control,
    name: [
      'hsp',
      'panel_power_w',
      'yield_factor',
      'generation_target_percent',
      'oversizing',
      'monthly_consumption_kwh',
      'bill_amount',
      'energy_tariff'
    ]
  });

  const [
    hsp,
    panel_power_w,
    yield_factor,
    generation_target_percent,
    oversizing,
    monthly_consumption_kwh,
    bill_amount,
    energy_tariff
  ] = watchedValues;

  const result = calcularSistemaSolar({
    hsp: formatNumber(hsp) || 0,
    panel_power_w: formatNumber(panel_power_w) || 0,
    yield_factor: formatNumber(yield_factor) || 0.80,
    generation_target_percent: formatNumber(generation_target_percent) || 100,
    oversizing: formatNumber(oversizing) || 1.20,
    monthly_consumption_kwh: formatNumber(monthly_consumption_kwh) || undefined,
    current_bill_value: formatNumber(bill_amount) || undefined,
    energy_tariff: formatNumber(energy_tariff) || undefined,
  });

  if (!result) {
    return (
      <Card className="bg-brand-surface border-brand-border shadow-xl">
        <CardHeader className="pb-3 border-b border-brand-border/50">
          <CardTitle className="text-lg text-brand-dark font-semibold">Resumo do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 text-sm text-slate-500">
          Preencha os dados do projeto (HSP, Potência do Módulo, etc) para visualizar o dimensionamento.
        </CardContent>
      </Card>
    );
  }

  const formatKw = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' kWp';
  const formatKwh = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' kWh';
  const formatMoney = (val: number) => 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatPercent = (val: number) => (val * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

  return (
    <Card className="bg-brand-surface border-brand-border shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-brand-blue/10 to-transparent border-b border-brand-blue/20 px-6 py-4">
        <h3 className="font-semibold text-brand-blue">Resumo do Dimensionamento</h3>
      </div>
      
      <CardContent className="p-0 divide-y divide-[#27272A]/50">
        <div className="p-4 bg-black/20">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-slate-500">Potência Instalada</span>
            <span className="text-lg font-bold text-brand-dark">{formatKw(result.installed_power_kwp)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">Qtde. Módulos</span>
            <span className="text-sm font-medium text-brand-dark">{result.panel_count} un.</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Consumo Mensal</span>
            <span className="text-sm font-medium text-brand-dark">{formatKwh(result.monthly_consumption_kwh)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Geração Estimada</span>
            <span className="text-sm font-medium text-brand-blue">{formatKwh(result.estimated_monthly_generation_kwh)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Excedente</span>
            <span className="text-sm font-medium text-brand-dark">
              {formatKwh(result.excess_kwh)} ({formatPercent(result.excess_percentage)})
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Inversor Mínimo</span>
            <span className="text-sm font-medium text-brand-dark">
              {result.min_inverter_power_kw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW
            </span>
          </div>
        </div>

        <div className="p-4 bg-black/20 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Economia Mensal</span>
            <span className="text-sm font-bold text-emerald-500">{formatMoney(result.monthly_savings)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Economia Anual</span>
            <span className="text-sm font-bold text-emerald-500">{formatMoney(result.annual_savings)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
