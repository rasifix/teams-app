import { useTranslation } from 'react-i18next';
import type { Guardian } from '../../types';
import { Alert, Button, EmptyState, EntityActions, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle, Panel, PanelActions, PanelHeader, PanelTitle, Stack } from '../ui';

interface Props {
  guardians: Guardian[];
  isSpondLinked: boolean;
  canManage: boolean;
  playerIsUnderage: boolean;
  error: string | null;
  onAdd: () => void;
  onEdit: (guardian: Guardian) => void;
  onRemove: (guardian: Guardian) => void;
}

export default function PlayerGuardiansSection({ guardians, isSpondLinked, canManage, playerIsUnderage, error, onAdd, onEdit, onRemove }: Props) {
  const { t } = useTranslation();

  return <Panel>
    <PanelHeader>
      <PanelTitle>{t('page.playerDetail.guardians.title', { count: guardians.length })}</PanelTitle>
      <PanelActions>
        {!isSpondLinked && <Button size="sm" onClick={onAdd} disabled={!canManage || !playerIsUnderage} title={!canManage ? t('page.playerDetail.guardians.onlyManagers') : !playerIsUnderage ? t('page.playerDetail.guardians.onlyUnderage') : t('page.playerDetail.guardians.assignAction')}>
          {t('page.playerDetail.guardians.addAction')}
        </Button>}
      </PanelActions>
    </PanelHeader>
    <Stack gap="sm">
      {!isSpondLinked && !canManage && <Alert tone="warning">{t('page.playerDetail.guardians.onlyManagersManage')}</Alert>}
      {!isSpondLinked && !playerIsUnderage && <Alert tone="info">{t('page.playerDetail.guardians.onlyUnderage')}</Alert>}
      {error && <Alert>{error}</Alert>}
      {guardians.length === 0 ? <EmptyState>{t('page.playerDetail.guardians.empty')}</EmptyState> : <EntityList variant="separated">
        {guardians.map((guardian) => <EntityRow key={guardian.id} align="start">
          <EntityContent>
            <EntityTitle>{guardian.firstName} {guardian.lastName}</EntityTitle>
            {guardian.email && <EntityMeta>{guardian.email}</EntityMeta>}
          </EntityContent>
          {canManage && <EntityActions>
            <Button variant="ghost" size="sm" onClick={() => onEdit(guardian)}>{t('common.actions.edit')}</Button>
            <Button variant="dangerGhost" size="sm" onClick={() => onRemove(guardian)}>{t('page.playerDetail.guardians.removeAction')}</Button>
          </EntityActions>}
        </EntityRow>)}
      </EntityList>}
    </Stack>
  </Panel>;
}
