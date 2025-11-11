import type { Shirt } from '../types';

interface ShirtCardProps {
  shirt: Shirt;
  onEdit: () => void;
  onRemove: () => void;
}

export default function ShirtCard({
  shirt,
  onEdit,
  onRemove,
}: ShirtCardProps) {
  return (
    <div 
      className={`flex items-center justify-between p-2 rounded border h-11 ${
        shirt.isGoalkeeper ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold">#{shirt.number}</span>
        <span className="text-sm text-gray-600">{shirt.size}</span>
        {shirt.isGoalkeeper && (
          <span className="text-xs text-yellow-600 font-medium bg-yellow-100 px-1 py-0.5 rounded">GK</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onEdit}
          className="text-blue-500 hover:text-blue-700 transition-colors p-1"
          title="Edit shirt"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
        </button>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors p-1"
          title="Remove shirt"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}