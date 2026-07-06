with open('src/pages/propostas/ProposalDetails.tsx', 'r') as f:
    content = f.read()

target = """                  <div className="p-4 bg-gray-50 border border-brand-border rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Geração</p>"""

replacement = """                  <div className="p-4 bg-gray-50 border border-brand-border rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Consumo Médio</p>
                    <p className="text-lg font-bold text-brand-dark">
                      {proposal.monthly_consumption_kwh || '-'} <span className="text-sm font-normal text-slate-500">kWh</span>
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-brand-border rounded-lg">
                    <p className="text-xs text-slate-500 mb-1">Geração</p>"""

if "Consumo Médio</p>" not in content:
    content = content.replace(target, replacement)

with open('src/pages/propostas/ProposalDetails.tsx', 'w') as f:
    f.write(content)
