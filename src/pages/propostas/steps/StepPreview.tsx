import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { clientService } from '../../../services/clientService';
import { Client } from '../../../types/client';
import { FileText, CheckCircle2 } from 'lucide-react';

export function StepPreview() {
  const { control } = useFormContext();
  const title = useWatch({ control, name: 'title' });
  const client_id = useWatch({ control, name: 'client_id' });
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    async function loadClient() {
      if (client_id) {
        try {
          const data = await clientService.getClientById(client_id);
          setClient(data);
        } catch (err) {
          console.error(err);
        }
      }
    }
    loadClient();
  }, [client_id]);

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-medium text-brand-dark mb-2">Tudo pronto para finalizar</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Sua proposta está completa. Ao clicar em finalizar, ela será salva e você poderá gerar o documento PDF e compartilhar com o cliente através do link público.
        </p>
      </div>

      <div className="border border-brand-border rounded-lg bg-gray-50 p-6 max-w-lg mx-auto">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Resumo</h3>
        
        <div className="space-y-3">
          <div>
            <span className="text-xs text-slate-500 block mb-1">Título</span>
            <span className="text-sm text-brand-dark font-medium">{title || 'Sem título'}</span>
          </div>
          
          <div>
            <span className="text-xs text-slate-500 block mb-1">Cliente</span>
            <span className="text-sm text-brand-dark">{client?.name || 'Não selecionado'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
