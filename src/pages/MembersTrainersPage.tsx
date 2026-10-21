import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import DuplicateMembersModal from "../components/DuplicateMembersModal";
import { Button, Cluster, Panel, SectionActions, SectionHeader, SectionHeaderContent, SectionTitle } from "../components/ui";
import { useActivities, useTrainers } from "../store";
import { selectDuplicateTrainerGuardianGroups } from "../store/selectors/memberDuplicateSelectors";
import type { MembersOutletContext } from "./MembersPage";

export default function MembersTrainersPage() {
  const { t } = useTranslation();
  const { trainers, players, openAddTrainerModal, requestDeleteTrainer, spondLinked } = useOutletContext<MembersOutletContext>();
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
    <Panel>
        <SectionHeader>
          <SectionHeaderContent><SectionTitle>{t("page.members.allTrainersTitle", { count: trainers.length })}</SectionTitle></SectionHeaderContent>
          <SectionActions><Cluster gap="sm">
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

        <MembersList members={trainers} onDelete={spondLinked ? undefined : requestDeleteTrainer} memberType="trainers" />

        <DuplicateMembersModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setIsDuplicateModalOpen(false)}
          duplicateGroups={duplicateGroups}
          onMerge={handleMergeDuplicate}
        />

    </Panel>
  );
}
