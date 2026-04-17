import type { Event } from '../types';
import { useTranslation } from 'react-i18next';
import EventCard from './EventCard';
import type { TeamAssignee } from '../store/selectors/teamTrainerSelectors';

interface EventsListProps {
  events: Event[];
  trainerAssignees?: Map<string, TeamAssignee>;
  onEventClick?: (eventId: string) => void;
}

export default function EventsList({ events, trainerAssignees, onEventClick }: EventsListProps) {
  const { t } = useTranslation();

  if (events.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>{t('events.list.emptyState')}</p>
      </div>
    );
  }

  const handleEventClick = (eventId: string) => {
    onEventClick?.(eventId);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          trainerAssignees={trainerAssignees}
          onClick={handleEventClick}
        />
      ))}
    </div>
  );
}
