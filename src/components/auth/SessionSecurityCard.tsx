import { useMemo, useState } from 'react';
import { Laptop, Loader2, LogOut, ShieldAlert, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase/client';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';

type LogoutScope = 'others' | 'global';

function currentDeviceLabel() {
  if (typeof navigator === 'undefined') return 'Este aparelho';

  const userAgent = navigator.userAgent;
  const platform = navigator.platform || '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  let browser = 'Navegador';
  if (/Edg\//.test(userAgent)) browser = 'Microsoft Edge';
  else if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) browser = 'Google Chrome';
  else if (/Firefox\//.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)) browser = 'Safari';

  let system = platform || 'sistema atual';
  if (/Windows/i.test(userAgent)) system = 'Windows';
  else if (/Android/i.test(userAgent)) system = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) system = 'iOS/iPadOS';
  else if (/Mac OS X/i.test(userAgent)) system = 'macOS';
  else if (/Linux/i.test(userAgent)) system = 'Linux';

  return `${browser} em ${system}${isMobile ? ' (móvel)' : ''}`;
}

export function SessionSecurityCard() {
  const [pendingScope, setPendingScope] = useState<LogoutScope | null>(null);
  const deviceLabel = useMemo(currentDeviceLabel, []);
  const DeviceIcon = /móvel|Android|iOS/i.test(deviceLabel) ? Smartphone : Laptop;

  const revokeSessions = async (scope: LogoutScope) => {
    const message = scope === 'others'
      ? 'Desconectar sua conta de todos os outros aparelhos? Este aparelho continuará conectado.'
      : 'Desconectar sua conta de todos os aparelhos, inclusive deste? Você precisará entrar novamente.';

    if (!window.confirm(message)) return;

    try {
      setPendingScope(scope);
      const { error } = await supabase.auth.signOut({ scope });
      if (error) throw error;

      if (scope === 'others') {
        toast.success('Outros aparelhos foram desconectados.');
        return;
      }

      window.location.replace('/login');
    } catch (error) {
      console.error('Erro ao encerrar sessões:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível encerrar as sessões.');
    } finally {
      setPendingScope(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldAlert className="h-5 w-5 text-brand-blue" />
          Sessões e aparelhos
        </CardTitle>
        <CardDescription>
          Desconecte sua conta de computadores, celulares ou navegadores que você não usa mais.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-brand-border bg-brand-gray/50 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-blue/10 text-brand-blue">
            <DeviceIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-dark">Sessão atual</p>
            <p className="mt-1 text-sm text-slate-500">{deviceLabel}</p>
            <p className="mt-1 text-xs text-emerald-700">Este aparelho está conectado agora.</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
          Ao encerrar uma sessão, o acesso já emitido pode permanecer válido por um curto período até o token expirar. A renovação da sessão é bloqueada imediatamente.
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={pendingScope !== null}
            onClick={() => void revokeSessions('others')}
          >
            {pendingScope === 'others' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {pendingScope === 'others' ? 'Desconectando...' : 'Desconectar outros aparelhos'}
          </Button>

          <Button
            type="button"
            variant="destructive"
            className="gap-2 bg-red-600 text-white hover:bg-red-700"
            disabled={pendingScope !== null}
            onClick={() => void revokeSessions('global')}
          >
            {pendingScope === 'global' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            {pendingScope === 'global' ? 'Desconectando...' : 'Sair de todos os aparelhos'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
