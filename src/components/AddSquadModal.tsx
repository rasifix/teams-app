import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateSquadRequest } from '../types';
import { Alert, Button, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, RequiredFieldsNote, Select, Stack, Textarea } from './ui';
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
      setNameError(t('page.squadModal.errors.nameRequired'));
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
        <ModalTitle>{t('page.squadModal.title')}</ModalTitle>
      </ModalHeader>

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <Stack>
            <RequiredFieldsNote />
            <Field label={t('domain.squad.fields.name')} htmlFor="name" error={nameError} required>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t('domain.squad.placeholders.name')}
              />
            </Field>

            <Field label={t('domain.squad.fields.club')} htmlFor="club">
              <Input
                type="text"
                id="club"
                name="club"
                value={formData.club ?? ''}
                onChange={handleChange}
                placeholder={t('domain.squad.placeholders.club')}
              />
            </Field>

            <Field label={t('domain.squad.fields.category')} htmlFor="category">
              <Select
                id="category"
                name="category"
                value={formData.category ?? ''}
                onChange={(event) => setFormData((previous) => ({
                  ...previous,
                  category: (event.target.value || null) as CreateSquadRequest['category'],
                }))}
              >
                <option value="">{t('domain.squad.fields.noCategory')}</option>
                {categoryOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.code}</option>
                ))}
              </Select>
              <p className="field-help">{t('page.squadModal.categoryHint')}</p>
              {selectedOption?.matchFormat && (
                <p className="text-caption">
                  {t('page.squadModal.officialFormatHint', {
                    format: selectedOption.matchFormat.name,
                    min: selectedOption.matchFormat.minPlayersPerTeam ?? '-',
                    max: selectedOption.matchFormat.maxPlayersPerTeam ?? '-',
                  })}
                </p>
              )}
              {selectedOption?.activityType === 'tournament' && !selectedOption.matchFormat && (
                <p className="text-caption">{t('page.squadModal.tournamentOnlyHint')}</p>
              )}
            </Field>

            <Field label={t('domain.squad.fields.description')} htmlFor="description">
              <Textarea
                id="description"
                name="description"
                value={formData.description ?? ''}
                onChange={handleChange}
                className="ui-textarea--tall"
                placeholder={t('domain.squad.placeholders.description')}
              />
            </Field>

            {error && (
              <Alert>
                {error}
              </Alert>
            )}
          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            width="grow"
            disabled={isSubmitting}
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            width="grow"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('page.squadModal.creating') : t('page.squadModal.createAction')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
