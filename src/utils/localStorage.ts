const SELECTED_GROUP_KEY = 'selectedGroupId';

export function getSelectedGroupId(): string | null {
  return localStorage.getItem(SELECTED_GROUP_KEY);
}

export function setSelectedGroupId(groupId: string): void {
  localStorage.setItem(SELECTED_GROUP_KEY, groupId);
}

export function clearSelectedGroupId(): void {
  localStorage.removeItem(SELECTED_GROUP_KEY);
}
