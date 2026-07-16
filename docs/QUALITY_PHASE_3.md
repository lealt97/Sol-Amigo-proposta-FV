# Qualidade — Fase 3

Esta fase adiciona uma base objetiva para detectar regressões antes da publicação.

## Entregas

- suíte automatizada para cálculos solares, financeiros, payback e levantamento de cargas;
- correção da média de consumo para usar os meses realmente informados;
- verificação TypeScript completa da aplicação;
- verificação TypeScript estrita do núcleo de cálculos e testes;
- workflow de integração contínua na branch `main`;
- comando único `npm run check`;
- README e arquivo de ambiente alinhados ao produto real;
- regras básicas de formatação por `.editorconfig`.

## Comandos obrigatórios

Antes de publicar uma alteração:

```bash
npm ci
npm run check
```

O comando `check` executa, nesta ordem:

1. TypeScript da aplicação;
2. TypeScript estrito do núcleo;
3. testes automatizados;
4. build de produção.

## Cobertura inicial

A suíte `tests/calculations.test.ts` verifica:

- média de consumo com meses parciais e valores inválidos;
- dimensionamento de potência, módulos, geração e inversor;
- economia mensal e anual;
- custo total, preço bruto, desconto, lucro, margem e markup;
- payback, classificação e retorno em 25 anos;
- consumo diário e mensal do levantamento de cargas;
- recusa de entradas insuficientes.

## Integração contínua

O workflow `.github/workflows/quality.yml` roda em:

- todo push na `main`;
- todo pull request.

A execução usa Node.js 22, instala com `npm ci` e chama `npm run check`.

## Próximas expansões recomendadas

- testes dos serviços Supabase com cliente simulado;
- testes do fluxo público de aprovação e recusa;
- testes de geração de PDF;
- testes do autosave e dos conflitos de revisão;
- cobertura dos componentes críticos com React Testing Library;
- lint semântico com ESLint em uma etapa posterior, após reduzir os `any` legados.
