const fs = require('fs');
let file = 'src/pages/design-pdf/DesignPdf.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Save, Eye, Check, RefreshCw, LayoutTemplate, Palette, Type, Upload, ImageIcon, FileText } from 'lucide-react';", "import { Save, Eye, Check, RefreshCw, LayoutTemplate, Palette, Type, Upload, ImageIcon, FileText } from 'lucide-react';\nimport { DatabaseSetupAlert } from '../../components/ui/DatabaseSetupAlert';");

content = content.replace("const [error, setError] = useState<string | null>(null);", "const [error, setError] = useState<string | null>(null);\n  const [rawError, setRawError] = useState<any>(null);");

content = content.replace(
`      } catch (error) {
        console.error('Error loading design data:', error);
        setError('Erro ao carregar dados de design');`,
`      } catch (error) {
        console.error('Error loading design data:', error);
        setRawError(error);
        setError('Erro ao carregar dados de design');`
);

content = content.replace(
`  if (loading) {
    return <div className="text-slate-500 animate-pulse">Carregando editor...</div>;
  }`,
`  if (loading) {
    return <div className="text-slate-500 animate-pulse">Carregando editor...</div>;
  }
  
  if (rawError && rawError.code === 'PGRST205') {
    return <DatabaseSetupAlert error={rawError} resourceName="o editor de design" />;
  }`
);

fs.writeFileSync(file, content);
