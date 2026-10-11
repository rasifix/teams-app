import type { ActivityKind, MatchFormat } from '../../types';
import { selectDefaultActivityLimits, type ActivityLimits } from './sfvCatalogSelectors';

export interface ActivityFormConfiguration {
  showOpponent: boolean;
  showMatchFormat: boolean;
  showTeamCount: boolean;
  fixedTeamCount: number | null;
  selectedMatchFormat: MatchFormat | null;
  defaultLimits: ActivityLimits | null;
}

/** Derives the fields and defaults that belong to an activity kind and selected squad format. */
export function selectActivityFormConfiguration(
  kind: ActivityKind,
  matchFormats: MatchFormat[],
  matchFormatId?: string | null,
): ActivityFormConfiguration {
  const selectedMatchFormat = kind === 'match'
    ? matchFormats.find((mode) => mode.id === matchFormatId) ?? null
    : null;

  return {
    showOpponent: kind === 'match',
    showMatchFormat: kind === 'match',
    showTeamCount: kind === 'tournament',
    fixedTeamCount: kind === 'match' ? 1 : null,
    selectedMatchFormat,
    defaultLimits: selectDefaultActivityLimits(selectedMatchFormat),
  };
}
