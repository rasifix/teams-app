import { apiClient } from './apiClient';
import type { ActivityHistoryPage } from '../types/activityHistory';

export async function getActivityHistory(squadId: string, activityId: string): Promise<ActivityHistoryPage> {
  return apiClient.request<ActivityHistoryPage>(
    apiClient.getSquadEndpoint(squadId, `/activities/${encodeURIComponent(activityId)}/history`),
  );
}
