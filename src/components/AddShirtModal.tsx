import { useState } from 'react';
import type { Shirt } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface AddShirtModalProps {
  onClose: () => void;
  onSubmit: (shirtData: Shirt) => void;
  existingNumbers: number[];
}

export default function AddShirtModal({ onClose, onSubmit, existingNumbers }: AddShirtModalProps) {
  const [formData, setFormData] = useState({
    number: '',
    size: 'M' as '128' | '140' | '152' | '164' | 'XS' | 'S' | 'M' | 'L' | 'XL',
    isGoalkeeper: false
  });

  const [errors, setErrors] = useState<{number?: string}>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: {number?: string} = {};
    const numberValue = parseInt(formData.number);
    
    if (!formData.number || isNaN(numberValue) || numberValue < 1 || numberValue > 99) {
      newErrors.number = 'Please enter a valid number between 1 and 99';
    } else if (existingNumbers.includes(numberValue)) {
      newErrors.number = `Shirt #${numberValue} already exists in this set`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      number: numberValue,
      size: formData.size,
      isGoalkeeper: formData.isGoalkeeper
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear errors when user starts typing
    if (name === 'number' && errors.number) {
      setErrors(prev => ({ ...prev, number: undefined }));
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const numberValue = parseInt(formData.number);
    return (
      formData.number.trim() !== '' &&
      !isNaN(numberValue) &&
      numberValue >= 1 &&
      numberValue <= 99 &&
      !existingNumbers.includes(numberValue) &&
      formData.size.trim() !== ''
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Add New Shirt</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                Shirt Number *
              </label>
              <input
                id="number"
                name="number"
                type="number"
                min="1"
                max="99"
                required
                value={formData.number}
                onChange={handleInputChange}
                placeholder="Enter shirt number (1-99)"
                className={`input-field w-full ${errors.number ? 'border-red-500' : ''}`}
              />
              {errors.number && (
                <p className="text-red-500 text-sm mt-1">{errors.number}</p>
              )}
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                Size *
              </label>
              <select
                id="size"
                name="size"
                required
                value={formData.size}
                onChange={handleInputChange}
                className="input-field w-full"
              >
                <option value="128">128 - Kids</option>
                <option value="140">140 - Kids</option>
                <option value="152">152 - Kids</option>
                <option value="164">164 - Kids</option>
                <option value="XS">XS - Extra Small</option>
                <option value="S">S - Small</option>
                <option value="M">M - Medium</option>
                <option value="L">L - Large</option>
                <option value="XL">XL - Extra Large</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="isGoalkeeper"
                name="isGoalkeeper"
                type="checkbox"
                checked={formData.isGoalkeeper}
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="isGoalkeeper" className="ml-2 text-sm font-medium text-gray-700">
                This is a goalkeeper shirt
              </label>
            </div>

            {existingNumbers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-700">
                  <strong>Existing numbers in this set:</strong> {existingNumbers.sort((a, b) => a - b).join(', ')}
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={!isFormValid()}
            >
              Add Shirt
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}