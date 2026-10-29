import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import DuplicateMembersModal from "../components/DuplicateMembersModal";
import { Button, Cluster, Panel, SectionActions, SectionHeader, SectionHeaderContent, SectionTitle } from "../components/ui";
import { useActivities, useTrainers } from "../store";
import { selectDuplicateTrainerGuardianGroups } from "../store/selectors/memberDuplicateSelectors";
import SpondBadge from "../components/SpondBadge";
import SpondSyncResultBanner from '../components/SpondSyncResultBanner';
import type { MembersOutletContext } from "./MembersPage";

export default function MembersTrainersPage() {
  const { t } = useTranslation();
  const { trainers, players, openAddTrainerModal, openMember, requestDeleteTrainer, spondLinked, canImportFromSpond } = useOutletContext<MembersOutletContext>();
  const navigate = useNavigate();
  const { activities } = useActivities();
  const { mergeGuardianIntoTrainer } = useTrainers();
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  const duplicateGroups = useMemo(
    () => selectDuplicateTrainerGuardianGroups(players, trainers, activities),
    [players, trainers, activities]
  );

  const handleMergeDuplicate = async (guardianId: string, trainerId: string): Promise<boolean> => {
    return mergeGuardianIntoTrainer(guardianId, trainerId);
  };

    return (
    <>
    <SpondSyncResultBanner />
    <Panel>
        <SectionHeader>
          <SectionHeaderContent><SectionTitle>{t("page.members.allTrainersTitle", { count: trainers.length })}</SectionTitle></SectionHeaderContent>
          <SectionActions><Cluster gap="sm">
            {canImportFromSpond && (
              <Button variant="secondary" size="sm" onClick={() => navigate('/spond-import', { state: { returnTo: '/members/trainers' } })}>
                <Cluster gap="sm" wrap={false}><SpondBadge />{t('spondSync.syncAction')}</Cluster>
              </Button>
            )}
            {!spondLinked && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsDuplicateModalOpen(true)}>
                  {t("page.members.duplicates.openAction", { count: duplicateGroups.length })}
                </Button>
                <Button variant="primary" size="sm" onClick={openAddTrainerModal}>
                  {t("common.actions.add")}
                </Button>
              </>
            )}
          </Cluster></SectionActions>
        </SectionHeader>

        <MembersList members={trainers} onDelete={spondLinked ? undefined : requestDeleteTrainer} memberType="trainers" onOpenMember={openMember} />

        <DuplicateMembersModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setIsDuplicateModalOpen(false)}
          duplicateGroups={duplicateGroups}
          onMerge={handleMergeDuplicate}
        />

    </Panel>
    </>
  );
}
