import React, { useEffect, useState } from "react";
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { Profile } from '../types/profile';
import { DatabaseSetupAlert } from '../components/ui/DatabaseSetupAlert';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Building2,
  Image as ImageIcon,
  User,
  Settings as SettingsIcon,
  Shield,
  Upload,
  Save,
  Loader2,
  Lock,
  UserX,
  AlertTriangle,
  Check,
  Trash2,
  PenLine,
} from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { extractActiveLogo, extractAllLogos, serializeLogos } from '../utils/logoHelper';

export function Configuracoes() {
  const { user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'empresa' | 'logo' | 'vendedor' | 'preferencias' | 'seguranca' | 'encerramento'>('empresa');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [loadError, setLoadError] = useState<any>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === 'logo' || tabParam === 'empresa' || tabParam === 'vendedor' || tabParam === 'preferencias' || tabParam === 'seguranca' || tabParam === 'encerramento') {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      try {
        const data = await profileService.getProfile(user.id);
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile:', err);
        setLoadError(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;

    setIsSaving(true);
    try {
      const { id, created_at, updated_at, ...updateData } = profile;
      const data = await profileService.updateProfile(user.id, updateData);
      setProfile(data);
      toast.success('Configurações salvas com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !profile || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setUploadingLogo(true);

    try {
      const url = await profileService.uploadLogo(file, user.id);
      const currentLogos = extractAllLogos(profile.logo_url);
      const activeLogo = extractActiveLogo(profile.logo_url);
      const updatedLogos = [...currentLogos, url];
      const newActiveLogo = activeLogo || url;
      const serializedValue = serializeLogos(newActiveLogo, updatedLogos);

      const nextProfile = { ...profile, logo_url: serializedValue };
      setProfile(nextProfile);
      await profileService.updateProfile(user.id, { logo_url: serializedValue });
      toast.success('Logo enviada com sucesso!');
    } catch (err: any) {
      toast.error(err?.message?.includes('row-level security') ? 'Erro de permissão. Execute o supabase-schema.sql no SQL Editor.' : (err.message || 'Erro ao fazer upload da logo'));
    } finally {
      setUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleSetLogoActive = async (url: string) => {
    if (!user || !profile) return;

    try {
      const currentLogos = extractAllLogos(profile.logo_url);
      const serializedValue = serializeLogos(url, currentLogos);

      setProfile({ ...profile, logo_url: serializedValue });
      await profileService.updateProfile(user.id, { logo_url: serializedValue });
      toast.success('Logo ativa alterada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar logo ativa');
    }
  };

  const handleDeleteLogo = async (url: string) => {
    if (!user || !profile) return;

    try {
      const currentLogos = extractAllLogos(profile.logo_url);
      const activeLogo = extractActiveLogo(profile.logo_url);
      const updatedLogos = currentLogos.filter((logo) => logo !== url);
      let newActiveLogo = activeLogo;

      if (activeLogo === url) {
        newActiveLogo = updatedLogos.length > 0 ? updatedLogos[0] : null;
      }

      const serializedValue = updatedLogos.length > 0 ? serializeLogos(newActiveLogo, updatedLogos) : null;

      setProfile({ ...profile, logo_url: serializedValue });
      await profileService.updateProfile(user.id, { logo_url: serializedValue });
      toast.success('Logo excluída com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir logo');
    }
  };

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !profile || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setUploadingSignature(true);

    try {
      const url = await profileService.uploadSellerSignature(file, user.id);
      const nextProfile = { ...profile, seller_signature_url: url };
      setProfile(nextProfile);
      await profileService.updateProfile(user.id, { seller_signature_url: url });
      toast.success('Assinatura enviada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar assinatura');
    } finally {
      setUploadingSignature(false);
      event.target.value = '';
    }
  };

  const handleRemoveSignature = async () => {
    if (!user || !profile) return;

    try {
      const nextProfile = { ...profile, seller_signature_url: null };
      setProfile(nextProfile);
      await profileService.updateProfile(user.id, { seller_signature_url: null });
      toast.success('Assinatura removida.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao remover assinatura');
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const { name, value } = event.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const { name, value } = event.target;
    setProfile({ ...profile, [name]: value ? Number(value) : null });
  };

  const handleUpdatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordErrorMessage(null);
    setPasswordSuccessMessage(null);

    if (!user?.email) {
      setPasswordErrorMessage('Usuário não autenticado.');
      return;
    }

    if (!currentPassword) {
      setPasswordErrorMessage('Por favor, insira sua senha atual.');
      return;
    }

    if (!newPassword) {
      setPasswordErrorMessage('Por favor, insira a nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrorMessage('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMessage('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordErrorMessage('A nova senha não pode ser igual à senha atual.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('A senha atual digitada está incorreta.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setPasswordSuccessMessage('Senha alterada com sucesso de forma instantânea!');
      toast.success('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordErrorMessage(err.message || 'Ocorreu um erro ao tentar alterar a senha.');
      toast.error(err.message || 'Erro ao alterar a senha');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setDeleteErrorMessage(null);
    setDeleteSuccessMessage(null);

    if (!user?.email) {
      setDeleteErrorMessage('Usuário não autenticado.');
      return;
    }

    if (deleteConfirmText.trim().toLowerCase() !== 'excluir a conta') {
      setDeleteErrorMessage('Por favor, digite exatamente "excluir a conta" para confirmar.');
      return;
    }

    if (!deletePassword) {
      setDeleteErrorMessage('Por favor, insira sua senha atual.');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (signInError) {
        throw new Error('A senha digitada está incorreta.');
      }

      const { error: deleteError } = await supabase.rpc('delete_user_account');

      if (deleteError) {
        if (
          deleteError.message?.toLowerCase().includes('does not exist') ||
          deleteError.code === 'P0001' ||
          deleteError.message?.toLowerCase().includes('function') ||
          deleteError.message?.toLowerCase().includes('not found')
        ) {
          setDeleteErrorMessage(
            'Para excluir a sua conta, é necessário registrar uma função de banco de dados no Supabase. Por favor, acesse seu painel do Supabase, abra o "SQL Editor" e execute o comando SQL abaixo:\n\n' +
            'CREATE OR REPLACE FUNCTION public.delete_user_account()\n' +
            'RETURNS void\n' +
            'LANGUAGE plpgsql\n' +
            'SECURITY DEFINER\n' +
            'SET search_path = public\n' +
            'AS $$\n' +
            'BEGIN\n' +
            '  DELETE FROM auth.users WHERE id = auth.uid();\n' +
            'END;\n' +
            '$$;\n\n' +
            'Após rodar este comando no painel do Supabase, tente clicar em excluir novamente.'
          );
          setIsDeletingAccount(false);
          return;
        }

        throw deleteError;
      }

      setDeleteSuccessMessage('Sua conta e todos os dados foram excluídos permanentemente. Você será desconectado em instantes...');
      toast.success('Conta excluída com sucesso!');
      setDeleteConfirmText('');
      setDeletePassword('');

      setTimeout(async () => {
        await signOut();
      }, 3000);
    } catch (err: any) {
      setDeleteErrorMessage(err.message || 'Ocorreu um erro ao processar o encerramento da conta.');
      toast.error(err.message || 'Erro ao processar encerramento');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return <div className="text-brand-blue animate-pulse">Carregando configurações...</div>;
  }

  if (loadError) {
    return <DatabaseSetupAlert error={loadError} resourceName="suas configurações" />;
  }

  if (!profile) {
    return <div className="text-red-600">Carregando dados...</div>;
  }

  const tabs = [
    { id: 'empresa', label: 'Dados da Empresa', icon: Building2 },
    { id: 'logo', label: 'Logo', icon: ImageIcon },
    { id: 'vendedor', label: 'Dados do Usuário', icon: User },
    { id: 'preferencias', label: 'Preferências Comerciais', icon: SettingsIcon },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'encerramento', label: 'Encerramento da Conta', icon: UserX },
  ] as const;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark mb-2">Configurações da Conta</h1>
        <p className="text-sm text-slate-500">Personalize as informações que aparecerão nas suas propostas.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 flex flex-col gap-1 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                    : 'text-slate-500 hover:bg-gray-100 hover:text-brand-dark border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 w-full min-w-0">
          {activeTab === 'empresa' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados da Empresa</CardTitle>
                <CardDescription>Informações principais da sua empresa de energia solar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Razão Social / Nome da Empresa</label>
                    <input name="company_name" value={profile.company_name || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">CNPJ</label>
                    <input name="document" value={profile.document || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Telefone da Empresa</label>
                    <input name="phone" value={profile.phone || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">E-mail da Empresa</label>
                    <input name="company_email" type="email" value={profile.company_email || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-brand-dark">Website</label>
                    <input name="website" placeholder="https://" value={profile.website || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-border">
                  <h4 className="text-sm font-medium text-brand-dark mb-4">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-dark">CEP</label>
                      <input name="cep" value={profile.cep || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-brand-dark">Endereço (Rua, Número, Bairro)</label>
                      <input name="address" value={profile.address || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-dark">Cidade</label>
                      <input name="city" value={profile.city || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-dark">Estado (UF)</label>
                      <input name="state" maxLength={2} value={profile.state || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none uppercase" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'logo' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Logos da Empresa</CardTitle>
                <CardDescription>Envie múltiplos logotipos e defina qual será o principal para cabeçalhos de propostas em PDF e links públicos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {extractAllLogos(profile.logo_url).map((logoUrl, index) => {
                    const isActive = extractActiveLogo(profile.logo_url) === logoUrl;
                    return (
                      <div key={logoUrl} className={`relative group rounded-lg border p-4 bg-brand-surface flex flex-col items-center justify-center transition-all ${isActive ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-brand-blue/5' : 'border-brand-border hover:border-slate-400'}`}>
                        {isActive && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-brand-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                            <Check className="w-3 h-3" /> Padrão
                          </div>
                        )}
                        <div className="h-20 w-full flex items-center justify-center p-2 mb-3">
                          <img src={logoUrl} alt={`Logo ${index + 1}`} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex gap-2 w-full mt-auto pt-2 border-t border-brand-border/60">
                          {!isActive ? (
                            <button onClick={() => handleSetLogoActive(logoUrl)} className="flex-1 text-xs text-brand-blue hover:text-brand-blue-hover font-medium py-1.5 px-2 bg-brand-blue/10 hover:bg-brand-blue/20 rounded transition-colors text-center cursor-pointer">
                              Tornar Padrão
                            </button>
                          ) : (
                            <span className="flex-1 text-center text-xs text-brand-blue font-bold py-1.5">Logo Ativa</span>
                          )}
                          <button onClick={() => handleDeleteLogo(logoUrl)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded transition-colors cursor-pointer" title="Excluir logo">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {extractAllLogos(profile.logo_url).length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-12 h-12 text-slate-300 mb-2" />
                      <p className="text-sm font-medium">Nenhum logotipo enviado ainda.</p>
                      <p className="text-xs">Faça o upload do seu primeiro logo abaixo.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-brand-border pt-6 flex flex-col items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-brand-dark">Adicionar Novo Logotipo</p>
                    <p className="text-xs text-slate-500 mt-0.5">Suporta PNG e JPG de até 5MB. Você pode adicionar múltiplos logotipos.</p>
                  </div>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  <Button type="button" variant="outline" className="gap-2 cursor-pointer" disabled={uploadingLogo} onClick={() => document.getElementById('logo-upload')?.click()}>
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingLogo ? 'Enviando...' : 'Fazer Upload de Logo'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'vendedor' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Usuário / Vendedor</CardTitle>
                <CardDescription>Suas informações de contato e assinatura padrão que serão inseridas nas propostas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Seu Nome (como Vendedor)</label>
                    <input name="seller_name" value={profile.seller_name || profile.name || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Seu Telefone / WhatsApp</label>
                    <input name="seller_phone" value={profile.seller_phone || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Seu E-mail</label>
                    <input name="seller_email" type="email" value={profile.seller_email || ''} onChange={handleChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  </div>
                </div>

                <div className="border-t border-brand-border pt-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                        <PenLine className="h-4 w-4 text-brand-blue" />
                        Assinatura do vendedor
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">PNG transparente, JPG ou SVG. Ela será aplicada automaticamente no final do PDF.</p>
                    </div>
                    {profile.seller_signature_url && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300">Assinatura ativa</span>
                    )}
                  </div>

                  <div className="mt-4 rounded-xl border border-dashed border-brand-border bg-brand-surface p-4">
                    {profile.seller_signature_url ? (
                      <div className="flex min-h-28 items-center justify-center rounded-lg bg-white p-5">
                        <img src={profile.seller_signature_url} alt="Assinatura do vendedor" className="max-h-24 max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="flex min-h-28 flex-col items-center justify-center text-center">
                        <PenLine className="mb-2 h-8 w-8 text-slate-500" />
                        <p className="text-sm font-medium text-brand-dark">Nenhuma assinatura enviada</p>
                        <p className="mt-1 text-xs text-slate-500">Envie a assinatura para preencher automaticamente o campo no PDF.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <input id="seller-signature-upload" type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,.svg" className="hidden" onChange={handleSignatureUpload} disabled={uploadingSignature} />
                    {profile.seller_signature_url && (
                      <Button type="button" variant="outline" className="gap-2" onClick={handleRemoveSignature}>
                        <Trash2 className="h-4 w-4" />
                        Remover assinatura
                      </Button>
                    )}
                    <Button type="button" className="gap-2" disabled={uploadingSignature} onClick={() => document.getElementById('seller-signature-upload')?.click()}>
                      {uploadingSignature ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploadingSignature ? 'Enviando...' : profile.seller_signature_url ? 'Trocar assinatura' : 'Adicionar assinatura'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferencias' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preferências Comerciais</CardTitle>
                <CardDescription>Defina os padrões para a geração de novas propostas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-dark">Margem de Lucro Padrão (%)</label>
                  <input type="number" name="default_margin_percentage" value={profile.default_margin_percentage || ''} onChange={handleNumberChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  <p className="text-xs text-slate-500">Esta margem será aplicada automaticamente ao criar uma nova proposta.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-dark">Validade Padrão da Proposta (Dias)</label>
                  <input type="number" name="default_validity_days" value={profile.default_validity_days || 7} onChange={handleNumberChange} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                  <p className="text-xs text-slate-500">Determina a data de expiração calculada a partir da data de criação.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'seguranca' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Segurança</CardTitle>
                  <CardDescription>Gerencie as configurações de segurança da sua conta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-brand-border rounded-lg bg-brand-surface">
                    <div>
                      <h4 className="text-sm font-medium text-brand-dark">Autenticação em Duas Etapas (MFA)</h4>
                      <p className="text-xs text-slate-500 mt-1">Adicione uma camada extra de segurança na sua conta exigindo um código no login.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{profile.mfa_enabled ? 'Ativado' : 'Desativado'}</span>
                      <button onClick={() => setProfile({ ...profile, mfa_enabled: !profile.mfa_enabled })} className={`w-10 h-6 rounded-full transition-colors relative flex items-center px-1 ${profile.mfa_enabled ? 'bg-brand-blue' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 rounded-full bg-brand-surface transition-transform ${profile.mfa_enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5 text-brand-blue" />
                    Alterar Senha
                  </CardTitle>
                  <CardDescription>Altere a senha de acesso à sua conta. Para sua segurança, você deve confirmar com a sua senha atual.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    {passwordErrorMessage && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">{passwordErrorMessage}</div>}
                    {passwordSuccessMessage && <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg font-medium">{passwordSuccessMessage}</div>}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-brand-dark">Senha Atual</label>
                      <input type="password" placeholder="Digite sua senha atual" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-dark">Nova Senha</label>
                        <input type="password" placeholder="Mínimo de 6 caracteres" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-brand-dark">Confirmar Nova Senha</label>
                        <input type="password" placeholder="Confirme sua nova senha" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-brand-blue focus:ring-1 focus:ring-brand-blue outline-none" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={isUpdatingPassword} className="gap-2">
                        {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {isUpdatingPassword ? 'Enviando...' : 'Alterar Senha'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'encerramento' && (
            <Card className="border-red-200">
              <CardHeader className="bg-red-50/50 border-b border-red-100 rounded-t-xl">
                <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Encerramento da Conta
                </CardTitle>
                <CardDescription className="text-red-600/80">Esta ação é permanente e irreversível.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  {deleteErrorMessage && <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg whitespace-pre-wrap">{deleteErrorMessage}</div>}
                  {deleteSuccessMessage && <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg font-medium">{deleteSuccessMessage}</div>}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm space-y-2">
                    <p className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />Aviso Importante:</p>
                    <p className="text-xs text-amber-700 leading-relaxed">Para concluir a exclusão definitiva, digite exatamente a frase de confirmação e sua senha atual.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Confirme digitando <strong className="text-red-600">excluir a conta</strong>:</label>
                    <input type="text" placeholder="Digite 'excluir a conta' para confirmar" value={deleteConfirmText} onChange={(event) => setDeleteConfirmText(event.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-dark">Sua Senha Atual</label>
                    <input type="password" placeholder="Digite sua senha para confirmar" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-dark focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" />
                  </div>
                  <div className="flex justify-end pt-4 border-t border-brand-border">
                    <Button type="submit" variant="destructive" disabled={isDeletingAccount} className="gap-2 bg-red-600 hover:bg-red-700 text-white border-none">
                      {isDeletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                      {isDeletingAccount ? 'Excluindo conta...' : 'Excluir Minha Conta Permanentemente'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab !== 'seguranca' && activeTab !== 'encerramento' && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
