export const kpiData = {
  clientesAtivos: 42,
  propostasMes: 15,
  propostasTotal: 128,
  valorVendidoAno: 845000,
  lucroAcumulado: 211250,
};

export type PropostaStatus = 'Rascunho' | 'Pendente' | 'Aprovada' | 'Recusada';

export interface PropostaRecente {
  id: string;
  cliente: string;
  potencia: number; // in kWp
  valor: number;
  status: PropostaStatus;
  data: string;
}

export const propostasRecentes: PropostaRecente[] = [
  { id: '1', cliente: 'Residencial Souza', potencia: 8.4, valor: 32400, status: 'Aprovada', data: '2026-07-02T10:00:00Z' },
  { id: '2', cliente: 'Supermercado Preço Bom', potencia: 75.0, valor: 215000, status: 'Pendente', data: '2026-07-01T14:30:00Z' },
  { id: '3', cliente: 'Sítio Bela Vista', potencia: 12.5, valor: 48900, status: 'Rascunho', data: '2026-07-04T09:15:00Z' },
  { id: '4', cliente: 'Consultório Odonto', potencia: 5.2, valor: 19800, status: 'Recusada', data: '2026-06-28T16:45:00Z' },
];
