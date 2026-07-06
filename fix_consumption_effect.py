import re

with open('src/pages/propostas/steps/StepConsumption.tsx', 'r') as f:
    content = f.read()

if 'import { useEffect } from' not in content:
    content = content.replace("import { useFormContext", "import { useEffect } from 'react';\nimport { useFormContext")

target = """  const historyAvg = historyVals.length > 0 ? historyVals.reduce((a, b) => a + b, 0) / historyVals.length : 0;"""

replacement = target + """

  useEffect(() => {
    if (consumptionSource === 'historical') {
      setValue('monthly_consumption_kwh', historyAvg);
    }
  }, [historyAvg, consumptionSource, setValue]);
"""

content = content.replace(target, replacement)

with open('src/pages/propostas/steps/StepConsumption.tsx', 'w') as f:
    f.write(content)
