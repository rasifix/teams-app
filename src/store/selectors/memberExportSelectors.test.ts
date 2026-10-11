import { describe, expect, it } from 'vitest';
import type { Player } from '../../types';
import { selectSpondMemberExportCsv } from './memberExportSelectors';

const player = (overrides: Partial<Player> = {}): Player => ({
  id: 'p1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  birthDate: '2014-01-02',
  level: 3,
  status: 'active',
  ...overrides,
});

describe('Spond member CSV export', () => {
  it('exports players and up to two guardians in the requested column order', () => {
    const csv = selectSpondMemberExportCsv([player({
      guardians: [
        { id: 'g1', firstName: 'Anne', lastName: 'Lovelace', email: 'anne@example.com', phone: '+41 79 111 22 33' },
        { id: 'g2', firstName: 'Charles', lastName: 'Babbage', email: 'charles@example.com', phone: '+41 79 444 55 66' },
        { id: 'g3', firstName: 'Ignored', lastName: 'Guardian' },
      ],
    })]);

    const [, row] = csv.slice(1).trim().split('\r\n');
    expect(row).toBe('Ada,Lovelace,02.01.2014,,,,Anne,Lovelace,anne@example.com,+41 79 111 22 33,Charles,Babbage,charles@example.com,+41 79 444 55 66');
  });

  it('leaves missing fields empty and still returns the header for an empty squad', () => {
    const emptyPlayerRow = selectSpondMemberExportCsv([player({ guardians: undefined })]).slice(1).trim().split('\r\n')[1];
    expect(emptyPlayerRow).toBe('Ada,Lovelace,02.01.2014,,,,,,,,,,,');

    const headerOnly = selectSpondMemberExportCsv([]).slice(1).trim();
    expect(headerOnly.split(',')).toHaveLength(14);
  });

  it('escapes commas, quotes, and line breaks without corrupting columns', () => {
    const csv = selectSpondMemberExportCsv([player({
      firstName: 'Ada, Marie',
      lastName: 'Lovelace "Countess"',
      guardians: [{ id: 'g1', firstName: 'Anne\nMarie', lastName: 'Lovelace' }],
    })]);

    expect(csv).toContain('"Ada, Marie"');
    expect(csv).toContain('"Lovelace ""Countess"""');
    expect(csv).toContain('"Anne\nMarie"');
  });

  it('keeps an empty or legacy birth date unchanged', () => {
    const csv = selectSpondMemberExportCsv([
      player({ id: 'empty', birthDate: '' }),
      player({ id: 'legacy', birthDate: '02.01.2014' }),
    ]).slice(1);

    expect(csv).toContain('Ada,Lovelace,,,,');
    expect(csv).toContain('Ada,Lovelace,02.01.2014,,,,');
  });
});
