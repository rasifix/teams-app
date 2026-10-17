import { useTranslation } from 'react-i18next';

interface DateColumnProps {
  date: string;
  className?: string;
}

export default function DateColumn({ date, className = "" }: DateColumnProps) {
  const { i18n } = useTranslation();
  // Parse date for display
  const eventDate = new Date(date);
  const locale = i18n.language.startsWith('de') ? 'de-CH' : 'en-US';
  const month = eventDate.toLocaleDateString(locale, { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();

  return (
    <div className={`flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-surface-muted text-center ${className}`}>
      <div className="text-micro font-semibold leading-none tracking-wide text-brand-text">{month}</div>
      <div className="mt-0.5 text-lg font-bold leading-none text-content-strong">{day}</div>
    </div>
  );
}
