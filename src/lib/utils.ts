import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
}

export function translateAuthError(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('email rate limit exceeded') || msg.includes('rate limit exceeded')) {
    return 'O limite de envio de e-mails foi excedido. Por favor, aguarde alguns minutos antes de tentar novamente.';
  }
  if (msg.includes('only request this once every 60 seconds')) {
    return 'Por motivos de segurança, você só pode solicitar isso uma vez a cada 60 segundos. Por favor, aguarde um momento antes de tentar novamente.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'Este e-mail já está cadastrado em nosso sistema.';
  }
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('signup is disabled') || msg.includes('signups are disabled')) {
    return 'O cadastro de novos usuários por e-mail está desativado no seu painel do Supabase. Para ativar, acesse seu painel do Supabase > Authentication > Providers > Email e habilite a opção "Allow signup" (Permitir cadastro).';
  }
  if (msg.includes('email not confirmed')) {
    return 'Seu e-mail ainda não foi verificado. Por favor, verifique sua caixa de entrada para confirmar.';
  }
  if (msg.includes('invalid token') || msg.includes('token is invalid') || msg.includes('expired')) {
    return 'O link de confirmação expirou ou é inválido. Por favor, solicite um novo link.';
  }
  
  return message;
}
