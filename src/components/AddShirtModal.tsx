import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Shirt } from '../types';
import { Button, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import { validateShirtNumber } from '../store/selectors/shirtNumberValidation';
import ShirtDetailsFields from './ShirtDetailsFields';

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
    const numberValue = parseInt(formData.number, 10);
    const numberError = validateShirtNumber(formData.number, existingNumbers);
    if (numberError === 'invalid') {
      newErrors.number = t('page.shirtModal.errors.invalidNumber');
    } else if (numberError === 'exists') {
      newErrors.number = t('page.shirtModal.errors.numberExists', { number: numberValue });
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
    return validateShirtNumber(formData.number, existingNumbers) === null && formData.size.trim() !== '';
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('page.shirtModal.addTitle')}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <ShirtDetailsFields
            number={formData.number} size={formData.size} isGoalkeeper={formData.isGoalkeeper} status={formData.status}
            numberError={errors.number} existingNumbers={existingNumbers} existingNumbersLabel="page.shirtModal.existingNumbers"
            onInputChange={handleInputChange}
            onUnavailableChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.checked ? 'unavailable' : 'available' }))}
          />
        </ModalBody>

        <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.actions.cancel')}
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={!isFormValid()}
            >
              {t('page.shirtModal.addAction')}
            </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
