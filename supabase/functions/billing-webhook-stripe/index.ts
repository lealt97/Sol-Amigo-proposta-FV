import { createClient } from 'npm:@supabase/supabase-js@2';

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
};

const SIGNATURE_TOLERANCE_SECONDS = 300;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3));

  const timestampNumber = Number(timestamp);
  if (!timestamp || !Number.isFinite(timestampNumber) || signatures.length === 0) return false;

  const age = Math.abs(Math.floor(Date.now() / 1000) - timestampNumber);
  if (age > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return signatures.some((signature) => constantTimeEqual(signature, expected));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readUnixDate(record: Record<string, unknown>, key: string) {
  const value = Number(record[key] || 0);
  return Number.isFinite(value) && value > 0 ? new Date(value * 1000).toISOString() : null;
}

function resolveMetadata(object: Record<string, unknown>) {
  return asRecord(object.metadata);
}

function resolveStripeInterval(object: Record<string, unknown>): 'month' | 'year' | null {
  const metadata = resolveMetadata(object);
  const explicit = readString(metadata, 'billing_interval');
  if (explicit === 'month' || explicit === 'year') return explicit;

  const items = asRecord(object.items);
  const data = Array.isArray(items.data) ? items.data : [];
  const first = asRecord(data[0]);
  const price = asRecord(first.price);
  const recurring = asRecord(price.recurring);
  const recurringInterval = readString(recurring, 'interval');
  return recurringInterval === 'month' || recurringInterval === 'year' ? recurringInterval : null;
}

function resolveStripeAccountId(object: Record<string, unknown>) {
  const metadata = resolveMetadata(object);
  return readString(metadata, 'account_id') || readString(object, 'client_reference_id');
}

function mapStripeStatus(eventType: string, object: Record<string, unknown>) {
  if (eventType === 'customer.subscription.deleted') return 'canceled';
  if (eventType === 'invoice.paid') return 'active';
  if (eventType === 'invoice.payment_failed') return 'past_due';

  if (eventType === 'customer.subscription.created' || eventType === 'customer.subscription.updated') {
    const status = readString(object, 'status');
    if (status === 'incomplete_expired') return 'canceled';
    if (status === 'paused') return 'past_due';
    if (status && ['incomplete', 'trialing', 'active', 'past_due', 'unpaid', 'canceled'].includes(status)) {
      return status;
    }
  }

  return null;
}

function resolveStripeSubscriptionId(eventType: string, object: Record<string, unknown>) {
  if (eventType.startsWith('customer.subscription.')) return readString(object, 'id');
  const subscription = object.subscription;
  if (typeof subscription === 'string') return subscription;
  return readString(asRecord(subscription), 'id');
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Método não permitido.' }, 405);

  const webhookSecret = String(Deno.env.get('STRIPE_WEBHOOK_SECRET') || '').trim();
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!webhookSecret || !supabaseUrl || !serviceRoleKey) {
    console.error('billing-webhook-stripe: missing server configuration');
    return jsonResponse({ error: 'Serviço indisponível.' }, 503);
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') || '';
  if (!await verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return jsonResponse({ error: 'Assinatura inválida.' }, 400);
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Payload inválido.' }, 400);
  }

  const eventId = readString(event, 'id');
  const eventType = readString(event, 'type');
  const object = asRecord(asRecord(asRecord(event.data).object));
  if (!eventId || !eventType) return jsonResponse({ error: 'Evento inválido.' }, 400);

  const supportedEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed',
  ]);
  if (!supportedEvents.has(eventType)) return jsonResponse({ received: true, ignored: true });

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  let accountId = resolveStripeAccountId(object);
  const providerSubscriptionId = resolveStripeSubscriptionId(eventType, object);
  const providerCustomerId = typeof object.customer === 'string'
    ? object.customer
    : readString(asRecord(object.customer), 'id');

  if (!accountId && providerSubscriptionId) {
    const { data } = await admin
      .from('subscriptions')
      .select('account_id')
      .eq('provider', 'stripe')
      .eq('provider_subscription_id', providerSubscriptionId)
      .maybeSingle();
    accountId = data?.account_id || null;
  }

  if (!accountId && providerCustomerId) {
    const { data } = await admin
      .from('subscriptions')
      .select('account_id')
      .eq('provider', 'stripe')
      .eq('provider_customer_id', providerCustomerId)
      .maybeSingle();
    accountId = data?.account_id || null;
  }

  if (!accountId) {
    console.error('billing-webhook-stripe: account not resolved', { eventId, eventType });
    return jsonResponse({ error: 'Conta não identificada.' }, 422);
  }

  const status = mapStripeStatus(eventType, object);
  let interval = resolveStripeInterval(object);
  if (!interval && accountId) {
    const { data } = await admin
      .from('subscriptions')
      .select('billing_interval')
      .eq('account_id', accountId)
      .maybeSingle();
    interval = data?.billing_interval === 'month' || data?.billing_interval === 'year'
      ? data.billing_interval
      : null;
  }

  const graceDays = Math.min(30, Math.max(0, Number(Deno.env.get('BILLING_GRACE_DAYS') || 3)));
  const gracePeriodEndsAt = status === 'past_due'
    ? new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await admin.rpc('apply_billing_provider_event', {
    p_provider: 'stripe',
    p_provider_event_id: eventId,
    p_event_type: eventType,
    p_account_id: accountId,
    p_provider_customer_id: providerCustomerId,
    p_provider_subscription_id: providerSubscriptionId,
    p_billing_interval: interval,
    p_status: status,
    p_current_period_start: readUnixDate(object, 'current_period_start'),
    p_current_period_end: readUnixDate(object, 'current_period_end'),
    p_grace_period_ends_at: gracePeriodEndsAt,
    p_metadata: {
      object_id: readString(object, 'id'),
      livemode: event.livemode === true,
    },
  });

  if (error) {
    console.error('billing-webhook-stripe: apply event failed', {
      eventId,
      eventType,
      code: error.code,
    });
    return jsonResponse({ error: 'Falha ao processar evento.' }, 500);
  }

  return jsonResponse({ received: true, result: data });
});
