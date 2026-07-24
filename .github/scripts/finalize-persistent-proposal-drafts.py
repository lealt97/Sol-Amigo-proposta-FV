from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        raise SystemExit(f'Marcador não encontrado: {label}')
    return source.replace(old, new, 1)


payback_path = Path('src/pages/propostas/PaybackStep.tsx')
payback = payback_path.read_text(encoding='utf-8')
payback = replace_once(
    payback,
    'type PaybackFormState = ProposalDraftPaybackForm;\n\nconst createCost = (): AdditionalCostDraft => ({',
    "type AdditionalCostDraft = ProposalDraftPaybackForm['additionalCosts'][number];\ntype PaybackFormState = ProposalDraftPaybackForm;\n\nconst createCost = (): AdditionalCostDraft => ({",
    'tipo de custo adicional',
)
payback = replace_once(
    payback,
    '  }, [storageKey, user?.id]);',
    '  }, [initialForm, storageKey, user?.id]);',
    'dependência do formulário inicial',
)
payback_path.write_text(payback, encoding='utf-8')


list_path = Path('src/pages/propostas/ProposalList.tsx')
proposal_list = list_path.read_text(encoding='utf-8')
proposal_list = proposal_list.replace(
    "import { PENDING_PROPOSAL_STATUSES } from '../../lib/proposals/status';\n",
    '',
)
proposal_list = replace_once(
    proposal_list,
    """        ? statusFilter === 'pending_like'
          ? PENDING_PROPOSAL_STATUSES.includes(proposal.status as (typeof PENDING_PROPOSAL_STATUSES)[number])
          : proposal.status === statusFilter
""",
    """        ? statusFilter === 'pending_like'
          ? proposal.status === 'pending'
          : proposal.status === statusFilter
""",
    'filtro de pendentes',
)
list_path.write_text(proposal_list, encoding='utf-8')


calculator_path = Path('src/pages/propostas/ProfessionalSizingCalculatorView.tsx')
calculator = calculator_path.read_text(encoding='utf-8')
calculator = replace_once(
    calculator,
    '        summary: buildDraftSummary(),',
    """        summary: {
          ...buildDraftSummary(),
          title: selectedClient ? `Proposta solar — ${selectedClient.name}` : undefined,
        },""",
    'título da proposta concluída',
)
calculator_path.write_text(calculator, encoding='utf-8')


service_path = Path('src/services/proposalService.ts')
service = service_path.read_text(encoding='utf-8')
service = replace_once(
    service,
    """  if (error) throw error;
  return { proposal: data as Proposal, resumed: false } as const;
}

async function saveFlowDraft""",
    """  if (error) {
    if (error.code === '23505') {
      const concurrentDraft = await findActiveFlowDraftByClient(input.userId, input.clientId);
      if (concurrentDraft) return { proposal: concurrentDraft, resumed: true } as const;
    }
    throw error;
  }
  return { proposal: data as Proposal, resumed: false } as const;
}

async function saveFlowDraft""",
    'tratamento de criação concorrente',
)
service_path.write_text(service, encoding='utf-8')


schema_path = Path('supabase-schema.sql')
schema = schema_path.read_text(encoding='utf-8')
marker = '-- 8. RASCUNHOS PERSISTENTES DO FLUXO DE PROPOSTA'
if marker not in schema:
    schema += f'''\n\n{marker}\nALTER TABLE public.proposals\n  ADD COLUMN IF NOT EXISTS flow_step SMALLINT,\n  ADD COLUMN IF NOT EXISTS flow_state JSONB,\n  ADD COLUMN IF NOT EXISTS flow_version INTEGER,\n  ADD COLUMN IF NOT EXISTS flow_completed BOOLEAN NOT NULL DEFAULT false,\n  ADD COLUMN IF NOT EXISTS flow_last_saved_at TIMESTAMP WITH TIME ZONE;\n\nDO $$\nBEGIN\n  IF NOT EXISTS (\n    SELECT 1 FROM pg_constraint\n    WHERE conrelid = 'public.proposals'::regclass\n      AND conname = 'proposals_flow_step_range'\n  ) THEN\n    ALTER TABLE public.proposals\n      ADD CONSTRAINT proposals_flow_step_range\n      CHECK (flow_step IS NULL OR flow_step BETWEEN 0 AND 6);\n  END IF;\nEND\n$$;\n\nCREATE INDEX IF NOT EXISTS proposals_active_flow_drafts_idx\n  ON public.proposals (user_id, client_id, updated_at DESC)\n  WHERE status = 'draft'\n    AND flow_completed = false\n    AND flow_state IS NOT NULL;\n\nCREATE UNIQUE INDEX IF NOT EXISTS proposals_one_active_flow_draft_per_client_uidx\n  ON public.proposals (user_id, client_id)\n  WHERE status = 'draft'\n    AND flow_completed = false\n    AND flow_state IS NOT NULL;\n\nDROP POLICY IF EXISTS "Usuário pode editar apenas suas propostas" ON public.proposals;\nCREATE POLICY "Usuário pode editar apenas suas propostas"\n  ON public.proposals\n  FOR UPDATE\n  TO authenticated\n  USING ((SELECT auth.uid()) = user_id)\n  WITH CHECK ((SELECT auth.uid()) = user_id);\n'''
schema_path.write_text(schema, encoding='utf-8')
