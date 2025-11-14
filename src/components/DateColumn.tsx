interface DateColumnProps {
  date: string;
  className?: string;
}

export default function DateColumn({ date, className = "" }: DateColumnProps) {
  // Parse date for display
  const eventDate = new Date(date);
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = eventDate.getDate();

  return (
    <div className={`flex-shrink-0 text-center bg-gray-50 rounded-lg p-3 min-w-[60px] ${className}`}>
      <div className="text-xs font-medium text-gray-500">{month}</div>
      <div className="text-xl font-bold text-gray-900">{day}</div>
    </div>
  );
}