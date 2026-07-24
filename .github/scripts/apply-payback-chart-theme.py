from pathlib import Path

repo = Path('.')
theme_path = repo / 'src/lib/theme/platformTheme.ts'
payback_path = repo / 'src/pages/propostas/PaybackStep.tsx'
test_path = repo / 'tests/payback-chart-theme.test.ts'


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'Trecho esperado não encontrado em {label}:\n{old}')
    return text.replace(old, new, 1)


theme = theme_path.read_text(encoding='utf-8')

if 'chartPositive: string;' not in theme:
    theme = replace_once(
        theme,
        "  gray900: string;\n}",
        "  gray900: string;\n"
        "  chartPositive: string;\n"
        "  chartNegative: string;\n"
        "  chartGrid: string;\n"
        "  chartAxis: string;\n"
        "  chartZero: string;\n"
        "  chartCursor: string;\n"
        "  chartTooltipBg: string;\n"
        "  chartTooltipBorder: string;\n"
        "  chartTooltipText: string;\n"
        "  chartTooltipMuted: string;\n"
        "  chartPanel: string;\n"
        "  chartMarker: string;\n"
        "  chartMarkerBg: string;\n"
        "}",
        'PlatformThemePalette',
    )

if 'chartPositive: normalizedSeed.primary' not in theme:
    theme = replace_once(
        theme,
        "    gray900: isLight ? '#0F172A' : '#F8FAFC',\n  };",
        "    gray900: isLight ? '#0F172A' : '#F8FAFC',\n"
        "    chartPositive: normalizedSeed.primary,\n"
        "    chartNegative: normalizedSeed.warning,\n"
        "    chartGrid: mix(normalizedSeed.background, normalizedSeed.accent, isLight ? 0.2 : 0.28),\n"
        "    chartAxis: mix(normalizedSeed.background, normalizedSeed.accent, isLight ? 0.5 : 0.62),\n"
        "    chartZero: mix(normalizedSeed.background, getReadableText(normalizedSeed.background), isLight ? 0.42 : 0.5),\n"
        "    chartCursor: mix(normalizedSeed.background, normalizedSeed.primary, isLight ? 0.1 : 0.18),\n"
        "    chartTooltipBg: mix(normalizedSeed.background, isLight ? '#FFFFFF' : '#000000', isLight ? 0.9 : 0.2),\n"
        "    chartTooltipBorder: mix(normalizedSeed.background, normalizedSeed.primary, isLight ? 0.34 : 0.44),\n"
        "    chartTooltipText: getReadableText(normalizedSeed.background),\n"
        "    chartTooltipMuted: getMutedText(normalizedSeed.background),\n"
        "    chartPanel: mix(normalizedSeed.background, normalizedSeed.primary, isLight ? 0.06 : 0.1),\n"
        "    chartMarker: normalizedSeed.accent,\n"
        "    chartMarkerBg: mix(normalizedSeed.background, normalizedSeed.accent, isLight ? 0.12 : 0.2),\n"
        "  };",
        'buildPlatformTheme',
    )

old_active_theme = "  const activeTheme = theme?.palette ? theme : buildPlatformTheme(DEFAULT_PLATFORM_THEME_SEED);\n  const palette = activeTheme.palette;"
new_active_theme = "  const activeTheme = buildPlatformTheme(theme?.seed || DEFAULT_PLATFORM_THEME_SEED);\n  const palette = activeTheme.palette;"
if old_active_theme in theme:
    theme = theme.replace(old_active_theme, new_active_theme, 1)
elif new_active_theme not in theme:
    raise SystemExit('Inicialização do tema ativo não encontrada.')

if "setCssVar('--color-chart-positive'" not in theme:
    theme = replace_once(
        theme,
        "  setCssVar('--color-gray-900', palette.gray900);\n\n  document.documentElement.dataset.platformThemeMode = palette.mode;",
        "  setCssVar('--color-gray-900', palette.gray900);\n"
        "  setCssVar('--color-chart-positive', palette.chartPositive);\n"
        "  setCssVar('--color-chart-negative', palette.chartNegative);\n"
        "  setCssVar('--color-chart-grid', palette.chartGrid);\n"
        "  setCssVar('--color-chart-axis', palette.chartAxis);\n"
        "  setCssVar('--color-chart-zero', palette.chartZero);\n"
        "  setCssVar('--color-chart-cursor', palette.chartCursor);\n"
        "  setCssVar('--color-chart-tooltip-bg', palette.chartTooltipBg);\n"
        "  setCssVar('--color-chart-tooltip-border', palette.chartTooltipBorder);\n"
        "  setCssVar('--color-chart-tooltip-text', palette.chartTooltipText);\n"
        "  setCssVar('--color-chart-tooltip-muted', palette.chartTooltipMuted);\n"
        "  setCssVar('--color-chart-panel', palette.chartPanel);\n"
        "  setCssVar('--color-chart-marker', palette.chartMarker);\n"
        "  setCssVar('--color-chart-marker-bg', palette.chartMarkerBg);\n\n"
        "  document.documentElement.dataset.platformThemeMode = palette.mode;",
        'applyPlatformTheme',
    )

theme_path.write_text(theme, encoding='utf-8')

payback = payback_path.read_text(encoding='utf-8')

if 'const paybackMarkerYear =' not in payback:
    payback = replace_once(
        payback,
        "  const result = calculation.result;\n\n  return (",
        "  const result = calculation.result;\n"
        "  const chartProjectionLastYear = result?.chartData[result.chartData.length - 1]?.year ?? 0;\n"
        "  const paybackMarkerYear = result\n"
        "    && Number.isFinite(result.paybackYears)\n"
        "    && result.paybackYears <= chartProjectionLastYear\n"
        "      ? Math.ceil(result.paybackYears)\n"
        "      : null;\n\n"
        "  return (",
        'PaybackStep result',
    )

chart_title = 'Saldo acumulado em 25 anos'
chart_title_index = payback.index(chart_title)
chart_start = payback.rfind('          <Card className="shadow-none">', 0, chart_title_index)
if chart_start < 0:
    chart_start = payback.rfind('          <Card\n', 0, chart_title_index)
chart_end_token = '          </Card>'
chart_end = payback.index(chart_end_token, chart_title_index) + len(chart_end_token)

new_chart = '''          <Card
            className="shadow-none"
            style={{
              borderColor: 'var(--color-chart-grid, var(--color-brand-border))',
              backgroundColor: 'var(--color-chart-panel, var(--color-brand-surface))',
            }}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{
                    backgroundColor: 'var(--color-chart-marker-bg, var(--color-gray-100))',
                    color: 'var(--color-chart-marker, var(--color-brand-light))',
                  }}
                >
                  <CircleDollarSign className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-brand-dark">Saldo acumulado em 25 anos</h3>
                  <p className="mt-1 text-xs text-slate-500">Barras negativas representam capital ainda não recuperado; positivas representam retorno acumulado.</p>
                </div>
              </div>

              <div className="mt-5 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid
                      stroke="var(--color-chart-grid, var(--color-brand-border))"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="year"
                      interval={4}
                      stroke="var(--color-chart-axis, var(--color-slate-500))"
                      tick={{ fill: 'var(--color-chart-axis, var(--color-slate-500))' }}
                      axisLine={{ stroke: 'var(--color-chart-axis, var(--color-slate-500))' }}
                      tickLine={{ stroke: 'var(--color-chart-axis, var(--color-slate-500))' }}
                      tickFormatter={(year) => `${year}`}
                    />
                    <YAxis
                      width={76}
                      stroke="var(--color-chart-axis, var(--color-slate-500))"
                      tick={{ fill: 'var(--color-chart-axis, var(--color-slate-500))' }}
                      axisLine={{ stroke: 'var(--color-chart-axis, var(--color-slate-500))' }}
                      tickLine={{ stroke: 'var(--color-chart-axis, var(--color-slate-500))' }}
                      tickFormatter={(value) => `R$ ${Math.round(Number(value) / 1000)}k`}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-chart-cursor, var(--color-gray-100))' }}
                      contentStyle={{
                        backgroundColor: 'var(--color-chart-tooltip-bg, var(--color-brand-surface))',
                        borderColor: 'var(--color-chart-tooltip-border, var(--color-brand-border))',
                        color: 'var(--color-chart-tooltip-text, var(--color-brand-dark))',
                        borderRadius: '12px',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.24)',
                      }}
                      labelStyle={{ color: 'var(--color-chart-tooltip-muted, var(--color-slate-500))' }}
                      itemStyle={{ color: 'var(--color-chart-tooltip-text, var(--color-brand-dark))' }}
                      labelFormatter={(year) => `Ano ${year}`}
                      formatter={(value) => [currency.format(Number(value)), 'Saldo acumulado']}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="var(--color-chart-zero, var(--color-slate-500))"
                      strokeWidth={2}
                    />
                    {paybackMarkerYear != null && (
                      <ReferenceLine
                        x={paybackMarkerYear}
                        stroke="var(--color-chart-marker, var(--color-brand-light))"
                        strokeDasharray="5 4"
                        strokeWidth={2}
                        label={{
                          value: 'Payback',
                          position: 'insideTopRight',
                          fill: 'var(--color-chart-marker, var(--color-brand-light))',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      />
                    )}
                    <Bar
                      dataKey="cumulativeBalance"
                      radius={0}
                      activeBar={{
                        fill: 'var(--color-chart-marker, var(--color-brand-light))',
                        stroke: 'var(--color-chart-tooltip-text, var(--color-brand-dark))',
                        strokeWidth: 1,
                      }}
                    >
                      {result.chartData.map((point) => (
                        <Cell
                          key={point.year}
                          fill={point.cumulativeBalance >= 0
                            ? 'var(--color-chart-positive, var(--color-brand-blue))'
                            : 'var(--color-chart-negative, var(--color-brand-yellow))'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: 'var(--color-chart-negative, var(--color-brand-yellow))' }}
                  />
                  Capital não recuperado
                </span>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ backgroundColor: 'var(--color-chart-positive, var(--color-brand-blue))' }}
                  />
                  Retorno acumulado
                </span>
                {paybackMarkerYear != null && (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-5 border-t-2 border-dashed"
                      style={{ borderColor: 'var(--color-chart-marker, var(--color-brand-light))' }}
                    />
                    Marco do payback
                  </span>
                )}
              </div>
            </CardContent>
          </Card>'''

payback = payback[:chart_start] + new_chart + payback[chart_end:]
payback_path.write_text(payback, encoding='utf-8')

test_path.write_text("""import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const THEME = 'src/lib/theme/platformTheme.ts';
const PAYBACK = 'src/pages/propostas/PaybackStep.tsx';

test('motor de cores cria papéis semânticos para gráficos', async () => {
  const source = await readFile(THEME, 'utf8');

  for (const role of [
    'chartPositive',
    'chartNegative',
    'chartGrid',
    'chartAxis',
    'chartZero',
    'chartCursor',
    'chartTooltipBg',
    'chartTooltipBorder',
    'chartTooltipText',
    'chartTooltipMuted',
    'chartPanel',
    'chartMarker',
    'chartMarkerBg',
  ]) {
    assert.match(source, new RegExp(`${role}: string`));
  }

  assert.match(source, /chartPositive: normalizedSeed\.primary/);
  assert.match(source, /chartNegative: normalizedSeed\.warning/);
  assert.match(source, /const activeTheme = buildPlatformTheme\(theme\?\.seed \|\| DEFAULT_PLATFORM_THEME_SEED\)/);
  assert.match(source, /setCssVar\('--color-chart-grid', palette\.chartGrid\)/);
  assert.match(source, /setCssVar\('--color-chart-tooltip-bg', palette\.chartTooltipBg\)/);
  assert.match(source, /setCssVar\('--color-chart-marker', palette\.chartMarker\)/);
});

test('gráfico de payback consome a paleta semântica em todos os elementos', async () => {
  const source = await readFile(PAYBACK, 'utf8');
  const start = source.indexOf('Saldo acumulado em 25 anos');
  const end = source.indexOf('</Card>', start);

  assert.ok(start >= 0 && end > start, 'Gráfico de payback não encontrado.');
  const chart = source.slice(start, end);

  for (const cssVariable of [
    '--color-chart-panel',
    '--color-chart-grid',
    '--color-chart-axis',
    '--color-chart-zero',
    '--color-chart-cursor',
    '--color-chart-tooltip-bg',
    '--color-chart-tooltip-border',
    '--color-chart-tooltip-text',
    '--color-chart-tooltip-muted',
    '--color-chart-positive',
    '--color-chart-negative',
    '--color-chart-marker',
    '--color-chart-marker-bg',
  ]) {
    assert.match(chart, new RegExp(cssVariable));
  }

  assert.match(source, /const paybackMarkerYear =/);
  assert.match(chart, /value: 'Payback'/);
  assert.match(chart, /Capital não recuperado/);
  assert.match(chart, /Retorno acumulado/);
  assert.match(chart, /Marco do payback/);
});
""", encoding='utf-8')
