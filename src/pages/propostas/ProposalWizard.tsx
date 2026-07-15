/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { proposalSchema, ProposalFormValues } from '../../lib/validations/proposal.schema';
import { proposalService } from '../../services/proposalService';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { StepClient } from './steps/StepClient';
import { StepConsumption } from './steps/StepConsumption';
import { StepProject } from './steps/StepProject';
import { StepInstallation } from './steps/StepInstallation';
import { StepCosts } from './steps/StepCosts';
import { StepFinancial } from './steps/StepFinancial';
import { StepPreview } from './steps/StepPreview';
import { SolarCalculationPreview } from './SolarCalculationPreview';
import { validateFullProposal, validateProposalStep } from './validation/proposalWizardValidation';
import { EMPTY_ROOF_LAYOUT } from '../../types/roofLayout';

const STEPS = [
  { id: 'client', title: 'Cliente' },
  { id: 'consumption', title: 'Consumo' },
  { id: 'project', title: 'Projeto Solar' },
  { id: 'installation', title: 'Local de Instalação' },
  { id: 'costs', title: 'Custos' },
  { id: 'financial', title: 'Financeiro' },
  { id: 'preview', title: 'Preview' },
];

export function ProposalWizard() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const clientIdFromQuery = searchParams.get('clienteId');
  
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(id || null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const isSubmittedRef = useRef(false);
  const proposalIdRef = useRef<string | null>(id || null);
  const isInitializedRef = useRef(false);
  const draftCreationPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    proposalIdRef.current = proposalId;
  }, [proposalId]);

  const methods = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      client_id: clientIdFromQuery || '',
      title: 'Nova Proposta',
      consumption_source: 'average',
      roof_type: '',
      roof_area_m2: '',
      roof_image_url: '',
      module_width_m: '1.13',
      module_height_m: '2.28',
      roof_layout_json: EMPTY_ROOF_LAYOUT,
      selected_solar_kit_id: '',
      solar_kit_snapshot: null,
      yield_factor: '0.80',
      generation_target_percent: '100',
      oversizing: '1.20',
      additional_costs: [],
    }
  });

  const applyValidationUpdates = (updates?: Partial<ProposalFormValues>) => {
    Object.entries(updates || {}).forEach(([key, value]) => {
      methods.setValue(key as any, value as any, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  };

  useEffect(() => {
    async function initWizard() {
      if (isInitializedRef.current && id === proposalIdRef.current) {
        return;
      }
      try {
        if (id) {
          const proposal = await proposalService.getProposalById(id);
          const otherCosts = Number(proposal.other_costs) || 0;

          methods.reset({
            client_id: proposal.client_id,
            title: proposal.title || '',
            consumption_source: proposal.consumption_source || 'average',
            history: (proposal as any).history || [],
            estimated_daily_consumption: proposal.estimated_daily_consumption || '',
            monthly_consumption_kwh: proposal.monthly_consumption_kwh || '',
            bill_amount: proposal.bill_amount || '',
            selected_solar_kit_id: proposal.selected_solar_kit_id || '',
            solar_kit_snapshot: proposal.solar_kit_snapshot || null,
            kit_cost: proposal.kit_cost || '',
            labor_cost: proposal.labor_cost || '',
            fixed_costs: proposal.fixed_costs || '',
            freight_cost: proposal.freight_cost || '',
            taxes: proposal.taxes || '',
            commission: proposal.commission || '',
            other_costs: otherCosts || '',
            additional_costs: otherCosts > 0 ? [{ description: 'Custos adicionais', amount: otherCosts }] : [],
            margin_percentage: proposal.margin_percentage || '',
            discount_percentage: proposal.discount_percentage || '',
            cep: proposal.solar?.cep || '',
            roof_type: proposal.roof_type || '',
            roof_area_m2: proposal.roof_area_m2 || '',
            roof_image_url: proposal.roof_image_url || '',
            module_width_m: proposal.module_width_m || '1.13',
            module_height_m: proposal.module_height_m || '2.28',
            roof_layout_json: proposal.roof_layout_json || EMPTY_ROOF_LAYOUT,
            hsp: proposal.solar?.hsp || '',
            panel_power_w: proposal.solar?.panel_power_w || '',
            yield_factor: proposal.solar?.yield_factor || '0.80',
            generation_target_percent: proposal.solar?.generation_target_percent || '100',
            oversizing: proposal.solar?.oversizing || '1.20',
            energy_tariff: proposal.solar?.energy_tariff || proposal.energy_tariff || '',
            loads: proposal.loads || [],
          });

          // Resume from the correct step
          const stepParam = searchParams.get('step');
          if (stepParam !== null) {
            const parsedStep = parseInt(stepParam, 10);
            if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep < STEPS.length) {
              setCurrentStep(parsedStep);
            }
          } else {
            // Auto-detect step based on completed data
            let resumeStep = 0;
            const hasClient = !!proposal.client_id;
            const hasConsumption = !!(
              proposal.consumption_source &&
              (proposal.monthly_consumption_kwh ||
               proposal.bill_amount ||
               (proposal as any).history?.length > 0)
            );
            const hasProject = !!(
              proposal.solar?.hsp ||
              proposal.solar?.panel_power_w ||
              proposal.solar?.energy_tariff ||
              proposal.energy_tariff
            );
            const hasInstallation = !!(
              proposal.roof_type ||
              (proposal.roof_area_m2 && Number(proposal.roof_area_m2) > 0)
            );
            const hasCosts = !!(
              proposal.kit_cost && Number(proposal.kit_cost) > 0
            );
            const hasFinancial = !!(
              proposal.margin_percentage && Number(proposal.margin_percentage) > 0
            );

            if (hasFinancial) {
              resumeStep = 6; // Preview
            } else if (hasCosts) {
              resumeStep = 5; // Financial
            } else if (hasInstallation) {
              resumeStep = 4; // Costs
            } else if (hasProject) {
              resumeStep = 3; // Installation
            } else if (hasConsumption) {
              resumeStep = 2; // Project
            } else if (hasClient) {
              resumeStep = 1; // Consumption
            }
            setCurrentStep(resumeStep);
          }

          setProposalId(id);
          isInitializedRef.current = true;
        } else if (user) {
          const profile = await profileService.getProfile(user.id);
          if (profile?.default_margin_percentage) {
            methods.setValue('margin_percentage', profile.default_margin_percentage);
          }
          isInitializedRef.current = true;
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao inicializar wizard');
      } finally {
        setIsLoading(false);
      }
    }
    initWizard();
  }, [id, methods, user, searchParams]);

  const saveDraft = async (values: ProposalFormValues, currentId: string | null) => {
    if (!user) return currentId;
    if (!values.client_id) return currentId;

    try {
      if (currentId) {
        await proposalService.updateProposal(currentId, values);
        return currentId;
      }

      if (draftCreationPromiseRef.current) {
        return await draftCreationPromiseRef.current;
      }

      draftCreationPromiseRef.current = (async () => {
        const newProposal = await proposalService.createProposal(values, user.id);
        proposalIdRef.current = newProposal.id;
        setProposalId(newProposal.id);
        navigate(`/propostas/${newProposal.id}/editar`, { replace: true });
        return newProposal.id;
      })();

      return await draftCreationPromiseRef.current;
    } catch (err) {
      console.error('Error auto-saving proposal:', err);
      return proposalIdRef.current || currentId;
    } finally {
      draftCreationPromiseRef.current = null;
    }
  };

  const formValues = methods.watch();
  const latestValuesRef = useRef<ProposalFormValues>(methods.getValues());

  useEffect(() => {
    latestValuesRef.current = formValues;
  }, [formValues]);

  // Debounced auto-save on form values change
  useEffect(() => {
    if (isSubmittedRef.current) return;
    if (!formValues.client_id) return;

    const timer = setTimeout(async () => {
      setIsAutoSaving(true);
      const currentId = proposalIdRef.current;
      await saveDraft(formValues, currentId);
      setIsAutoSaving(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [formValues, user]);

  // Save on unmount (when leaving the flow / navigating away)
  useEffect(() => {
    return () => {
      if (isSubmittedRef.current) return;
      const values = latestValuesRef.current;
      const currentId = proposalIdRef.current;
      if (user && values && values.client_id && currentId) {
        proposalService.updateProposal(currentId, values)
          .catch(err => console.error('Error saving on unmount:', err));
      }
    };
  }, [user]);

  // Handle page reload or closing the browser tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isSubmittedRef.current) return;
      const values = latestValuesRef.current;
      const currentId = proposalIdRef.current;
      if (user && values && values.client_id) {
        if (currentId) {
          proposalService.updateProposal(currentId, values).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  const handleNext = async () => {
    const validation = validateProposalStep(currentStep, methods.getValues());

    if (!validation.isValid) {
      setError(validation.message || 'Preencha as informações obrigatórias antes de continuar.');
      if (validation.stepIndex !== undefined && validation.stepIndex !== currentStep) {
        setCurrentStep(validation.stepIndex);
      }
      return;
    }

    applyValidationUpdates(validation.updates);
    setError(null);

    const latestValues = {
      ...methods.getValues(),
      ...(validation.updates || {}),
    };
    setIsAutoSaving(true);
    await saveDraft(latestValues, proposalIdRef.current);
    setIsAutoSaving(false);

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = async () => {
    setError(null);

    setIsAutoSaving(true);
    await saveDraft(methods.getValues(), proposalIdRef.current);
    setIsAutoSaving(false);

    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSaveDraft = async () => {
    if (!user) return;

    const validation = validateFullProposal(methods.getValues());
    if (!validation.isValid) {
      setError(validation.message || 'Preencha as informações obrigatórias antes de concluir a proposta.');
      if (validation.stepIndex !== undefined) {
        setCurrentStep(validation.stepIndex);
      }
      return;
    }

    applyValidationUpdates(validation.updates);
    setIsSaving(true);
    setError(null);
    try {
      const data = {
        ...methods.getValues(),
        ...(validation.updates || {}),
      };

      isSubmittedRef.current = true;

      const currentId = proposalIdRef.current;
      const savedId = currentId || await saveDraft(data, null);

      if (savedId) {
        await proposalService.updateProposal(savedId, data);
        navigate(`/propostas/${savedId}`);
      } else {
        const newProposal = await proposalService.createProposal(data, user.id);
        proposalIdRef.current = newProposal.id;
        setProposalId(newProposal.id);
        navigate(`/propostas/${newProposal.id}`);
      }
    } catch (err: any) {
      isSubmittedRef.current = false;
      setError(err.message || 'Erro ao concluir proposta');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-brand-blue animate-pulse">Carregando proposta...</div>;
  }

  const isInstallationStep = STEPS[currentStep]?.id === 'installation';

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/propostas')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-brand-dark">
              {isEditing ? 'Editar Proposta' : 'Nova Proposta'}
            </h1>
            <p className="text-sm text-slate-500">
              Etapa {currentStep + 1} de {STEPS.length}: {STEPS[currentStep].title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-brand-surface/50 px-4 py-2 rounded-lg border border-brand-border text-sm">
          {isAutoSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue animate-ping" />
              <span className="text-slate-400 font-medium text-xs">Salvando proposta...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 text-xs">Proposta salva automaticamente</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium border-2 transition-colors
                ${
                  index < currentStep
                    ? 'bg-brand-blue border-brand-blue text-white'
                    : index === currentStep
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-brand-border text-slate-500'
                }
              `}
            >
              {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
            </div>
            <span
              className={`ml-2 text-sm whitespace-nowrap transition-colors ${
                index <= currentStep ? 'text-brand-dark font-medium' : 'text-slate-500'
              }`}
            >
              {step.title}
            </span>
            {index < STEPS.length - 1 && (
              <div className={`w-8 sm:w-12 h-px mx-2 sm:mx-4 transition-colors ${index < currentStep ? 'bg-brand-blue' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <div className={`grid grid-cols-1 gap-6 items-start ${isInstallationStep ? '' : 'lg:grid-cols-3'}`}>
          <Card className={isInstallationStep ? 'w-full' : 'lg:col-span-2'}>
            <CardContent className="p-6">
              {error && (
                <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-md">
                  {error}
                </div>
              )}

              <form className="space-y-6">
                {currentStep === 0 && <StepClient />}
                {currentStep === 1 && <StepConsumption />}
                {currentStep === 2 && <StepProject />}
                {currentStep === 3 && <StepInstallation />}
                {currentStep === 4 && <StepCosts />}
                {currentStep === 5 && <StepFinancial />}
                {currentStep === 6 && <StepPreview />}
              </form>

              <div className="flex justify-between mt-8 pt-6 border-t border-brand-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                {currentStep < STEPS.length - 1 ? (
                  <Button type="button" onClick={handleNext} className="gap-2">
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={onSaveDraft} isLoading={isSaving} className="gap-2">
                    Concluir
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {!isInstallationStep && (
            <div className="lg:col-span-1 lg:sticky lg:top-6">
              <SolarCalculationPreview />
            </div>
          )}
        </div>
      </FormProvider>
    </div>
  );
}
