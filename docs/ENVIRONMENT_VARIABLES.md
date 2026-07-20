# Variáveis de ambiente — SolAmigo Propostas FV

Este documento define as variáveis permitidas e obrigatórias em desenvolvimento, homologação e produção.

## 1. Frontend Vite

As variáveis abaixo são incorporadas ao bundle durante o build. Elas são públicas por natureza e podem ser visualizadas pelo navegador.

| Variável | Obrigatória | Ambientes | Finalidade |
|---|---:|---|---|
| `VITE_SUPABASE_URL` | Sim | desenvolvimento, homologação e produção | URL base do projeto Supabase, sem `/rest/v1` no final. |
| `VITE_SUPABASE_ANON_KEY` | Sim | desenvolvimento, homologação e produção | Chave pública `anon` ou publishable do Supabase. |

### Regras de segurança

- Nunca use `SUPABASE_SERVICE_ROLE_KEY` em uma variável iniciada por `VITE_`.
- Nunca coloque segredos de pagamento, SMTP, administração ou banco no frontend.
- Nenhuma variável Cakto ou Stripe pode começar com `VITE_`.
- Homologação e produção devem usar projetos Supabase distintos.
- Ao alterar uma variável `VITE_*`, execute um novo build e deploy; mudar somente o runtime não altera um bundle já compilado.

## 2. Servidor de produção no Railway

| Variável | Obrigatória | Origem | Finalidade |
|---|---:|---|---|
| `PORT` | Automática | Railway | Porta usada pelo servidor Express. O Railway injeta esse valor em cada deployment. |
| `NODE_ENV` | Recomendada | Railway/configuração | Deve ser `production` no ambiente comercial. |

O processo de produção é iniciado por `npm start`, que executa `node server.mjs`. O endpoint `/health` deve responder HTTP 200 para o healthcheck do Railway.

## 3. Supabase Edge Functions

Estas variáveis pertencem somente ao ambiente protegido das Edge Functions.

### Credenciais e configuração comuns

| Variável | Obrigatória | Visibilidade | Finalidade |
|---|---:|---|---|
| `SUPABASE_URL` | Sim | servidor | URL do projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | segredo de servidor | Operações administrativas controladas, incluindo PDF privado, MFA, monitoramento e billing. |
| `APP_BASE_URL` | Sim para checkout | servidor | Origem HTTPS do frontend, por exemplo `https://app.exemplo.com`, usada apenas para retorno de sucesso ou cancelamento. |
| `BILLING_GRACE_DAYS` | Não | servidor | Quantidade de dias de tolerância após falha de pagamento. Padrão: `3`; faixa aceita pelo código: `0` a `30`. |

A `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser copiada para o Railway frontend, repositório, logs, navegador ou arquivo `.env` versionado.

### Cakto

| Variável | Obrigatória | Finalidade |
|---|---:|---|
| `CAKTO_CLIENT_ID` | Sim para prontidão Cakto | Identificador OAuth2 da integração. |
| `CAKTO_CLIENT_SECRET` | Sim para prontidão Cakto | Segredo OAuth2 exibido no painel Cakto. |
| `CAKTO_PRO_MONTHLY_OFFER_ID` | Sim para prontidão Cakto | Oferta server-side do Pro mensal de R$ 100,00. |
| `CAKTO_PRO_ANNUAL_OFFER_ID` | Sim para prontidão Cakto | Oferta server-side do Pro anual de R$ 1.000,00. |
| `CAKTO_PRO_MONTHLY_CHECKOUT_URL` | Sim para checkout Cakto | URL HTTPS publicada da oferta mensal. O servidor acrescenta o rastreamento interno `sck`. |
| `CAKTO_PRO_ANNUAL_CHECKOUT_URL` | Sim para checkout Cakto | URL HTTPS publicada da oferta anual. O servidor acrescenta o rastreamento interno `sck`. |
| `CAKTO_WEBHOOK_SECRET` | Sim para webhook Cakto | Segredo exclusivo usado para autenticar notificações recebidas. Deve ser diferente de `CAKTO_CLIENT_SECRET`. |
| `CAKTO_API_BASE_URL` | Não | Override exclusivo para teste local controlado; em produção usa `https://api.cakto.com.br`. |

### Stripe

| Variável | Obrigatória | Finalidade |
|---|---:|---|
| `STRIPE_SECRET_KEY` | Sim para Stripe | Chave secreta ou restrita usada somente no servidor. |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Sim para Stripe | Price server-side do Pro mensal. |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Sim para Stripe | Price server-side do Pro anual. |
| `STRIPE_WEBHOOK_SECRET` | Sim para webhook Stripe | Segredo `whsec_...` do endpoint configurado para o ambiente correspondente. |
| `STRIPE_API_BASE_URL` | Não | Override exclusivo para teste local controlado; em produção usa `https://api.stripe.com`. |

As referências de oferta e Price não são aceitas do navegador. A função server-side escolhe a referência esperada a partir do provedor e do intervalo de cobrança.

## 4. Endpoints de webhook

Após publicar as Edge Functions, configure no painel de cada provedor:

- Stripe: `https://<project-ref>.supabase.co/functions/v1/billing-webhook-stripe`;
- Cakto: `https://<project-ref>.supabase.co/functions/v1/billing-webhook-cakto`.

Nunca reutilize segredos entre desenvolvimento, homologação e produção. O endpoint Stripe valida HMAC sobre o corpo bruto e tolerância temporal. O endpoint Cakto exige o segredo configurado e o rastreamento `sck` gerado pelo checkout SolAmigo.

## 5. Matriz de ambientes

| Ambiente | Supabase | Railway | Pagamentos | Dados permitidos |
|---|---|---|---|---|
| Desenvolvimento | Projeto exclusivo de desenvolvimento | execução local | mocks ou sandbox | dados fictícios |
| Homologação | Projeto exclusivo de homologação | serviço/ambiente de staging | Cakto/Stripe de teste | dados de teste controlados |
| Produção | Projeto exclusivo de produção | serviço/ambiente de produção | credenciais de produção | dados reais de clientes |

Cada ambiente deve possuir suas próprias URLs, chaves públicas, buckets, migrations aplicadas, configurações de autenticação, produtos/ofertas, Prices, checkouts e webhooks.

## 6. Validação antes de publicar

1. Confirmar que `VITE_SUPABASE_URL` corresponde ao ambiente correto.
2. Confirmar que a chave do frontend é pública e não é `service_role`.
3. Confirmar que nenhum segredo Cakto ou Stripe usa prefixo `VITE_`.
4. Aplicar todas as migrations e publicar `billing-checkout`, `billing-webhook-stripe`, `billing-webhook-cakto` e `application-monitor`.
5. Executar `npm run build`.
6. Executar `npm start` e validar `GET /health`.
7. Confirmar login, MFA, geração de PDF e link público no ambiente publicado.
8. Invocar `billing-provider-readiness` com sessão autenticada e confirmar os provedores esperados.
9. Criar um checkout mensal e anual em sandbox sem enviar preço ou identificador comercial pelo navegador.
10. Reenviar o mesmo evento de webhook e confirmar que somente um `billing_event` foi aplicado.
11. Simular pagamento aprovado, falha, tolerância e cancelamento, validando assinatura e cota efetiva.
12. Verificar que nenhum segredo, token OAuth, chave, payload bruto ou dado de cartão aparece no bundle, logs ou painel do navegador.
