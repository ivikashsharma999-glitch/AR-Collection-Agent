"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import styles from "./page.module.css";

type FeatureCard = {
  icon: string;
  title: string;
  description: string;
};

type IntegrationCard = {
  name: string;
  description: string;
  status: "Connected" | "Coming Soon";
  color: string;
};

const navLinks = [
  { label: "Product", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "AI Agents", href: "#ai-agents" },
  { label: "Pricing", href: "#pricing" },
  { label: "ROI Calc", href: "#roi-calculator" },
];

const featureTabs: Record<string, FeatureCard[]> = {
  "AI Automation": [
    {
      icon: "🤖",
      title: "AI-Drafted Communications",
      description:
        "Analyzes customer history, risk score, and invoice amount to draft the perfect email or SMS automatically.",
    },
    {
      icon: "📞",
      title: "Voice AI Agent",
      description:
        "Automated outbound calls with live transcripts, outcome logging, and dispute detection.",
    },
    {
      icon: "💬",
      title: "Ask AR Agent",
      description:
        "Chat with your live AR data in plain English. 'Who owes the most?' answered instantly.",
    },
    {
      icon: "🔄",
      title: "Promise-to-Pay Detector",
      description:
        "NLP reads every reply and automatically captures payment commitments and dates.",
    },
    {
      icon: "📊",
      title: "Cash Forecast Engine",
      description:
        "30-day cash forecast with confidence scoring and risk-segment breakdown.",
    },
    {
      icon: "⚡",
      title: "Dynamic Risk Scoring",
      description:
        "ML scores every account by balance, aging, payment history, and dispute frequency.",
    },
  ],
  "Collections Intelligence": [
    {
      icon: "📋",
      title: "Collector Worklist",
      description:
        "AI-ranked daily queue with priority scores, urgency flags, and one-click actions.",
    },
    {
      icon: "🎯",
      title: "Customer Segmentation",
      description:
        "Automatically segments accounts: Good Payer, At Risk, Chronic Late, Strategic.",
    },
    {
      icon: "⚠️",
      title: "Dispute Workflow",
      description:
        "Kanban-style dispute board — New, Investigating, Escalated, Resolved — with AI auto-tagging.",
    },
    {
      icon: "🤝",
      title: "Human-in-the-Loop Approvals",
      description:
        "Every AI draft lands in your approval inbox. One click to approve, edit, or reject.",
    },
    {
      icon: "📅",
      title: "Promises to Pay Tracker",
      description:
        "Tracks every commitment with countdown timers. Broken promises trigger instant escalation.",
    },
    {
      icon: "📣",
      title: "Multi-Channel Outreach",
      description:
        "Email → SMS → Voice escalation playbooks. Nothing slips through the cracks.",
    },
  ],
  "Control & Compliance": [
    {
      icon: "🔒",
      title: "Immutable Audit Trail",
      description:
        "Every AI decision and human override logged permanently. Export CSV for compliance.",
    },
    {
      icon: "⚙️",
      title: "Playbook Builder",
      description:
        "Drag-and-drop workflow editor. Build custom escalation paths, tone shifts, and triggers.",
    },
    {
      icon: "🛡️",
      title: "Rules & Guardrails Engine",
      description:
        "Set approval thresholds, legal holds, credit limits, and regional routing policies.",
    },
    {
      icon: "🏢",
      title: "Multi-Entity Control Tower",
      description:
        "Roll up AR across legal entities, regions, and currencies in one global view.",
    },
    {
      icon: "📈",
      title: "Executive Analytics",
      description:
        "CEI, DSO trends, aging analysis, and AI agent performance — all in real time.",
    },
    {
      icon: "💳",
      title: "Cash Application",
      description:
        "84%+ auto-match rate on bank deposits. Short pays and exceptions routed automatically.",
    },
  ],
};

const integrationCards: IntegrationCard[] = [
  {
    name: "QuickBooks Online",
    description: "Bi-directional invoice & payment sync",
    status: "Connected",
    color: "#2ca01c",
  },
  {
    name: "Xero",
    description: "Real-time ledger sync, zero false alarms",
    status: "Connected",
    color: "#13b5ea",
  },
  {
    name: "NetSuite",
    description: "Enterprise AR data pipeline",
    status: "Connected",
    color: "#f97316",
  },
  {
    name: "Stripe",
    description: "Embed payment links in every email",
    status: "Connected",
    color: "#635bff",
  },
  {
    name: "Twilio SMS",
    description: "Automated SMS follow-ups",
    status: "Connected",
    color: "#f22f46",
  },
  {
    name: "Gmail / Outlook",
    description: "Send from your finance inbox",
    status: "Connected",
    color: "#4285f4",
  },
  {
    name: "Salesforce",
    description: "Customer context from CRM",
    status: "Coming Soon",
    color: "#00a1e0",
  },
  {
    name: "HubSpot",
    description: "Deal and contact sync",
    status: "Coming Soon",
    color: "#ff5c35",
  },
  {
    name: "Zendesk",
    description: "Dispute tickets auto-created",
    status: "Coming Soon",
    color: "#03363d",
  },
];

const agents = [
  {
    name: "Risk Scoring Agent",
    description:
      "Scores every account using balance, aging days, payment history, and dispute frequency. Rebuilds daily.",
    tag: "ML Classification",
    tone: "orange",
  },
  {
    name: "Draft Agent",
    description:
      "Writes personalized collection emails for each customer choosing the right tone, urgency, and channel.",
    tag: "Claude AI + RAG",
    tone: "blue",
  },
  {
    name: "Promise Detector",
    description:
      "Reads every inbound reply and extracts payment commitments, dates, and amounts automatically.",
    tag: "NLP + Intent Detection",
    tone: "green",
  },
  {
    name: "Dispute Classifier",
    description:
      "Tags dispute type (pricing, SLA, wrong entity) and pauses collections until resolution is confirmed.",
    tag: "NLP + Rules Engine",
    tone: "purple",
  },
  {
    name: "Cash Forecast Agent",
    description:
      "Predicts 30-day collections with confidence scoring by risk segment, updated in real time.",
    tag: "Time Series Forecasting",
    tone: "amber",
  },
  {
    name: "Voice AI Agent",
    description:
      "Makes outbound calls, conducts natural conversations, logs outcomes, and detects disputes in real time.",
    tag: "Voice AI + Transcription",
    tone: "red",
  },
];

const stack = [
  "QuickBooks",
  "Xero",
  "NetSuite",
  "Stripe",
  "Twilio",
  "Gmail",
  "Outlook",
  "Supabase",
  "Salesforce",
  "HubSpot",
];

const pricing = [
  {
    name: "Starter",
    monthly: 299,
    annual: 239,
    subtext: "For small AR teams getting started",
    cta: "Start Free Trial",
    featured: false,
    features: [
      "Up to 200 invoices/month",
      "1 legal entity",
      "AI email drafting",
      "ERP sync (QuickBooks, Xero)",
      "Basic analytics & DSO tracking",
      "Approval inbox",
      "Email support",
    ],
  },
  {
    name: "Growth",
    monthly: 799,
    annual: 639,
    subtext: "For growing teams serious about DSO",
    cta: "Start Free Trial",
    featured: true,
    features: [
      "Unlimited invoices",
      "Up to 3 legal entities",
      "Everything in Starter",
      "Voice AI Agent",
      "Ask AR Agent (chat)",
      "Multi-channel outreach (SMS + Email)",
      "Cash Forecast Engine",
      "Playbook Builder",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    subtext: "For multi-entity finance operations",
    cta: "Book a Demo",
    featured: false,
    features: [
      "Unlimited invoices & entities",
      "Everything in Growth",
      "Multi-entity Control Tower",
      "Governance & guardrails engine",
      "Custom playbooks & SLA rules",
      "Dedicated onboarding manager",
      "SSO & advanced security",
      "SLA guarantee",
    ],
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRevenue(value: number) {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }

  return formatCurrency(value);
}

function Logo() {
  return (
    <Link href="/" className={styles.logo} aria-label="CollectionsOS home">
      <span className={styles.logoIcon}>AR</span>
      <span className={styles.logoText}>
        Collections<span>OS</span>
      </span>
    </Link>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("AI Automation");
  const [annual, setAnnual] = useState(false);
  const [revenue, setRevenue] = useState(10_000_000);
  const [dso, setDso] = useState(55);
  const [badDebtRate, setBadDebtRate] = useState(2);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const roi = useMemo(() => {
    const ar = (revenue / 12) * (dso / 30);
    const dsoSavings = ar * 0.2;
    const badDebtSavings = revenue * (badDebtRate / 100) * 0.25;
    const laborSavings = 60_000;
    const total = dsoSavings + badDebtSavings + laborSavings;
    const payback = Math.max(1, Math.round((9_588 / total) * 365));

    return { dsoSavings, badDebtSavings, laborSavings, total, payback };
  }, [badDebtRate, dso, revenue]);

  return (
    <main className={styles.landing}>
      <nav className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
        <div className={styles.navInner}>
          <Logo />
          <div className={styles.navLinks} aria-label="Primary navigation">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            ))}
          </div>
          <div className={styles.navActions}>
            <Link href="/login?next=/dashboard" className={styles.buttonSecondarySmall}>
              Login
            </Link>
            <Link href="/dashboard" className={styles.buttonPrimarySmall}>
              Enter Command Center →
            </Link>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.mesh} />
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            AI-Powered Accounts Receivable
          </div>
          <h1 className={styles.heroTitle}>
            Stop Chasing Invoices.
            <br />
            Let AI Recover Your Cash.
          </h1>
          <p className={styles.heroSubtitle}>
            The autonomous Command Center that integrates with your ERP, drafts
            personalized follow-ups, and reduces Days Sales Outstanding by 20% —
            so your team can focus on strategy, not spreadsheets.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/dashboard" className={styles.buttonPrimary}>
              Enter Command Center →
            </Link>
            <a href="#how-it-works" className={styles.buttonSecondary}>
              See How It Works
            </a>
          </div>
        </div>

        <div className={styles.productWrap} aria-label="Command Center dashboard preview">
          <div className={`${styles.floatCard} ${styles.floatOne}`}>
            <span>DSO Reduced</span>
            <strong className={styles.greenText}>↓ 20%</strong>
          </div>
          <div className={`${styles.floatCard} ${styles.floatTwo}`}>
            <span>Invoices Automated</span>
            <strong className={styles.orangeText}>100%</strong>
          </div>
          <div className={`${styles.floatCard} ${styles.floatThree}`}>
            <span>Cash Freed</span>
            <strong className={styles.greenText}>$274k</strong>
          </div>

          <div className={styles.browserFrame}>
            <div className={styles.browserChrome}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.dashboardPreview}>
              <aside className={styles.previewSidebar}>
                {["Home", "AI Activity", "Recommendations", "Worklist", "Accounts", "Invoices"].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </aside>
              <section className={styles.previewMain}>
                <div className={styles.previewTop}>
                  <h2>Command Center</h2>
                  <div className={styles.previewSearch}>
                    <Search size={14} />
                    Search accounts
                  </div>
                </div>
                <div className={styles.previewGrid}>
                  <div className={`${styles.previewCard} ${styles.chartCard}`}>
                    <div className={styles.previewCardTitle}>Cash Burn-Down</div>
                    <svg viewBox="0 0 320 120" className={styles.lineChart} aria-hidden="true">
                      <polyline points="0,88 52,74 104,78 156,50 208,46 260,28 320,18" />
                      <path d="M0 88 L52 74 L104 78 L156 50 L208 46 L260 28 L320 18 L320 120 L0 120Z" />
                    </svg>
                  </div>
                  <div className={styles.gaugeRow}>
                    <div className={styles.previewCard}>
                      <div className={styles.gauge}>84%</div>
                      <span>AI Automation</span>
                    </div>
                    <div className={styles.previewCard}>
                      <div className={styles.gauge}>92%</div>
                      <span>Portfolio Coverage</span>
                    </div>
                  </div>
                  <div className={styles.previewCard}>
                    <div className={styles.previewCardTitle}>High-Priority Accounts</div>
                    <div className={styles.accountRow}>
                      <div>
                        <strong>Bright Pixel Media</strong>
                        <span>$14,200</span>
                      </div>
                      <em>chronic late</em>
                    </div>
                    <div className={styles.accountRow}>
                      <div>
                        <strong>Momentum Labs</strong>
                        <span>$18,900</span>
                      </div>
                      <em className={styles.redBadge}>high risk</em>
                    </div>
                  </div>
                  <div className={`${styles.previewCard} ${styles.recommendationCard}`}>
                    <div className={styles.previewCardTitle}>Top AI Recommendations</div>
                    <p>Send firm reminder to Momentum Labs with payment link and escalation owner.</p>
                  </div>
                </div>
              </section>
            </div>
            <div className={styles.previewFade} />
          </div>
        </div>
      </section>

      <section id="kpis" className={styles.kpiSection}>
        <div className={styles.sectionShell}>
          <div className={styles.eyebrow}>GUARANTEED OUTCOMES</div>
          <h2 className={styles.sectionTitle}>Measurable Results in 30 Days</h2>
          <div className={styles.kpiGrid}>
            {[
              ["20%", "Reduction in DSO", "Days Sales Outstanding drops in your first month"],
              ["90%", "Less Manual Work", "Automated follow-ups, reminders & reconciliation"],
              ["100%", "Invoice Coverage", "Every invoice tracked from issue to cash"],
              ["$114K", "Avg Annual Savings", "Per $10M AR under management"],
            ].map(([value, title, description]) => (
              <div className={styles.kpiCard} key={title}>
                <strong>{value}</strong>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <p className={styles.disclaimer}>
            Results based on industry benchmarks and AR automation research.
            Actual results vary by company size and AR complexity.
          </p>
        </div>
      </section>

      <section id="integrations" className={styles.integrationStrip}>
        <p>Works with your existing stack</p>
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            {[...stack, ...stack].map((item, index) => (
              <span key={`${item}-${index}`}>
                {item}
                <i />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className={styles.section}>
        <div className={styles.eyebrow}>CORE CAPABILITIES</div>
        <h2 className={styles.sectionTitle}>Everything Your AR Team Needs</h2>
        <p className={styles.sectionSubtitle}>
          Three pillars that transform collections from reactive chaos into a
          precision-tuned cash machine.
        </p>
        <div className={styles.tabRow} role="tablist" aria-label="Feature categories">
          {[...Object.keys(featureTabs), "Integrations"].map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Integrations" ? (
          <div className={`${styles.cardGrid} ${styles.fadeIn}`} key={activeTab}>
            {integrationCards.map((integration) => (
              <div className={styles.featureCard} key={integration.name}>
                <div className={styles.integrationTop}>
                  <span
                    className={styles.integrationLogo}
                    style={{ backgroundColor: integration.color }}
                  >
                    {integration.name.slice(0, 1)}
                  </span>
                  <span
                    className={`${styles.statusBadge} ${
                      integration.status === "Connected" ? styles.connected : styles.comingSoon
                    }`}
                  >
                    {integration.status}
                  </span>
                </div>
                <h3>{integration.name}</h3>
                <p>{integration.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className={`${styles.cardGrid} ${styles.fadeIn}`} key={activeTab}>
            {featureTabs[activeTab].map((feature) => (
              <article className={styles.featureCard} key={feature.title}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="how-it-works" className={styles.section}>
        <div className={styles.eyebrow}>HOW IT WORKS</div>
        <h2 className={styles.sectionTitle}>From Overdue to Collected in 4 Steps</h2>
        <div className={styles.timeline}>
          {[
            [
              "1",
              "Connect Your ERP",
              "Authenticate with QuickBooks, Xero, or upload a CSV. Invoices and customer data sync automatically.",
            ],
            [
              "2",
              "AI Analyzes & Drafts",
              "The agent scores every overdue invoice, selects the right playbook, and drafts a personalized follow-up.",
            ],
            [
              "3",
              "You Review & Approve",
              "Drafts land in your inbox. Approve in one click, edit if needed. You stay in full control.",
            ],
            [
              "4",
              "Cash Hits Your Account",
              "Message sent. Agent monitors replies, detects payments, and closes the loop automatically.",
            ],
          ].map(([number, title, description]) => (
            <div className={styles.timelineStep} key={number}>
              <div className={styles.stepNumber}>{number}</div>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="ai-agents" className={styles.agentSection}>
        <div className={styles.sectionShell}>
          <div className={styles.eyebrow}>UNDER THE HOOD</div>
          <h2 className={styles.sectionTitle}>6 AI Agents Working 24/7 For You</h2>
          <p className={styles.sectionSubtitle}>
            Each agent uses a specialized model trained on AR data to make
            intelligent decisions.
          </p>
          <div className={styles.agentGrid}>
            {agents.map((agent) => (
              <article className={styles.agentCard} key={agent.name}>
                <div className={styles.agentTop}>
                  <span className={`${styles.agentIcon} ${styles[agent.tone]}`} />
                  <h3>{agent.name}</h3>
                </div>
                <p>{agent.description}</p>
                <span className={styles.techPill}>{agent.tag}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="roi-calculator" className={styles.section}>
        <div className={styles.eyebrow}>ROI CALCULATOR</div>
        <h2 className={styles.sectionTitle}>See How Much Cash You&apos;re Leaving on the Table</h2>
        <p className={styles.sectionSubtitle}>Adjust the sliders to match your AR situation.</p>
        <div className={styles.calculator}>
          <div className={styles.sliderGroup}>
            <label>
              Annual Revenue
              <strong>{formatRevenue(revenue)}</strong>
            </label>
            <input
              type="range"
              min={1_000_000}
              max={50_000_000}
              step={500_000}
              value={revenue}
              onChange={(event) => setRevenue(Number(event.target.value))}
            />
          </div>
          <div className={styles.sliderGroup}>
            <label>
              Current DSO (Days)
              <strong>{dso} days</strong>
            </label>
            <input
              type="range"
              min={20}
              max={120}
              step={1}
              value={dso}
              onChange={(event) => setDso(Number(event.target.value))}
            />
          </div>
          <div className={styles.sliderGroup}>
            <label>
              Current Bad Debt Rate (%)
              <strong>{badDebtRate.toFixed(1)}%</strong>
            </label>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.1}
              value={badDebtRate}
              onChange={(event) => setBadDebtRate(Number(event.target.value))}
            />
          </div>
          <div className={styles.resultGrid}>
            <div className={styles.resultBox}>
              <span>Cash Freed</span>
              <strong className={styles.greenText}>{formatCurrency(roi.dsoSavings)}</strong>
            </div>
            <div className={styles.resultBox}>
              <span>Bad Debt Reduction</span>
              <strong className={styles.greenText}>{formatCurrency(roi.badDebtSavings)}</strong>
            </div>
            <div className={styles.resultBox}>
              <span>Labor Savings</span>
              <strong className={styles.greenText}>{formatCurrency(roi.laborSavings)}</strong>
            </div>
            <div className={`${styles.resultBox} ${styles.totalResult}`}>
              <span>Total Annual Value</span>
              <strong className={styles.orangeText}>{formatCurrency(roi.total)}</strong>
            </div>
          </div>
          <p className={styles.payback}>
            CollectionsOS pays for itself in <strong>{roi.payback}</strong> days
          </p>
          <Link href="/dashboard" className={styles.buttonPrimary}>
            Claim This Value →
          </Link>
        </div>
      </section>

      <section id="pricing" className={styles.pricingSection}>
        <div className={styles.sectionShell}>
          <div className={styles.eyebrow}>PRICING</div>
          <h2 className={styles.sectionTitle}>Simple, Transparent Pricing</h2>
          <p className={styles.sectionSubtitle}>
            Start free. Scale as you grow. Cancel anytime.
          </p>
          <div className={styles.priceToggle} aria-label="Billing cadence">
            <button
              type="button"
              className={!annual ? styles.toggleActive : ""}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              className={annual ? styles.toggleActive : ""}
              onClick={() => setAnnual(true)}
            >
              Annual <span>saves 20%</span>
            </button>
          </div>
          <div className={styles.pricingGrid}>
            {pricing.map((plan) => (
              <article
                className={`${styles.priceCard} ${plan.featured ? styles.priceFeatured : ""}`}
                key={plan.name}
              >
                {plan.featured ? <span className={styles.popular}>Most Popular</span> : null}
                <h3>{plan.name}</h3>
                <div className={styles.price} key={`${plan.name}-${annual}`}>
                  {plan.monthly === null ? (
                    "Custom"
                  ) : (
                    <>
                      ${annual ? plan.annual : plan.monthly}
                      <span>/mo</span>
                    </>
                  )}
                </div>
                <p>{plan.subtext}</p>
                <hr />
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <Check size={16} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Enterprise" ? "mailto:demo@collectionsos.com" : "/dashboard"}
                  className={plan.featured ? styles.buttonPrimary : styles.buttonSecondary}
                >
                  {plan.cta}
                </Link>
              </article>
            ))}
          </div>
          <p className={styles.pricingNote}>
            All plans include a 30-day free trial. No credit card required.
          </p>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.finalCard}>
          <h2>Ready to automate your collections?</h2>
          <p>
            Join mid-market finance teams recovering cash faster with AI-powered
            precision.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/dashboard" className={styles.buttonPrimary}>
              Get Started Free →
            </Link>
            <Link href="mailto:demo@collectionsos.com" className={styles.buttonSecondary}>
              Book a 15-min Demo
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div>
            <Logo />
            <p>
              The autonomous AR command center for mid-market finance teams.
            </p>
          </div>
          <div>
            <h3>Product</h3>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#ai-agents">AI Agents</a>
            <a href="#pricing">Pricing</a>
            <a href="#roi-calculator">ROI Calculator</a>
          </div>
          <div>
            <h3>Company</h3>
            <Link href="/dashboard">Dashboard</Link>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="mailto:demo@collectionsos.com">Contact</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 CollectionsOS. All rights reserved.</span>
          <span>
            <a href="#privacy">Privacy</a> · <a href="#terms">Terms</a> ·{" "}
            <a href="mailto:demo@collectionsos.com">Contact</a>
          </span>
        </div>
      </footer>
    </main>
  );
}
