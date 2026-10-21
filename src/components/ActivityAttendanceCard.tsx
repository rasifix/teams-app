import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Activity, ActivityAttendance, Player } from '../types';
import { hasActivityStarted, selectAttendanceDialogRows, selectAttendanceSummary } from '../store/selectors/attendanceSelectors';
import RecordAttendanceModal from './RecordAttendanceModal';
import { Badge, Button, Cluster, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle, Panel, PanelActions, PanelHeader, PanelTitle, Stack } from './ui';

interface ActivityAttendanceCardProps {
  activity: Activity;
  players: Player[];
  readOnly?: boolean;
  onSave: (attendance: ActivityAttendance[]) => Promise<void>;
}

export default function ActivityAttendanceCard({ activity, players, readOnly = false, onSave }: ActivityAttendanceCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const summary = selectAttendanceSummary(activity, players);

  return <Panel>
    <PanelHeader>
      <PanelTitle>{t('page.attendance.title')}</PanelTitle>
      {hasActivityStarted(activity) && !readOnly && (
        <PanelActions><Button size="sm" variant="primary" onClick={() => setIsOpen(true)} data-testid="record-attendance-button">
          {summary.isRecorded ? t('page.attendance.editAction') : t('page.attendance.recordAction')}
        </Button></PanelActions>
      )}
    </PanelHeader>
    {!hasActivityStarted(activity) ? <p className="body-muted">{t('page.attendance.notStarted')}</p>
      : !summary.isRecorded ? <p className="body-muted">{t('page.attendance.notRecorded')}</p>
      : <Stack gap="sm">
        <Cluster gap="sm">
          <Badge tone="success">{t('domain.attendance.status.present')}: {summary.present}</Badge>
          <Badge tone="danger">{t('domain.attendance.status.absent')}: {summary.absent}</Badge>
          <Badge tone="warning">{t('domain.attendance.status.excused')}: {summary.excused}</Badge>
        </Cluster>
        {summary.excusedWithReason.length > 0 && <EntityList variant="bare">
          {summary.excusedWithReason.map((entry) => <EntityRow key={entry.playerId} density="compact">
            <EntityContent><EntityTitle>{entry.name}</EntityTitle></EntityContent>
            {entry.reason && <EntityMeta><span>{t(`domain.attendance.reasons.${entry.reason}`)}</span></EntityMeta>}
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
