import type { InvitationStatus } from '../types';

export interface InvitationStatusMeta {
  label: string;
  tabLabel: string;
  badgeClassName: string;
  selectClassName: string;
  tabActiveClassName: string;
  icon: string;
  iconClassName: string;
  iconBackgroundClassName: string;
  emptyStateText: string;
}

export const invitationStatusMeta: Record<InvitationStatus, InvitationStatusMeta> = {
  accepted: {
    label: 'Accepted',
    tabLabel: 'Accepted',
    badgeClassName: 'bg-success-subtle text-success-text',
    selectClassName: 'border-success-border bg-success-subtle text-success-text',
    tabActiveClassName: 'border-success text-success-text',
    icon: '✓',
    iconClassName: 'text-success-text',
    iconBackgroundClassName: 'bg-success-subtle',
    emptyStateText: 'accepted',
  },
  open: {
    label: 'Open',
    tabLabel: 'Open',
    badgeClassName: 'bg-warning-subtle text-warning-text',
    selectClassName: 'border-warning-border bg-warning-subtle text-warning-text',
    tabActiveClassName: 'border-warning text-warning-text',
    icon: '?',
    iconClassName: 'text-warning-text',
    iconBackgroundClassName: 'bg-warning-subtle',
    emptyStateText: 'open',
  },
  declined: {
    label: 'Declined',
    tabLabel: 'Declined',
    badgeClassName: 'bg-danger-subtle text-danger-text',
    selectClassName: 'border-danger-border bg-danger-subtle text-danger-text',
    tabActiveClassName: 'border-danger text-danger-text',
    icon: '✗',
    iconClassName: 'text-danger-text',
    iconBackgroundClassName: 'bg-danger-subtle',
    emptyStateText: 'declined',
  },
  injured: {
    label: 'Injured',
    tabLabel: 'Injured',
    badgeClassName: 'bg-accent-subtle text-accent-text',
    selectClassName: 'border-accent-border bg-accent-subtle text-accent-text',
    tabActiveClassName: 'border-accent-border text-accent-text',
    icon: '✚',
    iconClassName: 'text-accent-text',
    iconBackgroundClassName: 'bg-accent-subtle',
    emptyStateText: 'been marked as injured',
  },
  sick: {
    label: 'Sick',
    tabLabel: 'Sick',
    badgeClassName: 'bg-brand-subtle text-brand-text',
    selectClassName: 'border-brand-border bg-brand-subtle text-brand-text',
    tabActiveClassName: 'border-brand text-brand-text',
    icon: 'S',
    iconClassName: 'text-brand-text',
    iconBackgroundClassName: 'bg-brand-subtle',
    emptyStateText: 'been marked as sick',
  },
  unavailable: {
    label: 'Unavailable',
    tabLabel: 'Unavailable',
    badgeClassName: 'bg-surface-subtle text-content-muted',
    selectClassName: 'border-edge-strong bg-surface-subtle text-content-muted',
    tabActiveClassName: 'border-edge-strong text-content-muted',
    icon: 'U',
    iconClassName: 'text-content-muted',
    iconBackgroundClassName: 'bg-surface-subtle',
    emptyStateText: 'been marked as unavailable',
  },
};

export const invitationStatusOrder: InvitationStatus[] = [
  'accepted',
  'open',
  'declined',
  'injured',
  'sick',
  'unavailable',
];
