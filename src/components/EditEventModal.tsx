import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; date: string; maxPlayersPerTeam: number; minPlayersPerTeam: number; location?: string }) => void;
  currentData: {
    name: string;
    date: string;
    maxPlayersPerTeam: number;
    minPlayersPerTeam: number;
    location?: string;
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
  const [location, setLocation] = useState(currentData.location || '');
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState(currentData.maxPlayersPerTeam);
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState(currentData.minPlayersPerTeam);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentData.name);
      setDate(currentData.date);
      setLocation(currentData.location || '');
      setMaxPlayersPerTeam(currentData.maxPlayersPerTeam || 9);
      setMinPlayersPerTeam(currentData.minPlayersPerTeam || 6);
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

    if (maxPlayersPerTeam < minMaxPlayers) {
      setError(`Max players cannot be less than ${minMaxPlayers} (current largest team size)`);
      return;
    }

    if (maxPlayersPerTeam < 1) {
      setError('Max players must be at least 1');
      return;
    }

    if (minPlayersPerTeam < 1) {
      setError('Min players must be at least 1');
      return;
    }

    if (minPlayersPerTeam > maxPlayersPerTeam) {
      setError('Min players cannot be greater than max players');
      return;
    }

    onSave({
      name: name.trim(),
      date,
      maxPlayersPerTeam,
      minPlayersPerTeam,
      location: location.trim() || undefined,
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
              <label htmlFor="eventLocation" className="form-label">
                Location
              </label>
              <input
                type="text"
                id="eventLocation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-input"
                placeholder="e.g., Main Field, Sportplatz Seebach"
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

            <div>
              <label htmlFor="minPlayers" className="form-label">
                Min Players per Team
              </label>
              <input
                type="number"
                id="minPlayers"
                value={minPlayersPerTeam}
                onChange={(e) => setMinPlayersPerTeam(parseInt(e.target.value) || 0)}
                required
                min={1}
                max={maxPlayersPerTeam}
                className="form-input"
              />
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
