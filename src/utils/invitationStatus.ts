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
    badgeClassName: 'bg-blue-100 text-blue-800',
    selectClassName: 'bg-green-100 text-green-800 border-green-300',
    tabActiveClassName: 'border-blue-500 text-blue-600',
    icon: '✓',
    iconClassName: 'text-blue-600',
    iconBackgroundClassName: 'bg-gray-50',
    emptyStateText: 'accepted',
  },
  open: {
    label: 'Open',
    tabLabel: 'Open',
    badgeClassName: 'bg-yellow-100 text-yellow-800',
    selectClassName: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    tabActiveClassName: 'border-yellow-500 text-yellow-600',
    icon: '?',
    iconClassName: 'text-yellow-600',
    iconBackgroundClassName: 'bg-yellow-50',
    emptyStateText: 'open',
  },
  declined: {
    label: 'Declined',
    tabLabel: 'Declined',
    badgeClassName: 'bg-red-100 text-red-800',
    selectClassName: 'bg-red-100 text-red-800 border-red-300',
    tabActiveClassName: 'border-red-500 text-red-600',
    icon: '✗',
    iconClassName: 'text-red-600',
    iconBackgroundClassName: 'bg-red-50',
    emptyStateText: 'declined',
  },
  injured: {
    label: 'Injured',
    tabLabel: 'Injured',
    badgeClassName: 'bg-purple-100 text-purple-800',
    selectClassName: 'bg-purple-100 text-purple-800 border-purple-300',
    tabActiveClassName: 'border-purple-500 text-purple-600',
    icon: '✚',
    iconClassName: 'text-purple-600',
    iconBackgroundClassName: 'bg-purple-50',
    emptyStateText: 'been marked as injured',
  },
  sick: {
    label: 'Sick',
    tabLabel: 'Sick',
    badgeClassName: 'bg-orange-100 text-orange-800',
    selectClassName: 'bg-orange-100 text-orange-800 border-orange-300',
    tabActiveClassName: 'border-orange-500 text-orange-600',
    icon: 'S',
    iconClassName: 'text-orange-600',
    iconBackgroundClassName: 'bg-orange-50',
    emptyStateText: 'been marked as sick',
  },
  unavailable: {
    label: 'Unavailable',
    tabLabel: 'Unavailable',
    badgeClassName: 'bg-slate-100 text-slate-800',
    selectClassName: 'bg-slate-100 text-slate-800 border-slate-300',
    tabActiveClassName: 'border-slate-500 text-slate-600',
    icon: 'U',
    iconClassName: 'text-slate-600',
    iconBackgroundClassName: 'bg-slate-50',
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