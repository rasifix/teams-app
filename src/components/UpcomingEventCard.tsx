import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DateColumn from './DateColumn';
import type { UpcomingEventWithGuardianInvitations } from '../store/selectors/homeSelectors';

interface UpcomingEventCardProps {
  event: UpcomingEventWithGuardianInvitations;
  respondingInvitationId: string | null;
  onInvitationResponse: (
    eventId: string,
    playerId: string,
    invitationId: string,
    status: 'accepted' | 'declined',
  ) => void;
}

export default function UpcomingEventCard({
  event,
  respondingInvitationId,
  onInvitationResponse,
}: UpcomingEventCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:border-orange-300 transition-colors">
      <Link
        to={`/events/${event.id}`}
        className="flex items-start gap-4 rounded-md -m-1 p-1 hover:bg-orange-50"
      >
        <DateColumn date={event.date} />
        <div className="pt-1">
          <p className="font-medium text-gray-900">{event.name}</p>
        </div>
      </Link>

      {event.guardianInvitations.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          {event.guardianInvitations.map((invitation) => {
            const isResponding = respondingInvitationId === invitation.invitationId;

            return (
              <div
                key={invitation.invitationId}
                className="flex flex-col gap-2 rounded-md border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm font-medium text-gray-800">
                  {invitation.playerFirstName} {invitation.playerLastName}
                </p>
                <div className="flex flex-wrap gap-2">
                  {invitation.status !== 'accepted' && (
                    <button
                      type="button"
                      disabled={isResponding}
                      onClick={() => onInvitationResponse(event.id, invitation.playerId, invitation.invitationId, 'accepted')}
                      className="px-3 py-1.5 rounded-md text-sm font-medium border border-green-700 bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {t('home.openInvitations.accept', { defaultValue: 'Accept' })}
                    </button>
                  )}
                  {invitation.status !== 'declined' && (
                    <button
                      type="button"
                      disabled={isResponding}
                      onClick={() => onInvitationResponse(event.id, invitation.playerId, invitation.invitationId, 'declined')}
                      className="px-3 py-1.5 rounded-md text-sm font-medium border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {t('home.openInvitations.decline', { defaultValue: 'Decline' })}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}