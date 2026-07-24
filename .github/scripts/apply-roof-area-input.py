from pathlib import Path


VIEW_PATH = Path('src/pages/propostas/ProfessionalSizingCalculatorView.tsx')


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        raise SystemExit(f'Marcador não encontrado: {label}')
    return source.replace(old, new, 1)


source = VIEW_PATH.read_text(encoding='utf-8')

source = replace_once(
    source,
    """  const [moduleWidthM, setModuleWidthM] = useState('');
  const [moduleHeightM, setModuleHeightM] = useState('');
  const [roofWidthM, setRoofWidthM] = useState('');
  const [roofHeightM, setRoofHeightM] = useState('');
""",
    """  const [moduleWidthM, setModuleWidthM] = useState('');
  const [moduleHeightM, setModuleHeightM] = useState('');
  const [roofAreaM2, setRoofAreaM2] = useState('');
""",
    'estados do telhado',
)

source = replace_once(
    source,
    """        { value: parseNumber(moduleHeightM), message: 'Informe a altura do módulo em metros.' },
        { value: parseNumber(roofWidthM), message: 'Informe a largura útil do telhado em metros.' },
        { value: parseNumber(roofHeightM), message: 'Informe a altura útil do telhado em metros.' },
""",
    """        { value: parseNumber(moduleHeightM), message: 'Informe a altura do módulo em metros.' },
        { value: parseNumber(roofAreaM2), message: 'Informe a área do telhado em metros quadrados.' },
""",
    'validação da área do telhado',
)

source = replace_once(
    source,
    """      moduleWidthM: parseNumber(moduleWidthM),
      moduleHeightM: parseNumber(moduleHeightM),
      roofWidthM: parseNumber(roofWidthM),
      roofHeightM: parseNumber(roofHeightM),
""",
    """      moduleWidthM: parseNumber(moduleWidthM),
      moduleHeightM: parseNumber(moduleHeightM),
      roofAreaM2: parseNumber(roofAreaM2),
""",
    'valores do cálculo de área',
)

source = replace_once(
    source,
    """  }, [moduleHeightM, modulePowerW, moduleWidthM, result, roofHeightM, roofWidthM]);
""",
    """  }, [moduleHeightM, modulePowerW, moduleWidthM, result, roofAreaM2]);
""",
    'dependências do cálculo de área',
)

source = replace_once(
    source,
    """                      step="1"
                      helper="Com 275 Wp e potência necessária de 4,556 kWp, o resultado é 17 módulos."
                    />
""",
    """                      step="1"
                    />
""",
    'descrição do exemplo de módulos',
)

source = replace_once(
    source,
    """                    <Field label="Largura útil do telhado" value={roofWidthM} onChange={setRoofWidthM} suffix="m" min={0.01} step="0.01" />
                    <Field label="Altura útil do telhado" value={roofHeightM} onChange={setRoofHeightM} suffix="m" min={0.01} step="0.01" />
""",
    """                    <Field label="Área do telhado" value={roofAreaM2} onChange={setRoofAreaM2} suffix="m²" min={0.01} step="0.01" />
""",
    'inputs das dimensões do telhado',
)

for forbidden in (
    'roofWidthM',
    'roofHeightM',
    'Largura útil do telhado',
    'Altura útil do telhado',
    'Com 275 Wp e potência necessária de 4,556 kWp',
):
    if forbidden in source:
        raise SystemExit(f'Conteúdo antigo ainda presente: {forbidden}')

if 'label="Área do telhado"' not in source or 'roofAreaM2' not in source:
    raise SystemExit('O novo input de área do telhado não foi aplicado.')

VIEW_PATH.write_text(source, encoding='utf-8')
