const fs = require('fs');
let file = 'src/pages/Configuracoes.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { Profile } from '../types/profile';", "import { Profile } from '../types/profile';\nimport { DatabaseSetupAlert } from '../components/ui/DatabaseSetupAlert';");

content = content.replace("const [uploadingLogo, setUploadingLogo] = useState(false);", "const [uploadingLogo, setUploadingLogo] = useState(false);\n  const [loadError, setLoadError] = useState<any>(null);");

content = content.replace(
`      } catch (err) {
        console.error('Error loading profile:', err);`,
`      } catch (err) {
        console.error('Error loading profile:', err);
        setLoadError(err);`
);

content = content.replace(
`  if (!profile) {
    return <div className="text-red-600">Erro ao carregar configurações.</div>;
  }`,
`  if (loadError) {
    return <DatabaseSetupAlert error={loadError} resourceName="suas configurações" />;
  }
  
  if (!profile) {
    return <div className="text-red-600">Carregando dados...</div>;
  }`
);

fs.writeFileSync(file, content);
