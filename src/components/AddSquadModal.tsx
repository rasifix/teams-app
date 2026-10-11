import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateSquadRequest } from '../types';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from './ui';
import Button from './ui/Button';
import { useSfvCatalog } from '../store';
import { selectSfvCategoryOptions } from '../store/selectors/sfvCatalogSelectors';

interface AddSquadModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (squad: CreateSquadRequest) => Promise<void>;
}

export default function AddSquadModal({
  isOpen,
  isSubmitting = false,
  error,
  onClose,
  onSave,
}: AddSquadModalProps) {
  const { t } = useTranslation();
  const sfvCatalog = useSfvCatalog();
  const categoryOptions = useMemo(() => selectSfvCategoryOptions(sfvCatalog), [sfvCatalog]);
  const [formData, setFormData] = useState<CreateSquadRequest>({
    name: '',
    description: '',
    club: '',
    category: null,
  });
  const selectedOption = useMemo(
    () => categoryOptions.find((option) => option.code === formData.category) ?? null,
    [categoryOptions, formData.category]
  );
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        club: '',
        category: null,
      });
      setNameError(null);
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'name' && value.trim()) {
      setNameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setNameError(t('squadModal.errors.nameRequired'));
      return;
    }

    const payload: CreateSquadRequest = {
      name: trimmedName,
      description: formData.description?.trim() || undefined,
      club: formData.club?.trim() || undefined,
      category: formData.category || null,
    };

    await onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{t('squadModal.title')}</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">
                {t('squadModal.fields.squadName')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder={t('squadModal.placeholders.squadName')}
              />
              {nameError && (
                <p className="mt-1 text-sm text-red-600">{nameError}</p>
              )}
            </div>

            <div>
              <label htmlFor="club" className="form-label">
                {t('squadModal.fields.clubOptional')}
              </label>
              <input
                type="text"
                id="club"
                name="club"
                value={formData.club ?? ''}
                onChange={handleChange}
                className="form-input"
                placeholder={t('squadModal.placeholders.club')}
              />
            </div>

            <div>
              <label htmlFor="category" className="form-label">
                {t('squadModal.fields.categoryOptional')}
              </label>
              <select
                id="category"
                name="category"
                value={formData.category ?? ''}
                onChange={(event) => setFormData((previous) => ({
                  ...previous,
                  category: (event.target.value || null) as CreateSquadRequest['category'],
                }))}
                className="form-input"
              >
                <option value="">{t('squadModal.fields.noCategory')}</option>
                {categoryOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.code}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">{t('squadModal.categoryHint')}</p>
              {selectedOption?.matchFormat && (
                <p className="mt-1 text-xs text-orange-700">
                  {t('squadModal.officialFormatHint', {
                    format: selectedOption.matchFormat.name,
                    min: selectedOption.matchFormat.minPlayersPerTeam ?? '-',
                    max: selectedOption.matchFormat.maxPlayersPerTeam ?? '-',
                  })}
                </p>
              )}
              {selectedOption?.activityType === 'tournament' && !selectedOption.matchFormat && (
                <p className="mt-1 text-xs text-gray-600">{t('squadModal.tournamentOnlyHint')}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="form-label">
                {t('squadModal.fields.descriptionOptional')}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description ?? ''}
                onChange={handleChange}
                className="form-input min-h-24"
                placeholder={t('squadModal.placeholders.description')}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('squadModal.creating') : t('squadModal.createAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
