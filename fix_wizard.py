with open('src/pages/propostas/ProposalWizard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "consumption_source: proposal.consumption_source || 'average',",
    "consumption_source: proposal.consumption_source || 'average',\n            history: (proposal as any).history || [],"
)

with open('src/pages/propostas/ProposalWizard.tsx', 'w') as f:
    f.write(content)
