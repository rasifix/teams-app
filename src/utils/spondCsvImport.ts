import type { ParsedGuardianImportCandidate, ParsedPlayerImportCandidate } from '../store/selectors/memberImportSelectors';

export interface ParsedSpondCsvResult {
  candidates: ParsedPlayerImportCandidate[];
  parseErrors: string[];
}

interface ParsedName {
  firstName: string;
  lastName: string;
}

const CHILD_NAME_HEADER = 'Name des Kindes';
const BIRTHDATE_HEADER = 'Geburtsdatum';

function parseSemicolonLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const isEscapedQuote = inQuotes && line[index + 1] === '"';
      if (isEscapedQuote) {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ';' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseName(fullName: string): ParsedName {
  const cleaned = fullName.trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return { firstName: '', lastName: '' };
  }

  const parts = cleaned.split(' ');
  if (parts.length === 1) {
    return { firstName: cleaned, lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function normalizeDate(rawDate: string): string | undefined {
  if (!rawDate) {
    return undefined;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return rawDate;
  }

  const match = rawDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return undefined;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function extractGuardianCandidates(values: string[], headers: string[]): { guardians: ParsedGuardianImportCandidate[]; issues: string[] } {
  const issues: string[] = [];
  const guardians: ParsedGuardianImportCandidate[] = [];

  const guardianSlots = [1, 2, 3, 4, 5];

  guardianSlots.forEach((slot) => {
    const nameHeader = `Name des ${slot} Elternteils`;
    const emailHeader = `E-Mail des ${slot} Elternteils`;
    const phoneHeader = `Mobilnummer des ${slot} Elternteils`;

    const nameIndex = headers.indexOf(nameHeader);
    const emailIndex = headers.indexOf(emailHeader);
    const phoneIndex = headers.indexOf(phoneHeader);

    if (nameIndex < 0 && emailIndex < 0 && phoneIndex < 0) {
      return;
    }

    const nameValue = nameIndex >= 0 ? values[nameIndex] ?? '' : '';
    const emailValue = emailIndex >= 0 ? values[emailIndex] ?? '' : '';
    const phoneValue = phoneIndex >= 0 ? values[phoneIndex] ?? '' : '';

    if (!nameValue && !emailValue && !phoneValue) {
      return;
    }

    const parsedName = parseName(nameValue);
    if (!parsedName.firstName || !parsedName.lastName) {
      issues.push('guardian-name-incomplete');
      return;
    }

    guardians.push({
      firstName: parsedName.firstName,
      lastName: parsedName.lastName,
      email: emailValue || undefined,
      phone: phoneValue || undefined,
    });
  });

  return { guardians, issues };
}

export function parseSpondMembersCsv(content: string): ParsedSpondCsvResult {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      candidates: [],
      parseErrors: ['empty-file'],
    };
  }

  const headerLine = lines[0];
  const headers = parseSemicolonLine(headerLine);

  const childNameIndex = headers.indexOf(CHILD_NAME_HEADER);
  if (childNameIndex < 0) {
    return {
      candidates: [],
      parseErrors: ['missing-required-header-child-name'],
    };
  }

  const birthDateIndex = headers.indexOf(BIRTHDATE_HEADER);
  const candidates: ParsedPlayerImportCandidate[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex];
    const values = parseSemicolonLine(rawLine);

    const hasContent = values.some((value) => value.trim().length > 0);
    if (!hasContent) {
      continue;
    }

    const sourceRow = lineIndex + 1;
    const childName = values[childNameIndex] ?? '';
    const parsedPlayerName = parseName(childName);
    const birthDateRaw = birthDateIndex >= 0 ? values[birthDateIndex] ?? '' : '';
    const birthDate = normalizeDate(birthDateRaw);

    const { guardians, issues: guardianIssues } = extractGuardianCandidates(values, headers);

    const issues = [...guardianIssues];
    if (!parsedPlayerName.firstName || !parsedPlayerName.lastName) {
      issues.push('player-name-incomplete');
    }

    if (birthDateRaw && !birthDate) {
      issues.push('invalid-birth-date');
    }

    candidates.push({
      id: `row-${sourceRow}`,
      sourceRow,
      firstName: parsedPlayerName.firstName,
      lastName: parsedPlayerName.lastName,
      birthDate,
      guardians,
      issues,
    });
  }

  return {
    candidates,
    parseErrors: [],
  };
}
