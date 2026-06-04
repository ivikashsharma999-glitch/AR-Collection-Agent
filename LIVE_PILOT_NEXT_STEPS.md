# Live Pilot Next Steps

The next priority is to polish the product from a live seeded demo into a credible pilot-ready workflow.

## 1. Add Guided Pilot Demo Mode

Build a tight 5-7 minute walkthrough:

Login -> Dashboard -> Accounts -> Invoice -> Approval Inbox -> Approve Reminder -> Audit Log -> Operations Health -> Forecast/Analytics.

The demo should make the workflow obvious without requiring explanation.

Recommended additions:

- Add a visible demo checklist or guided path across the main dashboard pages.
- Highlight the exact account or invoice the viewer should open.
- Add one or two seeded pilot story callouts, such as: "CloudBridge has an SLA dispute, so approval is required."
- Add a reset/seed button so every demo starts from a clean state.
- Make the Approval Inbox step land on the item that shows: approved, audit logged, but send blocked because no email provider is connected.

## 2. Add Operational Error States

Companies care about whether the product handles real-world integration failures clearly.

Add visible states for:

- No Gmail or Outlook provider connected.
- Expired Gmail token.
- Expired Outlook token.
- Failed email send.
- Failed QuickBooks sync.
- Failed Stripe payment link.
- Failed Twilio SMS.
- Compliance blocked send.

These should surface in Operations Health and, where relevant, in the workflow that triggered them.

## 3. Connect One Real Integration

Best first integration: Gmail.

Why:

- It makes the demo feel alive immediately.
- It proves the approval workflow can lead to a real outbound action.
- It is easier to demonstrate than QuickBooks or Stripe because the result is visible in an inbox.

Suggested integration order:

1. Gmail or Outlook for live email sending.
2. QuickBooks sandbox for invoice sync.
3. Stripe test mode for payment links.

## 4. Deploy The Pilot

Deploy the app to Vercel with the live Supabase project.

Goal:

- Share a real URL instead of localhost.
- Use one stable demo login.
- Keep seeded pilot data available for every walkthrough.

## 5. Create Investor And Company Materials

Create:

- Demo login details.
- One-page product brief.
- Short pitch deck.
- Demo script.
- Pilot proposal.
- Pricing hypothesis.

## Immediate Build Recommendation

Start with Guided Pilot Demo Mode.

The Approval Inbox workflow is now complete enough to be the centerpiece:

- Approve or reject.
- Update reminder status.
- Write human audit log.
- Show updated status.
- Surface missing email-provider state.

The next build should wrap that workflow in a crisp demo path so an investor, founder, finance leader, or pilot customer can understand the product in one pass.
