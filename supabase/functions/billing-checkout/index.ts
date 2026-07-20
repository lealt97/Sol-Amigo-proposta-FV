import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  BillingProvider,
  getProviderPriceReference,
  isBillingProvider,
  selectBillingProvider,
} from '../_shared/billingProviderContract.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
};

const CHECKOUT_REUSE_MINUTES = 30;
const VALID_INTERVALS = new Set(['month', 'year']);

type BillingInterval = 'month' | 'year';

type CheckoutResult = {
  providerSessionId: string;
  checkoutUrl: string;
  expiresAt: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get('authorization') || '';
  const [scheme, token] = authorization.trim().split(/\s+/, 2);
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

function readApplicationBaseUrl() {
  const raw = String(Deno.env.get('APP_BASE_URL') || '').trim();
  const parsed = new URL(raw);
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
    throw new Error('app_base_url_invalid');
  }
  return parsed.origin;
}

function createIdempotencyKey(
  accountId: string,
  provider: BillingProvider,
  interval: BillingInterval,
) {
  const bucket = Math.floor(Date.now() / (CHECKOUT_REUSE_MINUTES * 60 * 1000));
  return `checkout:${accountId}:${provider}:${interval}:${bucket}`;
}

function validateCheckoutUrl(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) {
    throw new Error('checkout_url_invalid');
  }

  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('checkout_url_invalid');
  return parsed.toString();
}

async function createStripeCheckout(input: {
  accountId: string;
  email: string | null;
  interval: BillingInterval;
  idempotencyKey: string;
  customerId: string | null;
  appBaseUrl: string;
}): Promise<CheckoutResult> {
  const environment = { get: (name: string) => Deno.env.get(name) };
  const secretKey = String(Deno.env.get('STRIPE_SECRET_KEY') || '').trim();
  const priceId = getProviderPriceReference('stripe', input.interval, environment);
  if (!secretKey || !priceId) throw new Error('stripe_not_configured');

  const body = new URLSearchParams({
    mode: 'subscription',
    success_url: `${input.appBaseUrl}/configuracoes?tab=assinatura&checkout=success`,
    cancel_url: `${input.appBaseUrl}/planos?checkout=cancelled`,
    client_reference_id: input.accountId,
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'metadata[account_id]': input.accountId,
    'metadata[billing_interval]': input.interval,
    'subscription_data[metadata][account_id]': input.accountId,
    'subscription_data[metadata][billing_interval]': input.interval,
    billing_address_collection: 'auto',
    allow_promotion_codes: 'true',
  });

  if (input.customerId) {
    body.set('customer', input.customerId);
  } else if (input.email) {
    body.set('customer_email', input.email);
  }

  const baseUrl = String(Deno.env.get('STRIPE_API_BASE_URL') || 'https://api.stripe.com').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/v1/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': input.idempotencyKey,
    },
    body,
  });

  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) {
    console.error('billing-checkout: Stripe checkout failed', { status: response.status });
    throw new Error(response.status === 401 || response.status === 403
      ? 'stripe_authentication_failed'
      : 'stripe_checkout_failed');
  }

  const sessionId = typeof payload?.id === 'string' ? payload.id : '';
  const checkoutUrl = validateCheckoutUrl(payload?.url);
  const expiresAtUnix = Number(payload?.expires_at || 0);
  const expiresAt = Number.isFinite(expiresAtUnix) && expiresAtUnix > 0
    ? new Date(expiresAtUnix * 1000).toISOString()
    : new Date(Date.now() + CHECKOUT_REUSE_MINUTES * 60 * 1000).toISOString();

  if (!sessionId) throw new Error('stripe_checkout_invalid_response');
  return { providerSessionId: sessionId, checkoutUrl, expiresAt };
}

function createCaktoCheckout(input: {
  accountId: string;
  interval: BillingInterval;
  idempotencyKey: string;
}): CheckoutResult {
  const variable = input.interval === 'month'
    ? 'CAKTO_PRO_MONTHLY_CHECKOUT_URL'
    : 'CAKTO_PRO_ANNUAL_CHECKOUT_URL';
  const configuredUrl = String(Deno.env.get(variable) || '').trim();
  if (!configuredUrl) throw new Error('cakto_checkout_not_configured');

  const parsed = new URL(validateCheckoutUrl(configuredUrl));
  parsed.searchParams.set('sck', `solamigo.${input.accountId}.${input.interval}`);

  return {
    providerSessionId: `cakto-link:${input.idempotencyKey}`,
    checkoutUrl: parsed.toString(),
    expiresAt: new Date(Date.now() + CHECKOUT_REUSE_MINUTES * 60 * 1000).toISOString(),
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  const accessToken = readBearerToken(request);
  if (!accessToken) return jsonResponse({ error: 'Sessão inválida.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('billing-checkout: missing Supabase server credentials');
    return jsonResponse({ error: 'Serviço indisponível.' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Sessão inválida.' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
  }

  const interval = body.interval;
  if (typeof interval !== 'string' || !VALID_INTERVALS.has(interval)) {
    return jsonResponse({ error: 'Intervalo de cobrança inválido.' }, 400);
  }

  if (body.provider !== undefined && body.provider !== null && !isBillingProvider(body.provider)) {
    return jsonResponse({ error: 'Provedor de pagamento inválido.' }, 400);
  }

  const provider = selectBillingProvider({
    requestedProvider: body.provider,
    countryCode: typeof body.countryCode === 'string' ? body.countryCode : 'BR',
    currency: typeof body.currency === 'string' ? body.currency : 'BRL',
  });
  const typedInterval = interval as BillingInterval;
  const accountId = userData.user.id;
  const idempotencyKey = createIdempotencyKey(accountId, provider, typedInterval);

  try {
    const { data: existing } = await admin
      .from('billing_checkout_sessions')
      .select('checkout_url, expires_at')
      .eq('account_id', accountId)
      .eq('provider', provider)
      .eq('billing_interval', typedInterval)
      .eq('status', 'created')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.checkout_url) {
      return jsonResponse({
        provider,
        checkoutUrl: existing.checkout_url,
        reused: true,
      });
    }

    const appBaseUrl = readApplicationBaseUrl();
    let result: CheckoutResult;

    if (provider === 'stripe') {
      const { data: subscription } = await admin
        .from('subscriptions')
        .select('provider_customer_id')
        .eq('account_id', accountId)
        .maybeSingle();

      result = await createStripeCheckout({
        accountId,
        email: userData.user.email || null,
        interval: typedInterval,
        idempotencyKey,
        customerId: subscription?.provider_customer_id || null,
        appBaseUrl,
      });
    } else {
      result = createCaktoCheckout({
        accountId,
        interval: typedInterval,
        idempotencyKey,
      });
    }

    const { error: insertError } = await admin
      .from('billing_checkout_sessions')
      .insert({
        account_id: accountId,
        provider,
        billing_interval: typedInterval,
        idempotency_key: idempotencyKey,
        provider_session_id: result.providerSessionId,
        checkout_url: result.checkoutUrl,
        expires_at: result.expiresAt,
        metadata: {
          source: 'plans_page',
        },
      });

    if (insertError) {
      const { data: concurrent } = await admin
        .from('billing_checkout_sessions')
        .select('checkout_url')
        .eq('account_id', accountId)
        .eq('provider', provider)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      if (!concurrent?.checkout_url) throw insertError;
      return jsonResponse({ provider, checkoutUrl: concurrent.checkout_url, reused: true });
    }

    await admin.from('billing_events').insert({
      account_id: accountId,
      event_type: 'checkout.created',
      source: 'user',
      provider,
      provider_event_id: `checkout:${result.providerSessionId}`,
      metadata: {
        billing_interval: typedInterval,
      },
    });

    return jsonResponse({
      provider,
      checkoutUrl: result.checkoutUrl,
      reused: false,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'checkout_failed';
    console.error('billing-checkout failed', { code, accountId, provider, interval: typedInterval });

    const configurationError = code.includes('not_configured') || code === 'app_base_url_invalid';
    return jsonResponse({
      error: configurationError
        ? 'O checkout ainda não está configurado para este provedor.'
        : 'Não foi possível iniciar o checkout. Tente novamente em instantes.',
      code,
    }, configurationError ? 503 : 502);
  }
});
