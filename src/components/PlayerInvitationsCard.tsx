import { getPlayerById } from '../utils/localStorage';
import type { Invitation } from '../types';

interface PlayerInvitationsCardProps {
  invitations: Invitation[];
  onInviteClick: () => void;
  onStatusChange: (invitationId: string, newStatus: 'open' | 'accepted' | 'declined') => void;
  onAutoSelect?: () => void;
}

export default function PlayerInvitationsCard({
  invitations,
  onInviteClick,
  onStatusChange,
  onAutoSelect,
}: PlayerInvitationsCardProps) {
  const acceptedCount = invitations.filter(inv => inv.status === 'accepted').length;
  const openCount = invitations.filter(inv => inv.status === 'open').length;
  const declinedCount = invitations.filter(inv => inv.status === 'declined').length;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Player Invitations</h2>
        <div className="flex gap-2">
          <button 
            onClick={onInviteClick}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            Invite Players
          </button>
          {onAutoSelect && (
            <button 
              onClick={onAutoSelect}
              disabled={acceptedCount === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Auto Select
            </button>
          )}
        </div>
      </div>
      {invitations.length > 0 && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="text-green-600 font-medium">{acceptedCount}</span>
          {' / '}
          <span className="text-yellow-600 font-medium">{openCount}</span>
          {' / '}
          <span className="text-red-600 font-medium">{declinedCount}</span>
          <span className="ml-2 text-gray-500">(accepted / open / declined)</span>
        </div>
      )}
      {invitations.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          <p>No invitations sent yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invitations.map((invitation) => {
            const player = getPlayerById(invitation.playerId);
            return (
              <div key={invitation.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-sm text-gray-900 flex-1">
                    {player ? `${player.firstName} ${player.lastName}` : `Player ID: ${invitation.playerId}`}
                  </span>
                  <select
                    value={invitation.status}
                    onChange={(e) => onStatusChange(invitation.id, e.target.value as 'open' | 'accepted' | 'declined')}
                    className={`text-xs px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      invitation.status === 'accepted' ? 'bg-green-100 text-green-800 border-green-300' :
                      invitation.status === 'declined' ? 'bg-red-100 text-red-800 border-red-300' :
                      'bg-yellow-100 text-yellow-800 border-yellow-300'
                    }`}
                  >
                    <option value="open">open</option>
                    <option value="accepted">accepted</option>
                    <option value="declined">declined</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
