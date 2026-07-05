import { useFormContext, useFieldArray, useWatch } from 'react-hook-form';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { calcularConsumoMensalEstimado, calcularConsumoDiarioTotal, calcularConsumoEquipamento } from '../../../lib/calculations/loadSurvey';
import { ProposalFormValues } from '../../../lib/validations/proposal.schema';

export function StepConsumption() {
  const { register, control, setValue } = useFormContext<ProposalFormValues>();
  
  const consumptionSource = useWatch({ control, name: 'consumption_source' });
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'loads',
  });

  const loads = useWatch({ control, name: 'loads' }) || [];

  const handleCalculateDailyLoad = (index: number) => {
    const power = Number(loads[index]?.power_watts) || 0;
    const qty = Number(loads[index]?.quantity) || 0;
    const hours = Number(loads[index]?.hours_per_day) || 0;
    
    if (power < 0 || qty < 0 || hours < 0) return;
    
    const daily = calcularConsumoEquipamento(power, qty, hours);
    setValue(`loads.${index}.daily_consumption`, daily);
    updateTotals();
  };

  const updateTotals = () => {
    // Need to use the latest values from form state
    // But since this is a callback, we'll calculate directly from the watched loads array (which might be 1 render behind if called directly on change)
    // Actually, `useWatch` gives us current values, so it's better to just calculate totals purely based on render.
  };

  const totalDaily = calcularConsumoDiarioTotal(loads as any[]);
  const totalMonthly = calcularConsumoMensalEstimado(totalDaily);

  const applyLoadToConsumption = () => {
    setValue('monthly_consumption_kwh', totalMonthly);
    setValue('estimated_daily_consumption', totalDaily);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="consumption_source">Método de Consumo</Label>
        <Select id="consumption_source" {...register('consumption_source')}>
          <option value="average">Informar Consumo Médio</option>
          <option value="historical">Informar Últimos 12 Meses</option>
          <option value="load_survey">Levantamento de Cargas</option>
        </Select>
      </div>

      {consumptionSource === 'average' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthly_consumption_kwh">Consumo Médio (kWh/mês)</Label>
            <Input 
              id="monthly_consumption_kwh" 
              type="number" 
              placeholder="Ex: 500" 
              {...register('monthly_consumption_kwh')} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill_amount">Valor Médio da Conta (R$)</Label>
            <Input 
              id="bill_amount" 
              type="number" 
              step="0.01"
              placeholder="Ex: 450.00" 
              {...register('bill_amount')} 
            />
          </div>
        </div>
      )}

      {consumptionSource === 'historical' && (
        <div className="p-4 border border-brand-border rounded-lg bg-gray-50">
          <p className="text-sm text-slate-500">
            O preenchimento do histórico de 12 meses será adicionado nas próximas atualizações.
          </p>
        </div>
      )}

      {consumptionSource === 'load_survey' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-brand-dark">Equipamentos</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ equipment_name: '', power_watts: 0, quantity: 1, hours_per_day: 0, daily_consumption: 0 })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Equipamento
            </Button>
          </div>

          <div className="border border-brand-border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-500 uppercase bg-white border-b border-brand-border">
                <tr>
                  <th className="px-4 py-3">Equipamento</th>
                  <th className="px-4 py-3 w-28">Potência (W)</th>
                  <th className="px-4 py-3 w-24">Quant.</th>
                  <th className="px-4 py-3 w-24">Hrs/Dia</th>
                  <th className="px-4 py-3 w-32">kWh/dia</th>
                  <th className="px-4 py-3 w-16 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {fields.map((field, index) => (
                  <tr key={field.id} className="bg-gray-50">
                    <td className="px-4 py-2">
                      <Input
                        {...register(`loads.${index}.equipment_name`)}
                        placeholder="Ex: Ar Condicionado"
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        {...register(`loads.${index}.power_watts`)}
                        onChange={(e) => {
                          setValue(`loads.${index}.power_watts`, e.target.value);
                          handleCalculateDailyLoad(index);
                        }}
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        {...register(`loads.${index}.quantity`)}
                        onChange={(e) => {
                          setValue(`loads.${index}.quantity`, e.target.value);
                          handleCalculateDailyLoad(index);
                        }}
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min="0"
                        {...register(`loads.${index}.hours_per_day`)}
                        onChange={(e) => {
                          setValue(`loads.${index}.hours_per_day`, e.target.value);
                          handleCalculateDailyLoad(index);
                        }}
                        className="h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        readOnly
                        {...register(`loads.${index}.daily_consumption`)}
                        className="h-8 bg-white text-brand-dark"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8 text-red-600 hover:text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Nenhum equipamento adicionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white border border-brand-border flex justify-between items-center">
              <span className="text-slate-500">Consumo Diário Total</span>
              <span className="text-lg font-bold text-brand-dark">{totalDaily.toFixed(2)} kWh</span>
            </div>
            <div className="p-4 rounded-lg bg-white border border-brand-border flex justify-between items-center">
              <span className="text-slate-500">Consumo Mensal Estimado</span>
              <span className="text-lg font-bold text-emerald-500">{totalMonthly.toFixed(2)} kWh</span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={applyLoadToConsumption} variant="secondary">
              Usar este consumo no dimensionamento
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
