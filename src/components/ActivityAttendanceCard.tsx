import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, ActivityAttendance, Player } from '../types';
import { hasActivityStarted, selectAttendanceDialogRows, selectAttendanceSummary } from '../store/selectors/attendanceSelectors';
import RecordAttendanceModal from './RecordAttendanceModal';
import { Badge, Button, Cluster, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle, Panel, PanelActions, PanelHeader, PanelTitle, Stack } from './ui';

interface ActivityAttendanceCardProps {
  activity: Activity;
  players: Player[];
  onSave: (attendance: ActivityAttendance[]) => Promise<void>;
}

export default function ActivityAttendanceCard({ activity, players, onSave }: ActivityAttendanceCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const summary = selectAttendanceSummary(activity, players);

  return <Panel>
    <PanelHeader>
      <PanelTitle>{t('attendance.title')}</PanelTitle>
      {hasActivityStarted(activity) && (
        <PanelActions><Button size="sm" variant="primary" onClick={() => setIsOpen(true)} data-testid="record-attendance-button">
          {summary.isRecorded ? t('attendance.editAction') : t('attendance.recordAction')}
        </Button></PanelActions>
      )}
    </PanelHeader>
    {!hasActivityStarted(activity) ? <p className="body-muted">{t('attendance.notStarted')}</p>
      : !summary.isRecorded ? <p className="body-muted">{t('attendance.notRecorded')}</p>
      : <Stack gap="sm">
        <Cluster gap="sm">
          <Badge tone="success">{t('attendance.status.present')}: {summary.present}</Badge>
          <Badge tone="warning">{t('attendance.status.excused')}: {summary.excused}</Badge>
        </Cluster>
        {summary.excusedWithReason.length > 0 && <EntityList variant="bare">
          {summary.excusedWithReason.map((entry) => <EntityRow key={entry.playerId} density="compact">
            <EntityContent><EntityTitle>{entry.name}</EntityTitle></EntityContent>
            {entry.reason && <EntityMeta><span>{t(`attendance.reasons.${entry.reason}`)}</span></EntityMeta>}
          </EntityRow>)}
        </EntityList>}
      </Stack>}
    <RecordAttendanceModal
      isOpen={isOpen}
      initialRows={selectAttendanceDialogRows(activity, players)}
      onClose={() => setIsOpen(false)}
      onSave={onSave}
    />
  </Panel>;
}
