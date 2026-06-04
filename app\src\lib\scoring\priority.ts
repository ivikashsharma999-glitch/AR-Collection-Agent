// ============================================
// AR Collections Agent — Priority Scoring Engine
// Rule-based scoring: age × amount × history × dispute × renewal
// ============================================

import type { Invoice, Customer, BehavioralProfile, PriorityBreakdown } from '@/types';
import { calculatePaymentLikelihood } from './predictive-ml';

const WEIGHTS = {
  age: 0.30,
  amount: 0.20,
  dispute: 0.10,
  renewal: 0.10,
  ml_propensity: 0.30, // New weight for the ML engine
};

/**
 * Score based on how overdue the invoice is.
 * 0-7 days: low urgency. 60+ days: maximum urgency.
 */
function scoreAge(daysOverdue: number): number {
  if (daysOverdue <= 0) return 0;
  if (daysOverdue <= 7) return 20;
  if (daysOverdue <= 14) return 35;
  if (daysOverdue <= 21) return 50;
  if (daysOverdue <= 30) return 65;
  if (daysOverdue <= 45) return 80;
  if (daysOverdue <= 60) return 90;
  return 100;
}

/**
 * Score based on invoice amount.
 * Higher amounts = higher priority.
 */
function scoreAmount(amountDue: number): number {
  if (amountDue <= 500) return 10;
  if (amountDue <= 1000) return 20;
  if (amountDue <= 2500) return 35;
  if (amountDue <= 5000) return 50;
  if (amountDue <= 10000) return 65;
  if (amountDue <= 25000) return 80;
  if (amountDue <= 50000) return 90;
  return 100;
}

/**
 * Score based on dispute status.
 * Open disputes = deprioritize automated follow-up.
 * No disputes = normal processing.
 */
function scoreDispute(invoiceStatus: string, disputeRate: number): number {
  if (invoiceStatus === 'disputed') return 10; // Already flagged, don't auto-prioritize
  if (disputeRate > 0.3) return 30; // High dispute rate, be careful
  if (disputeRate > 0.1) return 50;
  return 70; // Clean record, safe to pursue
}

/**
 * Score based on renewal proximity.
 * Close to renewal = needs human attention, lower auto-priority.
 */
function scoreRenewal(customer?: Customer): number {
  if (!customer?.renewal_date) return 60; // No renewal info

  const daysToRenewal = Math.floor(
    (new Date(customer.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysToRenewal <= 30) return 15; // Very close, needs human
  if (daysToRenewal <= 60) return 25;
  if (daysToRenewal <= 90) return 35;
  return 60; // Renewal is far, normal processing
}

/**
 * Calculate the full priority score for an invoice.
 * Returns a score 0-100 and the breakdown.
 */
export function calculatePriorityScore(
  invoice: Invoice,
  customer?: Customer,
  profile?: BehavioralProfile
): PriorityBreakdown & { propensity_score?: number } {
  const age_score = scoreAge(invoice.days_overdue);
  const amount_score = scoreAmount(invoice.amount_due);
  const dispute_score = scoreDispute(invoice.status, profile?.dispute_rate ?? 0);
  const renewal_score = scoreRenewal(customer);
  
  // Call the ML Engine
  const mlResult = calculatePaymentLikelihood(invoice, customer, profile);
  
  // Convert Propensity (0-100, high=good) to Priority Risk (0-100, high=bad)
  // E.g., 90% likelihood to pay = 10% risk penalty
  const ml_risk_score = 100 - mlResult.propensity_score;

  const total = Math.round(
    age_score * WEIGHTS.age +
    amount_score * WEIGHTS.amount +
    dispute_score * WEIGHTS.dispute +
    renewal_score * WEIGHTS.renewal +
    ml_risk_score * WEIGHTS.ml_propensity
  );

  return {
    age_score,
    amount_score,
    history_score: ml_risk_score, // We map history_score to the new ML risk score for backwards compatibility in UI
    dispute_score,
    renewal_score,
    propensity_score: mlResult.propensity_score,
    total: Math.min(100, Math.max(0, total)),
  };
}

/**
 * Get urgency level from score.
 */
export function getUrgencyLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Get urgency color for UI.
 */
export function getUrgencyColor(score: number): string {
  if (score >= 80) return 'var(--color-danger)';
  if (score >= 60) return 'var(--color-warning)';
  if (score >= 40) return 'var(--color-info)';
  return 'var(--color-success)';
}
