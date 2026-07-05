export interface Client {
  id: string;
  user_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  cep: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  number: string | null;
  neighborhood: string | null;
  complement: string | null;
  avg_consumption_kwh: number | null;
  notes: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}
