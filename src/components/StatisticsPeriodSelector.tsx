import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSquadPeriods, useSelectedStatisticsPeriod, useStore } from '../store';
import { getStatisticsPeriodLabel } from '../utils/statisticsPeriod';
import { Button, MenuDivider, MenuItem, MenuItemDescription, MenuItemTitle, MenuLabel, MenuSurface } from './ui';

export default function StatisticsPeriodSelector() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const periods = useSquadPeriods();
  const selectedPeriod = useSelectedStatisticsPeriod();
  const { selectStatisticsPeriod } = useStore();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="statistics-period-selector" ref={containerRef}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>{t('statistics.period.selectorLabel', { period: getStatisticsPeriodLabel(selectedPeriod) })}</span>
        <svg className={`statistics-period-chevron${isOpen ? ' statistics-period-chevron--open' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <MenuSurface className="statistics-period-menu">
            <MenuLabel>{t('statistics.period.selectPeriod')}</MenuLabel>

            <MenuItem
              selected={selectedPeriod === null}
              onClick={() => {
                selectStatisticsPeriod(null);
                setIsOpen(false);
              }}
            >
              <MenuItemTitle>{t('statistics.period.allEvents')}</MenuItemTitle>
              <MenuItemDescription>{t('statistics.period.allEventsDescription')}</MenuItemDescription>
            </MenuItem>

            <MenuDivider />

            <div className="statistics-period-options">
              {periods.map((period) => (
                <MenuItem
                  key={period.id}
                  selected={selectedPeriod?.id === period.id}
                  onClick={() => {
                    selectStatisticsPeriod(period.id);
                    setIsOpen(false);
                  }}
                >
                  <MenuItemTitle>{period.name}</MenuItemTitle>
                  <MenuItemDescription>{t('statistics.period.rangeLabel', { startDate: period.startDate, endDate: period.endDate })}</MenuItemDescription>
                </MenuItem>
              ))}

              {periods.length === 0 && (
                <p className="statistics-period-empty">{t('statistics.period.noSquadPeriods')}</p>
              )}
            </div>
        </MenuSurface>
      )}
    </div>
  );
}
