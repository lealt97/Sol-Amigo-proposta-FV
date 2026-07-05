import { supabase } from '../lib/supabase/client';
import { ProposalEventType } from '../types/proposalEvent';

export const proposalEventService = {
  async logEvent(
    proposal_id: string,
    event_type: ProposalEventType,
    description?: string,
    metadata?: Record<string, any>
  ) {
    try {
      let user_id = undefined;
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        user_id = session.session.user.id;
      }

      await supabase.from('proposal_events').insert([{
        proposal_id,
        user_id,
        event_type,
        description,
        metadata
      }]);
    } catch (err) {
      console.error('Error logging proposal event:', err);
    }
  },

  async getEvents(proposal_id: string) {
    const { data, error } = await supabase
      .from('proposal_events')
      .select('*')
      .eq('proposal_id', proposal_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
