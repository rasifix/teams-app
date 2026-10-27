import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { DensityPreference, FontPreference, LanguagePreference, ThemePreference } from '../contexts/preferencesContextValue';
import { usePreferences } from '../hooks/usePreferences';
import { Button, MenuDivider, MenuItem, MenuItemTitle, MenuLabel, MenuSurface } from './ui';

interface UserPreferencesMenuProps {
  userName: string;
  mobile?: boolean;
}

export default function UserPreferencesMenu({ userName, mobile = false }: UserPreferencesMenuProps) {
  const { t } = useTranslation();
  const { language, theme, density, font, setLanguage, setTheme, setDensity, setFont } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const languageOptions: Array<{ value: LanguagePreference; label: string }> = [
    { value: 'system', label: t('preferences.system') },
    { value: 'en', label: t('preferences.languages.en') },
    { value: 'de', label: t('preferences.languages.de') },
  ];
  const themeOptions: Array<{ value: ThemePreference; label: string }> = [
    { value: 'system', label: t('preferences.system') },
    { value: 'light', label: t('preferences.themes.light') },
    { value: 'dark', label: t('preferences.themes.dark') },
  ];
  const densityOptions: Array<{ value: DensityPreference; label: string }> = [
    { value: 'default', label: t('preferences.densities.default') },
    { value: 'compact', label: t('preferences.densities.compact') },
  ];
  const fontOptions: Array<{ value: FontPreference; label: string }> = [
    { value: 'inter', label: t('preferences.fonts.inter') },
    { value: 'jakarta', label: t('preferences.fonts.jakarta') },
    { value: 'barlow-condensed', label: t('preferences.fonts.barlowCondensed') },
    { value: 'roboto-condensed', label: t('preferences.fonts.robotoCondensed') },
    { value: 'oswald', label: t('preferences.fonts.oswald') },
  ];

  return (
    <div ref={containerRef} className={`ui-menu-anchor${mobile ? ' app-preferences--mobile' : ''}`}>
      <Button
        type="button"
        variant="inverse"
        size="sm"
        className="app-preferences-trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        title={t('preferences.openMenu', { name: userName })}
        onClick={() => setIsOpen((current) => !current)}
      >
        {userName}
        <svg className="icon-xs app-preferences-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 4 4 4-4" />
        </svg>
      </Button>

      {isOpen && (
        <MenuSurface id={menuId} className="app-preferences-popover">
          <MenuLabel>{t('preferences.language')}</MenuLabel>
          <div role="group" aria-label={t('preferences.language')}>
            {languageOptions.map((option) => (
              <MenuItem key={option.value} selected={language === option.value} onClick={() => setLanguage(option.value)}>
                <MenuItemTitle>{option.label}</MenuItemTitle>
              </MenuItem>
            ))}
          </div>
          <MenuDivider />
          <MenuLabel>{t('preferences.theme')}</MenuLabel>
          <div role="group" aria-label={t('preferences.theme')}>
            {themeOptions.map((option) => (
              <MenuItem key={option.value} selected={theme === option.value} onClick={() => setTheme(option.value)}>
                <MenuItemTitle>{option.label}</MenuItemTitle>
              </MenuItem>
            ))}
          </div>
          <MenuDivider />
          <MenuLabel>{t('preferences.density')}</MenuLabel>
          <div role="group" aria-label={t('preferences.density')}>
            {densityOptions.map((option) => (
              <MenuItem key={option.value} selected={density === option.value} onClick={() => setDensity(option.value)}>
                <MenuItemTitle>{option.label}</MenuItemTitle>
              </MenuItem>
            ))}
          </div>
          <MenuDivider />
          <MenuLabel>{t('preferences.font')}</MenuLabel>
          <div role="group" aria-label={t('preferences.font')}>
            {fontOptions.map((option) => (
              <MenuItem key={option.value} selected={font === option.value} onClick={() => setFont(option.value)}>
                <MenuItemTitle>{option.label}</MenuItemTitle>
              </MenuItem>
            ))}
          </div>
        </MenuSurface>
      )}
    </div>
  );
}
