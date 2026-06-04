# 🔍 AR Collections Agent - Prototype Review Guide

This guide contains all the direct links you need to explore the fully built prototype. 

## 🚨 Troubleshooting: Bypassing the Dashboard Redirect
If you go to `http://localhost:3000/` and it immediately redirects you to `/home` instead of showing the Landing Page, this is a **browser caching issue**. 

Before the landing page was built, the app was programmed to redirect the root URL to the dashboard. Your browser has cached this old redirect to make loading faster.

**How to fix it and see the Landing Page:**
1. **Option A:** Open an Incognito / Private Browsing window and go to `http://localhost:3000/`.
2. **Option B:** Do a **Hard Refresh** on your browser tab (Press `Ctrl` + `Shift` + `R` on Windows, or `Cmd` + `Shift` + `R` on Mac).

---

## 🗺️ Feature Navigation Guide

Once the app is running on your local server, use these links to review every major piece of the ecosystem:

### 1. The Public Landing Page
*   **Link:** [http://localhost:3000/](http://localhost:3000/)
*   *What to review:* This is the external sales page. Check the Bento UI grid and the overall value proposition.

### 2. The Internal Dashboard (Home)
*   **Link:** [http://localhost:3000/home](http://localhost:3000/home)
*   *What to review:* The burn-down charts, AI automation gauges, and the overall look and feel of the command center.

### 3. The AI Negotiation Hub (Inbox)
*   **Link:** [http://localhost:3000/inbox](http://localhost:3000/inbox) *(Make sure to click the **"Payment Plans"** filter tab).*
*   *What to review:* Look at the custom Negotiation Card UI. Does the AI proposing a split-payment plan look clear and easy to approve?

### 4. The No-Code Rules Engine (Playbooks)
*   **Link:** [http://localhost:3000/playbooks](http://localhost:3000/playbooks)
*   *What to review:* The visual node-based workflow builder. This is what you show CFOs to prove the AI is controllable.

### 5. Dispute Auto-Tagging
*   **Link:** [http://localhost:3000/disputes](http://localhost:3000/disputes)
*   *What to review:* Notice the `DED-XX` tags with the ✨ icon. This proves the AI read the angry email and correctly classified the deduction code.

### 6. Voice AI Transcript Logs
*   **Link:** [http://localhost:3000/communications](http://localhost:3000/communications)
*   *What to review:* The audio player mockup and the dual-chat transcript showing the AI navigating a live phone call.

### 7. Self-Service Customer Portal
*   **Link:** [http://localhost:3000/portal/inv-123](http://localhost:3000/portal/inv-123)
*   *What to review:* This is the external page a debtor sees when the AI emails them. Click the "Credit Card" option and then hit the blue "Pay" button to see the success state.

---
*If the pages do not load, your local Next.js development server may have stopped. Run `npm run dev` in your terminal to restart it.*
