import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { pdfDesignService } from '../../services/pdfDesignService';
import { PdfTemplate, PdfCoverTemplate } from '../../types/pdfDesign';
import { SvgPreview } from './SvgPreview';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Save, Image as ImageIcon, LayoutTemplate } from 'lucide-react';

export function DesignPdf() {
  const { user } = useAuth();
  
  const [coverTemplates, setCoverTemplates] = useState<PdfCoverTemplate[]>([]);
  const [userTemplate, setUserTemplate] = useState<Partial<PdfTemplate> | null>(null);
  
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#1e3a8a');
  const [accentColor, setAccentColor] = useState('#10b981');
  const [backgroundColor, setBackgroundColor] = useState('#09090b');
  
  const [selectedCover, setSelectedCover] = useState<PdfCoverTemplate | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Mock data if templates don't exist yet in the DB
        // In a real app we would seed the DB, but since RLS and schema were just created, it might be empty
        const covers = await pdfDesignService.getCoverTemplates();
        
        let loadedCovers = covers;
        if (covers.length === 0) {
           const mockCovers = [
             { name: 'Clássico 1', file: 'cover-model-1.svg' },
             { name: 'Moderno 1', file: 'cover-model-2.svg' },
             { name: 'Elegante 1', file: 'cover-model-3.svg' },
             { name: 'Clássico 2', file: 'cover-model-1.svg' },
             { name: 'Moderno 2', file: 'cover-model-2.svg' },
             { name: 'Elegante 2', file: 'cover-model-3.svg' },
             { name: 'Clássico 3', file: 'cover-model-1.svg' },
             { name: 'Moderno 3', file: 'cover-model-2.svg' },
             { name: 'Elegante 3', file: 'cover-model-3.svg' },
             { name: 'Premium 1', file: 'cover-model-1.svg' },
           ];
           
           loadedCovers = mockCovers.map((c, i) => ({
               id: String(i + 1),
               name: `Modelo ${i + 1} (${c.name})`,
               svg_file_url: `/pdf-assets/covers/${c.file}`,
               thumbnail_url: null,
               is_active: true,
               created_at: new Date().toISOString()
           }));
           setCoverTemplates(loadedCovers);
        } else {
           setCoverTemplates(covers);
        }

        const template = await pdfDesignService.getDefaultTemplate();
        if (template) {
          setUserTemplate(template);
          setPrimaryColor(template.primary_color);
          setSecondaryColor(template.secondary_color);
          setAccentColor(template.accent_color);
          setBackgroundColor(template.background_color);
          setLogoUrl(template.logo_url || '');
          setCoverPhotoUrl(template.cover_photo_url || '');
          const cover = loadedCovers.find(c => c.id === template.cover_template_id);
          if (cover) setSelectedCover(cover);
          else setSelectedCover(loadedCovers[0]);
        } else {
          setSelectedCover(loadedCovers[0]);
        }
      } catch (error) {
        console.error('Error loading design data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const templateData: Partial<PdfTemplate> = {
        id: userTemplate?.id,
        user_id: user.id,
        name: userTemplate?.name || 'Meu Template Padrão',
        cover_template_id: selectedCover?.id,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        background_color: backgroundColor,
        logo_url: logoUrl,
        cover_photo_url: coverPhotoUrl,
        is_default: true
      };

      const saved = await pdfDesignService.saveTemplate(templateData);
      setUserTemplate(saved);
      toast.success('Template salvo com sucesso!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erro ao salvar o template.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await pdfDesignService.uploadAsset(file, 'logos');
      setLogoUrl(url);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await pdfDesignService.uploadAsset(file, 'backgrounds');
      setCoverPhotoUrl(url);
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (isLoading) {
    return <div className="text-brand-dark p-8">Carregando editor...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Design da Proposta em PDF</h1>
          <p className="text-slate-500">Personalize a capa e as cores do seu documento.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar como Padrão'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-brand-border rounded-lg p-6 space-y-6">
            
            {/* Escolha de Template */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-brand-dark">
                <LayoutTemplate className="w-4 h-4 text-[#3B82F6]" />
                Modelo da Capa
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {coverTemplates.map(cover => (
                  <div 
                    key={cover.id}
                    onClick={() => setSelectedCover(cover)}
                    className={`cursor-pointer p-3 border rounded-lg text-center text-sm transition-colors ${
                      selectedCover?.id === cover.id 
                      ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-brand-dark' 
                      : 'border-brand-border bg-black text-slate-500 hover:border-gray-300'
                    }`}
                  >
                    {cover.name}
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-brand-border" />

            {/* Paleta de Cores */}
            <div className="space-y-4">
              <Label className="text-brand-dark">Paleta de Cores</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Cor Primária</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 p-1 h-10" />
                    <Input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 uppercase" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 p-1 h-10" />
                    <Input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 uppercase" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-12 p-1 h-10" />
                    <Input type="text" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1 uppercase" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 mb-1 block">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-12 p-1 h-10" />
                    <Input type="text" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="flex-1 uppercase" />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-brand-border" />

            {/* Uploads */}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 text-brand-dark mb-2">
                  <ImageIcon className="w-4 h-4 text-[#10B981]" />
                  Logo da Empresa
                </Label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} className="flex-1" />
                  {logoUrl && <div className="w-10 h-10 bg-white rounded flex items-center justify-center p-1"><img src={logoUrl} alt="Logo" className="max-w-full max-h-full" /></div>}
                </div>
                {uploadingLogo && <span className="text-xs text-brand-blue mt-1 block">Enviando...</span>}
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-brand-dark mb-2">
                  <ImageIcon className="w-4 h-4 text-[#F59E0B]" />
                  Foto da Capa (Fundo)
                </Label>
                <div className="flex items-center gap-3">
                  <Input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} className="flex-1" />
                  {coverPhotoUrl && <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden"><img src={coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" /></div>}
                </div>
                {uploadingPhoto && <span className="text-xs text-brand-blue mt-1 block">Enviando...</span>}
              </div>
            </div>

          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white border border-brand-border rounded-lg p-6 h-full flex flex-col">
            <h2 className="text-lg font-medium text-brand-dark mb-4">Pré-visualização</h2>
            <div className="flex-1 bg-black rounded-lg border border-brand-border flex items-center justify-center overflow-hidden">
              <SvgPreview 
                svgUrl={selectedCover?.svg_file_url || ''} 
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                accentColor={accentColor}
                backgroundColor={backgroundColor}
                logoUrl={logoUrl}
                coverPhotoUrl={coverPhotoUrl}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
