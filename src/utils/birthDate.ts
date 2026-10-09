export function getBirthYear(birthDate: string | undefined): number | undefined {
  if (!birthDate) {
    return undefined;
  }

  const year = new Date(birthDate).getFullYear();
  return Number.isNaN(year) ? undefined : year;
}
