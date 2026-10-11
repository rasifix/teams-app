import { useTranslation } from 'react-i18next';
import type {
  SpondDecisionSummary,
  SpondImportPreviewItem,
} from '../../store/selectors/spondSyncSelectors';
import SpondWizardActions from './SpondWizardActions';

interface SpondImportSummaryStepProps {
  items: SpondImportPreviewItem[];
  decisionSummary: SpondDecisionSummary;
  busy: boolean;
  onBack: () => void;
  onApply: () => void;
}

export default function SpondImportSummaryStep({
  items,
  decisionSummary,
  busy,
  onBack,
  onApply,
}: SpondImportSummaryStepProps) {
  const { t } = useTranslation();

  return (
    <>
      <p className="text-sm text-gray-600">{t('spondSync.wizard.summaryHelp')}</p>
      {!decisionSummary.isReady && (
        <p className="text-sm text-red-700">{t('spondSync.requiredFields.summary')}</p>
      )}
      {items.length === 0 ? (
        <div className="rounded bg-gray-50 p-4 text-sm text-gray-600">
          {t('spondSync.wizard.noChanges')}
        </div>
      ) : (
        <div className="divide-y rounded border">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-4">
              <span className={`mt-0.5 rounded px-2 py-0.5 text-xs font-medium ${item.action === 'create' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {t(`spondSync.wizard.actions.${item.action}`)}
              </span>
              <div>
                <p className="font-medium">{item.sourceName}</p>
                <p className="text-sm text-gray-600">
                  {t(`spondSync.wizard.preview.${item.kind}.${item.action}`, {
                    target: item.targetName,
                    changes: item.changes
                      ?.map((change) => t(`spondSync.wizard.changedFields.${change}`))
                      .join(', '),
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      <SpondWizardActions
        back={onBack}
        next={onApply}
        nextDisabled={items.length === 0 || !decisionSummary.isReady}
        busy={busy}
        nextLabel={t('spondSync.apply')}
      />
    </>
  );
}
