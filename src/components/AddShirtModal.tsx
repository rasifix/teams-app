import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Shirt } from '../types';
import { Alert, Button, Checkbox, ChoiceGroup, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Select, Stack } from './ui';

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
      newErrors.number = t('page.shirtModal.errors.invalidNumber');
    } else if (existingNumbers.includes(numberValue)) {
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
          <ModalTitle>{t('page.shirtModal.addTitle')}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <Stack>
            <Field label={t('page.shirtModal.fields.numberRequired')} htmlFor="number" error={errors.number}>
              <Input
                id="number"
                name="number"
                type="number"
                min="1"
                max="99"
                required
                value={formData.number}
                onChange={handleInputChange}
                placeholder={t('domain.shirt.placeholders.number')}
                aria-invalid={Boolean(errors.number)}
              />
            </Field>

            <Field label={t('page.shirtModal.fields.sizeRequired')} htmlFor="size">
              <Select
                id="size"
                name="size"
                required
                value={formData.size}
                onChange={handleInputChange}
              >
                <option value="128">128 - {t('domain.shirt.sizes.kids')}</option>
                <option value="140">140 - {t('domain.shirt.sizes.kids')}</option>
                <option value="152">152 - {t('domain.shirt.sizes.kids')}</option>
                <option value="164">164 - {t('domain.shirt.sizes.kids')}</option>
                <option value="XS">XS - {t('domain.shirt.sizes.extraSmall')}</option>
                <option value="S">S - {t('domain.shirt.sizes.small')}</option>
                <option value="M">M - {t('domain.shirt.sizes.medium')}</option>
                <option value="L">L - {t('domain.shirt.sizes.large')}</option>
                <option value="XL">XL - {t('domain.shirt.sizes.extraLarge')}</option>
              </Select>
            </Field>

            <ChoiceGroup>
              <Checkbox
                id="isGoalkeeper"
                name="isGoalkeeper"
                checked={formData.isGoalkeeper}
                onChange={handleInputChange}
              />
              <label htmlFor="isGoalkeeper" className="checkbox-label">
                {t('domain.shirt.fields.isGoalkeeper')}
              </label>
            </ChoiceGroup>

            <ChoiceGroup>
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
              <label htmlFor="isUnavailable" className="checkbox-label">
                {t('domain.shirt.fields.isUnavailable')}
              </label>
            </ChoiceGroup>

            {existingNumbers.length > 0 && (
              <Alert tone="info">
                <p>
                  <strong>{t('page.shirtModal.existingNumbers')}</strong> {existingNumbers.join(', ')}
                </p>
              </Alert>
            )}
          </Stack>
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
