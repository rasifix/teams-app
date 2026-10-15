import type { Squad } from '../../types';

/** Inactive squads stay in backend data but are omitted from active UI flows. */
export function selectActiveSquads(squads: Squad[]): Squad[] {
  return squads.filter((squad) => squad.active !== false);
}
