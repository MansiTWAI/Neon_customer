'use client';

import { useEffect } from 'react';
import { rememberReferral } from '@/lib/referral';

export function ReferralCapture() {
  useEffect(() => rememberReferral(window.location.search), []);
  return null;
}
