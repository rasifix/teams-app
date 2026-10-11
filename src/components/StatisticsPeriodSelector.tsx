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
        className="btn-secondary btn-sm inline-flex items-center gap-2"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span>{t('statistics.period.selectorLabel', { period: getStatisticsPeriodLabel(selectedPeriod) })}</span>
        <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              {t('statistics.period.selectPeriod')}
            </p>

            <button
              type="button"
              onClick={() => {
                selectStatisticsPeriod(null);
                setIsOpen(false);
              }}
              className={`flex w-full items-start rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedPeriod === null
                  ? 'bg-orange-50 text-orange-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div>
                <div className="font-medium">{t('statistics.period.allEvents')}</div>
                <div className="text-xs text-gray-500">{t('statistics.period.allEventsDescription')}</div>
              </div>
            </button>

            <div className="my-2 border-t border-gray-100" />

            <div className="space-y-1">
              {periods.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => {
                    selectStatisticsPeriod(period.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedPeriod?.id === period.id ? 'bg-orange-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`font-medium ${selectedPeriod?.id === period.id ? 'text-orange-700' : 'text-gray-900'}`}>
                    {period.name}
                  </div>
                  <div className="text-xs text-gray-500">{t('statistics.period.rangeLabel', { startDate: period.startDate, endDate: period.endDate })}</div>
                </button>
              ))}

              {periods.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500">{t('statistics.period.noSquadPeriods')}</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
