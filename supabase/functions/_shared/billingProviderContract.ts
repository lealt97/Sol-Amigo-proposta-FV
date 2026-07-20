export const BILLING_PROVIDERS = ['cakto', 'stripe'] as const;

export type BillingProvider = (typeof BILLING_PROVIDERS)[number];
export type PaidBillingInterval = 'month' | 'year';

export interface EnvironmentReader {
  get(name: string): string | undefined;
}

export const BILLING_PROVIDER_ENVIRONMENT = {
  cakto: {
    credentials: ['CAKTO_CLIENT_ID', 'CAKTO_CLIENT_SECRET'],
    prices: {
      month: 'CAKTO_PRO_MONTHLY_OFFER_ID',
      year: 'CAKTO_PRO_ANNUAL_OFFER_ID',
    },
  },
  stripe: {
    credentials: ['STRIPE_SECRET_KEY'],
    prices: {
      month: 'STRIPE_PRO_MONTHLY_PRICE_ID',
      year: 'STRIPE_PRO_ANNUAL_PRICE_ID',
    },
  },
} as const;

export function isBillingProvider(value: unknown): value is BillingProvider {
  return typeof value === 'string'
    && BILLING_PROVIDERS.includes(value as BillingProvider);
}

export function selectBillingProvider(input: {
  requestedProvider?: unknown;
  countryCode?: string | null;
  currency?: string | null;
}): BillingProvider {
  if (input.requestedProvider !== undefined && input.requestedProvider !== null) {
    if (!isBillingProvider(input.requestedProvider)) {
      throw new Error('billing_provider_invalid');
    }
    return input.requestedProvider;
  }

  const countryCode = String(input.countryCode || '').trim().toUpperCase();
  const currency = String(input.currency || '').trim().toUpperCase();

  if (countryCode === 'BR' || currency === 'BRL') return 'cakto';
  return 'stripe';
}

export function getProviderPriceReference(
  provider: BillingProvider,
  interval: PaidBillingInterval,
  environment: EnvironmentReader,
): string | null {
  const key = BILLING_PROVIDER_ENVIRONMENT[provider].prices[interval];
  const value = environment.get(key)?.trim();
  return value || null;
}

export function getMissingProviderConfiguration(
  provider: BillingProvider,
  environment: EnvironmentReader,
): string[] {
  const definition = BILLING_PROVIDER_ENVIRONMENT[provider];
  const requiredKeys = [
    ...definition.credentials,
    definition.prices.month,
    definition.prices.year,
  ];

  return requiredKeys.filter((key) => !environment.get(key)?.trim());
}

export function isProviderFullyConfigured(
  provider: BillingProvider,
  environment: EnvironmentReader,
): boolean {
  return getMissingProviderConfiguration(provider, environment).length === 0;
}
