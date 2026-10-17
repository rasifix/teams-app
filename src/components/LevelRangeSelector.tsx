import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select } from './ui';

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
    <div className={`flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-surface-subtle px-3 py-2 ${className}`}>
      <span className="mr-auto text-eyebrow font-bold uppercase tracking-label text-content-subtle">{t('filters.playerLevel')}</span>
      
      <div className="flex items-center gap-1.5">
        <label htmlFor="minLevel" className="text-eyebrow font-semibold leading-none text-content-subtle">{t('filters.from')}</label>
        <Select
          id="minLevel"
          value={levelRange[0]}
          onChange={(e) => handleMinLevelChange(parseInt(e.target.value))}
          disabled={disabled}
          className="!h-8 !min-h-0 !w-auto !rounded-lg !py-0 !pl-2.5 !pr-8 text-xs"
        >
          {generateLevelOptions()}
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <label htmlFor="maxLevel" className="text-eyebrow font-semibold leading-none text-content-subtle">{t('filters.to')}</label>
        <Select
          id="maxLevel"
          value={levelRange[1]}
          onChange={(e) => handleMaxLevelChange(parseInt(e.target.value))}
          disabled={disabled}
          className="!h-8 !min-h-0 !w-auto !rounded-lg !py-0 !pl-2.5 !pr-8 text-xs"
        >
          {generateLevelOptions()}
        </Select>
      </div>
    </div>
  );
}
