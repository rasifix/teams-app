import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Shirt } from '../types';
import { Alert, Button, Checkbox, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Select } from './ui';

interface EditShirtModalProps {
  isOpen: boolean;
  shirt: Shirt;
  onClose: () => void;
  onSave: (updatedShirt: Shirt) => void;
  existingNumbers: number[];
}

export default function EditShirtModal({ isOpen, shirt, onClose, onSave, existingNumbers }: EditShirtModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    number: shirt.number.toString(),
    size: shirt.size as '128' | '140' | '152' | '164' | 'XS' | 'S' | 'M' | 'L' | 'XL',
    isGoalkeeper: shirt.isGoalkeeper,
    status: shirt.status ?? 'available' as 'available' | 'unavailable'
  });

  const [errors, setErrors] = useState<{number?: string}>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: {number?: string} = {};
    const numberValue = parseInt(formData.number);
    
    if (!formData.number || isNaN(numberValue) || numberValue < 1 || numberValue > 99) {
      newErrors.number = t('shirtModal.errors.invalidNumber');
    } else if (numberValue !== shirt.number && existingNumbers.includes(numberValue)) {
      newErrors.number = t('shirtModal.errors.numberExists', { number: numberValue });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
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
      (numberValue === shirt.number || !existingNumbers.includes(numberValue)) &&
      formData.size.trim() !== ''
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('shirtModal.editTitle')}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <div className="layout-stack">
            <Field label={t('shirtModal.fields.numberRequired')} htmlFor="number" error={errors.number}>
              <Input
                id="number"
                name="number"
                type="number"
                min="1"
                max="99"
                required
                value={formData.number}
                onChange={handleInputChange}
                placeholder={t('shirtModal.placeholders.number')}
                aria-invalid={Boolean(errors.number)}
              />
            </Field>

            <Field label={t('shirtModal.fields.sizeRequired')} htmlFor="size">
              <Select
                id="size"
                name="size"
                required
                value={formData.size}
                onChange={handleInputChange}
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
              </Select>
            </Field>

            <div className="flex items-center">
              <Checkbox
                id="isGoalkeeper"
                name="isGoalkeeper"
                checked={formData.isGoalkeeper}
                onChange={handleInputChange}
              />
              <label htmlFor="isGoalkeeper" className="ml-2 text-sm font-medium text-content">
                {t('shirtModal.fields.isGoalkeeper')}
              </label>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="isUnavailable"
                name="status"
                checked={formData.status === 'unavailable'}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    status: e.target.checked ? 'unavailable' : 'available'
                  }));
                }}
              />
              <label htmlFor="isUnavailable" className="ml-2 text-sm font-medium text-content">
                {t('shirtModal.fields.isUnavailable')}
              </label>
            </div>

            {existingNumbers.length > 1 && (
              <Alert tone="info">
                <p>
                  <strong>{t('shirtModal.otherNumbers')}</strong> {existingNumbers.filter(num => num !== shirt.number).sort((a, b) => a - b).join(', ')}
                </p>
              </Alert>
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
              {t('shirtModal.saveChanges')}
            </Button>
          </div>
        </ModalFooter>
      </form>
    </Modal>
  );
}
