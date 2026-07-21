import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { firstUseService } from '../../services/firstUseService';
import type { Profile } from '../../types/profile';

const ASSUMED_ACCEPTED_LEGAL_STATUS = { complete: true, documents: [] };

export function FirstUseGate() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isOperationallyComplete, setIsOperationallyComplete] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const invalidationInFlight = useRef(false);

  const checkCurrentStatus = useCallback(async () => {
    if (!user) return;

    if (firstUseService.requiresFirstUse(user)) {
      setIsOperationallyComplete(false);
      setCheckFailed(false);
      setIsChecking(false);
      return;
    }

    try {
      setIsChecking(true);
      setCheckFailed(false);
      const snapshot = await firstUseService.load(user);

      if (!snapshot.status.complete) {
        await firstUseService.invalidateCompletion();
        setIsOperationallyComplete(false);
        return;
      }

      setIsOperationallyComplete(true);
    } catch (error) {
      console.error('Erro ao verificar configuração obrigatória da conta:', error);
      setCheckFailed(true);
      setIsOperationallyComplete(false);
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  useEffect(() => {
    void checkCurrentStatus();
  }, [checkCurrentStatus]);

  useEffect(() => {
    const handleProfileUpdated = async (event: Event) => {
      if (!user || invalidationInFlight.current) return;

      const profile = (event as CustomEvent<Profile>).detail;
      if (!profile) return;

      const profileStatus = firstUseService.buildStatus(profile, ASSUMED_ACCEPTED_LEGAL_STATUS);
      const requiredProfileDataComplete = profileStatus.company_complete
        && profileStatus.responsible_complete
        && profileStatus.identity_complete;

      if (requiredProfileDataComplete) return;

      try {
        invalidationInFlight.current = true;
        setIsChecking(true);
        await firstUseService.invalidateCompletion();
        setCheckFailed(false);
        setIsOperationallyComplete(false);
      } catch (error) {
        console.error('Erro ao regredir a configuração obrigatória da conta:', error);
        setCheckFailed(true);
        setIsOperationallyComplete(false);
      } finally {
        invalidationInFlight.current = false;
        setIsChecking(false);
      }
    };

    window.addEventListener('solamigo:profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('solamigo:profile-updated', handleProfileUpdated);
  }, [user]);

  if (!user) return null;

  if (isChecking) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-gray">
        <div className="flex items-center gap-3 text-brand-blue">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-semibold">Verificando a configuração da conta...</span>
        </div>
      </div>
    );
  }

  if (checkFailed || !isOperationallyComplete) {
    return <Navigate to="/primeiros-passos" replace />;
  }

  return <Outlet />;
}
