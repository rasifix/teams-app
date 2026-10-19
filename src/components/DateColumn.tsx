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
    <div className={`date-tile ${className}`.trim()}>
      <div className="date-tile-month">{month}</div>
      <div className="date-tile-day">{day}</div>
    </div>
  );
}
