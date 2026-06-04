# 🚀 AR Collections Agent OS - The Complete Enterprise Ecosystem

Welcome to the **AR Collections Agent OS**, an enterprise-grade Command Center built for modern finance teams. This application strikes the perfect balance between cutting-edge AI software and reliable, high-end finance tooling. 

> "It looks like Stripe, thinks like ChatGPT, and works like Ramp."

---

## 🏗️ Core Features & Capabilities (Phase 1 to Phase 3)

### 1. High-Converting Public Landing Page (`/`)
The application features a built-in public-facing SaaS landing page designed to wow investors and convert finance leads. It features a glowing glassmorphism navbar, a dynamic Bento-Grid highlighting core AI features, and a high-end Dark Mode aesthetic.

### 2. Home Command Center (`/home`)
The beating heart of the platform. Instead of static numbers, this page features interactive visual data:
- **Cash Burn-Down Area Chart:** An SVG-powered interactive chart plotting expected cash versus actual collected cash.
- **Circular Progress Gauges:** Animated rings displaying real-time metrics like *AI Automation Rate*.
- **High-Priority Accounts:** A quick-glance list of accounts that need immediate intervention based on predictive risk scoring.

### 3. Approval Inbox & AI Negotiation Hub (`/inbox`)
A hyper-efficient, Notion/Linear-style inbox where finance managers can review, edit, and approve communications drafted by the AI.
- **Killer Feature - Split Payment Negotiation:** When a customer says they can't pay in full, the AI cognitively drafts a structured payment plan (e.g., "$5k today, $5k next month") and extracts the terms into a dedicated visual "Negotiation Card" for 1-click approval.
- **ERP Ledger Sync:** Auto-resolves follow-ups if a customer has already paid.

### 4. No-Code Workflow Rules Editor (`/playbooks`)
The answer to the "Black Box" objection. 
- A full-page visual editor providing a node-based canvas.
- Allows AR Admins to visually build AI escalation paths (e.g., *Trigger: Overdue > 30 Days* ➡️ *Split path based on channel preference* ➡️ *Switch Tone to Firm* ➡️ *Send SMS*).

### 5. Dispute & Deduction Auto-Tagging (`/disputes`)
Proves the AI can handle complex B2B scenarios (manufacturing, wholesale, etc).
- The AI acts as a forensic accountant, reading customer complaint emails, determining why they are short-paying (e.g., damaged goods), and automatically applying formal accounting deduction codes (e.g., `DED-04: Pricing Mismatch`, `DED-09: SLA Failure`).

### 6. Voice AI Transcript Dashboard (`/communications`)
Proves the platform is built for the inbound/outbound voice revolution.
- A breathtaking UI simulating a completed phone call between the Voice AI and a customer.
- Includes a functional audio player mockup with an animated waveform and a dual-chat transcript where the AI successfully negotiates on the phone.

### 7. Self-Service Customer Portal (`/portal/[id]`)
The external, public-facing link in the ecosystem. 
- This is the exact page a debtor sees when the AI emails them a payment link.
- It sits completely outside the internal dashboard, featuring a beautiful invoice breakdown and a functional mockup of a secure Stripe checkout flow.

### 8. Immutable Audit Log (`/audit`)
An immutable record of every decision made by the AI or overridden by a human.
- Clean timeline interface with key-value data readouts.
- **Export to CSV:** Fully functional client-side CSV generation so compliance teams can download logs instantly.

---

## 🎨 Design Philosophy
This dashboard utilizes a **Bento Box UI** architecture with a massive emphasis on a premium Dark Mode aesthetic.
- **Glassmorphism:** Soft, semi-transparent frosted panels (`.glass-panel`) create depth.
- **Micro-Animations:** Elements subtly fade in and stagger on load, giving the UI a responsive, "living" feel.
- **Data Visualizations:** Custom, dependency-free SVG charts provide dynamic feedback on AI performance without bloating the bundle size.
- **Theme Toggle:** Built-in seamless Light/Dark mode switching via CSS variables (located in `app/globals.css`).

---

## 🛠️ Technology Stack
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Styling:** Pure CSS Modules + Global CSS Variables (No Tailwind dependencies required)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Charts:** Custom pure SVG components (Zero-dependency)

---

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

- Navigate to `/` to see the Public Landing Page.
- Navigate to `/home` to enter the Dashboard.
- Navigate to `/portal/inv-123` to see the Customer Checkout Portal.

*Built with precision for the future of automated finance.*
