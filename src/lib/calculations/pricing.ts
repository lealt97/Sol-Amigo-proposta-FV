import { PricingCalculationInput, PricingCalculationResult } from '../../types/pricing';

export function calcularCustoTotal(input: Omit<PricingCalculationInput, 'margin_percentage' | 'discount_percentage'>): number {
  return Math.max(0, 
    (input.kit_cost || 0) + 
    (input.labor_cost || 0) + 
    (input.fixed_costs || 0) + 
    (input.freight_cost || 0) + 
    (input.taxes || 0) + 
    (input.commission || 0) + 
    (input.other_costs || 0)
  );
}

export function calcularPrecoVendaPorMargem(custoTotal: number, margemDesejada: number): number {
  if (custoTotal <= 0) return 0;
  if (margemDesejada >= 100) return custoTotal; // Avoid division by zero or negative price
  const margemDecimal = Math.max(0, margemDesejada) / 100;
  return custoTotal / (1 - margemDecimal);
}

export function calcularDesconto(precoVenda: number, descontoPercentual: number): number {
  if (precoVenda <= 0 || descontoPercentual <= 0) return 0;
  const descontoDecimal = Math.min(100, descontoPercentual) / 100;
  return precoVenda * descontoDecimal;
}

export function calcularPrecoFinal(precoVenda: number, valorDesconto: number): number {
  return Math.max(0, precoVenda - valorDesconto);
}

export function calcularLucroEstimado(precoFinal: number, custoTotal: number): number {
  return precoFinal - custoTotal;
}

export function calcularMargemReal(lucroEstimado: number, precoFinal: number): number {
  if (precoFinal <= 0) return 0;
  return (lucroEstimado / precoFinal) * 100;
}

export function calcularMarkup(precoFinal: number, custoTotal: number): number {
  if (custoTotal <= 0) return 0;
  return ((precoFinal / custoTotal) - 1) * 100;
}

export function calcularPrecoProposta(input: PricingCalculationInput): PricingCalculationResult {
  const custoTotal = calcularCustoTotal({
    kit_cost: input.kit_cost,
    labor_cost: input.labor_cost,
    fixed_costs: input.fixed_costs,
    freight_cost: input.freight_cost,
    taxes: input.taxes,
    commission: input.commission,
    other_costs: input.other_costs,
  });

  const precoVendaBruto = calcularPrecoVendaPorMargem(custoTotal, input.margin_percentage || 0);
  const valorDesconto = calcularDesconto(precoVendaBruto, input.discount_percentage || 0);
  const precoFinal = calcularPrecoFinal(precoVendaBruto, valorDesconto);
  
  const lucroEstimado = calcularLucroEstimado(precoFinal, custoTotal);
  const margemReal = calcularMargemReal(lucroEstimado, precoFinal);
  const markup = calcularMarkup(precoFinal, custoTotal);

  return {
    total_cost: custoTotal,
    gross_price: precoVendaBruto,
    discount_value: valorDesconto,
    final_price: precoFinal,
    estimated_profit: lucroEstimado,
    real_margin_percentage: margemReal,
    markup_percentage: markup,
  };
}
