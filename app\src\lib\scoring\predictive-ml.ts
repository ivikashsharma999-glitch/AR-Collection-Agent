import type { Invoice, Customer, BehavioralProfile, RiskSegment } from '@/types';

export interface MLScoreResult {
  propensity_score: number; // 0-100%, higher means more likely to pay soon
  risk_segment: RiskSegment;
  factors: {
    macro_economic: number; // e.g. -5 to +5 impact
    behavioral_drift: number;
    engagement: number;
    base_history: number;
  };
}

/**
 * Simulates an ML prediction model for Payment Likelihood.
 * In a production setting, this would call out to a real SageMaker/Vertex AI endpoint.
 */
export function calculatePaymentLikelihood(
  invoice: Invoice,
  customer?: Customer,
  profile?: BehavioralProfile
): MLScoreResult {
  // 1. Base History (0-100)
  let baseHistory = 50;
  if (profile) {
    if (profile.pay_pattern === 'always_on_time') baseHistory = 90;
    else if (profile.pay_pattern === 'usually_late') baseHistory = 60;
    else if (profile.pay_pattern === 'chronic_late') baseHistory = 20;
    else if (profile.pay_pattern === 'unpredictable') baseHistory = 40;
  }

  // 2. Behavioral Drift (-20 to +20)
  // Simulated: If they have a high dispute rate, their drift is negative.
  let behavioralDrift = 0;
  if (profile && profile.dispute_rate > 0.2) {
    behavioralDrift = -15;
  } else if (profile && profile.avg_days_late > 15) {
    behavioralDrift = -10;
  } else if (profile && profile.avg_days_late <= 5) {
    behavioralDrift = 15;
  }

  // 3. Engagement (-15 to +15)
  // Simulated based on whether they have a preferred response channel
  let engagement = 0;
  if (profile?.response_channel_preference) {
    engagement = 10;
  } else if (invoice.days_overdue > 30) {
    engagement = -10; // Penalize long overdue with no engagement
  }

  // 4. Macro-Economic / Firmographics (-5 to +5)
  // Simulated: Tech companies (from mock data) might have slightly lower cash flow right now
  let macroEconomic = 0;
  if (customer?.name.toLowerCase().includes('tech') || customer?.name.toLowerCase().includes('saas') || customer?.name.toLowerCase().includes('cloud')) {
    macroEconomic = -5;
  } else {
    macroEconomic = 5;
  }

  // 5. Age Decay (The older the invoice, the less likely it gets paid)
  let ageDecay = 0;
  if (invoice.days_overdue > 60) ageDecay = -30;
  else if (invoice.days_overdue > 30) ageDecay = -15;
  else if (invoice.days_overdue > 15) ageDecay = -5;

  // Calculate total propensity (clamped between 5 and 98 to look realistic)
  let totalScore = baseHistory + behavioralDrift + engagement + macroEconomic + ageDecay;
  totalScore = Math.min(98, Math.max(5, totalScore));

  // Determine Segment based on Score
  let riskSegment: RiskSegment;
  if (totalScore >= 80) riskSegment = 'good_payer';
  else if (totalScore >= 60) riskSegment = 'low_risk';
  else if (totalScore >= 40) riskSegment = 'medium_risk';
  else if (totalScore >= 20) riskSegment = 'high_risk';
  else riskSegment = 'chronic_late';

  return {
    propensity_score: Math.round(totalScore),
    risk_segment: riskSegment,
    factors: {
      base_history: baseHistory,
      behavioral_drift: behavioralDrift,
      engagement,
      macro_economic: macroEconomic,
    }
  };
}
