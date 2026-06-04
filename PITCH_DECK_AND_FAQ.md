# AR Collections Agent: Founder's Pitch Deck & Cheat Sheet

This document is your master cheat sheet for selling, pitching, and discussing the AR Collections Agent with CEOs, Finance Directors, and Investors.

---

## Part 1: The Language of the Market (FinTech Vocabulary)

CEOs and CFOs speak in metrics. If you use these terms, you instantly build trust and prove you understand their pain points.

*   **DSO (Days Sales Outstanding):** The holy grail metric of Accounts Receivable. It measures how many days on average it takes a company to get paid.
    *   *Pitch:* "Our agent doesn't just send emails; its goal is to reduce your DSO by 12–15 days by addressing non-payment reasons instantly."
*   **Working Capital / Trapped Cash:** Unpaid invoices mean cash is trapped in the aging report instead of being used to grow the business.
*   **AR Aging Report:** A report showing all unpaid invoices bucketed by how long they’ve been overdue (Current, 1-30 days, 31-60 days, 90+ days).
*   **FDCPA (Fair Debt Collection Practices Act):** (For the US Market). The strict laws governing debt collection. You must mention this to explain why your "Compliance Shield" is a necessity.
*   **Dunning:** The process of communicating with customers to ensure the collection of accounts receivable.
    *   *Pitch:* "Standard software does basic dunning. Our agent does intelligent, behavioral collections."

---

## Part 2: The High-Level Architecture (How it Works)

You don't need to know how to code the backend, but you must know how to explain the architecture simply.

*   **OAuth (Open Authorization):** "We use secure OAuth so we never see your QuickBooks or Gmail passwords. You grant us restricted access, and you can revoke it at any time."
*   **Webhooks (Event-Driven Architecture):** "Our system uses webhooks. This means the second an invoice is marked as 'Paid' in your accounting software, our system is instantly notified and automatically stops all further emails. No awkward overlaps."
*   **LLM (Large Language Model) + Context Injection:** "We don't just use generic ChatGPT. We inject the customer's payment history, recent emails, and dispute rate into the LLM's context window so every email is highly personalized and context-aware."

---

## Part 3: The CEO / Investor FAQ (Objection Handling)

**1. CEO: "I can't trust an AI to talk to my best customers. What if it hallucinates and threatens them?"**
> **You:** "I completely agree, which is why we built a multi-layered defense system. Before any email leaves your outbox, it passes through our hard-coded **Compliance Shield**. If the AI tries to use aggressive language, threatens legal action, or violates your frequency rules, the shield blocks the email and flags it for human review. You can also set an 'Approval Threshold' (e.g., invoices over $10k) so the AI only drafts the email, but a human must hit send."

**2. CEO: "How is this different from the automated email reminders I already have in QuickBooks/Xero?"**
> **You:** "QuickBooks sends the exact same generic, robotic email on Day 15, 30, and 45. Customers ignore them because they look automated. Our Agent acts like a human. It reads the reply history to diagnose *why* they haven't paid (Cash flow issue? Dispute?). If a customer replies they are waiting on a manager's approval, the AI reads that, stops the aggressive reminders, and dynamically drafts an empathetic follow-up offering to help."

**3. CEO: "What happens if a customer replies with a complex question about a line item on their bill?"**
> **You:** "The agent's 'Non-Payment Diagnosis' engine is trained to recognize disputes and complex queries. The moment it detects a question it can't confidently answer, it categorizes the account as 'Active Dispute', pauses all automated outreach, and routes the conversation to your inbox for a human to take over. It never guesses."

**4. CEO: "Is our financial data safe?"**
> **You:** "Yes. We use Row-Level Security (RLS) in our database, meaning your data is cryptographically isolated from any other company on the platform. We use read-only scopes where possible, and our AI does not use your financial data to train public models."

---

## Part 4: The 30-Second Elevator Pitch

"We built an AI-native Accounts Receivable agent that plugs directly into your accounting software and email. Instead of sending dumb, generic reminders, it builds behavioral profiles on your customers, diagnoses *why* they aren't paying, and drafts highly contextual follow-ups. It's like hiring a senior collections clerk that works 24/7, costs a fraction of the price, and has built-in legal guardrails to protect your brand reputation. We help businesses recover trapped cash and reduce DSO by up to 15 days."
