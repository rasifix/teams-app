import type { HTMLAttributes, ReactNode } from 'react';
import type { Player } from '../types';
import Level from './Level';
import { EntityActions, EntityContent, EntityRow, EntityTitle } from './ui';

interface PlayerRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'content'> {
  player: Player | null;
  fallbackName: ReactNode;
  leading?: ReactNode;
  content?: ReactNode;
  trailing?: ReactNode;
  actions?: ReactNode;
  shirtNumber?: number | null;
  levelClassName?: string;
  density?: 'default' | 'compact';
}

export default function PlayerRow({ player, fallbackName, leading, content, trailing, actions, shirtNumber, levelClassName, density = 'default', ...rowProps }: PlayerRowProps) {
  return (
    <EntityRow density={density} {...rowProps}>
      {shirtNumber && shirtNumber > 0 && <strong className="text-number player-row-shirt-number">{shirtNumber}</strong>}
      {leading}
      <EntityContent>
        <EntityTitle>{player ? `${player.firstName} ${player.lastName}` : fallbackName}</EntityTitle>
        {content}
      </EntityContent>
      {player && <Level level={player.level} className={levelClassName} />}
      {trailing}
      {actions && <EntityActions>{actions}</EntityActions>}
    </EntityRow>
  );
}
