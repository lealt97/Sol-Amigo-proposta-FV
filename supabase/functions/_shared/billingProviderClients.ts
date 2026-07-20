import {
  BillingProvider,
  EnvironmentReader,
  getMissingProviderConfiguration,
} from './billingProviderContract.ts';

export interface BillingProviderProbeResult {
  provider: BillingProvider;
  configured: boolean;
  reachable: boolean;
  errorCode?: 'not_configured' | 'authentication_failed' | 'provider_unavailable';
}

type Fetcher = typeof fetch;

const CAKTO_DEFAULT_BASE_URL = 'https://api.cakto.com.br';
const STRIPE_DEFAULT_BASE_URL = 'https://api.stripe.com';

async function fetchWithTimeout(
  fetcher: Fetcher,
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 8_000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function probeCakto(environment: EnvironmentReader, fetcher: Fetcher) {
  const clientId = environment.get('CAKTO_CLIENT_ID')!.trim();
  const clientSecret = environment.get('CAKTO_CLIENT_SECRET')!.trim();
  const baseUrl = (environment.get('CAKTO_API_BASE_URL') || CAKTO_DEFAULT_BASE_URL).replace(/\/$/, '');

  const response = await fetchWithTimeout(
    fetcher,
    `${baseUrl}/public_api/token/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );

  if (response.status === 400 || response.status === 401 || response.status === 403) {
    return { reachable: true, authenticated: false };
  }

  if (!response.ok) {
    return { reachable: false, authenticated: false };
  }

  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  const accessToken = typeof payload?.access_token === 'string' ? payload.access_token : '';
  return { reachable: true, authenticated: accessToken.length > 0 };
}

async function probeStripe(environment: EnvironmentReader, fetcher: Fetcher) {
  const secretKey = environment.get('STRIPE_SECRET_KEY')!.trim();
  const baseUrl = (environment.get('STRIPE_API_BASE_URL') || STRIPE_DEFAULT_BASE_URL).replace(/\/$/, '');

  const response = await fetchWithTimeout(
    fetcher,
    `${baseUrl}/v1/customers?limit=1`,
    {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${secretKey}:`)}`,
        Accept: 'application/json',
      },
    },
  );

  if (response.status === 401 || response.status === 403) {
    return { reachable: true, authenticated: false };
  }

  return { reachable: response.ok, authenticated: response.ok };
}

export async function probeBillingProvider(
  provider: BillingProvider,
  environment: EnvironmentReader,
  fetcher: Fetcher = fetch,
): Promise<BillingProviderProbeResult> {
  if (getMissingProviderConfiguration(provider, environment).length > 0) {
    return {
      provider,
      configured: false,
      reachable: false,
      errorCode: 'not_configured',
    };
  }

  try {
    const result = provider === 'cakto'
      ? await probeCakto(environment, fetcher)
      : await probeStripe(environment, fetcher);

    if (!result.authenticated) {
      return {
        provider,
        configured: true,
        reachable: result.reachable,
        errorCode: result.reachable ? 'authentication_failed' : 'provider_unavailable',
      };
    }

    return {
      provider,
      configured: true,
      reachable: true,
    };
  } catch {
    return {
      provider,
      configured: true,
      reachable: false,
      errorCode: 'provider_unavailable',
    };
  }
}
