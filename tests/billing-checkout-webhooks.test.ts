import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const MIGRATION = 'supabase/migrations/20260720230000_p1_checkout_and_provider_events.sql';
const CHECKOUT = 'supabase/functions/billing-checkout/index.ts';
const STRIPE_WEBHOOK = 'supabase/functions/billing-webhook-stripe/index.ts';
const CAKTO_WEBHOOK = 'supabase/functions/billing-webhook-cakto/index.ts';
const CONFIG = 'supabase/config.toml';

const read = (path: string) => readFile(path, 'utf8');

test('checkout é autenticado, idempotente e nunca aceita preço do navegador', async () => {
  const source = await read(CHECKOUT);

  assert.match(source, /admin\.auth\.getUser\(accessToken\)/);
  assert.match(source, /createIdempotencyKey/);
  assert.match(source, /'Idempotency-Key': input\.idempotencyKey/);
  assert.match(source, /getProviderPriceReference\('stripe', input\.interval/);
  assert.match(source, /CAKTO_PRO_MONTHLY_CHECKOUT_URL/);
  assert.match(source, /searchParams\.set\('sck', `solamigo\./);
  assert.match(source, /APP_BASE_URL/);
  assert.doesNotMatch(source, /body\.price/);
  assert.doesNotMatch(source, /body\.priceId/);
  assert.doesNotMatch(source, /body\.offerId/);
});

test('sessões de checkout ficam isoladas e eventos são aplicados exatamente uma vez', async () => {
  const migration = await read(MIGRATION);

  assert.match(migration, /create table if not exists public\.billing_checkout_sessions/);
  assert.match(migration, /unique \(account_id, provider, idempotency_key\)/);
  assert.match(migration, /using \(auth\.uid\(\) = account_id\)/);
  assert.match(migration, /create or replace function public\.apply_billing_provider_event/);
  assert.match(migration, /on conflict \(provider, provider_event_id\)[\s\S]*do nothing/);
  assert.match(migration, /grant execute on function public\.apply_billing_provider_event[\s\S]*to service_role/);
  assert.doesNotMatch(migration, /grant execute on function public\.apply_billing_provider_event[\s\S]*to authenticated/);
});

test('webhook Stripe usa corpo bruto, HMAC SHA-256 e tolerância temporal', async () => {
  const source = await read(STRIPE_WEBHOOK);

  assert.match(source, /const rawBody = await request\.text\(\)/);
  assert.match(source, /request\.headers\.get\('stripe-signature'\)/);
  assert.match(source, /crypto\.subtle\.importKey/);
  assert.match(source, /name: 'HMAC', hash: 'SHA-256'/);
  assert.match(source, /SIGNATURE_TOLERANCE_SECONDS = 300/);
  assert.match(source, /apply_billing_provider_event/);
  assert.doesNotMatch(source, /await request\.json\(\)/);
});

test('webhook Cakto exige segredo, rastreamento da conta e deduplicação', async () => {
  const source = await read(CAKTO_WEBHOOK);

  assert.match(source, /CAKTO_WEBHOOK_SECRET/);
  assert.match(source, /constantTimeEqual\(presentedSecret, webhookSecret\)/);
  assert.match(source, /\^solamigo\\\./);
  assert.match(source, /eventType}:sha256/);
  assert.match(source, /apply_billing_provider_event/);
  assert.doesNotMatch(source, /service_role[^\n]*payload/i);
});

test('configuração separa função autenticada de endpoints públicos assinados', async () => {
  const config = await read(CONFIG);

  assert.match(config, /\[functions\.billing-checkout\][\s\S]*verify_jwt = true/);
  assert.match(config, /\[functions\.billing-webhook-stripe\][\s\S]*verify_jwt = false/);
  assert.match(config, /\[functions\.billing-webhook-cakto\][\s\S]*verify_jwt = false/);
});
