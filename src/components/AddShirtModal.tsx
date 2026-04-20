import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Shirt } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';

interface AddShirtModalProps {
  onClose: () => void;
  onSubmit: (shirtData: Shirt) => void;
  existingNumbers: number[];
}

export default function AddShirtModal({ onClose, onSubmit, existingNumbers }: AddShirtModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    number: '',
    size: 'M' as '128' | '140' | '152' | '164' | 'XS' | 'S' | 'M' | 'L' | 'XL',
    isGoalkeeper: false,
    status: 'available' as 'available' | 'unavailable'
  });

  const [errors, setErrors] = useState<{number?: string}>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: {number?: string} = {};
    const numberValue = parseInt(formData.number);
    
    if (!formData.number || isNaN(numberValue) || numberValue < 1 || numberValue > 99) {
      newErrors.number = t('shirtModal.errors.invalidNumber');
    } else if (existingNumbers.includes(numberValue)) {
      newErrors.number = t('shirtModal.errors.numberExists', { number: numberValue });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      number: numberValue,
      size: formData.size,
      isGoalkeeper: formData.isGoalkeeper,
      status: formData.status
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
          <ModalTitle>{t('shirtModal.addTitle')}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                {t('shirtModal.fields.numberRequired')}
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
                placeholder={t('shirtModal.placeholders.number')}
                className={`input-field w-full ${errors.number ? 'border-red-500' : ''}`}
              />
              {errors.number && (
                <p className="text-red-500 text-sm mt-1">{errors.number}</p>
              )}
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                {t('shirtModal.fields.sizeRequired')}
              </label>
              <select
                id="size"
                name="size"
                required
                value={formData.size}
                onChange={handleInputChange}
                className="input-field w-full"
              >
                <option value="128">128 - {t('shirtModal.size.kids')}</option>
                <option value="140">140 - {t('shirtModal.size.kids')}</option>
                <option value="152">152 - {t('shirtModal.size.kids')}</option>
                <option value="164">164 - {t('shirtModal.size.kids')}</option>
                <option value="XS">XS - {t('shirtModal.size.extraSmall')}</option>
                <option value="S">S - {t('shirtModal.size.small')}</option>
                <option value="M">M - {t('shirtModal.size.medium')}</option>
                <option value="L">L - {t('shirtModal.size.large')}</option>
                <option value="XL">XL - {t('shirtModal.size.extraLarge')}</option>
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
                {t('shirtModal.fields.isGoalkeeper')}
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isUnavailable"
                name="status"
                type="checkbox"
                checked={formData.status === 'unavailable'}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    status: e.target.checked ? 'unavailable' : 'available'
                  }));
                }}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="isUnavailable" className="ml-2 text-sm font-medium text-gray-700">
                {t('shirtModal.fields.isUnavailable')}
              </label>
            </div>

            {existingNumbers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-700">
                  <strong>{t('shirtModal.existingNumbers')}</strong> {existingNumbers.sort((a, b) => a - b).join(', ')}
                </p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.actions.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={!isFormValid()}
            >
              {t('shirtModal.addAction')}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}