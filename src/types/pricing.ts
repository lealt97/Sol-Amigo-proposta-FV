export interface PricingCalculationInput {
  kit_cost: number;
  labor_cost: number;
  fixed_costs: number;
  freight_cost: number;
  taxes: number;
  commission: number;
  other_costs: number;
  margin_percentage: number;
  discount_percentage: number;
}

export interface PricingCalculationResult {
  total_cost: number;
  gross_price: number;
  discount_value: number;
  final_price: number;
  estimated_profit: number;
  real_margin_percentage: number;
  markup_percentage: number;
}
