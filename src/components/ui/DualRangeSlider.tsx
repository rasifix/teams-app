import { useState, useRef, useCallback, useEffect } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  values: [number, number];
  onChange: (values: [number, number]) => void;
  className?: string;
  disabled?: boolean;
}

export default function DualRangeSlider({
  min,
  max,
  step = 1,
  values,
  onChange,
  className = '',
  disabled = false,
}: DualRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getPercentage = (value: number) => ((value - min) / (max - min)) * 100;

  const getValue = useCallback(
    (percentage: number) => {
      const value = min + (percentage / 100) * (max - min);
      return Math.round(value / step) * step;
    },
    [min, max, step]
  );

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(type);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current || disabled) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const newValue = getValue(percentage);

      if (isDragging === 'min') {
        const newMin = Math.min(newValue, values[1]);
        if (newMin !== values[0]) {
          onChange([newMin, values[1]]);
        }
      } else if (isDragging === 'max') {
        const newMax = Math.max(newValue, values[0]);
        if (newMax !== values[1]) {
          onChange([values[0], newMax]);
        }
      }
    },
    [isDragging, getValue, values, onChange, disabled]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const minPercentage = getPercentage(values[0]);
  const maxPercentage = getPercentage(values[1]);

  return (
    <div className={`relative ${className}`}>
      {/* Slider Track */}
      <div
        ref={sliderRef}
        className={`relative h-6 bg-gray-200 rounded-lg cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {/* Active Range */}
        <div
          className="absolute h-6 bg-orange-500 rounded-lg"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />

        {/* Min Thumb */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-orange-500 rounded-full shadow-md cursor-grab ${
            isDragging === 'min' ? 'cursor-grabbing scale-110' : ''
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{ left: `${minPercentage}%` }}
          onMouseDown={handleMouseDown('min')}
        />

        {/* Max Thumb */}
        <div
          className={`absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-white border-2 border-orange-500 rounded-full shadow-md cursor-grab ${
            isDragging === 'max' ? 'cursor-grabbing scale-110' : ''
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={handleMouseDown('max')}
        />
      </div>
    </div>
  );
}