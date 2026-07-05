const fs = require('fs');
const content = fs.readFileSync('src/pages/propostas/ProposalDetails.tsx', 'utf8');

const waHandler = `
  const handleSendWhatsApp = async () => {
    if (!proposal) return;

    if (!proposal.client?.phone) {
      alert('O cliente não possui um telefone cadastrado. Por favor, edite o cadastro do cliente e adicione o número.');
      return;
    }

    if (!proposal.pdf_url) {
      alert('Por favor, gere o PDF da proposta antes de enviá-la.');
      return;
    }

    let publicToken = proposal.public_token;
    
    // Atualiza BD se necessário (draft -> pending, set public_token e sent_whatsapp_at)
    const updates: any = {
      sent_whatsapp_at: new Date().toISOString()
    };
    
    if (!publicToken) {
      publicToken = crypto.randomUUID();
      updates.public_token = publicToken;
    }
    
    if (proposal.status === 'draft') {
      updates.status = 'pending';
    }

    try {
      const { error: updateError } = await supabase
        .from('proposals')
        .update(updates)
        .eq('id', proposal.id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setProposal({
        ...proposal,
        ...updates
      });

    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar dados da proposta antes do envio.');
      return;
    }

    // Build WhatsApp message
    const phoneNum = proposal.client.phone.replace(/\\D/g, ''); // Limpa máscara
    const publicLink = \`\${window.location.origin}/proposta/\${publicToken}\`;
    
    const power = proposal.solar?.installed_power_kwp ? proposal.solar.installed_power_kwp.toFixed(2) : '0';
    const savings = formatMoney(proposal.solar?.estimated_monthly_savings);
    const finalPrice = formatMoney(proposal.final_price);
    const payback = proposal.solar?.payback_formatted || '0 anos';
    
    const message = \`Olá, \${proposal.client.name}! Tudo bem?\\n\\nSegue sua proposta personalizada de energia solar fotovoltaica:\\n\\nPotência do sistema: \${power} kWp\\nEconomia mensal estimada: \${savings}\\nInvestimento: \${finalPrice}\\nPayback estimado: \${payback}\\n\\nVocê pode visualizar e aprovar sua proposta pelo link abaixo:\\n\${publicLink}\\n\\nQualquer dúvida, estou à disposição.\`;
    
    // Copy to clipboard fallback
    try {
      await navigator.clipboard.writeText(message);
    } catch (e) {
      console.error('Falha ao copiar para clipboard', e);
    }

    const waUrl = \`https://wa.me/\${phoneNum}?text=\${encodeURIComponent(message)}\`;
    window.open(waUrl, '_blank');
  };
`;

const updatedContent = content.replace(
  '  const handleGeneratePdf = async () => {',
  waHandler + '\n  const handleGeneratePdf = async () => {'
);

fs.writeFileSync('src/pages/propostas/ProposalDetails.tsx', updatedContent);
