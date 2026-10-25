import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import MembersList from "../components/MembersList";
import { Button, ChoiceGroup, Cluster, FilterBar, FilterGroup, FilterLabel, Panel, SectionActions, SectionHeader, SectionHeaderContent, SectionTitle, Switch } from "../components/ui";
import SpondSyncResultBanner from '../components/SpondSyncResultBanner';
import type { MembersOutletContext } from "./MembersPage";
import { selectFilteredPlayers, selectPlayerBirthYears } from '../store/selectors/memberSelectors';
import LevelRangeSelector from '../components/LevelRangeSelector';

export default function MembersPlayersPage() {
  const { t } = useTranslation();
  const { players, openAddPlayerModal, openBirthdayCalendar, openMember, canManageBirthdayCalendar, spondLinked, requestDeletePlayer } = useOutletContext<MembersOutletContext>();

  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showTrialPlayers, setShowTrialPlayers] = useState(false);
  const [showInactivePlayers, setShowInactivePlayers] = useState(false);

  const availableYears = useMemo(() => selectPlayerBirthYears(players), [players]);

  const filteredPlayers = useMemo(() => selectFilteredPlayers(players, {
    levels: selectedLevels,
    birthYear: selectedYear,
    includeTrial: showTrialPlayers,
    includeInactive: showInactivePlayers,
  }), [players, selectedLevels, selectedYear, showTrialPlayers, showInactivePlayers]);

  return (
    <>
      <SpondSyncResultBanner className="members-banner" />
      <Panel>
        <SectionHeader>
          <SectionHeaderContent><SectionTitle>
            {selectedLevels.length > 0 || selectedYear !== null || !showTrialPlayers
              ? t("page.members.allPlayersFilteredTitle", {
                  filteredCount: filteredPlayers.length,
                  totalCount: players.length,
                })
              : t("page.members.allPlayersTitle", { count: filteredPlayers.length })}
          </SectionTitle></SectionHeaderContent>
          <SectionActions><Cluster gap="sm">
            {canManageBirthdayCalendar && (
              <Button variant="secondary" size="sm" onClick={openBirthdayCalendar}>
                {t('page.members.birthdayCalendar.openAction')}
              </Button>
            )}
            {!spondLinked && (
              <Button variant="primary" size="sm" onClick={openAddPlayerModal}>
                {t("common.actions.add")}
              </Button>
            )}
          </Cluster></SectionActions>
        </SectionHeader>

        <FilterBar>
          <LevelRangeSelector selectedLevels={selectedLevels} onChange={setSelectedLevels} />

          {availableYears.length > 0 && (
            <FilterGroup>
              <FilterLabel>{t("page.members.yearFilter")}</FilterLabel>
              <ChoiceGroup>
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
              </ChoiceGroup>
            </FilterGroup>
          )}

          <FilterGroup>
            <FilterLabel>{t("page.members.trialFilter")}</FilterLabel>
            <Switch
              checked={showTrialPlayers}
              label={showTrialPlayers ? t("page.members.hideTrialPlayers") : t("page.members.showTrialPlayers")}
              onClick={() => setShowTrialPlayers((prev) => !prev)}
            />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>{t("page.members.inactiveFilter")}</FilterLabel>
            <Switch
              checked={showInactivePlayers}
              label={showInactivePlayers ? t("page.members.hideInactivePlayers") : t("page.members.showInactivePlayers")}
              onClick={() => setShowInactivePlayers((prev) => !prev)}
            />
          </FilterGroup>
        </FilterBar>

        <MembersList members={filteredPlayers} onDelete={spondLinked ? undefined : requestDeletePlayer} memberType="players" onOpenMember={openMember} />
      </Panel>
    </>
  );
}
