import {
  GST_STATES,
  type OrderPaymentStatus,
  type OrderStatus,
  type QuotationStatus,
} from '@neon-adda/shared';
import type { BadgeTone } from '@/components/ui/card';
import type { AddressSnapshot } from './types';

/** +919812345678 → +91 98123 45678 */
export const formatPhone = (phone: string | null) =>
  phone?.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2') ?? '';

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});
const dateTimeFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

export const stateName = (code: string) => GST_STATES[code as keyof typeof GST_STATES] ?? code;

export function addressLines(address: AddressSnapshot): string[] {
  return [
    address.line1,
    address.line2,
    address.landmark && `Near ${address.landmark}`,
    `${address.city}, ${stateName(address.stateCode)} ${address.pincode}`,
  ].filter((line): line is string => Boolean(line));
}

/** Inches with the centimetre equivalent, the way customers think about wall space. */
export const formatSize = (widthIn: number, heightIn: number) =>
  `${widthIn}″ × ${heightIn}″ (${Math.round(widthIn * 2.54)} × ${Math.round(heightIn * 2.54)} cm)`;

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
  PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'amber' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  CONFIRMED: { label: 'Confirmed', tone: 'cyan' },
  PROOF_PENDING: { label: 'Design in progress', tone: 'cyan' },
  PROOF_APPROVED: { label: 'Design approved', tone: 'cyan' },
  IN_PRODUCTION: { label: 'Being made', tone: 'cyan' },
  QUALITY_CHECK: { label: 'Being tested', tone: 'cyan' },
  READY_TO_DISPATCH: { label: 'Packed', tone: 'cyan' },
  SHIPPED: { label: 'On the way', tone: 'cyan' },
  DELIVERED: { label: 'Delivered', tone: 'green' },
  INSTALLED: { label: 'Installed', tone: 'green' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  ON_HOLD: { label: 'On hold', tone: 'amber' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
};

export const PAYMENT_STATUS: Record<OrderPaymentStatus, string> = {
  UNPAID: 'Not paid',
  PARTIALLY_PAID: 'Part paid',
  PAID: 'Paid',
  PARTIALLY_REFUNDED: 'Part refunded',
  REFUNDED: 'Refunded',
};

export const QUOTE_STATUS: Record<QuotationStatus, { label: string; tone: BadgeTone }> = {
  REQUESTED: { label: 'Requested', tone: 'neutral' },
  IN_REVIEW: { label: 'Being prepared', tone: 'cyan' },
  SENT: { label: 'Ready for you', tone: 'pink' },
  CHANGES_REQUESTED: { label: 'Being revised', tone: 'cyan' },
  ACCEPTED: { label: 'Accepted', tone: 'green' },
  REJECTED: { label: 'Declined', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
};

export const QUOTE_KIND = {
  LOGO: 'Logo sign',
  LARGE: 'Large sign',
  BULK: 'Bulk order',
  CUSTOM: 'Custom request',
} as const;

export const TICKET_TYPES: Record<string, string> = {
  DAMAGED: 'Arrived damaged',
  NOT_WORKING: 'Not lighting up',
  WRONG_ITEM: 'Not what I ordered',
  INSTALLATION: 'Installation',
  DELIVERY: 'Delivery',
  OTHER: 'Something else',
};
