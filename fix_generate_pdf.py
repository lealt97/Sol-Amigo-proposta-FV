import re

with open('src/lib/pdf/generateProposalPdf.tsx', 'r') as f:
    content = f.read()

# Replace pdfDesignService import
content = content.replace("import { pdfDesignService } from '../../services/pdfDesignService';", "import { pdfModelService } from '../../services/pdfModelService';\nimport { supabase } from '../supabase/client';")

# Replace template generation logic
target = """    // Attempt to load user's default template
    try {
      const template = await pdfDesignService.getDefaultTemplate();
      if (template && template.cover_template_id) {
        // Fetch the cover template details to get the SVG URL
        const { data: cover } = await supabase
          .from('pdf_cover_templates')
          .select('svg_file_url')
          .eq('id', template.cover_template_id)
          .single();
          
        if (cover?.svg_file_url) {
          coverImage = await generateSvgCoverImage(cover.svg_file_url, template, proposal);
        }
      }
    } catch (templateError) {
      console.warn('Could not load custom cover template, falling back to default', templateError);
    }"""

replacement = """    // Attempt to load user's default template
    try {
      const models = await pdfModelService.getUserModels(proposal.user_id);
      const defaultModel = models.find(m => m.is_default) || models[0];
      if (defaultModel) {
        coverImage = await generateSvgCoverImage(defaultModel, proposal);
      }
    } catch (templateError) {
      console.warn('Could not load custom cover template, falling back to default', templateError);
    }"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("TARGET NOT FOUND. FALLBACK TO REGEX")
    # if exact string didn't match
    content = re.sub(
        r"// Attempt to load user's default template[\s\S]*?\} catch \(templateError\) \{[\s\S]*?\}",
        replacement,
        content
    )

with open('src/lib/pdf/generateProposalPdf.tsx', 'w') as f:
    f.write(content)

