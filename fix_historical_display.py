import re

with open('src/pages/propostas/steps/StepConsumption.tsx', 'r') as f:
    content = f.read()

# Fix the useEffect to only overwrite if they actually typed something in history
target_effect = """  useEffect(() => {
    if (consumptionSource === 'historical') {
      setValue('monthly_consumption_kwh', historyAvg);
    }
  }, [historyAvg, consumptionSource, setValue]);"""

replacement_effect = """  const monthlyKwh = useWatch({ control, name: 'monthly_consumption_kwh' });

  useEffect(() => {
    if (consumptionSource === 'historical' && historyVals.length > 0) {
      setValue('monthly_consumption_kwh', historyAvg);
    }
  }, [historyAvg, consumptionSource, setValue, historyVals.length]);"""

content = content.replace(target_effect, replacement_effect)

# Fix the display
target_display = """              <span className="text-slate-500">Média Mensal Calculada</span>
              <span className="text-lg font-bold text-emerald-500">{historyAvg.toFixed(2)} kWh</span>"""

replacement_display = """              <span className="text-slate-500">Média Mensal Considerada</span>
              <span className="text-lg font-bold text-emerald-500">
                {historyVals.length > 0 ? historyAvg.toFixed(2) : (Number(monthlyKwh) || 0).toFixed(2)} kWh
              </span>"""

content = content.replace(target_display, replacement_display)

with open('src/pages/propostas/steps/StepConsumption.tsx', 'w') as f:
    f.write(content)
