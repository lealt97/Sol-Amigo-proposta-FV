import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, Loader2, LogOut, ShieldCheck } from 'lucide-react';
import {
  challengeAndVerifyTotp,
  loadVerifiedTotpFactors,
  normalizeTotpCode,
  readableMfaError,
} from '../../lib/auth/authFlows';
import { supabase } from '../../lib/supabase/client';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';

type MfaChallengeScreenProps = {
  onSuccess: () => void;
  onSignOut: () => Promise<void>;
};

export function MfaChallengeScreen({ onSuccess, onSignOut }: MfaChallengeScreenProps) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const verifiedFactors = await loadVerifiedTotpFactors(supabase.auth.mfa);
        const verifiedFactor = verifiedFactors[0];

        if (!verifiedFactor) {
          const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (assurance.error) throw assurance.error;

          if (assurance.data?.nextLevel !== 'aal2') {
            onSuccess();
            return;
          }

          throw new Error('Nenhum aplicativo autenticador verificado foi encontrado para esta conta.');
        }

        if (mounted) setFactorId(verifiedFactor.id);
      } catch (error) {
        if (mounted) setErrorMessage(readableMfaError(error));
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [onSuccess]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!factorId) return;

    const normalizedCode = normalizeTotpCode(code);
    if (normalizedCode.length !== 6) {
      setErrorMessage('Digite o código de seis números do aplicativo autenticador.');
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);

    try {
      await challengeAndVerifyTotp(supabase.auth.mfa, factorId, normalizedCode);
      onSuccess();
    } catch (error) {
      setErrorMessage(readableMfaError(error));
      setCode('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-brand-gray p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Verificação em duas etapas</CardTitle>
          <CardDescription>
            Abra o aplicativo autenticador vinculado à sua conta e digite o código atual para continuar.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="login-mfa-code" className="flex items-center gap-2 text-sm font-medium text-brand-dark">
                <KeyRound className="h-4 w-4 text-brand-blue" />
                Código de segurança
              </label>
              <input
                id="login-mfa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                disabled={isLoading || isVerifying || !factorId}
                value={code}
                onChange={(event) => setCode(normalizeTotpCode(event.target.value))}
                placeholder="000000"
                className="w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-3 text-center text-xl font-semibold tracking-[0.4em] text-brand-dark outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue disabled:opacity-60"
              />
              <p className="text-xs text-slate-500">O código muda aproximadamente a cada 30 segundos.</p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full gap-2" disabled={isLoading || isVerifying || !factorId || code.length !== 6}>
              {isLoading || isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {isLoading ? 'Carregando proteção...' : isVerifying ? 'Verificando...' : 'Confirmar e entrar'}
            </Button>
            <Button type="button" variant="outline" className="w-full gap-2" disabled={isVerifying} onClick={() => void onSignOut()}>
              <LogOut className="h-4 w-4" />
              Sair da conta
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
