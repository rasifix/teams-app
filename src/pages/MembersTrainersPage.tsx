import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import DuplicateMembersModal from "../components/DuplicateMembersModal";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";
import { useEvents, useTrainers } from "../store";
import { selectDuplicateTrainerGuardianGroups } from "../store/selectors/memberDuplicateSelectors";
import type { MembersOutletContext } from "./MembersPage";

export default function MembersTrainersPage() {
  const { t } = useTranslation();
  const { trainers, players, openAddTrainerModal, requestDeleteTrainer } = useOutletContext<MembersOutletContext>();
  const { events } = useEvents();
  const { mergeGuardianIntoTrainer } = useTrainers();
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  const duplicateGroups = useMemo(
    () => selectDuplicateTrainerGuardianGroups(players, trainers, events),
    [players, trainers, events]
  );

  const handleMergeDuplicate = async (guardianId: string, trainerId: string): Promise<boolean> => {
    return mergeGuardianIntoTrainer(guardianId, trainerId);
  };

  return (
    <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
      <CardBody className="lg:p-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="mb-0">{t("members.allTrainersTitle", { count: trainers.length })}</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDuplicateModalOpen(true)}>
              {t("members.duplicates.openAction", { count: duplicateGroups.length })}
            </Button>
            <Button variant="primary" size="sm" onClick={openAddTrainerModal}>
              {t("common.actions.add")}
            </Button>
          </div>
        </div>

        <MembersList members={trainers} onDelete={requestDeleteTrainer} memberType="trainers" />

        <DuplicateMembersModal
          isOpen={isDuplicateModalOpen}
          onClose={() => setIsDuplicateModalOpen(false)}
          duplicateGroups={duplicateGroups}
          onMerge={handleMergeDuplicate}
        />
      </CardBody>
    </Card>
  );
}
