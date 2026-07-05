export type ProposalEventType = 
  | 'created' 
  | 'updated' 
  | 'duplicated' 
  | 'pdf_generated' 
  | 'whatsapp_sent' 
  | 'public_viewed' 
  | 'accepted' 
  | 'rejected' 
  | 'status_changed';

export interface ProposalEvent {
  id: string;
  proposal_id: string;
  user_id: string | null;
  event_type: ProposalEventType;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}
