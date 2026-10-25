import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../../types';
import type { LineupSummaryPeriod } from '../../store/selectors/matchPlanningSelectors';
import { getPositionLabelKey } from '../../store/selectors/matchPlanningSelectors';
import { Button, Card, CardBody, CardTitle } from '../ui';

interface Props {
  formationName: string;
  period: LineupSummaryPeriod | undefined;
  selectingSlotId: string | null;
  assignablePlayers: Player[];
  readOnly: boolean;
  onSelectSlot: (slotId: string) => void;
  onAssign: (slotId: string, playerId: string) => void;
  onDrop: (slotId: string, playerId: string) => void;
}

export default function LineupEditorView({ formationName, period, selectingSlotId, assignablePlayers, readOnly, onSelectSlot, onAssign, onDrop }: Props) {
  const { t } = useTranslation();
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const selectingAssignment = period?.assignments.find((assignment) => assignment.slotId === selectingSlotId);

  return <Card className="lineup-editor-card">
    <CardBody className="lineup-editor-body">
      <CardTitle className="lineup-editor-title">{t('page.teamLineup.slotsTitle', { formation: formationName })}</CardTitle>
      {period && <div className="lineup-pitch--editor">
        {period.assignments.map((assignment) => <button
          type="button"
          data-ui-control="composite"
          key={assignment.slotId}
          draggable={Boolean(assignment.playerId) && !readOnly}
          onDragStart={(event) => {
            if (!assignment.playerId) return;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('lineupPlayerId', assignment.playerId);
          }}
          onDragEnd={() => setDragOverSlotId(null)}
          onClick={() => !readOnly && onSelectSlot(assignment.slotId)}
          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOverSlotId(assignment.slotId); }}
          onDragLeave={() => setDragOverSlotId((current) => current === assignment.slotId ? null : current)}
          onDrop={(event) => { event.preventDefault(); const playerId = event.dataTransfer.getData('lineupPlayerId'); if (playerId) onDrop(assignment.slotId, playerId); setDragOverSlotId(null); }}
          className={`lineup-slot lineup-slot--editor ${dragOverSlotId === assignment.slotId ? 'lineup-slot--drag-over' : selectingSlotId === assignment.slotId ? 'lineup-slot--selecting' : assignment.playerId ? 'lineup-slot--assigned' : 'lineup-slot--empty'}`}
          style={{ left: `${assignment.pitchX}%`, top: `${assignment.pitchY}%` }}
        >
          <span className="lineup-slot-position">{t(getPositionLabelKey(assignment.positionCode))}{assignment.displayIndex ? ` ${assignment.displayIndex}` : ''}</span>
          <span className="lineup-slot-player">{assignment.playerLabel ?? t('page.teamLineup.emptySlot')}</span>
        </button>)}
      </div>}
      {selectingAssignment && <div className="lineup-player-picker">
        <div className="lineup-player-picker-title">{t('page.teamLineup.selectPlayerForPosition', { position: t(getPositionLabelKey(selectingAssignment.positionCode)) })}</div>
        <div className="lineup-player-picker-options">
          <Button type="button" variant="secondary" size="sm" disabled={readOnly} onClick={() => onAssign(selectingAssignment.slotId, '')}>{t('page.teamLineup.emptySlot')}</Button>
          {assignablePlayers.map((player) => <Button
            type="button" key={player.id}
            variant={selectingAssignment.playerId === player.id ? 'primary' : 'secondary'}
            size="sm" disabled={readOnly}
            aria-pressed={selectingAssignment.playerId === player.id}
            onClick={() => onAssign(selectingAssignment.slotId, player.id)}
          >{player.firstName} {player.lastName}</Button>)}
        </div>
      </div>}
    </CardBody>
  </Card>;
}
