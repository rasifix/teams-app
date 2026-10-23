export type ActivityEventActor = {
  type: 'user' | 'system';
  userId?: string;
  memberId?: string;
  displayName?: string;
  roles?: string[];
};

export interface ActivityDomainEvent {
  ordinal: number;
  type: string;
  schemaVersion: number;
  data: unknown;
}

export interface ActivityEvent {
  _id: string;
  streamId: string;
  aggregateType: 'activity';
  aggregateId: string;
  squadId: string;
  revision: number;
  command: { id?: string; type: string; idempotencyKey: string | null; requestHash: string };
  actor: ActivityEventActor;
  recordedAt: string;
  correlationId: string;
  events: ActivityDomainEvent[];
}
