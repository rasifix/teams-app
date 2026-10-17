import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import DuplicateMembersModal from "../components/DuplicateMembersModal";
import { Button, Panel, PanelTitle } from "../components/ui";
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PanelTitle>{t("members.allTrainersTitle", { count: trainers.length })}</PanelTitle>
          <div className="layout-cluster layout-cluster--wrap">
            {!spondLinked && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsDuplicateModalOpen(true)}>
                  {t("members.duplicates.openAction", { count: duplicateGroups.length })}
                </Button>
                <Button variant="primary" size="sm" onClick={openAddTrainerModal}>
                  {t("common.actions.add")}
                </Button>
              </>
            )}
          </div>
        </div>

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
