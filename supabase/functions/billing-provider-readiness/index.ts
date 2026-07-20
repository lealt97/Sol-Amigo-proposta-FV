import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  BILLING_PROVIDERS,
  BillingProvider,
  isBillingProvider,
} from '../_shared/billingProviderContract.ts';
import { probeBillingProvider } from '../_shared/billingProviderClients.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  const accessToken = readBearerToken(request);
  if (!accessToken) {
    return jsonResponse({ error: 'Sessão inválida.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('billing-provider-readiness: missing Supabase server credentials');
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

  let requestedProvider: BillingProvider | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.provider !== undefined && body?.provider !== null) {
      if (!isBillingProvider(body.provider)) {
        return jsonResponse({ error: 'Provedor de pagamento inválido.' }, 400);
      }
      requestedProvider = body.provider;
    }
  } catch {
    return jsonResponse({ error: 'Corpo da requisição inválido.' }, 400);
  }

  const providers = requestedProvider ? [requestedProvider] : [...BILLING_PROVIDERS];
  const environment = {
    get: (name: string) => Deno.env.get(name),
  };

  const results = await Promise.all(
    providers.map((provider) => probeBillingProvider(provider, environment)),
  );

  return jsonResponse({
    ready: results.every((result) => result.configured && result.reachable),
    providers: results,
  });
});
