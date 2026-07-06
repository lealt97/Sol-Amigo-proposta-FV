with open('src/services/proposalService.ts', 'r') as f:
    content = f.read()

# createProposal
content = content.replace(
    "history: proposal.history,",
    ""
)

# updateProposal
content = content.replace(
    "if (proposal.history !== undefined) formattedData.history = proposal.history;",
    ""
)

with open('src/services/proposalService.ts', 'w') as f:
    f.write(content)
