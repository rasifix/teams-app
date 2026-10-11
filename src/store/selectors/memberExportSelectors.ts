import type { Player } from '../../types';

const SPOND_MEMBER_EXPORT_HEADERS = [
  'vorname',
  'nachname',
  'birth date',
  'street',
  'plz',
  'city',
  'vorname guardian 1',
  'nachname guardian 1',
  'email guardian 1',
  'phone guardian 1',
  'vorname guardian 2',
  'nachname guardian 2',
  'e-mail guardian 2',
  'phone guardian 2',
];

const escapeCsvCell = (value: string | undefined): string => {
  const cell = value ?? '';
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
};

const formatBirthDate = (birthDate: string): string => {
  const match = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : birthDate;
};

export function selectSpondMemberExportCsv(players: Player[]): string {
  const rows = players.map((player) => {
    const [guardianOne, guardianTwo] = player.guardians ?? [];
    return [
      player.firstName,
      player.lastName,
      formatBirthDate(player.birthDate),
      '',
      '',
      '',
      guardianOne?.firstName,
      guardianOne?.lastName,
      guardianOne?.email,
      guardianOne?.phone,
      guardianTwo?.firstName,
      guardianTwo?.lastName,
      guardianTwo?.email,
      guardianTwo?.phone,
    ].map(escapeCsvCell).join(',');
  });

  return `\uFEFF${[SPOND_MEMBER_EXPORT_HEADERS.join(','), ...rows].join('\r\n')}\r\n`;
}
