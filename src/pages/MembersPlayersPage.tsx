import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import Button from "../components/ui/Button";
import SpondBadge from "../components/SpondBadge";
import SpondSyncResultBanner from '../components/SpondSyncResultBanner';
import type { MembersOutletContext } from "./MembersPage";
import { getBirthYear } from '../utils/birthDate';
import BirthdayCalendarModal from '../components/BirthdayCalendarModal';
import { useSquad } from '../store';

export default function MembersPlayersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { players, openAddPlayerModal, canImportFromSpond, canManageBirthdayCalendar, spondLinked, requestDeletePlayer } = useOutletContext<MembersOutletContext>();
  const squad = useSquad();

  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showTrialPlayers, setShowTrialPlayers] = useState(false);
  const [showInactivePlayers, setShowInactivePlayers] = useState(false);
  const [isBirthdayCalendarOpen, setIsBirthdayCalendarOpen] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    players.forEach((player) => {
      const year = getBirthYear(player.birthDate);
      if (year !== undefined) {
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [players]);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      if (selectedLevels.length > 0 && !selectedLevels.includes(player.level)) {
        return false;
      }

      if (selectedYear !== null) {
        const year = getBirthYear(player.birthDate);
        if (year !== selectedYear) {
          return false;
        }
      }

      if (!showTrialPlayers && player.status === "trial") {
        return false;
      }

      if (!showInactivePlayers && player.status === "inactive") {
        return false;
      }

      return true;
    });
  }, [players, selectedLevels, selectedYear, showTrialPlayers, showInactivePlayers]);

  return (
    <>
      <SpondSyncResultBanner className="mb-4" />
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_40px_-32px_rgba(15,29,38,.45)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            {selectedLevels.length > 0 || selectedYear !== null || !showTrialPlayers
              ? t("members.allPlayersFilteredTitle", {
                  filteredCount: filteredPlayers.length,
                  totalCount: players.length,
                })
              : t("members.allPlayersTitle", { count: filteredPlayers.length })}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {canManageBirthdayCalendar && squad && (
              <Button className="!rounded-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200" variant="secondary" size="sm" onClick={() => setIsBirthdayCalendarOpen(true)}>
                {t('members.birthdayCalendar.openAction')}
              </Button>
            )}
            {canImportFromSpond && (
              <Button className="inline-flex items-center gap-1.5 !rounded-full !bg-slate-100 !text-slate-700 hover:!bg-slate-200" variant="secondary" size="sm" onClick={() => navigate('/spond-import?scope=players')}>
                <SpondBadge />
                {t('spondSync.syncAction')}
              </Button>
            )}
            {!spondLinked && (
              <Button className="!rounded-full !bg-orange-500 hover:!bg-orange-600" variant="primary" size="sm" onClick={openAddPlayerModal}>
                {t("common.actions.add")}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">{t("members.levelFilter")}</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    setSelectedLevels((prev) =>
                      prev.includes(level) ? prev.filter((entry) => entry !== level) : [...prev, level]
                    );
                  }}
                  className={`h-7 min-w-7 rounded-full px-2 text-xs font-semibold transition-colors ${
                    selectedLevels.includes(level)
                      ? "bg-orange-500 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {level}
                </button>
              ))}
              <button
                onClick={() => setSelectedLevels([])}
                className={`px-1 py-1 text-xs font-medium transition-opacity ${
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
              <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">{t("members.yearFilter")}</span>
              <div className="flex gap-1.5">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                    className={`h-7 rounded-full px-2.5 text-xs font-semibold transition-colors ${
                      selectedYear === year
                        ? "bg-orange-500 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {year}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedYear(null)}
                  className={`px-1 py-1 text-xs font-medium transition-opacity ${
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
            <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">{t("members.trialFilter")}</span>
            <button
              onClick={() => setShowTrialPlayers((prev) => !prev)}
              aria-pressed={showTrialPlayers}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                showTrialPlayers ? "bg-orange-500" : "bg-slate-300"
              }`}
            >
              <span className="sr-only">
                {showTrialPlayers ? t("members.hideTrialPlayers") : t("members.showTrialPlayers")}
              </span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  showTrialPlayers ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">{t("members.inactiveFilter")}</span>
            <button
              onClick={() => setShowInactivePlayers((prev) => !prev)}
              aria-pressed={showInactivePlayers}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                showInactivePlayers ? "bg-orange-500" : "bg-slate-300"
              }`}
            >
              <span className="sr-only">
                {showInactivePlayers ? t("members.hideInactivePlayers") : t("members.showInactivePlayers")}
              </span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  showInactivePlayers ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <MembersList members={filteredPlayers} onDelete={spondLinked ? undefined : requestDeletePlayer} memberType="players" />
      </section>
      {squad && (
        <BirthdayCalendarModal
          isOpen={isBirthdayCalendarOpen}
          onClose={() => setIsBirthdayCalendarOpen(false)}
          squadId={squad.id}
        />
      )}
    </>
  );
}
