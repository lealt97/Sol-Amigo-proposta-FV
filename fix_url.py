with open('src/lib/pdf/utils/svgToImage.ts', 'r') as f:
    content = f.read()

target = """    const urlToBase64 = async (url: string) => {
      if (!url) return '';"""
replacement = """    const urlToBase64 = async (url: string) => {
      if (!url) return '';
      if (url.startsWith('data:')) return url;"""

content = content.replace(target, replacement)

with open('src/lib/pdf/utils/svgToImage.ts', 'w') as f:
    f.write(content)
