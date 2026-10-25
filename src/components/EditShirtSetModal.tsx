import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ShirtSet } from '../types';
import { Button, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import ShirtSetDetailsFields from './ShirtSetDetailsFields';

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
          <ShirtSetDetailsFields sponsor={formData.sponsor} color={formData.color} onChange={handleInputChange} colorHint={t('page.shirtSetModal.colorHint')} />
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
