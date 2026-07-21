import { MouseEvent } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AccountData } from './AccountData';
import { Configuracoes } from './Configuracoes';

const SETTINGS_TAB_BY_LABEL: Record<string, string> = {
  'Dados da Empresa': 'empresa',
  Logo: 'logo',
  'Dados do Usuário': 'vendedor',
  'Customização da Conta': 'customizacao',
  'Preferências Comerciais': 'preferencias',
  Segurança: 'seguranca',
  'Encerramento da Conta': 'seguranca',
};

export function SettingsRoute() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'empresa';

  if (activeTab === 'encerramento') {
    return <Navigate to="/configuracoes?tab=seguranca#privacidade-dados" replace />;
  }

  const handleCapture = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const button = target.closest('button');
    if (!button) return;

    const label = button.textContent?.replace(/\s+/g, ' ').trim() || '';
    const nextTab = SETTINGS_TAB_BY_LABEL[label];
    if (!nextTab) return;

    event.preventDefault();
    event.stopPropagation();

    const hash = label === 'Encerramento da Conta' ? '#privacidade-dados' : '';
    navigate(`/configuracoes?tab=${nextTab}${hash}`);
  };

  return (
    <>
      <div onClickCapture={handleCapture}>
        <Configuracoes />
      </div>
      {activeTab === 'seguranca' && <AccountData embedded />}
    </>
  );
}
