import { supabase } from '../lib/supabase/client';
import { PdfCoverTemplate, PdfTemplate } from '../types/pdfDesign';

export const pdfDesignService = {
  async getCoverTemplates(): Promise<PdfCoverTemplate[]> {
    const { data, error } = await supabase
      .from('pdf_cover_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (error) throw error;
    return data || [];
  },

  async getUserTemplates(): Promise<PdfTemplate[]> {
    const { data, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  },

  async getTemplate(id: string): Promise<PdfTemplate | null> {
    const { data, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },

  async getDefaultTemplate(): Promise<PdfTemplate | null> {
    const { data, error } = await supabase
      .from('pdf_templates')
      .select('*')
      .eq('is_default', true)
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  async saveTemplate(template: Partial<PdfTemplate>): Promise<PdfTemplate> {
    const isNew = !template.id;
    let data;
    
    // If setting as default, we might need to unset others later, but for now we'll do it on the client/service.
    if (template.is_default) {
      await supabase
        .from('pdf_templates')
        .update({ is_default: false })
        .neq('id', template.id || '00000000-0000-0000-0000-000000000000'); // unset all others for this user
    }

    if (isNew) {
      const { data: insertData, error } = await supabase
        .from('pdf_templates')
        .insert([template])
        .select()
        .single();
      if (error) throw error;
      data = insertData;
    } else {
      const { data: updateData, error } = await supabase
        .from('pdf_templates')
        .update({
          ...template,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id)
        .select()
        .single();
      if (error) throw error;
      data = updateData;
    }

    return data;
  },
  
  async setDefaultTemplate(id: string): Promise<void> {
    // Unset all
    await supabase.from('pdf_templates').update({ is_default: false }).neq('id', id);
    // Set one
    await supabase.from('pdf_templates').update({ is_default: true }).eq('id', id);
  },

  async uploadAsset(file: File, folder: string): Promise<string> {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('pdf-assets')
      .upload(filePath, file);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('pdf-assets')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }
};
