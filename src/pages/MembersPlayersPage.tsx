import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import { Button, FilterBar, FilterGroup, FilterLabel, Panel, PanelTitle, Switch } from "../components/ui";
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
      <Panel>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PanelTitle>
            {selectedLevels.length > 0 || selectedYear !== null || !showTrialPlayers
              ? t("members.allPlayersFilteredTitle", {
                  filteredCount: filteredPlayers.length,
                  totalCount: players.length,
                })
              : t("members.allPlayersTitle", { count: filteredPlayers.length })}
          </PanelTitle>
          <div className="layout-cluster layout-cluster--wrap">
            {canManageBirthdayCalendar && squad && (
              <Button variant="secondary" size="sm" onClick={() => setIsBirthdayCalendarOpen(true)}>
                {t('members.birthdayCalendar.openAction')}
              </Button>
            )}
            {canImportFromSpond && (
              <Button className="gap-1.5" variant="secondary" size="sm" onClick={() => navigate('/spond-import?scope=players')}>
                <SpondBadge />
                {t('spondSync.syncAction')}
              </Button>
            )}
            {!spondLinked && (
              <Button variant="primary" size="sm" onClick={openAddPlayerModal}>
                {t("common.actions.add")}
              </Button>
            )}
          </div>
        </div>

        <FilterBar>
          <FilterGroup>
            <FilterLabel>{t("members.levelFilter")}</FilterLabel>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  type="button"
                  variant={selectedLevels.includes(level) ? "primary" : "secondary"}
                  size="sm"
                  key={level}
                  aria-pressed={selectedLevels.includes(level)}
                  onClick={() => {
                    setSelectedLevels((prev) =>
                      prev.includes(level) ? prev.filter((entry) => entry !== level) : [...prev, level]
                    );
                  }}
                  className="min-w-8 px-2"
                >
                  {level}
                </Button>
              ))}
              {selectedLevels.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedLevels([])}>
                  {t("common.actions.clear")}
                </Button>
              )}
            </div>
          </FilterGroup>

          {availableYears.length > 0 && (
            <FilterGroup>
              <FilterLabel>{t("members.yearFilter")}</FilterLabel>
              <div className="flex gap-1.5">
                {availableYears.map((year) => (
                  <Button
                    type="button"
                    variant={selectedYear === year ? "primary" : "secondary"}
                    size="sm"
                    key={year}
                    aria-pressed={selectedYear === year}
                    onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                  >
                    {year}
                  </Button>
                ))}
                {selectedYear !== null && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedYear(null)}>
                    {t("common.actions.clear")}
                  </Button>
                )}
              </div>
            </FilterGroup>
          )}

          <FilterGroup>
            <FilterLabel>{t("members.trialFilter")}</FilterLabel>
            <Switch
              checked={showTrialPlayers}
              label={showTrialPlayers ? t("members.hideTrialPlayers") : t("members.showTrialPlayers")}
              onClick={() => setShowTrialPlayers((prev) => !prev)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>{t("members.inactiveFilter")}</FilterLabel>
            <Switch
              checked={showInactivePlayers}
              label={showInactivePlayers ? t("members.hideInactivePlayers") : t("members.showInactivePlayers")}
              onClick={() => setShowInactivePlayers((prev) => !prev)}
            />
          </FilterGroup>
        </FilterBar>

        <MembersList members={filteredPlayers} onDelete={spondLinked ? undefined : requestDeletePlayer} memberType="players" />
      </Panel>
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
