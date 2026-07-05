export interface ProposalLoad {
  id: string;
  proposal_id: string;
  equipment_name: string;
  power_watts: number;
  quantity: number;
  hours_per_day: number;
  daily_consumption: number;
  created_at: string;
  updated_at: string;
}

export interface ProposalLoadInput {
  equipment_name: string;
  power_watts: number;
  quantity: number;
  hours_per_day: number;
}
