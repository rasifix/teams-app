import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LevelRangeSelectorProps {
  minLevel?: number;
  maxLevel?: number;
  defaultRange?: [number, number];
  onChange: (range: [number, number]) => void;
  className?: string;
  disabled?: boolean;
}

export default function LevelRangeSelector({
  minLevel = 1,
  maxLevel = 5,
  defaultRange = [1, 5],
  onChange,
  className = '',
  disabled = false,
}: LevelRangeSelectorProps) {
  const { t } = useTranslation();
  const [levelRange, setLevelRange] = useState<[number, number]>(defaultRange);

  const handleMinLevelChange = (newMin: number) => {
    const newRange: [number, number] = [newMin, Math.max(newMin, levelRange[1])];
    setLevelRange(newRange);
    onChange(newRange);
  };

  const handleMaxLevelChange = (newMax: number) => {
    const newRange: [number, number] = [Math.min(levelRange[0], newMax), newMax];
    setLevelRange(newRange);
    onChange(newRange);
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1: return t('levels.1');
      case 2: return t('levels.2');
      case 3: return t('levels.3');
      case 4: return t('levels.4');
      case 5: return t('levels.5');
      default: return `${level}`;
    }
  };

  const generateLevelOptions = () => {
    const options = [];
    for (let i = minLevel; i <= maxLevel; i++) {
      options.push(
        <option key={i} value={i}>
          {getLevelLabel(i)}
        </option>
      );
    }
    return options;
  };

  return (
    <div className={`mt-4 mb-4 flex flex-wrap items-center gap-4 ${className}`}>
      <span className="text-sm font-medium text-gray-700">{t('filters.playerLevel')}</span>
      
      <div className="flex items-center gap-2">
        <label htmlFor="minLevel" className="text-sm text-gray-600">{t('filters.from')}</label>
        <select
          id="minLevel"
          value={levelRange[0]}
          onChange={(e) => handleMinLevelChange(parseInt(e.target.value))}
          disabled={disabled}
          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {generateLevelOptions()}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="maxLevel" className="text-sm text-gray-600">{t('filters.to')}</label>
        <select
          id="maxLevel"
          value={levelRange[1]}
          onChange={(e) => handleMaxLevelChange(parseInt(e.target.value))}
          disabled={disabled}
          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {generateLevelOptions()}
        </select>
      </div>
    </div>
  );
}