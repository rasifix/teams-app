import type { Shirt } from '../../types';

export function selectSortedShirts(shirts: readonly Shirt[] | null | undefined): Shirt[] {
  return [...(shirts ?? [])].sort((left, right) => left.number - right.number);
}
