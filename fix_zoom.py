import re

with open('src/pages/design-pdf/DesignPdfEditor.tsx', 'r') as f:
    content = f.read()

content = content.replace("t.zoom - 0.1", "Math.max(0.1, t.zoom - 0.1)")

with open('src/pages/design-pdf/DesignPdfEditor.tsx', 'w') as f:
    f.write(content)

