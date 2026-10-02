'use client';

import { CheckCircle2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, Field, fieldErrors, FormError, Select, TextArea, TextInput } from '@/components/ui/form';
import { ApiError, publicRequest } from '@/lib/api';

export function LeadForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? '').trim();
    setPending(true);
    setErrors({});
    setError(null);
    try {
      await publicRequest('/leads', {
        method: 'POST',
        body: JSON.stringify({
          name: value('name'),
          phone: value('phone'),
          email: value('email'),
          pincode: value('pincode'),
          message: value('message'),
          source: value('source'),
        }),
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_FAILED') setErrors(fieldErrors(err.details));
      else setError(err instanceof ApiError ? err.title : 'Could not send your message. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-12 text-center">
        <CheckCircle2 className="size-10 text-emerald-300" />
        <h2 className="mt-4 font-display text-xl font-semibold">Thanks, we have your message</h2>
        <p className="mt-2 text-sm text-muted">Someone from our team will call you within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
      <Field label="Your name" error={errors.name}>
        <TextInput name="name" autoComplete="name" required />
      </Field>
      <Field label="Mobile number" error={errors.phone}>
        <TextInput name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required />
      </Field>
      <Field label="Email" optional error={errors.email}>
        <TextInput name="email" type="email" autoComplete="email" />
      </Field>
      <Field label="Pincode" optional error={errors.pincode}>
        <TextInput name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" />
      </Field>
      <Field label="This is about" className="sm:col-span-2">
        <Select name="source" defaultValue="CONTACT">
          <option value="CONTACT">A sign for me</option>
          <option value="BUSINESS">Signs for my business</option>
          <option value="FRANCHISE_ENQUIRY">Becoming a Neon Adda partner</option>
        </Select>
      </Field>
      <Field label="Message" error={errors.message} className="sm:col-span-2">
        <TextArea name="message" rows={5} maxLength={2000} required />
      </Field>
      <div className="sm:col-span-2">
        <FormError message={error} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" pending={pending}>
          Send message
        </Button>
      </div>
    </form>
  );
}
