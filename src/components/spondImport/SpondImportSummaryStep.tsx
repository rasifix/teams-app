import { useTranslation } from 'react-i18next';
import type {
  SpondDecisionSummary,
  SpondImportPreviewItem,
} from '../../store/selectors/spondSyncSelectors';
import SpondWizardActions from './SpondWizardActions';
import { Badge, EmptyState, EntityContent, EntityList, EntityMeta, EntityRow, EntityTitle } from '../ui';

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
      <p className="body-muted">{t('spondSync.wizard.summaryHelp')}</p>
      {!decisionSummary.isReady && (
        <p className="spond-review-error">{t('spondSync.requiredFields.summary')}</p>
      )}
      {items.length === 0 ? (
        <EmptyState>
          {t('spondSync.wizard.noChanges')}
        </EmptyState>
      ) : (
        <EntityList>
          {items.map((item) => (
            <EntityRow key={item.id} align="start">
              <Badge tone={item.action === 'create' ? 'success' : 'info'} size="sm">
                {t(`spondSync.wizard.actions.${item.action}`)}
              </Badge>
              <EntityContent>
                <EntityTitle>{item.sourceName}</EntityTitle>
                <EntityMeta><span>
                  {t(`spondSync.wizard.preview.${item.kind}.${item.action}`, {
                    target: item.targetName,
                    changes: item.changes
                      ?.map((change) => t(`spondSync.wizard.changedFields.${change}`))
                      .join(', '),
                  })}
                </span></EntityMeta>
              </EntityContent>
            </EntityRow>
          ))}
        </EntityList>
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
