import type { ActivityKind, PlayingMode } from '../../types';
import { selectDefaultActivityLimits, type ActivityLimits } from './sfvCatalogSelectors';

export interface ActivityFormConfiguration {
  showOpponent: boolean;
  showMatchFormat: boolean;
  showTeamCount: boolean;
  fixedTeamCount: number | null;
  selectedPlayingMode: PlayingMode | null;
  defaultLimits: ActivityLimits | null;
}

/** Derives the fields and defaults that belong to an activity kind and selected squad format. */
export function selectActivityFormConfiguration(
  kind: ActivityKind,
  playingModes: PlayingMode[],
  playingModeId?: string | null,
): ActivityFormConfiguration {
  const selectedPlayingMode = kind === 'match'
    ? playingModes.find((mode) => mode.id === playingModeId) ?? null
    : null;

  return {
    showOpponent: kind === 'match',
    showMatchFormat: kind === 'match',
    showTeamCount: kind === 'tournament',
    fixedTeamCount: kind === 'match' ? 1 : null,
    selectedPlayingMode,
    defaultLimits: selectDefaultActivityLimits(selectedPlayingMode),
  };
}
