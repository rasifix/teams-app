import { useState, useEffect } from 'react';
import type { ShirtSet } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface EditShirtSetModalProps {
  shirtSet: ShirtSet;
  onClose: () => void;
  onSubmit: (updates: Partial<Omit<ShirtSet, 'id'>>) => void;
}

export default function EditShirtSetModal({ shirtSet, onClose, onSubmit }: EditShirtSetModalProps) {
  const [formData, setFormData] = useState({
    sponsor: '',
    color: '#000000'
  });

  useEffect(() => {
    setFormData({
      sponsor: shirtSet.sponsor,
      color: shirtSet.color
    });
  }, [shirtSet]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sponsor.trim() && formData.color.trim()) {
      onSubmit({
        sponsor: formData.sponsor.trim(),
        color: formData.color
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Edit Shirt Set</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="sponsor" className="block text-sm font-medium text-gray-700 mb-1">
                Sponsor Name *
              </label>
              <input
                id="sponsor"
                name="sponsor"
                type="text"
                required
                value={formData.sponsor}
                onChange={handleInputChange}
                placeholder="Enter sponsor name"
                className="input-field w-full"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Color *
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="color"
                  name="color"
                  type="color"
                  required
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={handleInputChange}
                  name="color"
                  placeholder="#000000"
                  className="input-field flex-1"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Choose a color or enter a hex code
              </p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
