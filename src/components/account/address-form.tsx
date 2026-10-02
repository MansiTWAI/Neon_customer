'use client';

import { GST_STATES } from '@neon-adda/shared';
import { useState, type FormEvent } from 'react';
import { Button, Field, fieldErrors, FormError, Select, TextInput } from '@/components/ui/form';
import { ApiError, publicRequest } from '@/lib/api';
import { api } from '@/lib/browser-api';
import type { Address, Serviceability } from '@/lib/types';

const STATES = Object.entries(GST_STATES).sort((a, b) => a[1].localeCompare(b[1]));

interface AddressFormProps {
  address?: Address;
  /** Pre-fills the contact fields for a first address. */
  defaults?: { name?: string; phone?: string };
  onSaved: (address: Address) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

export function AddressForm({
  address,
  defaults,
  onSaved,
  onCancel,
  submitLabel = 'Save address',
}: AddressFormProps) {
  const [city, setCity] = useState(address?.city ?? '');
  const [stateCode, setStateCode] = useState(address?.stateCode ?? '');
  const [delivery, setDelivery] = useState<Serviceability | null>(null);
  const [business, setBusiness] = useState(Boolean(address?.gstin));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function lookUp(pincode: string) {
    setDelivery(null);
    if (!/^[1-9]\d{5}$/.test(pincode)) return;
    try {
      const result = await publicRequest<Serviceability>(`/serviceability/${pincode}`);
      setDelivery(result);
      if (result.place) {
        setCity((current) => current || result.place!.city);
        setStateCode(result.place.stateCode);
      }
    } catch {
      // The lookup is a convenience; the customer can still fill the fields in by hand.
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();
    setPending(true);
    setErrors({});
    setError(null);

    try {
      const body = JSON.stringify({
        label: value('label') || null,
        name: value('name'),
        phone: value('phone'),
        line1: value('line1'),
        line2: value('line2') || null,
        landmark: value('landmark') || null,
        city,
        stateCode,
        pincode: value('pincode'),
        gstin: business ? value('gstin') || null : null,
        businessName: business ? value('businessName') || null : null,
        isDefault: form.get('isDefault') === 'on',
      });
      const saved = await api.request<Address>(address ? `/me/addresses/${address.id}` : '/me/addresses', {
        method: address ? 'PUT' : 'POST',
        body,
      });
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_FAILED') setErrors(fieldErrors(err.details));
      else setError(err instanceof ApiError ? err.title : 'Could not save the address.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      <Field label="Full name" error={errors.name}>
        <TextInput name="name" defaultValue={address?.name ?? defaults?.name} autoComplete="name" required />
      </Field>
      <Field label="Mobile number" error={errors.phone}>
        <TextInput
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={(address?.phone ?? defaults?.phone ?? '').replace(/^\+91/, '')}
          autoComplete="tel-national"
          required
        />
      </Field>
      <Field label="Flat, house, building" error={errors.line1} className="sm:col-span-2">
        <TextInput name="line1" defaultValue={address?.line1} autoComplete="address-line1" required />
      </Field>
      <Field label="Street, area" optional error={errors.line2} className="sm:col-span-2">
        <TextInput name="line2" defaultValue={address?.line2 ?? ''} autoComplete="address-line2" />
      </Field>
      <Field label="Landmark" optional error={errors.landmark}>
        <TextInput name="landmark" defaultValue={address?.landmark ?? ''} />
      </Field>
      <Field
        label="Pincode"
        error={errors.pincode}
        hint={
          delivery &&
          (delivery.serviceable
            ? `Delivered in ${delivery.deliveryDays!.min}–${delivery.deliveryDays!.max} days${delivery.installationAvailable ? ', installation available' : ''}`
            : 'We do not deliver here yet')
        }
      >
        <TextInput
          name="pincode"
          defaultValue={address?.pincode}
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          required
          onChange={(e) => void lookUp(e.target.value)}
        />
      </Field>
      <Field label="City" error={errors.city}>
        <TextInput
          value={city}
          onChange={(e) => setCity(e.target.value)}
          autoComplete="address-level2"
          required
        />
      </Field>
      <Field label="State" error={errors.stateCode}>
        <Select value={stateCode} onChange={(e) => setStateCode(e.target.value)} required>
          <option value="" disabled>
            Choose a state
          </option>
          {STATES.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Save as" optional error={errors.label}>
        <TextInput
          name="label"
          defaultValue={address?.label ?? ''}
          placeholder="Home, office, shop"
          maxLength={30}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={business}
          onChange={(e) => setBusiness(e.target.checked)}
          className="accent-pink-500"
        />
        Add a GSTIN for a business invoice
      </label>
      {business && (
        <>
          <Field label="GSTIN" error={errors.gstin}>
            <TextInput
              name="gstin"
              defaultValue={address?.gstin ?? ''}
              maxLength={15}
              className="uppercase"
              placeholder="27AAPFU0939F1ZV"
            />
          </Field>
          <Field label="Registered business name" error={errors.businessName}>
            <TextInput
              name="businessName"
              defaultValue={address?.businessName ?? ''}
              autoComplete="organization"
            />
          </Field>
        </>
      )}

      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault}
          className="accent-pink-500"
        />
        Use as my default address
      </label>

      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" pending={pending}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
