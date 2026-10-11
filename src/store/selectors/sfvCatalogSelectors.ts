import type { SquadCategory, OfficialMatchFormat, MatchFormat, SfvActivityType, SfvCategoryCatalog } from '../../types';
import { GROUP_CATEGORIES, selectLegacyOfficialMatchFormat } from './squadCategorySelectors';

export interface SfvCategoryOption {
  code: SquadCategory;
  activityType: SfvActivityType | null;
  matchFormat: OfficialMatchFormat | null;
}

export interface ActivityLimits {
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
}

/** Category options in display order; unknown catalog entries fall back to "no info" instead of being hidden. */
export function selectSfvCategoryOptions(catalog: SfvCategoryCatalog | null): SfvCategoryOption[] {
  return GROUP_CATEGORIES.map((code) => {
    const entry = catalog?.categories[code];
    return {
      code,
      activityType: entry?.activityType ?? null,
      matchFormat: entry ? entry.matchFormat ?? null : toLegacyFormat(code),
    };
  });
}

export function selectSfvCategoryOption(
  catalog: SfvCategoryCatalog | null,
  code: SquadCategory | null | undefined
): SfvCategoryOption | null {
  if (!code) {
    return null;
  }

  return selectSfvCategoryOptions(catalog).find((option) => option.code === code) ?? null;
}

/** Official format of a category; falls back to the built-in table when the catalog is not loaded. */
export function selectOfficialMatchFormatForCategory(
  catalog: SfvCategoryCatalog | null,
  code: SquadCategory | null | undefined
): OfficialMatchFormat | null {
  return selectSfvCategoryOption(catalog, code)?.matchFormat ?? null;
}

export function selectIsTournamentOnlyCategory(
  catalog: SfvCategoryCatalog | null,
  code: SquadCategory | null | undefined
): boolean {
  const option = selectSfvCategoryOption(catalog, code);
  return option?.activityType === 'tournament' && !option.matchFormat;
}

export function selectIsOfficialMatchFormat(format: Pick<MatchFormat, 'origin'>): boolean {
  return Boolean(format.origin);
}

/** Default activity player limits from a format; null when the (legacy) format carries no limits. */
export function selectDefaultActivityLimits(
  format: Pick<MatchFormat, 'minPlayersPerTeam' | 'maxPlayersPerTeam'> | null | undefined
): ActivityLimits | null {
  if (!format) {
    return null;
  }

  const { minPlayersPerTeam, maxPlayersPerTeam } = format;
  if (minPlayersPerTeam === undefined && maxPlayersPerTeam === undefined) {
    return null;
  }

  const min = minPlayersPerTeam ?? maxPlayersPerTeam!;
  const max = maxPlayersPerTeam ?? minPlayersPerTeam!;
  return { minPlayersPerTeam: Math.min(min, max), maxPlayersPerTeam: Math.max(min, max) };
}

function toLegacyFormat(code: SquadCategory): OfficialMatchFormat | null {
  const legacy = selectLegacyOfficialMatchFormat(code);
  return legacy ? { ...legacy, minimumPeriodsPerPlayer: 0 } : null;
}
