import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";
import type { MembersOutletContext } from "./MembersPage";

export default function MembersTrainersPage() {
  const { t } = useTranslation();
  const { trainers, openAddTrainerModal, requestDeleteTrainer } = useOutletContext<MembersOutletContext>();

  return (
    <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
      <CardBody className="lg:p-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="mb-0">{t("members.allTrainersTitle", { count: trainers.length })}</CardTitle>
          <Button variant="primary" size="sm" onClick={openAddTrainerModal}>
            {t("common.actions.add")}
          </Button>
        </div>

        <MembersList members={trainers} onDelete={requestDeleteTrainer} memberType="trainers" />
      </CardBody>
    </Card>
  );
}
