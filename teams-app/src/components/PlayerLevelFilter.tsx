interface PlayerLevelFilterProps {
  minLevel: number;
  maxLevel: number;
  onMinLevelChange: (level: number) => void;
  onMaxLevelChange: (level: number) => void;
  onReset: () => void;
}

export default function PlayerLevelFilter({
  minLevel,
  maxLevel,
  onMinLevelChange,
  onMaxLevelChange,
  onReset
}: PlayerLevelFilterProps) {
  const isFiltered = minLevel !== 1 || maxLevel !== 5;

  return (
    <div className="mt-4 mb-4 flex flex-wrap items-center gap-4">
      <span className="text-sm font-medium text-gray-700">Filter by Player Level:</span>
      <div className="flex items-center gap-2">
        <label htmlFor="minLevel" className="text-sm text-gray-600">From:</label>
        <select
          id="minLevel"
          value={minLevel}
          onChange={(e) => onMinLevelChange(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value={1}>1 - Beginner</option>
          <option value={2}>2 - Learning</option>
          <option value={3}>3 - Intermediate</option>
          <option value={4}>4 - Advanced</option>
          <option value={5}>5 - Expert</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="maxLevel" className="text-sm text-gray-600">To:</label>
        <select
          id="maxLevel"
          value={maxLevel}
          onChange={(e) => onMaxLevelChange(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value={1}>1 - Beginner</option>
          <option value={2}>2 - Learning</option>
          <option value={3}>3 - Intermediate</option>
          <option value={4}>4 - Advanced</option>
          <option value={5}>5 - Expert</option>
        </select>
      </div>
      {isFiltered && (
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}
