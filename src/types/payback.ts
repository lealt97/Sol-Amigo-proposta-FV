export interface TabelaRetornoAno {
  ano: number;
  retorno: number;
  investimento: number;
  diferenca: number;
}

export interface PaybackCalculationInput {
  investimentoTotal: number;
  economiaMensal: number;
  economiaAnual: number;
}

export interface PaybackCalculationResult {
  paybackAnos: number;
  paybackMeses: number;
  paybackFormatado: string;
  retorno25Anos: number;
  economiaAcumulada: number;
  economiaLiquida25Anos: number;
  tabelaRetorno: TabelaRetornoAno[];
}
