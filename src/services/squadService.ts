import { apiClient, SQUADS_PATH } from './apiClient';
import type { CreateSquadRequest, Formation, FormationSlot, Squad, SquadCategory, Period, MatchFormat, PositionCode } from '../types';

/**
 * Service layer for squad data operations.
 * This provides an abstraction layer that handles API communication
 * for squad-related operations.
 */

const normalizeSquad = (squad: Squad): Squad => ({
  ...squad,
  periods: squad.periods ?? [],
  matchPlanningEnabled: squad.matchPlanningEnabled ?? false,
  matchFormats: squad.matchFormats ?? (squad as { playingModes?: MatchFormat[] }).playingModes ?? [],
  formations: squad.formations ?? [],
});

export async function getSquad(squadId: string): Promise<Squad> {
  const squad = await apiClient.request<Squad>(apiClient.getSquadEndpoint(squadId));
  return normalizeSquad(squad);
}

export async function getSquads(): Promise<Squad[]> {
  const squads = await apiClient.request<Squad[]>(SQUADS_PATH);
  return squads.map(normalizeSquad);
}

export async function createSquad(squadData: CreateSquadRequest): Promise<Squad> {
  const squad = await apiClient.request<Squad>(SQUADS_PATH, {
    method: 'POST',
    body: JSON.stringify(squadData),
  });

  return normalizeSquad(squad);
}

export async function updateSquadCategory(squadId: string, name: string, category: SquadCategory | null): Promise<Squad> {
  const squad = await apiClient.request<Squad>(apiClient.getSquadEndpoint(squadId), {
    method: 'PUT',
    body: JSON.stringify({ name, category }),
  });

  return normalizeSquad(squad);
}

export async function unlinkSquadFromSpond(squadId: string, name: string): Promise<Squad> {
  const squad = await apiClient.request<Squad>(apiClient.getSquadEndpoint(squadId), {
    method: 'PUT',
    body: JSON.stringify({ name, spondId: null }),
  });

  return normalizeSquad(squad);
}

export async function setMatchPlanningEnabled(squadId: string, matchPlanningEnabled: boolean): Promise<Squad> {
  const squad = await apiClient.request<Squad>(apiClient.getSquadEndpoint(squadId), {
    method: 'PUT',
    body: JSON.stringify({ matchPlanningEnabled }),
  });

  return normalizeSquad(squad);
}

interface SquadPeriodPayload {
  name: string;
  startDate: string;
  endDate: string;
}

export async function addSquadPeriod(squadId: string, periodData: SquadPeriodPayload): Promise<Period> {
  return apiClient.request<Period>(apiClient.getSquadEndpoint(squadId, '/periods'), {
    method: 'POST',
    body: JSON.stringify(periodData),
  });
}

export async function updateSquadPeriod(squadId: string, periodId: string, periodData: SquadPeriodPayload): Promise<Period> {
  return apiClient.request<Period>(apiClient.getSquadEndpoint(squadId, `/periods/${periodId}`), {
    method: 'PUT',
    body: JSON.stringify(periodData),
  });
}

export async function deleteSquadPeriod(squadId: string, periodId: string): Promise<void> {
  await apiClient.request<void>(apiClient.getSquadEndpoint(squadId, `/periods/${periodId}`), {
    method: 'DELETE',
  });
}

interface SquadMatchFormatPayload {
  name: string;
  numberOfPeriods: number;
  periodLengthMinutes: number;
  minimumPeriodsPerPlayer?: number;
  playersOnField?: number;
  minPlayersPerTeam?: number;
  maxPlayersPerTeam?: number;
}

export async function addSquadMatchFormat(squadId: string, data: SquadMatchFormatPayload): Promise<MatchFormat> {
  return apiClient.request<MatchFormat>(apiClient.getSquadEndpoint(squadId, '/match-formats'), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSquadMatchFormat(squadId: string, matchFormatId: string, data: SquadMatchFormatPayload): Promise<MatchFormat> {
  return apiClient.request<MatchFormat>(apiClient.getSquadEndpoint(squadId, `/match-formats/${matchFormatId}`), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSquadMatchFormat(squadId: string, matchFormatId: string): Promise<void> {
  await apiClient.request<void>(apiClient.getSquadEndpoint(squadId, `/match-formats/${matchFormatId}`), {
    method: 'DELETE',
  });
}

export async function setDefaultSquadMatchFormat(squadId: string, matchFormatId: string): Promise<MatchFormat> {
  return apiClient.request<MatchFormat>(apiClient.getSquadEndpoint(squadId, `/match-formats/${matchFormatId}/set-default`), {
    method: 'POST',
  });
}

interface SquadFormationSlotPayload {
  id?: string;
  positionCode: PositionCode;
}

interface SquadFormationPayload {
  name: string;
  slots: SquadFormationSlotPayload[];
}

export async function addSquadFormation(squadId: string, data: SquadFormationPayload): Promise<Formation> {
  return apiClient.request<Formation>(apiClient.getSquadEndpoint(squadId, '/formations'), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSquadFormation(squadId: string, formationId: string, data: SquadFormationPayload): Promise<Formation> {
  return apiClient.request<Formation>(apiClient.getSquadEndpoint(squadId, `/formations/${formationId}`), {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSquadFormation(squadId: string, formationId: string): Promise<void> {
  await apiClient.request<void>(apiClient.getSquadEndpoint(squadId, `/formations/${formationId}`), {
    method: 'DELETE',
  });
}

export type { FormationSlot };
