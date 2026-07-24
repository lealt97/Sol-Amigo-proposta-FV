from pathlib import Path

old = r'path="propostas\/:id\/editar" element=\{null\}'
new = r'path="propostas\/:id\/editar" element=\{<ProfessionalSizingCalculator \/>\}'
changed = []

for path in Path('tests').glob('*.test.ts'):
    source = path.read_text(encoding='utf-8')
    if old not in source:
        continue
    path.write_text(source.replace(old, new), encoding='utf-8')
    changed.append(str(path))

if not changed:
    raise SystemExit('A asserção antiga da rota de edição não foi encontrada.')

print('Testes atualizados: ' + ', '.join(changed))
