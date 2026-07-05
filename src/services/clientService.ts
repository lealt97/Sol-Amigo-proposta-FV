import { supabase } from '../lib/supabase/client';
import { Client } from '../types/client';
import { ClientFormValues } from '../lib/validations/client.schema';

export const clientService = {
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Client[];
  },

  async getClientById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as Client;
  },

  async createClient(client: ClientFormValues, userId: string) {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ 
        ...client, 
        user_id: userId,
        avg_consumption_kwh: client.avg_consumption_kwh || null
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data as Client;
  },

  async updateClient(id: string, client: ClientFormValues) {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...client,
        avg_consumption_kwh: client.avg_consumption_kwh || null
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as Client;
  },

  async deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
};
