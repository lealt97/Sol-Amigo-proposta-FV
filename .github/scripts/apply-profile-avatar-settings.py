from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    content = file_path.read_text(encoding='utf-8')
    if old not in content:
        raise SystemExit(f'Trecho não encontrado em {path}: {old[:100]!r}')
    file_path.write_text(content.replace(old, new, 1), encoding='utf-8')


path = 'src/pages/Configuracoes.tsx'

replace_once(
    path,
    "  Sparkles,\n} from 'lucide-react';",
    "  Sparkles,\n  Camera,\n} from 'lucide-react';",
)
replace_once(
    path,
    '  const [uploadingSignature, setUploadingSignature] = useState(false);\n  const [loadError, setLoadError] = useState<any>(null);',
    '  const [uploadingSignature, setUploadingSignature] = useState(false);\n  const [uploadingAvatar, setUploadingAvatar] = useState(false);\n  const [removingAvatar, setRemovingAvatar] = useState(false);\n  const [loadError, setLoadError] = useState<any>(null);',
)
replace_once(
    path,
    "  const setProfileAndPreview = (nextProfile: Profile) => {\n    setProfile(nextProfile);\n    applyPlatformTheme(nextProfile.platform_theme || null);\n  };",
    "  const notifyProfileUpdated = (nextProfile: Profile) => {\n    window.dispatchEvent(new CustomEvent<Profile>('solamigo:profile-updated', { detail: nextProfile }));\n  };\n\n  const setProfileAndPreview = (nextProfile: Profile) => {\n    setProfile(nextProfile);\n    applyPlatformTheme(nextProfile.platform_theme || null);\n  };",
)
replace_once(
    path,
    "      setProfile(data);\n      applyPlatformTheme(data.platform_theme || null);\n      toast.success('Configurações salvas com sucesso!');",
    "      setProfile(data);\n      applyPlatformTheme(data.platform_theme || null);\n      notifyProfileUpdated(data);\n      toast.success('Configurações salvas com sucesso!');",
)
replace_once(
    path,
    '  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {',
    "  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {\n    if (!user || !profile || !event.target.files?.length) return;\n\n    const file = event.target.files[0];\n    const previousAvatarUrl = profile.avatar_url;\n    let uploadedPath: string | null = null;\n    setUploadingAvatar(true);\n\n    try {\n      const uploaded = await profileService.uploadProfileAvatar(file, user.id);\n      uploadedPath = uploaded.path;\n      const data = await profileService.updateProfile(user.id, { avatar_url: uploaded.url });\n      setProfile(data);\n      notifyProfileUpdated(data);\n\n      if (previousAvatarUrl) {\n        void profileService.deleteProfileAvatar(previousAvatarUrl, user.id).catch((error) => {\n          console.warn('Não foi possível remover a foto de perfil anterior:', error);\n        });\n      }\n\n      toast.success('Foto de perfil atualizada!');\n    } catch (err: any) {\n      if (uploadedPath) {\n        void profileService.deleteProfileAvatar(uploadedPath, user.id).catch(() => undefined);\n      }\n      toast.error(err.message || 'Erro ao enviar a foto de perfil');\n    } finally {\n      setUploadingAvatar(false);\n      event.target.value = '';\n    }\n  };\n\n  const handleRemoveAvatar = async () => {\n    if (!user || !profile?.avatar_url) return;\n\n    const previousAvatarUrl = profile.avatar_url;\n    setRemovingAvatar(true);\n    try {\n      const data = await profileService.updateProfile(user.id, { avatar_url: null });\n      setProfile(data);\n      notifyProfileUpdated(data);\n      await profileService.deleteProfileAvatar(previousAvatarUrl, user.id);\n      toast.success('Foto de perfil removida.');\n    } catch (err: any) {\n      toast.error(err.message || 'Erro ao remover a foto de perfil');\n    } finally {\n      setRemovingAvatar(false);\n    }\n  };\n\n  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {",
)
replace_once(
    path,
    '                <CardTitle className="text-lg">Dados do Usuário / Vendedor</CardTitle>\n                <CardDescription>Suas informações de contato e assinatura padrão que serão inseridas nas propostas.</CardDescription>',
    '                <CardTitle className="text-lg">Dados do Usuário / Vendedor</CardTitle>\n                <CardDescription>Gerencie sua foto de perfil, informações de contato e assinatura padrão.</CardDescription>',
)
replace_once(
    path,
    '              <CardContent className="space-y-6">\n                <div className="space-y-4">\n                  <div className="space-y-2">\n                    <label className="text-sm font-medium text-brand-dark">Seu Nome (como Vendedor)</label>',
    "              <CardContent className=\"space-y-6\">\n                <div className=\"rounded-xl border border-brand-border bg-brand-surface p-4\">\n                  <div className=\"flex flex-col gap-4 sm:flex-row sm:items-center\">\n                    <div className=\"h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-brand-border bg-gradient-to-tr from-brand-blue to-brand-blue-hover\">\n                      {profile.avatar_url ? (\n                        <img src={profile.avatar_url} alt=\"Sua foto de perfil\" className=\"h-full w-full object-cover\" />\n                      ) : (\n                        <div className=\"flex h-full w-full items-center justify-center text-3xl font-bold uppercase text-white\">\n                          {(profile.seller_name || profile.name || user?.email || 'U').charAt(0)}\n                        </div>\n                      )}\n                    </div>\n\n                    <div className=\"min-w-0 flex-1\">\n                      <h4 className=\"flex items-center gap-2 text-sm font-semibold text-brand-dark\">\n                        <Camera className=\"h-4 w-4 text-brand-blue\" />\n                        Foto de perfil\n                      </h4>\n                      <p className=\"mt-1 text-xs leading-relaxed text-slate-500\">\n                        PNG, JPG ou WebP de até 2 MB. A foto será exibida no avatar do menu lateral do SaaS.\n                      </p>\n                      <input\n                        id=\"profile-avatar-upload\"\n                        type=\"file\"\n                        accept=\"image/png,image/jpeg,image/webp\"\n                        className=\"hidden\"\n                        onChange={handleAvatarUpload}\n                        disabled={uploadingAvatar || removingAvatar}\n                      />\n                      <div className=\"mt-3 flex flex-wrap gap-2\">\n                        <Button\n                          type=\"button\"\n                          variant=\"outline\"\n                          className=\"gap-2\"\n                          disabled={uploadingAvatar || removingAvatar}\n                          onClick={() => document.getElementById('profile-avatar-upload')?.click()}\n                        >\n                          {uploadingAvatar ? <Loader2 className=\"h-4 w-4 animate-spin\" /> : <Upload className=\"h-4 w-4\" />}\n                          {uploadingAvatar ? 'Enviando...' : profile.avatar_url ? 'Trocar foto' : 'Adicionar foto'}\n                        </Button>\n                        {profile.avatar_url && (\n                          <Button\n                            type=\"button\"\n                            variant=\"outline\"\n                            className=\"gap-2 text-red-500 hover:text-red-600\"\n                            disabled={uploadingAvatar || removingAvatar}\n                            onClick={() => void handleRemoveAvatar()}\n                          >\n                            {removingAvatar ? <Loader2 className=\"h-4 w-4 animate-spin\" /> : <Trash2 className=\"h-4 w-4\" />}\n                            {removingAvatar ? 'Removendo...' : 'Remover foto'}\n                          </Button>\n                        )}\n                      </div>\n                    </div>\n                  </div>\n                </div>\n\n                <div className=\"space-y-4\">\n                  <div className=\"space-y-2\">\n                    <label className=\"text-sm font-medium text-brand-dark\">Seu Nome (como Vendedor)</label>",
)
replace_once(
    path,
    "                      <div>\n                        <p className=\"text-xs uppercase tracking-[0.24em] text-brand-blue\">Prévia ao vivo</p>\n                        <h3 className=\"mt-1 text-xl font-bold text-brand-dark\">SolAmigo Pro</h3>\n                      </div>",
    "                      <p className=\"text-xs uppercase tracking-[0.24em] text-brand-blue\">Prévia ao vivo</p>",
)
