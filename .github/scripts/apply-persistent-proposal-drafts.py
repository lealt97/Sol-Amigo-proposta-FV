from pathlib import Path


CALCULATOR = Path('src/pages/propostas/ProfessionalSizingCalculatorView.tsx')
PAYBACK = Path('src/pages/propostas/PaybackStep.tsx')


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        raise SystemExit(f'Marcador não encontrado: {label}')
    return source.replace(old, new, 1)


calculator = CALCULATOR.read_text(encoding='utf-8')

calculator = replace_once(
    calculator,
    "import { useNavigate, useSearchParams } from 'react-router-dom';",
    "import { useNavigate, useParams, useSearchParams } from 'react-router-dom';",
    'useParams',
)

calculator = replace_once(
    calculator,
    "import { Button } from '../../components/ui/Button';\n",
    "import { Button } from '../../components/ui/Button';\nimport { useAuth } from '../../contexts/AuthContext';\n",
    'useAuth',
)

calculator = replace_once(
    calculator,
    """} from '../../lib/calculations/moduleSizing';
import type { PaybackResult } from '../../lib/calculations/payback';
import { clientService } from '../../services/clientService';
import { solarKitService } from '../../services/solarKitService';
import type { Client } from '../../types/client';
import type { SolarKit } from '../../types/solarKit';
""",
    """} from '../../lib/calculations/moduleSizing';
import type { PaybackResult } from '../../lib/calculations/payback';
import { clampProposalFlowStep, getProposalContinuePath } from '../../lib/proposals/flow';
import { clientService } from '../../services/clientService';
import { proposalService, type ProposalFlowSummary } from '../../services/proposalService';
import { solarKitService } from '../../services/solarKitService';
import type { Client } from '../../types/client';
import {
  PROPOSAL_DRAFT_VERSION,
  isProposalDraftState,
  type ProposalDraftPaybackForm,
  type ProposalDraftState,
} from '../../types/proposalDraft';
import { buildSolarKitSnapshot, type SolarKit } from '../../types/solarKit';
""",
    'imports de rascunho',
)

calculator = replace_once(
    calculator,
    """const parseNumber = (value: string) => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return Number.NaN;
  return Number(normalized);
};
""",
    """const parseNumber = (value: string) => {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return Number.NaN;
  return Number(normalized);
};

const parseOptionalNumber = (value: string) => {
  const parsed = parseNumber(value);
  return Number.isFinite(parsed) ? parsed : null;
};
""",
    'parse opcional',
)

calculator = replace_once(
    calculator,
    """export function ProfessionalSizingCalculator() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdFromQuery = searchParams.get('clienteId') || '';

  const [currentStep, setCurrentStep] = useState(0);
""",
    """export function ProfessionalSizingCalculator() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: draftIdFromRoute } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const clientIdFromQuery = searchParams.get('clienteId') || '';

  const [draftId, setDraftId] = useState<string | null>(draftIdFromRoute || null);
  const [isHydratingDraft, setIsHydratingDraft] = useState(Boolean(draftIdFromRoute));
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
""",
    'estado base do rascunho',
)

calculator = replace_once(
    calculator,
    """  const [kitsError, setKitsError] = useState<string | null>(null);
  const [paybackResult, setPaybackResult] = useState<PaybackResult | null>(null);

  useEffect(() => {
""",
    """  const [kitsError, setKitsError] = useState<string | null>(null);
  const [paybackResult, setPaybackResult] = useState<PaybackResult | null>(null);
  const [paybackForm, setPaybackForm] = useState<ProposalDraftPaybackForm | null>(null);
  const [roofPhotoReference, setRoofPhotoReference] = useState<string | null>(null);

  function hydrateProposalDraft(state: ProposalDraftState) {
    setCurrentStep(clampProposalFlowStep(state.currentStep));
    setSelectedClientId(state.selectedClientId);
    setConsumptionMode(state.consumptionMode as ConsumptionMode);
    setDirectAverageConsumption(state.directAverageConsumption);
    setMonthlyConsumption(state.monthlyConsumption.length === 12
      ? state.monthlyConsumption
      : Array.from({ length: 12 }, (_, index) => state.monthlyConsumption[index] || ''));
    setLoadSurvey(state.loadSurvey.length > 0 ? state.loadSurvey : [createLoadDraft()]);
    setConnectionType(state.connectionType as ConnectionType);
    setHspDaily(state.hspDaily);
    setPerformanceRatioPercent(state.performanceRatioPercent);
    setGenerationIncreasePercent(state.generationIncreasePercent);
    setModulePowerW(state.modulePowerW);
    setModuleWidthM(state.moduleWidthM);
    setModuleHeightM(state.moduleHeightM);
    setRoofAreaM2(state.roofAreaM2);
    setRoofPhotoReference(state.roofPhotoReference);
    setSelectedKitId(state.selectedKitId);
    setPaybackForm(state.paybackForm);
    setPaybackResult(null);
  }

  useEffect(() => {
""",
    'hidratação do estado',
)

calculator = replace_once(
    calculator,
    """    void loadKits();
  }, []);

  const selectedClient = useMemo(
""",
    """    void loadKits();
  }, []);

  useEffect(() => {
    if (!draftIdFromRoute) {
      setIsHydratingDraft(false);
      return undefined;
    }

    let active = true;
    const loadDraft = async () => {
      try {
        setIsHydratingDraft(true);
        const proposal = await proposalService.getFlowDraftById(draftIdFromRoute);
        if (!isProposalDraftState(proposal.flow_state)) {
          throw new Error('O rascunho não possui um estado de fluxo compatível.');
        }
        if (!active) return;
        setDraftId(proposal.id);
        hydrateProposalDraft(proposal.flow_state);
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : 'Não foi possível carregar o rascunho.');
        navigate('/propostas', { replace: true });
      } finally {
        if (active) setIsHydratingDraft(false);
      }
    };

    void loadDraft();
    return () => {
      active = false;
    };
  }, [draftIdFromRoute, navigate]);

  const selectedClient = useMemo(
""",
    'carregamento do rascunho',
)

calculator = replace_once(
    calculator,
    """  const goNext = () => {
    if (!validateStep()) return;
    setCurrentStep((step) => Math.min(step + 1, STEPS.length - 1));
  };

  const completeSizing = () => {
    if (!validateStep()) return;
    toast.success('Dimensionamento concluído.');
  };
""",
    """  const buildDraftState = (step: number): ProposalDraftState => ({
    version: PROPOSAL_DRAFT_VERSION,
    currentStep: step,
    selectedClientId,
    consumptionMode,
    directAverageConsumption,
    monthlyConsumption,
    loadSurvey,
    connectionType,
    hspDaily,
    performanceRatioPercent,
    generationIncreasePercent,
    modulePowerW,
    moduleWidthM,
    moduleHeightM,
    roofAreaM2,
    roofPhotoReference,
    selectedKitId,
    paybackForm,
  });

  const buildDraftSummary = (): ProposalFlowSummary => {
    const source = consumptionMode === 'history'
      ? 'historical'
      : consumptionMode === 'loads'
        ? 'load_survey'
        : 'average';
    const margin = paybackResult?.marginPercentage
      ?? (paybackForm ? parseOptionalNumber(paybackForm.marginPercentage) : null);
    const tariff = paybackForm ? parseOptionalNumber(paybackForm.tariffCentsPerKwh) : null;

    return {
      title: selectedClient ? `Proposta em elaboração — ${selectedClient.name}` : undefined,
      consumption_source: source,
      history: consumptionMode === 'history' ? monthlyConsumption : null,
      monthly_consumption_kwh: consumptionResolution.averageMonthlyConsumptionKwh,
      estimated_daily_consumption: calculation.result?.targetDailyGenerationKwh ?? null,
      energy_tariff: tariff == null ? null : tariff / 100,
      roof_area_m2: parseOptionalNumber(roofAreaM2),
      roof_image_url: roofPhotoReference,
      module_width_m: parseOptionalNumber(moduleWidthM),
      module_height_m: parseOptionalNumber(moduleHeightM),
      selected_solar_kit_id: selectedKit?.id ?? null,
      solar_kit_snapshot: selectedKit ? buildSolarKitSnapshot(selectedKit) : null,
      kit_cost: selectedKit?.cost_price ?? null,
      other_costs: paybackResult?.additionalCostsTotal ?? null,
      margin_percentage: margin,
      total_cost: paybackResult?.directCost ?? null,
      gross_price: paybackResult?.totalInvestment ?? null,
      final_price: paybackResult?.totalInvestment ?? null,
      estimated_profit: paybackResult?.profitAmount ?? null,
    };
  };

  const persistDraftStep = async (nextStep: number) => {
    if (!user?.id || !selectedClient) {
      throw new Error('Selecione um cliente autenticado para salvar o rascunho.');
    }

    const flowState = buildDraftState(nextStep);
    const summary = buildDraftSummary();

    if (!draftId) {
      const outcome = await proposalService.createOrResumeFlowDraft({
        userId: user.id,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        flowStep: nextStep,
        flowState,
        summary,
      });

      setDraftId(outcome.proposal.id);
      navigate(getProposalContinuePath(outcome.proposal.id), { replace: true });

      if (outcome.resumed) {
        if (!isProposalDraftState(outcome.proposal.flow_state)) {
          throw new Error('O rascunho existente não possui dados compatíveis para retomada.');
        }
        hydrateProposalDraft(outcome.proposal.flow_state);
        toast.info('Já existia um rascunho para este cliente. O preenchimento foi retomado.');
        return true;
      }

      return false;
    }

    await proposalService.saveFlowDraft({
      proposalId: draftId,
      flowStep: nextStep,
      flowState,
      summary,
    });
    return false;
  };

  const goNext = async () => {
    if (!validateStep() || isSavingDraft) return;
    const nextStep = Math.min(currentStep + 1, STEPS.length - 1);

    try {
      setIsSavingDraft(true);
      const resumed = await persistDraftStep(nextStep);
      if (!resumed) setCurrentStep(nextStep);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o rascunho.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const completeSizing = async () => {
    if (!validateStep() || isSavingDraft) return;
    if (!draftId) {
      toast.error('O rascunho ainda não foi criado.');
      return;
    }

    try {
      setIsSavingDraft(true);
      const flowState = buildDraftState(STEPS.length - 1);
      await proposalService.completeFlowDraft({
        proposalId: draftId,
        flowStep: STEPS.length - 1,
        flowState,
        summary: buildDraftSummary(),
      });
      toast.success('Proposta concluída e salva.');
      navigate(`/propostas/${draftId}`, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível concluir a proposta.');
    } finally {
      setIsSavingDraft(false);
    }
  };
""",
    'persistência ao avançar',
)

calculator = replace_once(
    calculator,
    """  const hasCalculation = Boolean(result);

  return (
""",
    """  const hasCalculation = Boolean(result);

  if (isHydratingDraft) {
    return (
      <div className=\"flex items-center justify-center gap-3 py-20 text-sm text-slate-500\">
        <Loader2 className=\"h-5 w-5 animate-spin text-brand-blue\" /> Carregando rascunho da proposta...
      </div>
    );
  }

  return (
""",
    'loading do rascunho',
)

calculator = replace_once(
    calculator,
    '<h1 className="text-2xl font-bold text-brand-dark">Nova Proposta</h1>',
    '<h1 className="text-2xl font-bold text-brand-dark">{draftId ? \'Continuar Proposta\' : \'Nova Proposta\'}</h1>',
    'título dinâmico',
)

calculator = replace_once(
    calculator,
    """          <div className={`h-2 w-2 rounded-full ${hasCalculation ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-xs text-slate-500">
            {hasCalculation ? 'Cálculo atualizado automaticamente' : 'Preencha os dados para calcular'}
          </span>
""",
    """          <div className={`h-2 w-2 rounded-full ${isSavingDraft ? 'bg-brand-yellow animate-pulse' : draftId ? 'bg-emerald-500' : hasCalculation ? 'bg-brand-blue animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-xs text-slate-500">
            {isSavingDraft
              ? 'Salvando rascunho...'
              : draftId
                ? 'Rascunho salvo automaticamente'
                : hasCalculation
                  ? 'Cálculo atualizado automaticamente'
                  : 'Preencha os dados para calcular'}
          </span>
""",
    'status de salvamento',
)

calculator = replace_once(
    calculator,
    '<Select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)}>',
    '<Select value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} disabled={Boolean(draftId)}>',
    'bloqueio do cliente',
)

calculator = replace_once(
    calculator,
    '<RoofPhotoUpload clientId={selectedClient?.id ?? null} />',
    """<RoofPhotoUpload
                  clientId={selectedClient?.id ?? null}
                  initialStorageReference={roofPhotoReference}
                  onReferenceChange={setRoofPhotoReference}
                />""",
    'foto persistente',
)

calculator = replace_once(
    calculator,
    """                  monthlyGenerationKwh={result.selectedKitEstimatedMonthlyGenerationKwh ?? result.targetMonthlyGenerationKwh}
                  onResultChange={setPaybackResult}
""",
    """                  monthlyGenerationKwh={result.selectedKitEstimatedMonthlyGenerationKwh ?? result.targetMonthlyGenerationKwh}
                  initialForm={paybackForm}
                  onDraftChange={setPaybackForm}
                  onResultChange={setPaybackResult}
""",
    'payback persistente',
)

calculator = replace_once(
    calculator,
    """                onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                disabled={currentStep === 0}
""",
    """                onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                disabled={currentStep === 0 || isSavingDraft}
""",
    'bloqueio anterior',
)

calculator = replace_once(
    calculator,
    '<Button type="button" onClick={goNext} className="gap-2">',
    '<Button type="button" onClick={() => void goNext()} className="gap-2" disabled={isSavingDraft}>',
    'botão próximo assíncrono',
)

calculator = replace_once(
    calculator,
    '<Button type="button" onClick={completeSizing} className="gap-2">',
    '<Button type="button" onClick={() => void completeSizing()} className="gap-2" disabled={isSavingDraft}>',
    'botão concluir assíncrono',
)

CALCULATOR.write_text(calculator, encoding='utf-8')


payback = PAYBACK.read_text(encoding='utf-8')

payback = replace_once(
    payback,
    "import type { SolarKit } from '../../types/solarKit';\n",
    "import type { ProposalDraftPaybackForm } from '../../types/proposalDraft';\nimport type { SolarKit } from '../../types/solarKit';\n",
    'tipo de formulário do payback',
)

payback = replace_once(
    payback,
    """type AdditionalCostDraft = {
  id: string;
  description: string;
  amount: string;
};

type PaybackFormState = {
  tariffCentsPerKwh: string;
  pisPercent: string;
  cofinsPercent: string;
  icmsPercent: string;
  otherTariffsPercent: string;
  marginPercentage: string;
  additionalCosts: AdditionalCostDraft[];
};
""",
    "type PaybackFormState = ProposalDraftPaybackForm;\n",
    'tipos locais do payback',
)

payback = replace_once(
    payback,
    """export function PaybackStep({
  selectedKit,
  connectionType,
  monthlyCompensableConsumptionKwh,
  monthlyGenerationKwh,
  onResultChange,
}: {
  selectedKit: SolarKit;
  connectionType: ConnectionType;
  monthlyCompensableConsumptionKwh: number;
  monthlyGenerationKwh: number;
  onResultChange: (result: PaybackResult | null) => void;
}) {
""",
    """export function PaybackStep({
  selectedKit,
  connectionType,
  monthlyCompensableConsumptionKwh,
  monthlyGenerationKwh,
  initialForm,
  onDraftChange,
  onResultChange,
}: {
  selectedKit: SolarKit;
  connectionType: ConnectionType;
  monthlyCompensableConsumptionKwh: number;
  monthlyGenerationKwh: number;
  initialForm?: ProposalDraftPaybackForm | null;
  onDraftChange?: (form: ProposalDraftPaybackForm) => void;
  onResultChange: (result: PaybackResult | null) => void;
}) {
""",
    'props do payback',
)

payback = replace_once(
    payback,
    "const [form, setForm] = useState<PaybackFormState>(() => createDefaultForm());",
    "const [form, setForm] = useState<PaybackFormState>(() => initialForm || createDefaultForm());",
    'estado inicial do payback',
)

payback = replace_once(
    payback,
    """    const hydrate = async () => {
      setHydrated(false);
      const saved = sessionStorage.getItem(storageKey);
""",
    """    const hydrate = async () => {
      setHydrated(false);
      if (initialForm) {
        if (active) setForm(initialForm);
        if (active) setHydrated(true);
        return;
      }

      const saved = sessionStorage.getItem(storageKey);
""",
    'hidratação inicial do payback',
)

payback = replace_once(
    payback,
    """  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(storageKey, JSON.stringify(form));
  }, [form, hydrated, storageKey]);
""",
    """  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(storageKey, JSON.stringify(form));
    onDraftChange?.(form);
  }, [form, hydrated, onDraftChange, storageKey]);
""",
    'callback do formulário de payback',
)

PAYBACK.write_text(payback, encoding='utf-8')
