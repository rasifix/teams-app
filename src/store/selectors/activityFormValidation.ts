import { toStartsAt } from './activitySelectors';

export type ActivityFormError = 'minMax' | 'endDateTimeTogether' | 'endAfterStart' | null;

export function validateActivitySchedule(input: {
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  minimumAllowedPlayers: number;
  date: string;
  startTime: string;
  endDate: string;
  endTime: string;
}): ActivityFormError {
  if (input.maxPlayersPerTeam < input.minimumAllowedPlayers || input.minPlayersPerTeam < 1 || input.minPlayersPerTeam > input.maxPlayersPerTeam) return 'minMax';
  if ((input.endDate && !input.endTime) || (!input.endDate && input.endTime)) return 'endDateTimeTogether';
  if (input.endDate && input.endTime) {
    const start = new Date(toStartsAt(input.date, input.startTime)).getTime();
    const end = new Date(toStartsAt(input.endDate, input.endTime)).getTime();
    if (end <= start) return 'endAfterStart';
  }
  return null;
}
