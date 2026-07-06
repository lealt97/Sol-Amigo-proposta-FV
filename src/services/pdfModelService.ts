import { PdfTemplatePreset, PdfUserModel } from '../types/pdfModels';
import { supabase } from '../lib/supabase/client';

const LOCAL_STORAGE_KEY = 'solamigo_pdf_user_models';

const defaultTransform = { zoom: 1, x: 0, y: 0, rotate: 0 };
const defaultPageConfig = { order: ['cover', 'intro', 'technical', 'financial', 'payback'] };

export const PRESETS: PdfTemplatePreset[] = [
  {
    id: 'preset-1',
    name: 'Moderno Solar',
    thumbnail_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80',
    svg_content: `<svg viewBox="0 0 794 1123" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="cover-photo-mask"><rect width="794" height="600" rx="0" /></clipPath>
      </defs>
      <rect width="100%" height="100%" fill="var(--pdf-neutral)" />
      <g clip-path="url(#cover-photo-mask)">
        <image id="cover-photo-image" href="" width="794" height="600" preserveAspectRatio="xMidYMid slice" />
      </g>
      <rect y="600" width="794" height="523" fill="var(--pdf-primary)" />
      <rect y="580" width="794" height="40" fill="var(--pdf-accent)" />
      <text id="company-name" x="40" y="660" font-family="Arial" font-size="24" font-weight="bold" fill="#ffffff">NOME DA EMPRESA</text>
      <text id="proposal-title" x="40" y="740" font-family="Arial" font-size="48" font-weight="bold" fill="#ffffff">Proposta Comercial</text>
      <text id="proposal-subtitle" x="40" y="790" font-family="Arial" font-size="24" fill="var(--pdf-secondary)">Sistema Fotovoltaico</text>
      <text id="client-name" x="40" y="860" font-family="Arial" font-size="20" fill="#ffffff">Cliente: {client_name}</text>
      <text id="project-power" x="40" y="900" font-family="Arial" font-size="20" fill="#ffffff">Potência: {power} kWp</text>
      <text id="city-state" x="40" y="940" font-family="Arial" font-size="20" fill="#ffffff">{city}</text>
      <text id="proposal-date" x="40" y="980" font-family="Arial" font-size="20" fill="#ffffff">{date}</text>
    </svg>`,
    default_theme: {
      primary: '#0F172A',
      secondary: '#38BDF8',
      accent: '#F59E0B',
      neutral: '#FFFFFF'
    },
    page_config: defaultPageConfig
  },
  {
    id: 'preset-2',
    name: 'Clean Energy',
    thumbnail_url: 'https://images.unsplash.com/photo-1508514177221-188b1c77eca2?w=400&q=80',
    svg_content: `<svg viewBox="0 0 794 1123" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="cover-photo-mask"><path d="M 0 0 L 794 0 L 794 500 L 0 700 Z" /></clipPath>
      </defs>
      <rect width="100%" height="100%" fill="var(--pdf-neutral)" />
      <g clip-path="url(#cover-photo-mask)">
        <image id="cover-photo-image" href="" width="794" height="700" preserveAspectRatio="xMidYMid slice" />
      </g>
      <path d="M 0 680 L 794 480 L 794 520 L 0 720 Z" fill="var(--pdf-accent)" />
      <rect y="720" width="794" height="403" fill="var(--pdf-primary)" />
      <text id="company-name" x="50" y="800" font-family="Arial" font-size="28" font-weight="bold" fill="#ffffff">EMPRESA</text>
      <text id="proposal-title" x="50" y="880" font-family="Arial" font-size="56" font-weight="bold" fill="var(--pdf-secondary)">Energia Solar</text>
      <text id="client-name" x="50" y="950" font-family="Arial" font-size="24" fill="#ffffff">{client_name}</text>
      <text id="proposal-date" x="50" y="1000" font-family="Arial" font-size="18" fill="#ffffff">{date}</text>
    </svg>`,
    default_theme: {
      primary: '#064E3B',
      secondary: '#34D399',
      accent: '#10B981',
      neutral: '#F3F4F6'
    },
    page_config: defaultPageConfig
  }
];

// Add remaining presets up to 10 dynamically
for (let i = 3; i <= 10; i++) {
  PRESETS.push({
    id: `preset-${i}`,
    name: `Modelo Original ${i}`,
    thumbnail_url: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80',
    svg_content: `<svg viewBox="0 0 794 1123" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="var(--pdf-primary)" /><text x="397" y="561" text-anchor="middle" font-family="Arial" font-size="36" fill="#ffffff">Modelo ${i}</text></svg>`,
    default_theme: {
      primary: '#1E3A8A',
      secondary: '#3B82F6',
      accent: '#60A5FA',
      neutral: '#FFFFFF'
    },
    page_config: defaultPageConfig
  });
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export const pdfModelService = {
  getPresets(): PdfTemplatePreset[] {
    return PRESETS;
  },

  getPreset(id: string): PdfTemplatePreset | undefined {
    return PRESETS.find(p => p.id === id);
  },

  async getUserModels(userId: string): Promise<PdfUserModel[]> {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    try {
      const models: PdfUserModel[] = JSON.parse(raw);
      return models.filter(m => m.user_id === userId);
    } catch (e) {
      console.error('Error parsing user models from local storage', e);
      return [];
    }
  },

  async getModelById(id: string): Promise<PdfUserModel | null> {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    try {
      const models: PdfUserModel[] = JSON.parse(raw);
      return models.find(m => m.id === id) || null;
    } catch (e) {
      return null;
    }
  },

  async createModelFromPreset(presetId: string, userId: string): Promise<PdfUserModel> {
    const preset = this.getPreset(presetId);
    if (!preset) throw new Error('Preset not found');

    const models = await this.getUserModels(userId);
    const isFirst = models.length === 0;

    const newModel: PdfUserModel = {
      id: generateId(),
      user_id: userId,
      preset_id: preset.id,
      name: `${preset.name} (Cópia)`,
      theme: { ...preset.default_theme },
      logo_url: null,
      cover_image_url: null,
      logo_transform: { ...defaultTransform },
      cover_image_transform: { ...defaultTransform },
      page_config: { ...preset.page_config },
      is_default: isFirst,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allModels = this.getAllModels();
    allModels.push(newModel);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allModels));
    return newModel;
  },

  async duplicateModel(modelId: string, userId: string): Promise<PdfUserModel> {
    const sourceModel = await this.getModelById(modelId);
    if (!sourceModel) throw new Error('Source model not found');

    const newModel: PdfUserModel = {
      ...sourceModel,
      id: generateId(),
      source_model_id: sourceModel.id,
      name: `${sourceModel.name} (Cópia)`,
      is_default: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const allModels = this.getAllModels();
    allModels.push(newModel);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allModels));
    return newModel;
  },

  async updateModel(id: string, updates: Partial<PdfUserModel>): Promise<PdfUserModel> {
    const allModels = this.getAllModels();
    const index = allModels.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Model not found');

    allModels[index] = {
      ...allModels[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.is_default) {
      for (let i = 0; i < allModels.length; i++) {
        if (i !== index && allModels[i].user_id === allModels[index].user_id) {
          allModels[i].is_default = false;
        }
      }
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allModels));
    return allModels[index];
  },

  async deleteModel(id: string): Promise<void> {
    let allModels = this.getAllModels();
    const model = allModels.find(m => m.id === id);
    if (!model) return;
    
    allModels = allModels.filter(m => m.id !== id);
    
    // if we deleted the default, set another one as default
    if (model.is_default && allModels.length > 0) {
      const userModels = allModels.filter(m => m.user_id === model.user_id);
      if (userModels.length > 0) {
        userModels[0].is_default = true;
      }
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allModels));
  },

  async setDefaultModel(id: string): Promise<void> {
    await this.updateModel(id, { is_default: true });
  },

  getAllModels(): PdfUserModel[] {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async uploadAsset(file: File, bucket: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `models/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }
};
