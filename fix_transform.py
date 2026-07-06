import re

def fix_transform(content):
    target = r"coverImage\.setAttribute\('transform', `translate\(\$\{t\.x\}, \$\{t\.y\}\) scale\(\$\{t\.zoom\}\) rotate\(\$\{t\.rotate\} \$\{cx\} \$\{cy\}\)`\);"
    replacement = r"coverImage.setAttribute('transform', `translate(${t.x}, ${t.y}) translate(${cx}, ${cy}) scale(${t.zoom}) rotate(${t.rotate}) translate(${-cx}, ${-cy})`);"
    
    if re.search(target, content):
        content = re.sub(target, replacement, content)
    else:
        print("COULD NOT FIND TARGET IN CONTENT")
        
    target_logo = r"logoImage\.setAttribute\('transform', `translate\(\$\{lt\.x\}, \$\{lt\.y\}\) scale\(\$\{lt\.zoom\}\)`\);"
    # Let's fix logo transform too. We might not know cx/cy for logo, but we can do a simple scale around its own center if we could. Let's just use translate and scale.
    # Actually, scaling from 0,0 is fine if user can adjust x/y. Let's just use the translate(x,y) scale(zoom) for logo.
    
    return content

# Fix PdfPreview.tsx
with open('src/pages/design-pdf/PdfPreview.tsx', 'r') as f:
    content = f.read()
content = fix_transform(content)
with open('src/pages/design-pdf/PdfPreview.tsx', 'w') as f:
    f.write(content)

# Fix svgToImage.ts
with open('src/lib/pdf/utils/svgToImage.ts', 'r') as f:
    content2 = f.read()
content2 = fix_transform(content2)
with open('src/lib/pdf/utils/svgToImage.ts', 'w') as f:
    f.write(content2)

