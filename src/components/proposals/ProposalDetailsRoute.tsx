import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { proposalService } from '../../services/proposalService';
import { isProposalPending } from '../../lib/proposals/status';
import { ProposalDetails } from '../../pages/propostas/ProposalDetails';

export function ProposalDetailsRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [canViewDetails, setCanViewDetails] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function validateProposalRoute() {
      if (!id) {
        if (active) setIsChecking(false);
        return;
      }

      try {
        const proposal = await proposalService.getProposalById(id);
        if (!active) return;

        if (isProposalPending(proposal)) {
          navigate(`/propostas/${id}/editar`, { replace: true });
          return;
        }

        setCanViewDetails(true);
      } catch {
        // Let ProposalDetails render its existing not-found/error state.
        if (active) setCanViewDetails(true);
      } finally {
        if (active) setIsChecking(false);
      }
    }

    validateProposalRoute();

    return () => {
      active = false;
    };
  }, [id, navigate]);

  if (!id) return <Navigate to="/propostas" replace />;

  if (isChecking || !canViewDetails) {
    return <div className="text-brand-blue animate-pulse">Verificando proposta...</div>;
  }

  return <ProposalDetails />;
}
