import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  document: z.string().optional().or(z.literal('')),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'WhatsApp é recomendado').optional().or(z.literal('')),
  cep: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  number: z.string().optional().or(z.literal('')),
  neighborhood: z.string().optional().or(z.literal('')),
  complement: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  avg_consumption_kwh: z.union([z.string(), z.number()]).optional(),
  notes: z.string().optional().or(z.literal('')),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
