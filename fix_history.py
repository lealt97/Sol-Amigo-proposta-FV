import re
with open('src/pages/propostas/steps/StepConsumption.tsx', 'r') as f:
    content = f.read()

target = """  const history = useWatch({ control, name: 'history' }) || [];
  const historyVals = history.map(v => Number(v) || 0).filter(v => v > 0);
  const historyAvg = historyVals.length > 0 ? historyVals.reduce((a, b) => a + b, 0) / historyVals.length : 0;"""

content = content.replace(target + "\n" + target, target)

with open('src/pages/propostas/steps/StepConsumption.tsx', 'w') as f:
    f.write(content)
