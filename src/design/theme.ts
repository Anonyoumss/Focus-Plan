import {
  argbFromHex,
  themeFromSourceColor,
  hexFromArgb,
} from '@material/material-color-utilities';

export interface ThemePreset {
  id: string;
  name: string;
  nameAr: string;
  hex: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'sage', name: 'M3 Forest Sage', nameAr: 'المريمية الغابية', hex: '#2e6b52' },
  { id: 'teal', name: 'Oceanic Teal', nameAr: 'الأزرق المائي', hex: '#028090' },
  { id: 'clay', name: 'Terracotta Clay', nameAr: 'الطين الهادئ', hex: '#9c6644' },
  { id: 'indigo', name: 'Royal Indigo', nameAr: 'النيلي الملكي', hex: '#3a506b' },
  { id: 'crimson', name: 'Berry Crimson', nameAr: 'التوتي العميق', hex: '#800f2f' },
];

export type ThemeMode = 'system' | 'light' | 'dark';

export function applyM3Theme(hexColor: string, isDark: boolean): void {
  try {
    const sourceArgb = argbFromHex(hexColor);
    const theme = themeFromSourceColor(sourceArgb);
    const scheme = (isDark ? theme.schemes.dark : theme.schemes.light) as any;

    const root = document.documentElement;
    const setProp = (name: string, argb: number | undefined) => {
      if (argb !== undefined) {
        root.style.setProperty(`--md-sys-color-${name}`, hexFromArgb(argb));
      }
    };

    setProp('primary', scheme.primary);
    setProp('on-primary', scheme.onPrimary);
    setProp('primary-container', scheme.primaryContainer);
    setProp('on-primary-container', scheme.onPrimaryContainer);
    setProp('secondary', scheme.secondary);
    setProp('on-secondary', scheme.onSecondary);
    setProp('secondary-container', scheme.secondaryContainer);
    setProp('on-secondary-container', scheme.onSecondaryContainer);
    setProp('tertiary', scheme.tertiary);
    setProp('on-tertiary', scheme.onTertiary);
    setProp('tertiary-container', scheme.tertiaryContainer);
    setProp('on-tertiary-container', scheme.onTertiaryContainer);
    setProp('surface', scheme.surface);
    setProp('surface-dim', scheme.surfaceDim || scheme.surface);
    setProp('surface-bright', scheme.surfaceBright || scheme.surface);
    setProp('surface-container-lowest', scheme.surfaceContainerLowest || scheme.surface);
    setProp('surface-container-low', scheme.surfaceContainerLow || scheme.surface);
    setProp('surface-container', scheme.surfaceContainer || scheme.surface);
    setProp('surface-container-high', scheme.surfaceContainerHigh || scheme.surface);
    setProp('surface-container-highest', scheme.surfaceContainerHighest || scheme.surface);
    setProp('on-surface', scheme.onSurface);
    setProp('on-surface-variant', scheme.onSurfaceVariant);
    setProp('outline', scheme.outline);
    setProp('outline-variant', scheme.outlineVariant);
    setProp('error', scheme.error);
    setProp('on-error', scheme.onError);
    setProp('error-container', scheme.errorContainer);
    setProp('on-error-container', scheme.onErrorContainer);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', hexFromArgb(scheme.surfaceContainer || scheme.surface));
    }
  } catch (e) {
    console.error('Failed to apply dynamic M3 theme:', e);
  }
}

export function syncDocumentTheme(mode: ThemeMode, seedHex: string): boolean {
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  applyM3Theme(seedHex, isDark);
  return isDark;
}
