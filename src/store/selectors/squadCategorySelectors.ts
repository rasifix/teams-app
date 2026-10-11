import type { SquadCategory, MatchFormat } from '../../types';

export const GROUP_CATEGORIES: SquadCategory[] = [
  'G', 'F', 'E', 'D7', 'D9', 'C', 'B', 'A', 'FF9', 'FF11', 'FF14', 'FF17',
];

export interface OfficialMatchFormat {
  name: string;
  numberOfPeriods: number;
  periodLengthMinutes: number;
}

const FOUR_BY_TWENTY: OfficialMatchFormat = {
  name: '4x20',
  numberOfPeriods: 4,
  periodLengthMinutes: 20,
};
const TWO_BY_FORTY_FIVE: OfficialMatchFormat = {
  name: '2x45',
  numberOfPeriods: 2,
  periodLengthMinutes: 45,
};

export function selectLegacyOfficialMatchFormat(
  category: SquadCategory | null | undefined
): OfficialMatchFormat | null {
  if (category === 'D7' || category === 'D9') return FOUR_BY_TWENTY;
  if (category === 'C' || category === 'B' || category === 'A') return TWO_BY_FORTY_FIVE;
  return null;
}

export function selectMatchingMatchFormat(
  matchFormats: MatchFormat[],
  officialMode: OfficialMatchFormat
): MatchFormat | undefined {
  return matchFormats.find((mode) => (
    mode.numberOfPeriods === officialMode.numberOfPeriods &&
    mode.periodLengthMinutes === officialMode.periodLengthMinutes
  ));
}
