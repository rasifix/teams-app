import { Field, Input } from './ui';

interface Props {
  idPrefix: string;
  nameLabel: string;
  dateLabel: string;
  startTimeLabel: string;
  endDateLabel: string;
  endTimeLabel: string;
  locationLabel: string;
  name: string;
  date: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  disabled?: boolean;
  autoFocusName?: boolean;
  showName?: boolean;
  showSchedule?: boolean;
  onNameChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

export default function ActivityCoreFields({ idPrefix, nameLabel, dateLabel, startTimeLabel, endDateLabel, endTimeLabel, locationLabel, name, date, startTime, endDate, endTime, location, disabled = false, autoFocusName = false, showName = true, showSchedule = true, onNameChange, onDateChange, onStartTimeChange, onEndDateChange, onEndTimeChange, onLocationChange }: Props) {
  return <>
    {showName && <Field label={nameLabel} htmlFor={`${idPrefix}-name`}>
      <Input id={`${idPrefix}-name`} value={name} onChange={(event) => onNameChange(event.target.value)} required disabled={disabled} autoFocus={autoFocusName} />
    </Field>}
    {showSchedule && <>
      <Field label={dateLabel} htmlFor={`${idPrefix}-date`}>
        <Input id={`${idPrefix}-date`} type="date" value={date} onChange={(event) => onDateChange(event.target.value)} required disabled={disabled} />
      </Field>
      <Field label={startTimeLabel} htmlFor={`${idPrefix}-time`}>
        <Input id={`${idPrefix}-time`} type="time" value={startTime} onChange={(event) => onStartTimeChange(event.target.value)} required disabled={disabled} />
      </Field>
      <Field label={endDateLabel} htmlFor={`${idPrefix}-end-date`}>
        <Input id={`${idPrefix}-end-date`} type="date" value={endDate} onChange={(event) => onEndDateChange(event.target.value)} disabled={disabled} />
      </Field>
      <Field label={endTimeLabel} htmlFor={`${idPrefix}-end-time`}>
        <Input id={`${idPrefix}-end-time`} type="time" value={endTime} onChange={(event) => onEndTimeChange(event.target.value)} disabled={disabled} />
      </Field>
      <Field label={locationLabel} htmlFor={`${idPrefix}-location`}>
        <Input id={`${idPrefix}-location`} value={location} onChange={(event) => onLocationChange(event.target.value)} disabled={disabled} />
      </Field>
    </>}
  </>;
}
