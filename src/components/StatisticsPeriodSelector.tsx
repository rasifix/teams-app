import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSquadPeriods, useSelectedStatisticsPeriod, useStore } from '../store';
import { getStatisticsPeriodLabel } from '../utils/statisticsPeriod';
import { Button } from './ui';

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
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen((current) => !current)}
        className="gap-2"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>{t('statistics.period.selectorLabel', { period: getStatisticsPeriodLabel(selectedPeriod) })}</span>
        <svg className={`h-4 w-4 text-content-disabled transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-edge bg-surface shadow-xl">
          <div className="p-2.5">
            <p className="px-3 pb-2 pt-1 text-eyebrow font-bold uppercase tracking-label text-content-subtle">
              {t('statistics.period.selectPeriod')}
            </p>

            <button
              type="button"
              data-ui-control="menu-item"
              onClick={() => {
                selectStatisticsPeriod(null);
                setIsOpen(false);
              }}
              className={`flex w-full items-start rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                selectedPeriod === null
                  ? 'bg-brand-subtle text-brand-text'
                  : 'text-content hover:bg-surface-subtle'
              }`}
            >
              <div>
                <div className="font-semibold">{t('statistics.period.allEvents')}</div>
                <div className="mt-0.5 text-xs text-content-subtle">{t('statistics.period.allEventsDescription')}</div>
              </div>
            </button>

            <div className="my-2 border-t border-edge" />

            <div className="space-y-1">
              {periods.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  data-ui-control="menu-item"
                  onClick={() => {
                    selectStatisticsPeriod(period.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedPeriod?.id === period.id ? 'bg-brand-subtle' : 'hover:bg-surface-subtle'
                  }`}
                >
                  <div className={`font-semibold ${selectedPeriod?.id === period.id ? 'text-brand-text' : 'text-content-strong'}`}>
                    {period.name}
                  </div>
                  <div className="mt-0.5 text-xs text-content-subtle">{t('statistics.period.rangeLabel', { startDate: period.startDate, endDate: period.endDate })}</div>
                </button>
              ))}

              {periods.length === 0 && (
                <p className="px-3 py-2.5 text-sm leading-6 text-content-subtle">{t('statistics.period.noSquadPeriods')}</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
