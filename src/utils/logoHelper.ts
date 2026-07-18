export const MAX_ACCOUNT_LOGOS = 3;

function uniqueLogos(logos: string[]) {
  return Array.from(new Set(logos.filter((logo) => typeof logo === 'string' && logo.trim())));
}

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
        return uniqueLogos(parsed.logos);
      }
      const active = parsed.activeLogo || parsed.active;
      return active ? [active] : [];
    } catch (e) {
      console.error("Error parsing logo_url JSON:", e);
    }
  }
  return [logoField];
}

export function assertAccountLogoLimit(logos: string[]) {
  const normalizedLogos = uniqueLogos(logos);
  if (normalizedLogos.length > MAX_ACCOUNT_LOGOS) {
    throw new Error(`Você pode cadastrar no máximo ${MAX_ACCOUNT_LOGOS} logos. Exclua um logo para enviar outro.`);
  }
  return normalizedLogos;
}

export function serializeLogos(activeLogo: string | null, logos: string[]): string {
  const normalizedLogos = assertAccountLogoLimit(logos);
  const normalizedActiveLogo = activeLogo && normalizedLogos.includes(activeLogo)
    ? activeLogo
    : normalizedLogos[0] || null;

  return JSON.stringify({
    active: normalizedActiveLogo,
    logos: normalizedLogos,
  });
}
