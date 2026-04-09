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
    <div className={`flex-shrink-0 text-center bg-gray-50 rounded-lg p-3 min-w-[60px] ${className}`}>
      <div className="text-xs font-medium text-gray-500">{month}</div>
      <div className="text-xl font-bold text-gray-900">{day}</div>
    </div>
  );
}