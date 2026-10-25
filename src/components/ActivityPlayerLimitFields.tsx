import { Field, Input } from './ui';

interface Props {
  minLabel: string;
  maxLabel: string;
  minPlayers: number;
  maxPlayers: number;
  minimumAllowed: number;
  minId: string;
  maxId: string;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

export default function ActivityPlayerLimitFields({ minLabel, maxLabel, minPlayers, maxPlayers, minimumAllowed, minId, maxId, onMinChange, onMaxChange }: Props) {
  return <>
    <Field label={maxLabel} htmlFor={maxId}>
      <Input id={maxId} type="number" min={minimumAllowed} value={maxPlayers} onChange={(event) => onMaxChange(Number(event.target.value) || 1)} required />
    </Field>
    <Field label={minLabel} htmlFor={minId}>
      <Input id={minId} type="number" min={1} max={maxPlayers} value={minPlayers} onChange={(event) => onMinChange(Number(event.target.value) || 1)} required />
    </Field>
  </>;
}
