import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterBar, FilterGroup, FilterLabel, Select } from './ui';

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
  const controlId = useId();
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

  const minControlId = `${controlId}-minimum`;
  const maxControlId = `${controlId}-maximum`;

  return (
    <FilterBar className={`level-range-filter ${className}`.trim()}>
      <FilterLabel className="level-range-label">{t('filters.playerLevel')}</FilterLabel>
      <FilterGroup>
        <label htmlFor={minControlId} className="level-range-bound-label">{t('filters.from')}</label>
        <Select
          id={minControlId}
          value={levelRange[0]}
          onChange={(e) => handleMinLevelChange(parseInt(e.target.value))}
          disabled={disabled}
          controlSize="sm"
          className="level-range-select"
        >
          {generateLevelOptions()}
        </Select>
      </FilterGroup>

      <FilterGroup>
        <label htmlFor={maxControlId} className="level-range-bound-label">{t('filters.to')}</label>
        <Select
          id={maxControlId}
          value={levelRange[1]}
          onChange={(e) => handleMaxLevelChange(parseInt(e.target.value))}
          disabled={disabled}
          controlSize="sm"
          className="level-range-select"
        >
          {generateLevelOptions()}
        </Select>
      </FilterGroup>
    </FilterBar>
  );
}
