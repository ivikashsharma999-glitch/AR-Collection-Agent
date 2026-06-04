# AR Collections Agent: Current Status

## Current Verdict

The project is now a stronger MVP and serious prototype.

It is good for a portfolio demo and closer to friendly-user pilot readiness, but it is not production-ready for fully autonomous collections workflows yet.

## What Has Been Hardened

- Private app pages are now protected by the Next proxy.
- Unauthenticated users are redirected to `/login?next=...`.
- Login now safely returns users to the page they originally tried to open.
- The legal language filter was fixed so prohibited terms like `lawsuit` are actually blocked.
- Lightweight Node test coverage now exists for the legal filter.
- Focused Node test coverage now exists for the compliance shield, including curfew, weekend blocking, frequency caps, active disputes, suppressed conversations, and strategic renewal holds.
- The browser smoke test now checks auth redirects, the known-user login path, authenticated dashboard navigation, settings navigation, and sign-out.
- Several strict build/lint issues in demo screens and mock type definitions were cleaned up.
- A new Operations Health page tracks Supabase, QuickBooks, Gmail, Outlook, Stripe, and Twilio readiness states.
- A new authenticated pilot seeding endpoint can create realistic customers, invoices, approvals, promises, disputes, reminders, and audit events in Supabase.
- A new Supabase migration adds integration-health columns and authenticated workspace bootstrap policies.
- Accounts, account detail, invoices, approval inbox, and audit log now read from Supabase when live data exists and fall back to demo data otherwise.
- Disputes, promises, recommendations, cash forecast, analytics, and AI activity now also read from Supabase-derived live data with demo fallback.

## Verified Checks

The following checks pass:

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npm.cmd run smoke
```

The configured smoke-test Supabase account now signs in successfully and reaches the authenticated app shell.

Note: apply `supabase/migrations/20260603000000_operational_readiness.sql` to the remote Supabase project before using the pilot seed button against production Supabase.

## Remaining Concerns

- Important dashboard metrics are still mostly mock data.
- Real integration behavior for Gmail, Outlook, QuickBooks, and Stripe needs production validation.
- The app needs more robust operational error handling before live collections use.
- The dashboard now has a live Supabase metrics path with demo fallback, but deeper KPI validation still needs pilot data after the readiness migration is applied.

## Recommended Next Steps

1. Apply the operational readiness migration to Supabase.
2. Use Settings → Seed Pilot Workspace to populate the authenticated demo account.
3. Run a full pilot-style walkthrough from login to reminder approval to audit log.
4. Add operational error states for failed sends, expired tokens, failed payment-link creation, and stalled sync jobs.
5. Validate the live walkthrough after applying the Supabase migration and seeding the pilot workspace.
