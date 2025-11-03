import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; date: string; startTime: string; maxPlayersPerTeam: number }) => void;
  currentData: {
    name: string;
    date: string;
    startTime: string;
    maxPlayersPerTeam: number;
  };
  minMaxPlayers: number;
}

export default function EditEventModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentData,
  minMaxPlayers
}: EditEventModalProps) {
  const [name, setName] = useState(currentData.name);
  const [date, setDate] = useState(currentData.date);
  const [startTime, setStartTime] = useState(currentData.startTime);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(currentData.maxPlayersPerTeam);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentData.name);
      setDate(currentData.date);
      setStartTime(currentData.startTime);
      setMaxPlayersPerTeam(currentData.maxPlayersPerTeam);
      setError(null);
    }
  }, [currentData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Event name is required');
      return;
    }

    if (!date) {
      setError('Date is required');
      return;
    }

    if (!startTime) {
      setError('Start time is required');
      return;
    }

    if (maxPlayersPerTeam < minMaxPlayers) {
      setError(`Max players cannot be less than ${minMaxPlayers} (current largest team size)`);
      return;
    }

    if (maxPlayersPerTeam < 1) {
      setError('Max players must be at least 1');
      return;
    }

    onSave({
      name: name.trim(),
      date,
      startTime,
      maxPlayersPerTeam,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Edit Event</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="eventName" className="form-label">
                Event Name
              </label>
              <input
                type="text"
                id="eventName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input"
                placeholder="Enter event name"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="eventDate" className="form-label">
                Date
              </label>
              <input
                type="date"
                id="eventDate"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="eventStartTime" className="form-label">
                Start Time
              </label>
              <input
                type="time"
                id="eventStartTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="form-input"
              />
            </div>

            <div>
              <label htmlFor="maxPlayers" className="form-label">
                Max Players per Team
              </label>
              <input
                type="number"
                id="maxPlayers"
                value={maxPlayersPerTeam}
                onChange={(e) => setMaxPlayersPerTeam(parseInt(e.target.value) || 0)}
                required
                min={minMaxPlayers}
                className="form-input"
              />
              {minMaxPlayers > 1 && (
                <p className="text-xs text-gray-500 mt-1">
                  Minimum: {minMaxPlayers} (current largest team size)
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
          >
            Save
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
