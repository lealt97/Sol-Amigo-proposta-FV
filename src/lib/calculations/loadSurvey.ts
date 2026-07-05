import { ProposalLoadInput } from '../../types/loadSurvey';

export function calcularConsumoEquipamento(potenciaWatts: number, quantidade: number, horasPorDia: number): number {
  if (potenciaWatts < 0 || quantidade < 0 || horasPorDia < 0) return 0;
  return (potenciaWatts * quantidade * horasPorDia) / 1000;
}

export function calcularConsumoDiarioTotal(equipamentos: ProposalLoadInput[]): number {
  return equipamentos.reduce((total, equipamento) => {
    return total + calcularConsumoEquipamento(
      equipamento.power_watts,
      equipamento.quantity,
      equipamento.hours_per_day
    );
  }, 0);
}

export function calcularConsumoMensalEstimado(consumoDiarioTotal: number): number {
  return consumoDiarioTotal * 30;
}
