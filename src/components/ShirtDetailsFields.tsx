import { useTranslation } from 'react-i18next';
import type { Shirt } from '../types';
import { Alert, Checkbox, ChoiceGroup, Field, Input, Select, Stack } from './ui';

type ShirtSize = Shirt['size'];
interface Props {
  number: string;
  size: ShirtSize;
  isGoalkeeper: boolean;
  status: Shirt['status'];
  numberError?: string;
  existingNumbers: number[];
  existingNumbersLabel: 'page.shirtModal.existingNumbers' | 'page.shirtModal.otherNumbers';
  onInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onUnavailableChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ShirtDetailsFields({ number, size, isGoalkeeper, status, numberError, existingNumbers, existingNumbersLabel, onInputChange, onUnavailableChange }: Props) {
  const { t } = useTranslation();
  return <Stack>
    <Field label={t('page.shirtModal.fields.numberRequired')} htmlFor="number" error={numberError}>
      <Input id="number" name="number" type="number" min="1" max="99" required value={number} onChange={onInputChange} placeholder={t('domain.shirt.placeholders.number')} aria-invalid={Boolean(numberError)} />
    </Field>
    <Field label={t('page.shirtModal.fields.sizeRequired')} htmlFor="size">
      <Select id="size" name="size" required value={size} onChange={onInputChange}>
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
      <Checkbox id="isGoalkeeper" name="isGoalkeeper" checked={isGoalkeeper} onChange={onInputChange} />
      <label htmlFor="isGoalkeeper" className="checkbox-label">{t('domain.shirt.fields.isGoalkeeper')}</label>
    </ChoiceGroup>
    <ChoiceGroup>
      <Checkbox id="isUnavailable" name="status" checked={status === 'unavailable'} onChange={onUnavailableChange} />
      <label htmlFor="isUnavailable" className="checkbox-label">{t('domain.shirt.fields.isUnavailable')}</label>
    </ChoiceGroup>
    {existingNumbers.length > 0 && <Alert tone="info"><p><strong>{t(existingNumbersLabel)}</strong> {existingNumbers.join(', ')}</p></Alert>}
  </Stack>;
}
