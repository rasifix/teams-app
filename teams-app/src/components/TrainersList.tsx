import type { Trainer } from '../types';
import { useState } from 'react';

interface TrainersListProps {
  trainers: Trainer[];
  onEdit: (trainer: Trainer) => void;
  onDelete: (trainer: Trainer) => void;
}

export default function TrainersList({ trainers, onEdit, onDelete }: TrainersListProps) {
  const [swipedTrainerId, setSwipedTrainerId] = useState<string | null>(null);

  if (trainers.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        <p>No trainers added yet. Click "Add Trainer" to get started.</p>
      </div>
    );
  }

  const handleTouchStart = (trainerId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const diffX = startX - moveTouch.clientX;
      
      // If swiped left more than 50px, show delete button
      if (diffX > 50) {
        setSwipedTrainerId(trainerId);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
    
    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleRowClick = (_trainer: Trainer, e: React.MouseEvent) => {
    // Don't trigger any action if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('.delete-button') || target.closest('button')) {
      return;
    }
    // Since we have explicit edit/delete buttons, we can remove the card click action
    // or optionally keep it for edit if preferred
    // onEdit(trainer);
  };

  const handleDeleteClick = (trainer: Trainer, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(trainer);
    setSwipedTrainerId(null);
  };

  // Close swipe state when clicking outside
  const handleBackdropClick = () => {
    if (swipedTrainerId) {
      setSwipedTrainerId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3" onClick={handleBackdropClick}>
      {trainers.map((trainer) => (
        <div 
          key={trainer.id}
          className="relative overflow-hidden bg-white border border-gray-200 rounded-lg"
        >
          {/* Main row content */}
          <div 
            className={`flex items-center justify-between p-3 cursor-pointer transition-transform duration-200 ${
              swipedTrainerId === trainer.id ? '-translate-x-20' : 'translate-x-0'
            } active:bg-gray-50`}
            onClick={(e) => handleRowClick(trainer, e)}
            onTouchStart={(e) => handleTouchStart(trainer.id, e)}
          >
            {/* Trainer info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {trainer.firstName} {trainer.lastName}
                  </p>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(trainer);
                    }}
                    className="flex items-center justify-center p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    title="Edit trainer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(trainer, e)}
                    className="delete-button flex items-center justify-center p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Delete trainer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Delete button that appears on swipe */}
          <div 
            className={`absolute inset-y-0 right-0 flex items-center justify-center w-20 bg-red-600 transition-opacity duration-200 ${
              swipedTrainerId === trainer.id ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              className="delete-button flex items-center justify-center w-full h-full text-white font-medium"
              onClick={(e) => handleDeleteClick(trainer, e)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}