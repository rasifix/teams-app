import type { Squad } from '../../types';

const SPOND_GROUP_URL = 'https://spond.com/client/groups/';

export const selectSpondGroupUrl = (
  squad: Pick<Squad, 'spondId'> | null | undefined,
): string | null => {
  const spondId = squad?.spondId?.trim();
  return spondId ? `${SPOND_GROUP_URL}${encodeURIComponent(spondId)}` : null;
};

export const selectIsSpondLinked = (
  squad: Pick<Squad, 'spondId'> | null | undefined,
): boolean => Boolean(squad?.spondId?.trim());
