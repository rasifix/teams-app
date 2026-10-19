import type { Squad } from '../../types';

/** Inactive squads stay in backend data but are omitted from active UI flows. */
export function selectActiveSquads(squads: Squad[]): Squad[] {
  return squads.filter((squad) => squad.active !== false);
}

export function selectNewestSquad(squads: Squad[]): Squad | null {
  if (squads.length === 0) return null;

  const datedSquads = squads.flatMap((squad) => {
    const timestamp = Date.parse(squad.createdAt ?? squad.updatedAt ?? '');
    return Number.isNaN(timestamp) ? [] : [{ squad, timestamp }];
  });

  if (datedSquads.length === 0) return squads.at(-1) ?? null;
  return datedSquads.reduce((latest, current) => current.timestamp > latest.timestamp ? current : latest).squad;
}

export type InitializationErrorDomain = 'players' | 'activities' | 'trainers' | 'shirtSets';

export function selectInitializationErrors(
  errors: Record<InitializationErrorDomain, string | null>,
): Array<{ domain: InitializationErrorDomain; message: string }> {
  return (Object.entries(errors) as Array<[InitializationErrorDomain, string | null]>)
    .flatMap(([domain, message]) => message ? [{ domain, message }] : []);
}
