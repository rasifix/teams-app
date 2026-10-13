import type { ActivityKind, PlayerStatus } from './index';

export interface SpondGuardianSnapshot {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface SpondMemberSnapshot {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  guardians: SpondGuardianSnapshot[];
  roles?: string[];
}

export interface SpondSubGroup {
  id: string;
  name: string;
  color?: string;
}

export type SpondInvitationResponse = 'open' | 'accepted' | 'declined';

export interface SpondEventResponse {
  spondMemberId: string;
  response: SpondInvitationResponse;
}

export interface SpondEventSnapshot {
  id: string;
  groupId: string;
  name: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  responses: SpondEventResponse[];
}

export interface SpondGroupSnapshot {
  id: string;
  name: string;
  subGroups?: SpondSubGroup[];
  members: SpondMemberSnapshot[];
}

export interface SpondSnapshot {
  group: SpondGroupSnapshot;
  events: SpondEventSnapshot[];
  sourceReadAt: string;
}

export type SpondMemberDecision =
  | { action: 'link'; spondMemberId: string; memberId: string }
  | {
      action: 'create-player';
      spondMemberId: string;
      birthDate: string;
      level: number;
      status: PlayerStatus;
      guardianIds: string[];
    }
  | { action: 'skip'; spondMemberId: string };

export type SpondActivityDecision =
  | { action: 'link'; spondEventId: string; activityId: string }
  | {
      action: 'create';
      spondEventId: string;
      kind: ActivityKind;
      trainerIds?: string[];
      teams?: Array<{ name: string; strength: number; selectedPlayers: string[] }>;
    }
  | { action: 'skip'; spondEventId: string };

export interface SpondImportRequest {
  importId: string;
  spondGroupId: string;
  from: string;
  to: string;
  squadUpdatedAt?: string;
  snapshot: SpondSnapshot;
  members: SpondMemberDecision[];
  activities: SpondActivityDecision[];
}

export interface SpondImportResult {
  importId: string;
  created: number;
  linked: number;
  updated: number;
  unchanged: number;
  skipped: number;
  warnings: string[];
}
