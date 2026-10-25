import { useTranslation } from 'react-i18next';
import { Cluster, ColorInput, Field, Input, Stack } from './ui';

interface Props {
  sponsor: string;
  color: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  colorHint?: string;
}

export default function ShirtSetDetailsFields({ sponsor, color, onChange, colorHint }: Props) {
  const { t } = useTranslation();
  return <Stack>
    <Field label={t('page.shirtSetModal.fields.sponsorRequired')} htmlFor="sponsor">
      <Input id="sponsor" name="sponsor" type="text" required value={sponsor} onChange={onChange} placeholder={t('domain.shirtSet.placeholders.sponsor')} />
    </Field>
    <Field label={t('page.shirtSetModal.fields.colorRequired')} htmlFor="color" hint={colorHint}>
      <Cluster gap="sm" wrap={false}>
        <ColorInput id="color" name="color" required value={color} onChange={onChange} />
        <Input type="text" value={color} onChange={onChange} name="color" placeholder={t('domain.shirtSet.placeholders.color')} />
      </Cluster>
    </Field>
  </Stack>;
}
