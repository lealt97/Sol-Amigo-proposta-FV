import re

with open('src/pages/propostas/steps/StepConsumption.tsx', 'r') as f:
    content = f.read()

target1 = """  const loads = useWatch({ control, name: 'loads' }) || [];"""
replacement1 = """  const loads = useWatch({ control, name: 'loads' }) || [];
  const history = useWatch({ control, name: 'history' }) || [];

  const historyVals = history.map(v => Number(v) || 0).filter(v => v > 0);
  const historyAvg = historyVals.length > 0 ? historyVals.reduce((a, b) => a + b, 0) / historyVals.length : 0;"""

target2 = """      {consumptionSource === 'historical' && (
        <div className="p-4 border border-brand-border rounded-lg bg-gray-50">
          <p className="text-sm text-slate-500">
            O preenchimento do histórico de 12 meses será adicionado nas próximas atualizações.
          </p>
        </div>
      )}"""

replacement2 = """      {consumptionSource === 'historical' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((month, idx) => (
              <div key={idx} className="space-y-2">
                <Label htmlFor={`history.${idx}`}>{month}</Label>
                <Input
                  id={`history.${idx}`}
                  type="number"
                  placeholder="kWh"
                  {...register(`history.${idx}` as const)}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-brand-surface border border-brand-border flex justify-between items-center">
              <span className="text-slate-500">Média Mensal Calculada</span>
              <span className="text-lg font-bold text-emerald-500">{historyAvg.toFixed(2)} kWh</span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={() => {
              setValue('monthly_consumption_kwh', historyAvg);
            }} variant="secondary">
              Usar esta média no dimensionamento
            </Button>
          </div>
        </div>
      )}"""

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open('src/pages/propostas/steps/StepConsumption.tsx', 'w') as f:
    f.write(content)

