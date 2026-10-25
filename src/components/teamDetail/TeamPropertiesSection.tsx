import { useTranslation } from 'react-i18next';
import type { Activity, Team } from '../../types';
import type { TeamAssignee } from '../../store/selectors/teamTrainerSelectors';
import { Button, Panel, PropertyAction, PropertyActions, PropertyLabel, PropertyList, PropertyRow, PropertyValue } from '../ui';
import Strength from '../Strength';
import { getActivityTime } from '../../store/selectors/activitySelectors';

interface Props {
  activity: Activity;
  team: Team;
  responsiblePeople: TeamAssignee[];
  shirtSetSponsor: string | null;
  formationName: string | null;
  matchPlanningEnabled: boolean;
  isCancelled: boolean;
  onAssignResponsiblePerson: () => void;
  onAssignShirts: () => void;
  onAssignFormation: () => void;
  onPlanLineup: () => void;
}

export default function TeamPropertiesSection({ activity, team, responsiblePeople, shirtSetSponsor, formationName, matchPlanningEnabled, isCancelled, onAssignResponsiblePerson, onAssignShirts, onAssignFormation, onPlanLineup }: Props) {
  const { t } = useTranslation();
  const location = activity.kind === 'match' ? activity.location : team.location || activity.location;
  const startTime = activity.kind === 'match' ? getActivityTime(activity) : team.startTime || getActivityTime(activity);
  const canPlanLineup = Boolean((activity.kind === 'match' ? activity.matchFormatId : undefined) && team.formationId);

  return <Panel>
    <PropertyList>
      <PropertyRow>
        <PropertyLabel><span>🕐</span><span>{t('domain.team.fields.startTime')}</span></PropertyLabel>
        <PropertyValue>{startTime}</PropertyValue>
      </PropertyRow>
      {location && <PropertyRow>
        <PropertyLabel><span>📍</span><span>{t('domain.team.fields.location')}</span></PropertyLabel>
        <PropertyValue>{location}</PropertyValue>
      </PropertyRow>}
      <PropertyRow>
        <PropertyLabel><span>💪</span><span>{t('domain.team.fields.strength')}</span></PropertyLabel>
        <PropertyValue><Strength level={team.strength} /></PropertyValue>
      </PropertyRow>
      <PropertyAction data-testid="team-responsible-people-row" onClick={onAssignResponsiblePerson} disabled={isCancelled}>
        <PropertyLabel><span>👤</span><span>{t('domain.team.fields.responsiblePeople')}</span></PropertyLabel>
        {responsiblePeople[0] ? <PropertyValue>{responsiblePeople[0].firstName} {responsiblePeople[0].lastName}</PropertyValue> : <PropertyValue muted>{t('page.teamModal.noTrainerAssigned')}</PropertyValue>}
      </PropertyAction>
      <PropertyAction data-testid="team-shirt-set-row" onClick={onAssignShirts} disabled={isCancelled}>
        <PropertyLabel><span>👕</span><span>{t('page.teamDetail.shirtSetLabel')}</span></PropertyLabel>
        {shirtSetSponsor ? <PropertyValue>{shirtSetSponsor}</PropertyValue> : <PropertyValue muted>{t('page.teamDetail.noShirtSetAssigned')}</PropertyValue>}
      </PropertyAction>
      {matchPlanningEnabled && activity.kind === 'match' && activity.matchFormatId && <PropertyAction onClick={onAssignFormation} disabled={isCancelled}>
        <PropertyLabel><span>🧩</span><span>{t('page.teamDetail.formationLabel')}</span></PropertyLabel>
        <PropertyValue muted={!team.formationId}>{formationName ?? t('page.teamDetail.noFormationAssigned')}</PropertyValue>
      </PropertyAction>}
      <PropertyRow>
        <PropertyLabel><span>📋</span><span>{t('page.teamDetail.lineupLabel')}</span></PropertyLabel>
        <PropertyActions>{canPlanLineup && <Button size="sm" disabled={isCancelled} onClick={onPlanLineup}>{t('page.teamDetail.planLineupAction')}</Button>}</PropertyActions>
      </PropertyRow>
    </PropertyList>
  </Panel>;
}
