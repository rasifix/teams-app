import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';
import { useTrainers } from '../hooks/useTrainers';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, strength: number, trainerId?: string) => void;
  currentName: string;
  currentStrength: number;
  currentTrainerId?: string;
}

export default function EditTeamModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentName,
  currentStrength,
  currentTrainerId,
}: EditTeamModalProps) {
  const [teamName, setTeamName] = useState(currentName);
  const [strength, setStrength] = useState(currentStrength);
  const [trainerId, setTrainerId] = useState(currentTrainerId || '');

  const { trainers } = useTrainers();

  useEffect(() => {
    setTeamName(currentName);
    setStrength(currentStrength);
    setTrainerId(currentTrainerId || '');
  }, [currentName, currentStrength, currentTrainerId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teamName.trim()) {
      onSave(teamName.trim(), strength, trainerId || undefined);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>Edit Team</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="teamName" className="form-label">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="form-input"
                placeholder="Enter team name"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="strength" className="form-label">
                Strength
              </label>
              <select
                id="strength"
                value={strength}
                onChange={(e) => setStrength(parseInt(e.target.value))}
                className="form-input"
              >
                <option value={1}>1 - Highest 🔥🔥🔥</option>
                <option value={2}>2 - Medium 🔥🔥</option>
                <option value={3}>3 - Lowest 🔥</option>
              </select>
            </div>

            <div>
              <label htmlFor="trainer" className="form-label">
                Trainer
              </label>
              <select
                id="trainer"
                value={trainerId}
                onChange={(e) => setTrainerId(e.target.value)}
                className="form-input"
              >
                <option value="">No trainer assigned</option>
                {trainers.map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.firstName} {trainer.lastName}
                  </option>
                ))}
              </select>
            </div>
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
