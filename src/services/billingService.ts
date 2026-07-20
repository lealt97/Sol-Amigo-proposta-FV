import { supabase } from '../lib/supabase/client';

export type BillingInterval = 'month' | 'year';
export type BillingProvider = 'cakto' | 'stripe';

export interface ProposalQuota {
  plan_code: 'free' | 'pro';
  billing_interval: 'free' | BillingInterval;
  period_start: string;
  period_end: string;
  used: number;
  limit: number;
  remaining: number;
  warning: boolean;
}

export interface CheckoutResponse {
  provider: BillingProvider;
  checkoutUrl: string;
  reused: boolean;
}

function assertCheckoutUrl(value: unknown) {
  if (typeof value !== 'string') throw new Error('O checkout retornou uma URL inválida.');
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') throw new Error('O checkout retornou uma URL insegura.');
  return parsed.toString();
}

export const billingService = {
  async getProposalQuota(): Promise<ProposalQuota> {
    const { data, error } = await supabase.rpc('get_my_proposal_quota');
    if (error) throw error;
    if (!data || typeof data !== 'object') throw new Error('Não foi possível carregar a cota atual.');
    return data as ProposalQuota;
  },

  async startCheckout(
    interval: BillingInterval,
    provider?: BillingProvider,
  ): Promise<CheckoutResponse> {
    const { data, error } = await supabase.functions.invoke('billing-checkout', {
      body: {
        interval,
        ...(provider ? { provider } : {}),
        countryCode: 'BR',
        currency: 'BRL',
      },
    });

    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    if (data?.provider !== 'cakto' && data?.provider !== 'stripe') {
      throw new Error('O checkout retornou um provedor inválido.');
    }

    return {
      provider: data.provider,
      checkoutUrl: assertCheckoutUrl(data.checkoutUrl),
      reused: data.reused === true,
    };
  },
};
