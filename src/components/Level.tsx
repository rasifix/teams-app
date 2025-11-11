interface LevelProps {
  level: number;
  className?: string;
}

export default function Level({ level, className = '' }: LevelProps) {
  // Ensure level is between 1 and 5
  const normalizedLevel = Math.max(1, Math.min(5, level));
  
  // Create string with filled stars
  const stars = '★'.repeat(normalizedLevel);
  
  return (
    <span className={`text-yellow-500 ${className}`} title={`Level ${normalizedLevel}`}>
      {stars}
    </span>
  );
}
