import type { GroupCategory, PlayingMode } from '../../types';

export const GROUP_CATEGORIES: GroupCategory[] = [
  'G', 'F', 'E', 'D7', 'D9', 'C', 'B', 'A', 'FF9', 'FF11', 'FF14', 'FF17',
];

export interface OfficialPlayingMode {
  name: string;
  numberOfPeriods: number;
  periodLengthMinutes: number;
}

const FOUR_BY_TWENTY: OfficialPlayingMode = {
  name: '4x20',
  numberOfPeriods: 4,
  periodLengthMinutes: 20,
};
const TWO_BY_FORTY_FIVE: OfficialPlayingMode = {
  name: '2x45',
  numberOfPeriods: 2,
  periodLengthMinutes: 45,
};

export function selectOfficialPlayingModeForCategory(
  category: GroupCategory | null | undefined
): OfficialPlayingMode | null {
  if (category === 'D7' || category === 'D9') return FOUR_BY_TWENTY;
  if (category === 'C' || category === 'B' || category === 'A') return TWO_BY_FORTY_FIVE;
  return null;
}

export function selectMatchingPlayingMode(
  playingModes: PlayingMode[],
  officialMode: OfficialPlayingMode
): PlayingMode | undefined {
  return playingModes.find((mode) => (
    mode.numberOfPeriods === officialMode.numberOfPeriods &&
    mode.periodLengthMinutes === officialMode.periodLengthMinutes
  ));
}
