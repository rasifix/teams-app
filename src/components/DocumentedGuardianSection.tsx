import { useTranslation } from 'react-i18next';
import { FieldLabel, Input, RequiredMark } from './ui';

interface DocumentedGuardianSectionProps {
  firstName: string;
  lastName: string;
  email: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

export default function DocumentedGuardianSection({ firstName, lastName, email, onFirstNameChange, onLastNameChange, onEmailChange }: DocumentedGuardianSectionProps) {
  const { t } = useTranslation();

  return <>
    <div>
      <FieldLabel htmlFor="guardian-first-name">{t('auth.firstName')}<RequiredMark /></FieldLabel>
      <Input id="guardian-first-name" type="text" value={firstName} onChange={(event) => onFirstNameChange(event.target.value)} placeholder={t('domain.member.placeholders.firstName')} required />
    </div>
    <div>
      <FieldLabel htmlFor="guardian-last-name">{t('auth.lastName')}<RequiredMark /></FieldLabel>
      <Input id="guardian-last-name" type="text" value={lastName} onChange={(event) => onLastNameChange(event.target.value)} placeholder={t('domain.member.placeholders.lastName')} required />
    </div>
    <div>
      <FieldLabel htmlFor="guardian-documented-email">{t('domain.member.fields.email')}</FieldLabel>
      <Input id="guardian-documented-email" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder={t('domain.member.placeholders.email')} />
    </div>
    <p className="field-help">{t('page.guardians.documentedHint')}</p>
  </>;
}
