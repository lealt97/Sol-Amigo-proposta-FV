import { useFormContext, useWatch } from 'react-hook-form';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { calcularPrecoProposta } from '../../../lib/calculations/pricing';
import { AlertCircle } from 'lucide-react';

const formatNumber = (val: any) => {
  if (val === '' || val === null || val === undefined) return 0;
  return Number(val);
};

export function StepCosts() {
  const { register, control } = useFormContext();

  const watchedValues = useWatch({
    control,
    name: [
      'kit_cost',
      'labor_cost',
      'fixed_costs',
      'freight_cost',
      'taxes',
      'commission',
      'other_costs',
      'margin_percentage',
      'discount_percentage'
    ]
  });

  const [
    kit_cost, labor_cost, fixed_costs, freight_cost, 
    taxes, commission, other_costs, margin_percentage, discount_percentage
  ] = watchedValues;

  const result = calcularPrecoProposta({
    kit_cost: formatNumber(kit_cost),
    labor_cost: formatNumber(labor_cost),
    fixed_costs: formatNumber(fixed_costs),
    freight_cost: formatNumber(freight_cost),
    taxes: formatNumber(taxes),
    commission: formatNumber(commission),
    other_costs: formatNumber(other_costs),
    margin_percentage: formatNumber(margin_percentage),
    discount_percentage: formatNumber(discount_percentage),
  });

  const formatMoney = (val: number) => 'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const marginWarning = result.real_margin_percentage < formatNumber(margin_percentage) && formatNumber(discount_percentage) > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kit_cost">Custo do Kit (R$)</Label>
          <Input 
            id="kit_cost" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register('kit_cost')} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="labor_cost">Mão de Obra (R$)</Label>
          <Input 
            id="labor_cost" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register('labor_cost')} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fixed_costs">Custos Fixos / Adicionais (R$)</Label>
          <Input 
            id="fixed_costs" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register('fixed_costs')} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="freight_cost">Frete (R$)</Label>
          <Input 
            id="freight_cost" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register('freight_cost')} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxes">Impostos (R$)</Label>
          <Input 
            id="taxes" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register('taxes')} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="commission">Comissão (R$)</Label>
          <Input 
            id="commission" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register('commission')} 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="other_costs">Outros Custos (R$)</Label>
          <Input 
            id="other_costs" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            {...register('other_costs')} 
          />
        </div>
      </div>

      <div className="border-t border-brand-border pt-6">
        <h3 className="text-sm font-medium text-brand-dark mb-4">Margem e Desconto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="margin_percentage">Margem Desejada (%)</Label>
            <Input 
              id="margin_percentage" 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              {...register('margin_percentage')} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount_percentage">Desconto (%)</Label>
            <Input 
              id="discount_percentage" 
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              {...register('discount_percentage')} 
            />
          </div>
        </div>
      </div>

      <div className="border border-brand-border rounded-lg bg-white overflow-hidden">
        <div className="bg-gray-50 border-b border-brand-border p-4 flex justify-between items-center">
          <h3 className="font-medium text-brand-dark">Resumo Financeiro</h3>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Custo Total</span>
            <span className="text-brand-dark font-medium">{formatMoney(result.total_cost)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Preço de Venda Bruto</span>
            <span className="text-brand-dark font-medium">{formatMoney(result.gross_price)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500">Desconto</span>
            <span className="text-red-400 font-medium">- {formatMoney(result.discount_value)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-brand-border">
            <span className="text-brand-dark font-medium">Preço Final</span>
            <span className="text-xl font-bold text-brand-dark">{formatMoney(result.final_price)}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-border">
            <div className="p-3 bg-gray-50 rounded-lg">
              <span className="block text-xs text-slate-500 mb-1">Lucro Estimado</span>
              <span className="text-lg font-bold text-emerald-500">{formatMoney(result.estimated_profit)}</span>
            </div>
            
            <div className={`p-3 rounded-lg ${marginWarning ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
              <span className="block text-xs text-slate-500 mb-1">Margem Real</span>
              <span className={`text-lg font-bold ${marginWarning ? 'text-red-400' : 'text-emerald-500'}`}>
                {result.real_margin_percentage.toFixed(2)}%
              </span>
            </div>
          </div>
          
          {marginWarning && (
            <div className="flex items-center gap-2 p-3 text-sm text-brand-blue bg-brand-blue/10 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>Atenção: O desconto aplicado reduziu a margem real para abaixo da margem desejada ({formatNumber(margin_percentage)}%).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
