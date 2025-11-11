import type { ShirtSet, Shirt } from '../types';
import ShirtCard from './ShirtCard';

interface ShirtSetCardProps {
  shirtSet: ShirtSet;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddShirt: () => void;
  onEditShirt: (shirt: Shirt) => void;
  onRemoveShirt: (shirtId: string, shirtNumber: number) => void;
}

export default function ShirtSetCard({
  shirtSet,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onAddShirt,
  onEditShirt,
  onRemoveShirt,
}: ShirtSetCardProps) {
  return (
    <div className={`border-l-4 card hover:shadow-md transition-shadow`} style={{ borderLeftColor: shirtSet.color }}>
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div 
              className="flex items-center justify-between mb-2 cursor-pointer -mx-2 px-2 py-1 rounded"
              onClick={onToggleExpanded}
            >
              <div className="flex items-center gap-3">
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="text-lg font-semibold">{shirtSet.sponsor}</h3>
                <span className="text-sm text-gray-500">
                  {shirtSet.shirts.length} shirt{shirtSet.shirts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={onEdit}
                  className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                  title="Edit set"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button
                  onClick={onDelete}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                  title="Delete set"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {shirtSet.shirts
                    .sort((a, b) => a.number - b.number)
                    .map((shirt) => (
                        <ShirtCard
                          key={shirt.number}
                          shirt={shirt}
                          onEdit={() => onEditShirt(shirt)}
                          onRemove={() => onRemoveShirt(shirtSet.id, shirt.number)}
                        />
                      ))}
                  
                  {/* Add Shirt Card */}
                  <div 
                    onClick={onAddShirt}
                    className="flex items-center justify-center p-2 rounded border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200 group h-11"
                  >
                    <svg 
                      className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}