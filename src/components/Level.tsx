import { useTranslation } from 'react-i18next';

interface LevelProps {
  level: number;
  className?: string;
}

export default function Level({ level, className = '' }: LevelProps) {
  const { t } = useTranslation();
  // Ensure level is between 1 and 5
  const normalizedLevel = Math.max(1, Math.min(5, level));
  
  // Create string with filled stars
  const stars = '★'.repeat(normalizedLevel);
  
  return (
    <span className={`text-yellow-500 ${className}`} title={t('levels.title', { level: normalizedLevel })}>
      {stars}
    </span>
  );
}
