import { useActivities as useActivitiesFromStore, useAppLoading, useAppHasErrors, useAppErrors } from '../store';

export function useActivities() {
  const store = useActivitiesFromStore();

  const loading = useAppLoading();
  const hasErrors = useAppHasErrors();
  const errors = useAppErrors();

  const error = errors.activities || (hasErrors ? 'Failed to load data' : null);

  return { ...store, loading, error };
}
