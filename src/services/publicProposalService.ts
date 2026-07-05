import { supabase } from '../lib/supabase/client';
import { proposalEventService } from './proposalEventService';

export const publicProposalService = {
  async getProposalByToken(token: string) {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        id, code, title, status, final_price, pdf_url, public_token,
        accepted_at, rejected_at, rejection_reason, public_viewed_at,
        created_at,
        client_id,
        user_id,
        client:clients(name, city, state, document),
        profile:profiles(company_name, logo_url, seller_name, seller_phone, seller_email, website, company_email, default_validity_days, default_margin_percentage),
        solar:solar_system_calculations(*)
      `)
      .eq('public_token', token)
      .single();

    if (error) {
       console.error('Error fetching public proposal via select:', error);
       const { data: rpcData, error: rpcError } = await supabase
         .rpc('get_public_proposal', { p_token: token });
       if (rpcError) throw rpcError;
       return rpcData;
    }

    if (data && !data.public_viewed_at) {
      await supabase
        .from('proposals')
        .update({ public_viewed_at: new Date().toISOString() })
        .eq('public_token', token);
    }
    
    // Log view event
    if (data && data.id) {
      await proposalEventService.logEvent(data.id, 'public_viewed', 'Cliente visualizou a proposta pelo link público');
    }
    
    let company = { name: 'Empresa', logo_url: '' };
    if (data?.user_id) {
       const { data: profile } = await supabase
         .from('profiles')
         .select('company_name, logo_url')
         .eq('id', data.user_id)
         .single();
       if (profile) {
         company = { name: profile.company_name, logo_url: profile.logo_url || '' };
       }
    }

    // Adapt solar to array if needed or use single object
    const solarCalc = Array.isArray(data.solar) ? data.solar[0] : data.solar;
    
    return { ...data, company, solar: solarCalc };
  },

  async updateStatus(token: string, status: 'approved' | 'rejected', reason?: string, proposalId?: string) {
    let updatePayload: any = { status };
    if (status === 'approved') {
      updatePayload.accepted_at = new Date().toISOString();
    } else {
      updatePayload.rejected_at = new Date().toISOString();
      updatePayload.rejection_reason = reason;
    }
    
    updatePayload.client_user_agent = navigator.userAgent;

    const { error } = await supabase
      .from('proposals')
      .update(updatePayload)
      .eq('public_token', token)
      .eq('status', 'pending');

    if (error) {
       console.error('Error updating via table, trying RPC:', error);
       const { error: rpcError } = await supabase
         .rpc('update_public_proposal_status', { 
            p_token: token, 
            p_status: status, 
            p_reason: reason || null,
            p_ip: null,
            p_user_agent: navigator.userAgent
         });
       if (rpcError) throw rpcError;
    }
    
    if (proposalId) {
      await proposalEventService.logEvent(
        proposalId, 
        status === 'approved' ? 'accepted' : 'rejected', 
        status === 'approved' ? 'Cliente aprovou a proposta' : 'Cliente recusou a proposta',
        reason ? { reason } : undefined
      );
    }
  }
};
