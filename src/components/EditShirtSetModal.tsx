import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ShirtSet } from '../types';
import { Button, Cluster, ColorInput, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Stack } from './ui';

interface EditShirtSetModalProps {
  shirtSet: ShirtSet;
  onClose: () => void;
  onSubmit: (updates: Partial<Omit<ShirtSet, 'id'>>) => void;
}

export default function EditShirtSetModal({ shirtSet, onClose, onSubmit }: EditShirtSetModalProps) {
  const { t } = useTranslation();
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
          <ModalTitle>{t('page.shirtSetModal.editTitle')}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <Stack>
            <Field label={t('page.shirtSetModal.fields.sponsorRequired')} htmlFor="sponsor">
              <Input
                id="sponsor"
                name="sponsor"
                type="text"
                required
                value={formData.sponsor}
                onChange={handleInputChange}
                placeholder={t('domain.shirtSet.placeholders.sponsor')}
              />
            </Field>

            <Field label={t('page.shirtSetModal.fields.colorRequired')} htmlFor="color" hint={t('page.shirtSetModal.colorHint')}>
              <Cluster gap="sm" wrap={false}>
                <ColorInput
                  id="color"
                  name="color"
                  required
                  value={formData.color}
                  onChange={handleInputChange}
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={handleInputChange}
                  name="color"
                  placeholder={t('domain.shirtSet.placeholders.color')}
                />
              </Cluster>
            </Field>
          </Stack>
        </ModalBody>

        <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('page.shirtModal.saveChanges')}
            </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
