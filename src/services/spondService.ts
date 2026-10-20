import { apiClient } from './apiClient';
import type {
  SpondGroupSnapshot,
  SpondImportRequest,
  SpondImportResult,
  SpondSnapshot,
} from '../types/spond';

export interface SpondReadClient {
  login(email: string, password: string): Promise<void>;
  getGroups(): Promise<SpondGroupSnapshot[]>;
  getSnapshot(groupId: string, from: string, to: string, subGroupId?: string): Promise<SpondSnapshot>;
  dispose(): void;
}

class ProxySpondReadClient implements SpondReadClient {
  #email = '';
  #password = '';
  #groups: SpondGroupSnapshot[] | null = null;

  async login(email: string, password: string): Promise<void> {
    this.#email = email;
    this.#password = password;
    this.#groups = await this.#requestGroups();
  }

  async getGroups(): Promise<SpondGroupSnapshot[]> {
    this.#requireCredentials();
    if (!this.#groups) this.#groups = await this.#requestGroups();
    return this.#groups;
  }

  async getSnapshot(groupId: string, from: string, to: string, subGroupId?: string): Promise<SpondSnapshot> {
    this.#requireCredentials();
    const snapshot = await apiClient.request<SpondSnapshot>('/api/integrations/spond/snapshot', {
      method: 'POST',
      body: JSON.stringify({
        email: this.#email,
        password: this.#password,
        groupId,
        ...(subGroupId ? { subGroupId } : {}),
        from,
        to,
      }),
    });
    return snapshot;
  }

  dispose(): void {
    this.#email = '';
    this.#password = '';
    this.#groups = null;
  }

  async #requestGroups(): Promise<SpondGroupSnapshot[]> {
    const groups = await apiClient.request<SpondGroupSnapshot[]>('/api/integrations/spond/groups', {
      method: 'POST',
      body: JSON.stringify({ email: this.#email, password: this.#password }),
    });
    return groups.map((group) => ({ ...group, members: group.members ?? [] }));
  }

  #requireCredentials(): void {
    if (!this.#email || !this.#password) throw new Error('SPOND_AUTH_REQUIRED');
  }
}

export const createSpondReadClient = (): SpondReadClient => new ProxySpondReadClient();

export async function importSpondSnapshot(squadId: string, payload: SpondImportRequest): Promise<SpondImportResult> {
  return apiClient.request<SpondImportResult>(apiClient.getSquadEndpoint(squadId, '/spond/import'), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
