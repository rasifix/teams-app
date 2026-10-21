import { useTranslation } from 'react-i18next';
import type { SpondGuardianRow } from '../../store/selectors/spondSyncSelectors';
import SpondWizardActions from './SpondWizardActions';
import { EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle } from '../ui';

interface SpondGuardiansReviewStepProps {
  rows: SpondGuardianRow[];
  onBack: () => void;
  onNext: () => void;
}

export default function SpondGuardiansReviewStep({
  rows,
  onBack,
  onNext,
}: SpondGuardiansReviewStepProps) {
  const { t } = useTranslation();

  return (
    <>
      <p className="body-muted">{t('spondSync.wizard.guardiansHelp')}</p>
      <EntityList variant="separated">
        {rows.map((row) => (
          <EntityRow key={row.source.id} align="start">
            <EntityContent>
              <EntityTitle>{row.source.firstName} {row.source.lastName}</EntityTitle>
              <EntityMeta><span>
                {t('spondSync.wizard.guardianChildren', {
                  count: row.childNames.length,
                  names: row.childNames.join(', '),
                })}
              </span><span>
                {t('spondSync.wizard.guardianEmail', {
                  email: row.source.email ?? t('page.members.noEmail'),
                })}
              </span></EntityMeta>
              {row.linkedGuardian && (
                <EntityMeta><span>
                  {t('spondSync.wizard.alreadyExists', {
                    name: `${row.linkedGuardian.firstName} ${row.linkedGuardian.lastName}`,
                  })}
                </span></EntityMeta>
              )}
            </EntityContent>
          </EntityRow>
        ))}
      </EntityList>
      <SpondWizardActions back={onBack} next={onNext} />
    </>
  );
}
