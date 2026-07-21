import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { firstUseService } from '../../services/firstUseService';

export function FirstUseGate() {
  const { user } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isOperationallyComplete, setIsOperationallyComplete] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

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
      setIsOperationallyComplete(snapshot.status.complete);
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
  }, [checkCurrentStatus, location.pathname, location.search]);

  useEffect(() => {
    const handleProfileUpdated = () => {
      void checkCurrentStatus();
    };

    window.addEventListener('solamigo:profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('solamigo:profile-updated', handleProfileUpdated);
  }, [checkCurrentStatus]);

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
