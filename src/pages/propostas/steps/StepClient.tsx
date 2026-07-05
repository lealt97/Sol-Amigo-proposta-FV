import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { clientService } from '../../../services/clientService';
import { Client } from '../../../types/client';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function StepClient() {
  const { register, formState: { errors } } = useFormContext();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadClients() {
      try {
        const data = await clientService.getClients();
        setClients(data);
      } catch (err) {
        console.error('Erro ao carregar clientes', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClients();
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Título da Proposta (Opcional)</Label>
        <Input id="title" placeholder="Ex: Sistema Solar Residência Silva" {...register('title')} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="client_id">Cliente *</Label>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="text-brand-blue h-auto p-0 hover:text-brand-blue"
            onClick={() => navigate('/clientes/novo')}
          >
            + Novo Cliente
          </Button>
        </div>
        <Select id="client_id" {...register('client_id')}>
          <option value="">Selecione um cliente...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} {client.document ? `(${client.document})` : ''}
            </option>
          ))}
        </Select>
        {errors.client_id && <p className="text-sm text-red-600">{errors.client_id.message as string}</p>}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Carregando clientes...</p>}
      
      {!isLoading && clients.length === 0 && (
        <div className="p-4 border border-brand-border rounded-lg bg-gray-50 text-center">
          <p className="text-sm text-slate-500 mb-4">Você ainda não tem clientes cadastrados.</p>
          <Button type="button" onClick={() => navigate('/clientes/novo')}>
            Cadastrar Primeiro Cliente
          </Button>
        </div>
      )}
    </div>
  );
}
