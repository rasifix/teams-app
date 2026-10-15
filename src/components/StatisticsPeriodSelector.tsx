import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSquadPeriods, useSelectedStatisticsPeriod, useStore } from '../store';
import { getStatisticsPeriodLabel } from '../utils/statisticsPeriod';

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
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-orange-100"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>{t('statistics.period.selectorLabel', { period: getStatisticsPeriodLabel(selectedPeriod) })}</span>
        <svg className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,.45)]">
          <div className="p-2.5">
            <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.075em] text-slate-500">
              {t('statistics.period.selectPeriod')}
            </p>

            <button
              type="button"
              onClick={() => {
                selectStatisticsPeriod(null);
                setIsOpen(false);
              }}
              className={`flex w-full items-start rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                selectedPeriod === null
                  ? 'bg-orange-50 text-orange-800'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="font-semibold">{t('statistics.period.allEvents')}</div>
                <div className="mt-0.5 text-xs text-slate-500">{t('statistics.period.allEventsDescription')}</div>
              </div>
            </button>

            <div className="my-2 border-t border-slate-100" />

            <div className="space-y-1">
              {periods.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => {
                    selectStatisticsPeriod(period.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedPeriod?.id === period.id ? 'bg-orange-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className={`font-semibold ${selectedPeriod?.id === period.id ? 'text-orange-800' : 'text-slate-900'}`}>
                    {period.name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">{t('statistics.period.rangeLabel', { startDate: period.startDate, endDate: period.endDate })}</div>
                </button>
              ))}

              {periods.length === 0 && (
                <p className="px-3 py-2.5 text-sm leading-6 text-slate-500">{t('statistics.period.noSquadPeriods')}</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
