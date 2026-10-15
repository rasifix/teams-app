import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import DuplicateMembersModal from "../components/DuplicateMembersModal";
import Button from "../components/ui/Button";
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
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t("members.allTrainersTitle", { count: trainers.length })}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {!spondLinked && (
              <>
                <Button className="!rounded-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200" variant="secondary" size="sm" onClick={() => setIsDuplicateModalOpen(true)}>
                  {t("members.duplicates.openAction", { count: duplicateGroups.length })}
                </Button>
                <Button className="!rounded-full !bg-orange-500 hover:!bg-orange-600" variant="primary" size="sm" onClick={openAddTrainerModal}>
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

    </section>
  );
}
