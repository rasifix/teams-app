import { apiClient } from './apiClient';
import type { ActivityEvent } from '../types/activityEvents';

export interface ActivityAuditEventPage {
  items: ActivityEvent[];
  nextCursor?: string;
}

export interface ActivityAuditEventQuery {
  limit?: number;
  cursor?: string;
  activityId?: string;
  eventType?: string;
}

export async function getActivityAuditEvents(squadId: string, query: ActivityAuditEventQuery = {}): Promise<ActivityAuditEventPage> {
  const params = new URLSearchParams();
  if (query.limit) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.activityId) params.set('activityId', query.activityId);
  if (query.eventType) params.set('eventType', query.eventType);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiClient.request<ActivityAuditEventPage>(apiClient.getSquadEndpoint(squadId, `/activity-events${suffix}`));
}
