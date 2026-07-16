import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Label
} from 'recharts';
import { TabelaRetornoAno } from '../../types/payback';

interface PaybackChartProps {
  data: TabelaRetornoAno[];
  investimento: number;
}

const formatMoney = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const PaybackChart: React.FC<PaybackChartProps> = ({ data, investimento }) => {
  const paybackYearIndex = useMemo(() => {
    return data.findIndex((item) => item.retorno >= investimento && item.ano > 0);
  }, [data, investimento]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as TabelaRetornoAno;
      return (
        <div className="bg-brand-surface border border-brand-border p-3 rounded-lg shadow-xl">
          <p className="text-brand-dark font-medium mb-2">Ano {item.ano}</p>
          <div className="space-y-1 text-sm">
            <p className="text-brand-green">
              Retorno: {formatMoney(item.retorno)}
            </p>
            <p className="text-brand-primary">
              Investimento: {formatMoney(item.investimento)}
            </p>
            <p className={item.diferenca >= 0 ? "text-brand-green font-medium" : "text-red-400 font-medium"}>
              Diferença: {formatMoney(item.diferenca)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 30, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-border)" vertical={false} />
          <XAxis 
            dataKey="ano" 
            stroke="var(--color-brand-border)" 
            tick={{ fill: 'var(--color-slate-500)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--color-brand-border)' }}
            axisLine={{ stroke: 'var(--color-brand-border)' }}
          />
          <YAxis 
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            stroke="var(--color-brand-border)"
            tick={{ fill: 'var(--color-slate-500)', fontSize: 12 }}
            tickLine={{ stroke: 'var(--color-brand-border)' }}
            axisLine={{ stroke: 'var(--color-brand-border)' }}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-brand-surface)', opacity: 0.4 }} />
          
          <ReferenceLine 
            y={investimento} 
            stroke="var(--color-brand-yellow)" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          >
            <Label 
              value="Investimento Inicial" 
              position="insideTopLeft" 
              fill="var(--color-brand-yellow)" 
              fontSize={12} 
              offset={10}
            />
          </ReferenceLine>

          {paybackYearIndex >= 0 && (
            <ReferenceLine x={data[paybackYearIndex].ano} stroke="transparent">
              <Label 
                value="PAYBACK ATINGIDO" 
                position="top" 
                fill="var(--color-brand-green)" 
                fontSize={12} 
                fontWeight="bold"
                offset={10}
              />
            </ReferenceLine>
          )}

          <Bar dataKey="retorno" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index === paybackYearIndex ? 'var(--color-brand-green)' : 'var(--color-brand-primary)'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
