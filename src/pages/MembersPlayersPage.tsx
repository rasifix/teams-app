import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import { Card, CardBody, CardTitle } from "../components/ui";
import Button from "../components/ui/Button";
import type { MembersOutletContext } from "./MembersPage";

export default function MembersPlayersPage() {
  const { t } = useTranslation();
  const { players, openAddPlayerModal, requestDeletePlayer } = useOutletContext<MembersOutletContext>();

  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showTrialPlayers, setShowTrialPlayers] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    players.forEach((player) => {
      const year = player.birthDate ? new Date(player.birthDate).getFullYear() : player.birthYear;
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (selectedLevels.length > 0 && !selectedLevels.includes(player.level)) {
        return false;
      }

      if (selectedYear !== null) {
        const year = player.birthDate ? new Date(player.birthDate).getFullYear() : player.birthYear;
        if (year !== selectedYear) {
          return false;
        }
      }

      if (!showTrialPlayers && player.status === "trial") {
        return false;
      }

      return true;
    });
  }, [players, selectedLevels, selectedYear, showTrialPlayers]);

  return (
    <Card className="lg:border border-0 lg:rounded-lg rounded-none lg:shadow shadow-none">
      <CardBody className="lg:p-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="mb-0">
            {selectedLevels.length > 0 || selectedYear !== null || !showTrialPlayers
              ? t("members.allPlayersFilteredTitle", {
                  filteredCount: filteredPlayers.length,
                  totalCount: players.length,
                })
              : t("members.allPlayersTitle", { count: filteredPlayers.length })}
          </CardTitle>
          <Button variant="primary" size="sm" onClick={openAddPlayerModal}>
            {t("common.actions.add")}
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{t("members.levelFilter")}</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setSelectedLevels((prev) =>
                      prev.includes(level) ? prev.filter((entry) => entry !== level) : [...prev, level]
                    );
                  }}
                  className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
                    selectedLevels.includes(level)
                      ? "bg-orange-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
              <button
                onClick={() => setSelectedLevels([])}
                className={`px-2 py-1 text-xs font-medium underline transition-opacity ${
                  selectedLevels.length > 0
                    ? "text-gray-600 hover:text-gray-800 opacity-100"
                    : "text-transparent opacity-0 pointer-events-none"
                }`}
              >
                {t("common.actions.clear")}
              </button>
            </div>
          </div>

          {availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{t("members.yearFilter")}</span>
              <div className="flex gap-1.5">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                    className={`px-2.5 py-1 rounded text-sm font-medium transition-colors ${
                      selectedYear === year
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {year}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedYear(null)}
                  className={`px-2 py-1 text-xs font-medium underline transition-opacity ${
                    selectedYear !== null
                      ? "text-gray-600 hover:text-gray-800 opacity-100"
                      : "text-transparent opacity-0 pointer-events-none"
                  }`}
                >
                  {t("common.actions.clear")}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{t("members.trialFilter")}</span>
            <button
              onClick={() => setShowTrialPlayers((prev) => !prev)}
              aria-pressed={showTrialPlayers}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                showTrialPlayers ? "bg-orange-600" : "bg-gray-300"
              }`}
            >
              <span className="sr-only">
                {showTrialPlayers ? t("members.hideTrialPlayers") : t("members.showTrialPlayers")}
              </span>
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  showTrialPlayers ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <MembersList members={filteredPlayers} onDelete={requestDeletePlayer} memberType="players" />
      </CardBody>
    </Card>
  );
}
