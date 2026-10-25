import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player } from '../../types';
import { Card, CardBody, CardTitle, EmptyState } from '../ui';

interface Props {
  players: Player[];
  plannedPeriodCounts: Map<string, number>;
  totalPeriods: number;
  readOnly: boolean;
  onDrop: (playerId: string) => void;
}

export default function LineupBenchView({ players, plannedPeriodCounts, totalPeriods, readOnly, onDrop }: Props) {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);

  return <Card className={`lineup-editor-card${isDragOver ? ' lineup-editor-card--bench-drop' : ''}`} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setIsDragOver(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragOver(false); }} onDrop={(event) => { event.preventDefault(); const playerId = event.dataTransfer.getData('lineupPlayerId'); if (playerId) onDrop(playerId); setIsDragOver(false); }}>
    <CardBody className="lineup-editor-body">
      <CardTitle className="lineup-editor-title">{t('page.teamLineup.benchTitle', { count: players.length })}</CardTitle>
      <div className="lineup-bench-drop">
        {players.length === 0 ? <EmptyState>{t('page.teamLineup.noBenchedPlayers')}</EmptyState> : <div className="lineup-bench-list" role="list">
          {players.map((player) => {
            const count = plannedPeriodCounts.get(player.id) ?? 0;
            return <div key={player.id} role="listitem" draggable={!readOnly} onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('lineupPlayerId', player.id); }} onDragEnd={() => setIsDragOver(false)} className="lineup-bench-player">
              <span className="lineup-drag-handle" aria-hidden="true"><span className="lineup-drag-dot-row"><span className="dot" /><span className="dot" /></span><span className="lineup-drag-dot-row"><span className="dot" /><span className="dot" /></span><span className="lineup-drag-dot-row"><span className="dot" /><span className="dot" /></span></span>
              <span className="lineup-bench-name">{player.firstName} {player.lastName}</span>
              <span className="lineup-period-count" aria-label={t('page.teamLineup.plannedPeriods', { count, total: totalPeriods })}>{count}/{totalPeriods}</span>
            </div>;
          })}
        </div>}
      </div>
    </CardBody>
  </Card>;
}
