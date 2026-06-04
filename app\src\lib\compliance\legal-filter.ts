// ============================================
// Legal Language Filter
// A strict safety net to block prohibited debt collection language
// ============================================

export interface LegalFilterResult {
  isClean: boolean;
  violations: string[];
}

// Prohibited terms or regex patterns based on FDCPA / general B2B legal safety
// NOTE: B2B collections are technically exempt from FDCPA in many jurisdictions,
// but maintaining a strict filter prevents aggressive or brand-damaging AI behavior.
const PROHIBITED_PATTERNS = [
  /\b(sue)\b/i,
  /\b(lawsuit)\b/i,
  /\b(police)\b/i,
  /\b(arrest)\b/i,
  /\b(jail)\b/i,
  /\b(ruin\s+your\s+credit)\b/i,
  /\b(credit\s+score)\b/i,
  /\b(harass)\b/i,
  /\b(threat)\b/i,
  /\b(seize\s+assets)\b/i,
  /\b(collections\s+agency)\b/i, // We are acting as first-party, not third-party agency
];

export function checkLegalCompliance(emailBody: string): LegalFilterResult {
  const violations: string[] = [];
  
  for (const pattern of PROHIBITED_PATTERNS) {
    const match = emailBody.match(pattern);
    if (match) {
      violations.push(match[0].toLowerCase());
    }
  }

  return {
    isClean: violations.length === 0,
    violations,
  };
}
