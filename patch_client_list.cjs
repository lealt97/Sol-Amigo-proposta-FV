const fs = require('fs');
let file = 'src/pages/clientes/ClientList.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { clientService } from '../../services/clientService';", "import { clientService } from '../../services/clientService';\nimport { DatabaseSetupAlert } from '../../components/ui/DatabaseSetupAlert';");

content = content.replace("const [error, setError] = useState<string | null>(null);", "const [error, setError] = useState<string | null>(null);\n  const [rawError, setRawError] = useState<any>(null);");

content = content.replace(
`      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao carregar clientes');`,
`      } catch (err: any) {
        console.error(err);
        setRawError(err);
        setError(err.message || 'Erro ao carregar clientes');`
);

content = content.replace(
`      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-2">Clientes</h1>`,
`      {rawError && rawError.code === 'PGRST205' && (
        <DatabaseSetupAlert error={rawError} resourceName="os clientes" />
      )}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark mb-2">Clientes</h1>`
);

fs.writeFileSync(file, content);
