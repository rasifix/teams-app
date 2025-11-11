import { useState, useEffect } from 'react';
import type { Trainer } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface AddTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trainer: Omit<Trainer, 'id'>) => void;
  onUpdate?: (trainerId: string, trainer: Omit<Trainer, 'id'>) => void;
  editingTrainer?: Trainer | null;
}

export default function AddTrainerModal({ isOpen, onClose, onSave, onUpdate, editingTrainer }: AddTrainerModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: ''
  });

  const isEditMode = Boolean(editingTrainer);

  // Load trainer data when editing
  useEffect(() => {
    if (editingTrainer) {
      setFormData({
        firstName: editingTrainer.firstName,
        lastName: editingTrainer.lastName
      });
    } else {
      setFormData({
        firstName: '',
        lastName: ''
      });
    }
  }, [editingTrainer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.firstName.trim() && formData.lastName.trim()) {
      if (isEditMode && editingTrainer && onUpdate) {
        onUpdate(editingTrainer.id, formData);
      } else {
        onSave(formData);
      }
      
      // Reset form only if not editing
      if (!isEditMode) {
        setFormData({
          firstName: '',
          lastName: ''
        });
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>
          {isEditMode ? 'Edit Trainer' : 'Add New Trainer'}
        </ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="form-label">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter last name"
              />
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
            {isEditMode ? 'Update Trainer' : 'Add Trainer'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}