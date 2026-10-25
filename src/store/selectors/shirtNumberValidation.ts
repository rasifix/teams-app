export type ShirtNumberError = 'invalid' | 'exists' | null;

export function validateShirtNumber(value: string, existingNumbers: number[], currentNumber?: number): ShirtNumberError {
  const number = Number.parseInt(value, 10);
  if (!value || Number.isNaN(number) || number < 1 || number > 99) return 'invalid';
  if (number !== currentNumber && existingNumbers.includes(number)) return 'exists';
  return null;
}
