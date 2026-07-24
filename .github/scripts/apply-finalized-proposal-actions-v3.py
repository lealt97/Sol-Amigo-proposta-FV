from pathlib import Path
import re

calculator = Path('src/pages/propostas/ProfessionalSizingCalculatorView.tsx')
source = calculator.read_text(encoding='utf-8')

if "isEditMode ? 'Salvar alterações' : 'Concluir dimensionamento'" in source:
    raise SystemExit(0)

pattern = re.compile(
    r'(onClick=\{\(\) => void completeSizing\(\)\}[\s\S]*?>\s*)'
    r'Concluir dimensionamento'
    r'(\s*<CheckCircle2 className="h-4 w-4" />)',
)
updated, count = pattern.subn(
    r"\1{isEditMode ? 'Salvar alterações' : 'Concluir dimensionamento'}\2",
    source,
    count=1,
)

if count != 1:
    raise SystemExit('Botão final do Wizard não encontrado.')

calculator.write_text(updated, encoding='utf-8')
