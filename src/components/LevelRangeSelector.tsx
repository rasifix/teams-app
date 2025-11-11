import { useState } from 'react';
import DualRangeSlider from './ui/DualRangeSlider';

interface LevelRangeSelectorProps {
  minLevel?: number;
  maxLevel?: number;
  defaultRange?: [number, number];
  onChange: (range: [number, number]) => void;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export default function LevelRangeSelector({
  minLevel = 1,
  maxLevel = 5,
  defaultRange = [1, 5],
  onChange,
  className = '',
  disabled = false,
  compact = false,
}: LevelRangeSelectorProps) {
  const [levelRange, setLevelRange] = useState<[number, number]>(defaultRange);

  const handleRangeChange = (values: [number, number]) => {
    setLevelRange(values);
    onChange(values);
  };

  const handleReset = () => {
    const resetRange: [number, number] = [minLevel, maxLevel];
    setLevelRange(resetRange);
    onChange(resetRange);
  };

  const getLevelEmoji = (level: number) => {

    switch (level) {
      case 1: return '★';
      case 2: return '★★';
      case 3: return '★★★';
      case 4: return '★★★★';
      case 5: return '★★★★★';
      default: return '⚫';
    }
  };

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-4'} ${className}`}>
      {compact ? (
        // Compact single-line layout
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Level:</span>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{getLevelEmoji(levelRange[0])}</span>
            <span>to</span>
            <span>{getLevelEmoji(levelRange[1])}</span>
          </div>
          <div className="flex-1 min-w-0">
            <DualRangeSlider
              min={minLevel}
              max={maxLevel}
              values={levelRange}
              onChange={handleRangeChange}
              disabled={disabled}
            />
          </div>
          <button
            onClick={handleReset}
            disabled={disabled}
            className="text-xs text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Reset
          </button>
        </div>
      ) : (
        // Original full layout
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Filter by Level</h3>
            <button
              onClick={handleReset}
              disabled={disabled}
              className="text-sm text-orange-600 hover:text-orange-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
          
          {/* Custom Labels for Player Levels */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span>Min:</span>
                <span className="font-medium">{getLevelEmoji(levelRange[0])}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Max:</span>
                <span className="font-medium">{getLevelEmoji(levelRange[1])}</span>
              </div>
            </div>
          </div>

          <DualRangeSlider
            min={minLevel}
            max={maxLevel}
            values={levelRange}
            onChange={handleRangeChange}
            className="px-2"
            disabled={disabled}
          />
        </>
      )}
    </div>
  );
}