import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { applyPlatformTheme, resetPlatformTheme } from '../../lib/theme/platformTheme';

export function PlatformThemeBootstrap() {
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function loadTheme() {
      if (!user) {
        resetPlatformTheme();
        return;
      }

      try {
        const profile = await profileService.getProfile(user.id);
        if (!cancelled) {
          applyPlatformTheme(profile.platform_theme || null);
        }
      } catch (err) {
        console.error('Erro ao aplicar tema da plataforma:', err);
        if (!cancelled) {
          resetPlatformTheme();
        }
      }
    }

    loadTheme();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return null;
}
