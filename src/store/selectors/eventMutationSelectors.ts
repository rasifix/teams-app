import type { Event } from '../../types';

export function selectEventMutationResult(
  responseEvent: Event,
  submittedEvent: Partial<Event>,
  currentEvent?: Event
): Event {
  const mergedEvent = currentEvent
    ? { ...currentEvent, ...responseEvent }
    : responseEvent;

  if (
    Object.prototype.hasOwnProperty.call(submittedEvent, 'playingModeId') &&
    !Object.prototype.hasOwnProperty.call(responseEvent, 'playingModeId')
  ) {
    return { ...mergedEvent, playingModeId: submittedEvent.playingModeId };
  }

  return mergedEvent;
}
