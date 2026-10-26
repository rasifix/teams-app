import { useTranslation } from 'react-i18next';
import type { ExistingGuardianUserOption } from '../store/selectors/guardianAssignmentSelectors';
import { FieldLabel, Input, RequiredMark, Select, Stack } from './ui';

interface ExistingGuardianSectionProps {
  availableUsers: ExistingGuardianUserOption[];
  selectedMemberId: string;
  isEditMode: boolean;
  firstName: string;
  lastName: string;
  email: string;
  onSelect: (memberId: string) => void;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

export default function ExistingGuardianSection({ availableUsers, selectedMemberId, isEditMode, firstName, lastName, email, onSelect, onFirstNameChange, onLastNameChange, onEmailChange }: ExistingGuardianSectionProps) {
  const { t } = useTranslation();

  return <div>
    <FieldLabel htmlFor="guardian-existing">{t('page.guardians.existingUser')}{!isEditMode && <RequiredMark />}</FieldLabel>
    <Select id="guardian-existing" value={selectedMemberId} onChange={(event) => onSelect(event.target.value)} disabled={isEditMode}>
      <option value="">{t('page.guardians.selectUser')}</option>
      {availableUsers.map((user) => <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>)}
    </Select>
    {availableUsers.length === 0 && <p className="field-help">{t('page.guardians.noAvailableUsers')}</p>}
    {isEditMode && <p className="field-help">{t('page.guardians.selectionLocked')}</p>}
    {isEditMode && <Stack gap="sm">
      <div>
        <FieldLabel htmlFor="guardian-existing-first-name">{t('auth.firstName')}<RequiredMark /></FieldLabel>
        <Input id="guardian-existing-first-name" type="text" value={firstName} onChange={(event) => onFirstNameChange(event.target.value)} placeholder={t('auth.firstName')} required />
      </div>
      <div>
        <FieldLabel htmlFor="guardian-existing-last-name">{t('auth.lastName')}<RequiredMark /></FieldLabel>
        <Input id="guardian-existing-last-name" type="text" value={lastName} onChange={(event) => onLastNameChange(event.target.value)} placeholder={t('auth.lastName')} required />
      </div>
      <div>
        <FieldLabel htmlFor="guardian-existing-email">{t('auth.emailAddress')}<RequiredMark /></FieldLabel>
        <Input id="guardian-existing-email" type="email" value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder={t('auth.emailAddress')} required />
      </div>
    </Stack>}
  </div>;
}
