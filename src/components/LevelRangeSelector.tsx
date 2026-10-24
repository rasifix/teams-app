import { useTranslation } from 'react-i18next';
import { Button, ChoiceGroup, FilterBar, FilterGroup, FilterLabel } from './ui';

interface LevelRangeSelectorProps {
  selectedLevels: number[];
  onChange: (levels: number[]) => void;
  className?: string;
  disabled?: boolean;
}

export default function LevelRangeSelector({ selectedLevels, onChange, className = '' }: LevelRangeSelectorProps) {
  const { t } = useTranslation();
  const toggleLevel = (level: number) => onChange(
    selectedLevels.includes(level)
      ? selectedLevels.filter((entry) => entry !== level)
      : [...selectedLevels, level].sort(),
  );

  return (
    <FilterBar className={`ui-filter-bar--embedded ${className}`.trim()}>
      <FilterGroup>
        <FilterLabel>{t('filters.playerLevel')}</FilterLabel>
        <ChoiceGroup>
          {[1, 2, 3, 4, 5].map((level) => (
            <Button
              key={level}
              type="button"
              variant={selectedLevels.includes(level) ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={selectedLevels.includes(level)}
              onClick={() => toggleLevel(level)}
              className="member-level-filter"
            >{level}</Button>
          ))}
          {selectedLevels.length > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange([])}>
              {t('common.actions.clear')}
            </Button>
          )}
        </ChoiceGroup>
      </FilterGroup>
    </FilterBar>
  );
}
