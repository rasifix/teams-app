interface StrengthProps {
  level: number; // 1 (highest) to 3 (lowest)
  className?: string;
}

export default function Strength({ level, className = '' }: StrengthProps) {
  // Strength 1 = 3 biceps (highest)
  // Strength 2 = 2 biceps (medium)
  // Strength 3 = 1 bicep (lowest)
  const bicepsCount = 4 - level; // Converts: 1->3, 2->2, 3->1
  const biceps = '🔥'.repeat(bicepsCount);
  
  return (
    <span className={className} title={`Strength ${level}`}>
      {biceps}
    </span>
  );
}
