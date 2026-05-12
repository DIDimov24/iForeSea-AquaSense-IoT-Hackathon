'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError, SHORT_NAMES, postSubscribe, type LocationId } from '@/lib/api';

const BEACH_OPTIONS: { id: LocationId; label: string; sub: string }[] = [
  { id: 'sarafovo', label: SHORT_NAMES.sarafovo, sub: 'Northern coast' },
  { id: 'central_beach_burgas', label: 'Central Beach Burgas', sub: 'City centre' },
  { id: 'kraimorie', label: SHORT_NAMES.kraimorie, sub: 'Southern coast' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Sofia';
  } catch {
    return 'Europe/Sofia';
  }
}

type FormState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | {
      kind: 'success';
      status: 'pending_confirmation' | 'already_active';
      message: string;
    }
  | { kind: 'error'; message: string };

export function SubscribeForm() {
  const params = useSearchParams();
  const confirmed = params?.get('confirmed') === '1';
  const unsubscribed = params?.get('unsubscribed') === '1';
  const tokenError = params?.get('error') === 'invalid_token';

  const [email, setEmail] = useState('');
  const [locationId, setLocationId] = useState<LocationId>('sarafovo');
  const [hour, setHour] = useState<number>(8);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<FormState>({ kind: 'idle' });

  const timezone = useMemo(detectTimezone, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === 'submitting') return;
    setState({ kind: 'submitting' });
    try {
      const res = await postSubscribe({
        email: email.trim(),
        location_id: locationId,
        hour_local: hour,
        timezone,
      });
      setState({ kind: 'success', status: res.status, message: res.message });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 422
            ? 'Please check the email format.'
            : `Server error (${err.status}). Try again.`
          : 'Network error. Try again.';
      setState({ kind: 'error', message: msg });
    }
  }

  return (
    <div className="space-y-6">
      <Banner tone="muted">
        <strong>Demo mode.</strong> Email delivery is running on a Resend sandbox
        sender, which only delivers to the project owner&rsquo;s address. Submitting
        another email creates a database record but the confirmation message will
        not arrive. Production deployment uses a verified domain.
      </Banner>
      {confirmed && (
        <Banner tone="success">
          Email confirmed. You will start receiving daily forecasts at your chosen hour.
        </Banner>
      )}
      {unsubscribed && (
        <Banner tone="muted">
          You have been unsubscribed. Resubscribe below any time.
        </Banner>
      )}
      {tokenError && <Banner tone="error">That link is invalid or expired.</Banner>}

      {state.kind === 'success' ? (
        <SuccessCard
          status={state.status}
          message={state.message}
          onReset={() => {
            setState({ kind: 'idle' });
            setEmail('');
            setConsent(false);
          }}
        />
      ) : (
        <form
          onSubmit={onSubmit}
          className="space-y-6 rounded-2xl border border-border bg-card/60 p-6 md:p-8"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Beach</Label>
            <RadioGroup
              value={locationId}
              onValueChange={v => setLocationId(v as LocationId)}
              className="grid gap-3 sm:grid-cols-3"
            >
              {BEACH_OPTIONS.map(b => (
                <Label
                  key={b.id}
                  htmlFor={`beach-${b.id}`}
                  className={[
                    'flex cursor-pointer flex-col items-start gap-1 rounded-xl border p-4 transition',
                    locationId === b.id
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-border hover:border-primary/30',
                  ].join(' ')}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-medium text-foreground">{b.label}</span>
                    <RadioGroupItem value={b.id} id={`beach-${b.id}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{b.sub}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hour">Delivery hour (local)</Label>
              <Select value={String(hour)} onValueChange={v => setHour(Number(v))}>
                <SelectTrigger id="hour">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map(h => (
                    <SelectItem key={h} value={String(h)}>
                      {pad(h)}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time zone</Label>
              <Input value={timezone} readOnly className="text-mono text-sm" />
            </div>
          </div>

          <Label
            htmlFor="consent"
            className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3 text-sm font-normal"
          >
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={v => setConsent(v === true)}
              className="mt-0.5"
            />
            <span className="text-muted-foreground">
              I agree to receive a daily forecast email for the chosen beach. I can
              unsubscribe any time from a link in the email.
            </span>
          </Label>

          {state.kind === 'error' && <Banner tone="error">{state.message}</Banner>}

          <Button
            type="submit"
            disabled={!consent || state.kind === 'submitting'}
            className="w-full sm:w-auto"
          >
            {state.kind === 'submitting' ? 'Submitting...' : 'Subscribe'}
          </Button>
        </form>
      )}
    </div>
  );
}

function Banner({
  tone,
  children,
}: {
  tone: 'success' | 'error' | 'muted';
  children: React.ReactNode;
}) {
  const cls =
    tone === 'success'
      ? 'border-[color:var(--chl)]/40 bg-[color:var(--chl)]/10 text-foreground'
      : tone === 'error'
        ? 'border-[color:var(--bloom)]/50 bg-[color:var(--bloom)]/10 text-foreground'
        : 'border-border bg-muted/40 text-muted-foreground';
  return (
    <div className={['rounded-lg border px-4 py-3 text-sm', cls].join(' ')}>
      {children}
    </div>
  );
}

function SuccessCard({
  status,
  message,
  onReset,
}: {
  status: 'pending_confirmation' | 'already_active';
  message: string;
  onReset: () => void;
}) {
  const title =
    status === 'pending_confirmation' ? 'Check your inbox' : 'You are already subscribed';
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-8">
      <div className="text-mono text-xs uppercase tracking-widest text-primary">
        · {status.replace('_', ' ')}
      </div>
      <h3 className="mt-2 text-2xl font-medium text-foreground">{title}</h3>
      <p className="mt-3 text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-6" onClick={onReset}>
        Subscribe another email
      </Button>
    </div>
  );
}
