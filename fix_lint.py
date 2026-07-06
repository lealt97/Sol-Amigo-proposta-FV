import re

# Fix generateProposalPdf.tsx
with open('src/lib/pdf/generateProposalPdf.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"import \{ supabase \} from '\.\.\/supabase\/client';\nimport \{ supabase \} from '\.\.\/\.\.\/lib\/supabase\/client';", "import { supabase } from '../../lib/supabase/client';", content)

# just in case it's something else
lines = content.split('\n')
unique_imports = []
seen_supabase = False
for line in lines:
    if 'import { supabase }' in line:
        if not seen_supabase:
            unique_imports.append(line)
            seen_supabase = True
    else:
        unique_imports.append(line)

content = '\n'.join(unique_imports)

with open('src/lib/pdf/generateProposalPdf.tsx', 'w') as f:
    f.write(content)

# Fix DesignPdfEditor.tsx
with open('src/pages/design-pdf/DesignPdfEditor.tsx', 'r') as f:
    content = f.read()

content = content.replace('<PdfPreview model={model} mode="cover" />', '<PdfPreview model={model} />')

with open('src/pages/design-pdf/DesignPdfEditor.tsx', 'w') as f:
    f.write(content)

