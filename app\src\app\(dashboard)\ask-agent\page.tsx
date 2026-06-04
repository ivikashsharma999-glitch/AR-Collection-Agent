'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  BrainCircuit,
  Sparkles,
  User,
  FileSpreadsheet,
  TrendingUp,
  AlertTriangle,
  Users,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/mock-data';
import styles from './page.module.css';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  sources?: { label: string; type: string }[];
  isThinking?: boolean;
}

const SUGGESTED_PROMPTS = [
  { text: 'Which accounts need immediate attention?', icon: AlertTriangle },
  { text: 'Show me a summary of overdue invoices', icon: FileSpreadsheet },
  { text: 'What is our current DSO trend?', icon: TrendingUp },
  { text: 'Who are our highest risk customers?', icon: Users },
];

// Simulated agent responses based on keywords
function getAgentResponse(query: string): { content: string; sources: { label: string; type: string }[] } {
  const q = query.toLowerCase();

  if (q.includes('attention') || q.includes('priority') || q.includes('urgent')) {
    return {
      content: `Based on current analysis, **3 accounts** need immediate attention:\n\n1. **Global Retail Group** — ${formatCurrency(18500)} overdue by 72 days. Risk segment: *high_risk*. The agent sent 2 reminders with no reply. Recommendation: **Escalate to direct call**.\n\n2. **CloudBase Inc** — ${formatCurrency(12200)} with a broken promise to pay (was due May 20). Recommendation: **Offer a structured payment plan**.\n\n3. **TechFlow Solutions** — ${formatCurrency(8750)} with an active dispute (pricing error). Recommendation: **Resolve dispute first**, then follow up.\n\nWould you like me to draft escalation messages for any of these?`,
      sources: [
        { label: 'Accounts Risk Model', type: 'ai' },
        { label: 'Promise Tracker', type: 'data' },
        { label: 'Dispute Log', type: 'data' },
      ]
    };
  }

  if (q.includes('overdue') || q.includes('invoice')) {
    return {
      content: `Here's your overdue invoice summary:\n\n| Aging Bucket | Count | Total |\n|---|---|---|\n| 1-30 days | 8 | ${formatCurrency(45200)} |\n| 31-60 days | 4 | ${formatCurrency(28100)} |\n| 61-90 days | 2 | ${formatCurrency(18500)} |\n| 90+ days | 1 | ${formatCurrency(6150)} |\n\n**Total overdue:** ${formatCurrency(97950)} across 15 invoices.\n\nThe 90+ bucket contains 1 invoice from **Global Retail Group** which I recommend escalating. The collection rate this month is **68.2%**, which is 7% below target.`,
      sources: [
        { label: 'QuickBooks Sync', type: 'erp' },
        { label: 'Aging Analysis', type: 'ai' },
      ]
    };
  }

  if (q.includes('dso') || q.includes('trend') || q.includes('days sales')) {
    return {
      content: `Your DSO trend over the last 6 months shows **positive improvement**:\n\n📊 **Jan:** 42d → **Feb:** 45d → **Mar:** 48d → **Apr:** 44d → **May:** 38d → **Jun:** 35d\n\nDSO has dropped from a peak of **48 days** in March to **35 days** in June — a **27% improvement**.\n\nKey drivers:\n- AI-driven follow-up automation reduced average response time by 3 days\n- Payment plan adoption increased by 15%\n- Promise-to-pay fulfillment rate improved to 82%\n\nAt this rate, you're on track to hit the **30-day target** by Q3.`,
      sources: [
        { label: 'Cash Forecast Model', type: 'ai' },
        { label: 'Historical Payments', type: 'data' },
      ]
    };
  }

  if (q.includes('risk') || q.includes('highest risk') || q.includes('risky')) {
    return {
      content: `Here are your **highest risk accounts** ranked by AI propensity score:\n\n1. 🔴 **Global Retail Group** — Score: 25/100 (very low propensity to pay)\n   - ${formatCurrency(18500)} outstanding, 72 days overdue\n   - Pattern: *chronic_late*, responds only to escalation\n\n2. 🔴 **CloudBase Inc** — Score: 40/100\n   - ${formatCurrency(12200)} outstanding, broken promise\n   - Pattern: *usually_late*, prefers SMS contact\n\n3. 🟡 **Metro Design Studio** — Score: 55/100\n   - ${formatCurrency(5200)} outstanding, 35 days overdue\n   - Pattern: *sometimes_late*, high dispute rate\n\nI recommend focusing on **Global Retail Group** first due to the highest balance and lowest recovery probability.`,
      sources: [
        { label: 'Risk Scoring Engine', type: 'ai' },
        { label: 'Behavioral Profiles', type: 'data' },
      ]
    };
  }

  // Default response
  return {
    content: `I analyzed your AR portfolio to answer that. Here's what I found:\n\n**Current Portfolio Health:**\n- Total outstanding: ${formatCurrency(142500)}\n- Collection rate: 68.2%\n- Active disputes: 3\n- Pending promises: 4 (worth ${formatCurrency(28400)})\n\nThe AI agent has completed **14 actions today** including 6 reminder emails, 2 promise captures, and 1 dispute detection.\n\nIs there something specific you'd like me to dig into? I can help with account reviews, draft communications, or run scenario forecasts.`,
    sources: [
      { label: 'Dashboard Metrics', type: 'data' },
      { label: 'Agent Activity Log', type: 'ai' },
    ]
  };
}

export default function AskAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messageIdRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = text || input.trim();
    if (!query || isTyping) return;
    const messageBatch = messageIdRef.current++;
    const createdAt = new Date();

    const userMsg: Message = {
      id: `msg-${messageBatch}-user`,
      role: 'user',
      content: query,
      timestamp: createdAt,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    const thinkingMsg: Message = {
      id: `msg-${messageBatch}-thinking`,
      role: 'agent',
      content: '',
      timestamp: createdAt,
      isThinking: true,
    };
    setMessages(prev => [...prev, thinkingMsg]);

    // Simulate response time (1.5-3s)
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));

    const response = getAgentResponse(query);
    const agentMsg: Message = {
      id: `msg-${messageBatch}-agent`,
      role: 'agent',
      content: response.content,
      timestamp: new Date(),
      sources: response.sources,
    };

    setMessages(prev => [...prev.filter(m => !m.isThinking), agentMsg]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([]);
    setIsTyping(false);
    inputRef.current?.focus();
  };

  const renderContent = (content: string) => {
    // Basic markdown-like rendering
    return content.split('\n').map((line, i) => {
      // Bold
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      rendered = rendered.replace(/\*(.*?)\*/g, '<em>$1</em>');

      // Table header
      if (rendered.startsWith('|') && rendered.includes('---')) {
        return null; // Skip separator line
      }
      if (rendered.startsWith('|')) {
        const cells = rendered.split('|').filter(c => c.trim());
        const isHeader = i > 0 && content.split('\n')[i + 1]?.includes('---');
        return (
          <div key={i} className={isHeader ? styles.tableRowHeader : styles.tableRow}>
            {cells.map((cell, j) => (
              <span key={j} className={styles.tableCell}>{cell.trim()}</span>
            ))}
          </div>
        );
      }

      if (rendered.trim() === '') return <br key={i} />;

      return (
        <p key={i} className={styles.messageLine} dangerouslySetInnerHTML={{ __html: rendered }} />
      );
    });
  };

  return (
    <div className={styles.container}>
      {messages.length === 0 ? (
        /* Empty State — Welcome */
        <div className={styles.welcomeContainer}>
          <div className={styles.welcomeHero}>
            <div className={styles.agentAvatar}>
              <BrainCircuit size={32} />
            </div>
            <h1 className={styles.welcomeTitle}>Ask your AR Agent</h1>
            <p className={styles.welcomeDesc}>
              Get instant answers about your receivables, customer risk, forecasts, and collection strategy. Powered by your live AR data.
            </p>
          </div>

          <div className={styles.promptGrid}>
            {SUGGESTED_PROMPTS.map((prompt, idx) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={idx}
                  className={`glass-panel ${styles.promptCard}`}
                  onClick={() => handleSend(prompt.text)}
                >
                  <Icon size={18} className={styles.promptIcon} />
                  <span>{prompt.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Chat Thread */
        <div className={styles.chatContainer}>
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderLeft}>
              <div className={styles.agentAvatarSm}>
                <BrainCircuit size={16} />
              </div>
              <span className={styles.chatHeaderTitle}>AR Agent</span>
              <span className={styles.onlineDot} />
            </div>
            <button className={styles.resetBtn} onClick={handleReset}>
              <RotateCcw size={14} /> New conversation
            </button>
          </div>

          <div className={styles.messagesArea}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${msg.role === 'user' ? styles.messageUser : styles.messageAgent}`}
              >
                <div className={styles.messageAvatar}>
                  {msg.role === 'user' ? (
                    <User size={16} />
                  ) : (
                    <BrainCircuit size={16} />
                  )}
                </div>
                <div className={styles.messageBubble}>
                  {msg.isThinking ? (
                    <div className={styles.thinkingDots}>
                      <span /><span /><span />
                    </div>
                  ) : (
                    <>
                      <div className={styles.messageContent}>
                        {renderContent(msg.content)}
                      </div>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className={styles.sourcesBar}>
                          <Sparkles size={12} className={styles.sourcesIcon} />
                          {msg.sources.map((src, i) => (
                            <span key={i} className={styles.sourceTag} data-type={src.type}>
                              {src.label}
                            </span>
                          ))}
                        </div>
                      )}
                      {msg.role === 'agent' && (
                        <div className={styles.messageActions}>
                          <button
                            className={styles.copyBtn}
                            onClick={() => handleCopy(msg.id, msg.content)}
                          >
                            {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === msg.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Area — always visible */}
      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <textarea
            ref={inputRef}
            className={styles.inputField}
            placeholder="Ask about invoices, customers, forecasts, or collections strategy..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isTyping}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send size={18} />
          </button>
        </div>
        <div className={styles.inputDisclaimer}>
          AR Agent uses your live QuickBooks data, communication logs, and AI models. Responses are for guidance only.
        </div>
      </div>
    </div>
  );
}
