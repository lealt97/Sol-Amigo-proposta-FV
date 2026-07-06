import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ProposalDocument } from '../../components/pdf/ProposalDocument';
import { Proposal } from '../../types/proposal';
import { supabase } from '../supabase/client';
import { pdfModelService } from '../../services/pdfModelService';
import { generateSvgCoverImage } from './utils/svgToImage';

export async function generateAndUploadPdf(proposal: Proposal): Promise<string | null> {
  try {
    let coverImage: string | null = null;
    
    // Attempt to load user's default template
    try {
      const models = await pdfModelService.getUserModels(proposal.user_id);
      const defaultModel = models.find(m => m.is_default) || models[0];
      if (defaultModel) {
        coverImage = await generateSvgCoverImage(defaultModel, proposal);
      }
    } catch (templateError) {
      console.warn('Could not load custom cover template, falling back to default', templateError);
    }

    // Generate PDF blob
    const asPdf = pdf(<ProposalDocument proposal={proposal} coverImage={coverImage} />);
    const blob = await asPdf.toBlob();
    
    // Create unique filename
    const timestamp = new Date().getTime();
    const fileName = `proposta-${proposal.code || proposal.id.substring(0, 8)}-${timestamp}.pdf`;
    const filePath = `${proposal.user_id}/${fileName}`;
    
    // Check if bucket exists, if not, it will fail but we assume 'proposals' bucket exists
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('proposals')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF to storage:', uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('proposals')
      .getPublicUrl(filePath);

    // Update proposal with PDF URL
    if (urlData?.publicUrl) {
      const { error: updateError } = await supabase
        .from('proposals')
        .update({ pdf_url: urlData.publicUrl })
        .eq('id', proposal.id);
        
      if (updateError) {
        console.error('Error updating proposal with PDF URL:', updateError);
      }
      
      return urlData.publicUrl;
    }

    return null;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}
