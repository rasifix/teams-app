import { useTranslation } from 'react-i18next';
import type { SpondGuardianRow } from '../../store/selectors/spondSyncSelectors';
import SpondWizardActions from './SpondWizardActions';

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
      <p className="text-sm text-gray-600">{t('spondSync.wizard.guardiansHelp')}</p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.source.id} className="rounded border p-4">
            <span className="min-w-0">
              <span className="font-medium">{row.source.firstName} {row.source.lastName}</span>
              <span className="block text-sm text-gray-600">
                {t('spondSync.wizard.guardianChildren', {
                  count: row.childNames.length,
                  names: row.childNames.join(', '),
                })}
              </span>
              <span className="block text-sm text-gray-600">
                {t('spondSync.wizard.guardianEmail', {
                  email: row.source.email ?? t('members.noEmail'),
                })}
              </span>
              {row.linkedGuardian && (
                <span className="block text-sm text-gray-600">
                  {t('spondSync.wizard.alreadyExists', {
                    name: `${row.linkedGuardian.firstName} ${row.linkedGuardian.lastName}`,
                  })}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <SpondWizardActions back={onBack} next={onNext} />
    </>
  );
}
