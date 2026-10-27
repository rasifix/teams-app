export interface ActivityHistorySubject {
  type: 'activity' | 'team' | 'player' | 'person';
  id: string;
  displayName: string | null;
}

export interface ActivityHistoryChange {
  type: string;
  subject: ActivityHistorySubject;
  field?: string;
  previous?: unknown;
  current?: unknown;
  context?: Record<string, unknown>;
}

export interface ActivityHistoryItem {
  id: string;
  revision: number;
  recordedAt: string;
  actor: { type: 'user' | 'system'; memberId: string | null; displayName: string | null };
  changes: ActivityHistoryChange[];
}

export interface ActivityHistoryPage {
  items: ActivityHistoryItem[];
}
