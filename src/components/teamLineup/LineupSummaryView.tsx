import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Card, CardBody, CardTitle, IconButton, PanelTitle } from '../ui';
import { getPositionLabelKey, type LineupShirtNumberRow, type LineupSummaryPeriod, type MinimumPeriodViolation } from '../../store/selectors/matchPlanningSelectors';

interface Props {
  teamName: string;
  matchFormatName: string;
  formationName: string;
  periods: LineupSummaryPeriod[];
  shirtNumberRows: LineupShirtNumberRow[];
  violations: MinimumPeriodViolation[];
}

export default function LineupSummaryView({ teamName, matchFormatName, formationName, periods, shirtNumberRows, violations }: Props) {
  const { t } = useTranslation();
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);

  return <div className="lineup-print-content">
    <div className="lineup-print-actions">
      <PanelTitle>{t('page.teamLineup.summaryTitle')}</PanelTitle>
      <IconButton label={t('page.teamLineup.printSummary')} onClick={() => window.print()}>
        <svg className="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v6H6z" /></svg>
      </IconButton>
    </div>
    {violations.length > 0 && <Alert className="lineup-alert">
      <div className="lineup-violation-title">{t('page.teamLineup.minimumPeriodsViolationTitle')}</div>
      <ul className="lineup-violation-list">{violations.map((violation) => <li key={violation.playerId}>
        {t('page.teamLineup.minimumPeriodsViolation', { player: violation.playerName ?? t('page.teamLineup.unknownPlayer'), count: violation.plannedPeriods, minimum: violation.minimumPeriods })}
      </li>)}</ul>
    </Alert>}
    <div className="lineup-print-heading">
      <h1 className="lineup-print-title">{t('page.teamLineup.title', { team: teamName })}</h1>
      <p>{matchFormatName} · {formationName}</p>
    </div>
    <div className="lineup-summary-grid">
      {periods.map((period) => <Card key={period.periodNumber} className="lineup-period-card">
        <CardBody className="lineup-period-body">
          <CardTitle className="lineup-period-title">{t('page.teamLineup.periodLabel', { number: period.periodNumber })}</CardTitle>
          <div className="lineup-pitch--summary">
            {period.assignments.map((assignment) => <div
              key={assignment.slotId}
              className={`lineup-slot lineup-slot--summary ${assignment.playerId && hoveredPlayerId === assignment.playerId ? 'lineup-slot--highlighted' : assignment.playerId ? 'lineup-slot--assigned' : 'lineup-slot--empty'}`}
              style={{ left: `${assignment.pitchX}%`, top: `${assignment.pitchY}%` }}
              onMouseEnter={() => assignment.playerId && setHoveredPlayerId(assignment.playerId)}
              onMouseLeave={() => setHoveredPlayerId(null)}
            >
              <span className="lineup-slot-position">{t(getPositionLabelKey(assignment.positionCode))}{assignment.displayIndex ? ` ${assignment.displayIndex}` : ''}</span>
              <span className="lineup-slot-player">{assignment.playerLabel ?? t('page.teamLineup.emptySlot')}</span>
            </div>)}
          </div>
          <div className="lineup-summary-bench">
            <div className="lineup-summary-bench-title">{t('page.teamLineup.benchLabel')}</div>
            {period.benchedPlayers.length > 0 ? <div className="lineup-summary-players">
              {period.benchedPlayers.map((player) => <span key={player.playerId} className={`lineup-summary-player${hoveredPlayerId === player.playerId ? ' lineup-summary-player--highlighted' : ''}`} onMouseEnter={() => setHoveredPlayerId(player.playerId)} onMouseLeave={() => setHoveredPlayerId(null)}>
                {player.playerName ?? t('page.teamLineup.unknownPlayer')}
              </span>)}
            </div> : <div className="lineup-empty-bench">{t('page.teamLineup.noBenchedPlayers')}</div>}
          </div>
        </CardBody>
      </Card>)}
    </div>
    <section className="lineup-shirt-page">
      <header className="lineup-shirt-header">
        <h1 className="lineup-shirt-title">{teamName}</h1>
        <h2 className="lineup-shirt-subtitle">{t('page.teamLineup.shirtNumbersTitle')}</h2>
      </header>
      <div className="lineup-shirt-grid">{shirtNumberRows.map((row) => <div key={row.playerId} className="lineup-shirt-row">
        <span className="lineup-shirt-number">{row.shirtNumber ?? t('page.teamLineup.noShirtNumber')}</span>
        <span className="lineup-shirt-name">{row.playerName ?? t('page.teamLineup.unknownPlayer')}</span>
      </div>)}</div>
    </section>
  </div>;
}
