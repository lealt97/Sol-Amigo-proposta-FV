import re

def fix(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace cx, cy calculation
    target = """        const cx = 794 / 2; // Assuming viewBox width
        const cy = 1123 / 2; // Roughly
        const t = model.cover_image_transform;"""
        
    replacement = """        const imgW = parseFloat(coverImage.getAttribute('width') || '794');
        const imgH = parseFloat(coverImage.getAttribute('height') || '600');
        const cx = imgW / 2;
        const cy = imgH / 2;
        const t = model.cover_image_transform;"""

    if target in content:
        content = content.replace(target, replacement)
    else:
        # Also handle the updated one from my previous command if it changed
        target2 = """        const cx = 794 / 2;
        const cy = 1123 / 2;
        const t = model.cover_image_transform;"""
        if target2 in content:
            content = content.replace(target2, replacement)

    with open(filepath, 'w') as f:
        f.write(content)

fix('src/pages/design-pdf/PdfPreview.tsx')
fix('src/lib/pdf/utils/svgToImage.ts')
