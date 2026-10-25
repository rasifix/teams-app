import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ShirtSet, Shirt } from '../types';
import { Button, Checkbox, ChoiceGroup, Cluster, ContentGrid, Field, Input, Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Select, Split, Stack } from './ui';
import { selectGeneratedShirts } from '../store/selectors/shirtSetSelectors';
import ShirtSetDetailsFields from './ShirtSetDetailsFields';

interface AddShirtSetModalProps {
  onClose: () => void;
  onSubmit: (shirtSetData: Omit<ShirtSet, 'id'>) => void;
}

export default function AddShirtSetModal({ onClose, onSubmit }: AddShirtSetModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    sponsor: '',
    color: '#000000', // Default color
  });

  const [shirtOptions, setShirtOptions] = useState({
    createShirts: false,
    startNumber: 1,
    endNumber: 11,
    size: 'M' as '128' | '140' | '152' | '164' | 'XS' | 'S' | 'M' | 'L' | 'XL',
    includeGoalkeeper: false,
    goalkeeperNumber: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sponsor.trim() && formData.color.trim()) {
      onSubmit({
        sponsor: formData.sponsor.trim(),
        color: formData.color,
        shirts: generatedShirts,
      });
    }
  };

  const generatedShirts: Shirt[] = selectGeneratedShirts(shirtOptions);
  const regularShirtCount = generatedShirts.filter((shirt) => !shirt.isGoalkeeper).length;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleShirtOptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setShirtOptions(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) || 0 : value)
    }));
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{t('page.shirtSetModal.addTitle')}</ModalTitle>
        </ModalHeader>

        <ModalBody>
          <Stack gap="sm">
            <ShirtSetDetailsFields sponsor={formData.sponsor} color={formData.color} onChange={handleInputChange} />

            {/* Shirt creation options */}
            <div className="shirt-generation-options">
              <ChoiceGroup>
                <Checkbox
                  id="createShirts"
                  name="createShirts"
                  checked={shirtOptions.createShirts}
                  onChange={handleShirtOptionChange}
                />
                <label htmlFor="createShirts" className="checkbox-label">
                  {t('domain.shirtSet.fields.createAutomatically')}
                </label>
              </ChoiceGroup>

              {shirtOptions.createShirts && (
                <Stack className="shirt-generation-fields">
                  <ContentGrid variant="threeColumn">
                    <Field label={t('domain.shirtSet.fields.startNumber')} htmlFor="startNumber">
                      <Input
                        id="startNumber"
                        name="startNumber"
                        type="number"
                        min="1"
                        max="99"
                        value={shirtOptions.startNumber}
                        onChange={handleShirtOptionChange}
                      />
                    </Field>
                    <Field label={t('domain.shirtSet.fields.endNumber')} htmlFor="endNumber">
                      <Input
                        id="endNumber"
                        name="endNumber"
                        type="number"
                        min="1"
                        max="99"
                        value={shirtOptions.endNumber}
                        onChange={handleShirtOptionChange}
                      />
                    </Field>
                    <Field label={t('domain.shirtSet.fields.size')} htmlFor="size">
                      <Select
                        id="size"
                        name="size"
                        value={shirtOptions.size}
                        onChange={handleShirtOptionChange}
                      >
                        <option value="128">128</option>
                        <option value="140">140</option>
                        <option value="152">152</option>
                        <option value="164">164</option>
                        <option value="XS">XS</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                      </Select>
                    </Field>
                  </ContentGrid>

                  <Split gap="sm">
                    <ChoiceGroup>
                      <Checkbox
                        id="includeGoalkeeper"
                        name="includeGoalkeeper"
                        checked={shirtOptions.includeGoalkeeper}
                        onChange={handleShirtOptionChange}
                      />
                      <label htmlFor="includeGoalkeeper" className="checkbox-label">
                        {t('domain.shirtSet.fields.includeGoalkeeper')}
                      </label>
                    </ChoiceGroup>
                    
                    {shirtOptions.includeGoalkeeper && (
                      <Cluster gap="sm" wrap={false}>
                        <label htmlFor="goalkeeperNumber" className="shirt-goalkeeper-label">
                          {t('domain.shirtSet.fields.goalkeeperNumber')}
                        </label>
                        <Input
                          id="goalkeeperNumber"
                          name="goalkeeperNumber"
                          type="number"
                          min="1"
                          max="99"
                          value={shirtOptions.goalkeeperNumber}
                          onChange={handleShirtOptionChange}
                          className="shirt-goalkeeper-number"
                        />
                      </Cluster>
                    )}
                  </Split>

                  <div className="shirt-generation-preview">
                    {t('page.shirtSetModal.preview.prefix')} {regularShirtCount} {t('page.shirtSetModal.preview.regularShirts')}{shirtOptions.includeGoalkeeper ? ` ${t('page.shirtSetModal.preview.plusGoalkeeper')}` : ''} ({t('page.shirtSetModal.preview.size', { size: shirtOptions.size })})
                  </div>
                </Stack>
              )}
            </div>
          </Stack>
        </ModalBody>

        <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('page.shirtSetModal.createAction')}
            </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
