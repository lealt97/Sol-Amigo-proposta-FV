export function extractActiveLogo(logoField: string | null): string | null {
  if (!logoField) return null;
  const trimmed = logoField.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return parsed.activeLogo || parsed.active || null;
    } catch (e) {
      console.error("Error parsing logo_url JSON:", e);
    }
  }
  return logoField;
}

export function extractAllLogos(logoField: string | null): string[] {
  if (!logoField) return [];
  const trimmed = logoField.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed.logos)) {
        return parsed.logos;
      }
      const active = parsed.activeLogo || parsed.active;
      return active ? [active] : [];
    } catch (e) {
      console.error("Error parsing logo_url JSON:", e);
    }
  }
  return [logoField];
}

export function serializeLogos(activeLogo: string | null, logos: string[]): string {
  return JSON.stringify({
    active: activeLogo,
    logos: logos
  });
}
