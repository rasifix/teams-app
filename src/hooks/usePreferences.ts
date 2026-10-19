import { useContext } from 'react';
import { PreferencesContext, type PreferencesContextValue } from '../contexts/preferencesContextValue';

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider');
  return context;
}
