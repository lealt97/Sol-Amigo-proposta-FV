with open('src/services/proposalService.ts', 'r') as f:
    content = f.read()

# createProposal
content = content.replace(
    "consumption_source: proposal.consumption_source,",
    "consumption_source: proposal.consumption_source,\n      history: proposal.history,"
)

# updateProposal
content = content.replace(
    "if (proposal.consumption_source !== undefined) formattedData.consumption_source = proposal.consumption_source;",
    "if (proposal.consumption_source !== undefined) formattedData.consumption_source = proposal.consumption_source;\n    if (proposal.history !== undefined) formattedData.history = proposal.history;"
)

with open('src/services/proposalService.ts', 'w') as f:
    f.write(content)
