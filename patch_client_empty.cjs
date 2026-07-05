const fs = require('fs');
let file = 'src/pages/clientes/ClientList.tsx';
let content = fs.readFileSync(file, 'utf8');

const clientLoadingOld = `              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Carregando clientes...
                  </td>
                </tr>`;
const clientLoadingReplace = `              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-500">Carregando clientes...</p>
                    </div>
                  </td>
                </tr>`;

const clientNoDataOld = `                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>`;
const clientNoDataReplace = `                <tr>
                  <td colSpan={5} className="px-4 py-16">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Users className="w-12 h-12 mb-4 text-slate-300" />
                      <p className="text-lg font-medium text-brand-dark mb-1">Nenhum cliente encontrado</p>
                      <p className="text-sm">Tente ajustar a busca ou cadastre um novo cliente.</p>
                    </div>
                  </td>
                </tr>`;

content = content.replace(clientLoadingOld, clientLoadingReplace);
content = content.replace(
  /<tr>[\s]*<td colSpan=\{5\} className="px-4 py-8 text-center text-slate-500">[\s]*Nenhum cliente encontrado\.[\s]*<\/td>[\s]*<\/tr>/,
  clientNoDataReplace
);
fs.writeFileSync(file, content);
