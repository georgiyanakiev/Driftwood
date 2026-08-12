export interface Violation {
  category: string;
  reason: string;
  matched: string;
  index: number;
}

export interface ValidatorResult {
  passed: boolean;
  violations: Violation[];
}

interface BannedRule {
  category: string;
  patterns: RegExp[];
  reason: string;
}

const CAPS_ALLOWLIST = new Set([
  'AM', 'PM', 'EST', 'PST', 'CST', 'MST', 'EDT', 'PDT', 'CDT', 'MDT',
  'US', 'UK', 'EU', 'OK', 'ID', 'FAQ', 'URL', 'API', 'CEO', 'COO',
  'DM', 'PR', 'NYC', 'SFO', 'LAX', 'PDF', 'RSS', 'SEO', 'UPS', 'USPS',
  'FYI', 'TBD', 'ETD', 'ETA', 'DIY',
]);

const BANNED_PATTERNS: BannedRule[] = [
  {
    category: 'exclamation',
    patterns: [/!/],
    reason: 'Exclamation marks are not allowed',
  },
  {
    category: 'emoji',
    patterns: [/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/u],
    reason: 'Emoji are not allowed',
  },
  {
    category: 'absolute_claims',
    patterns: [
      /\bguarantee[ds]?\b/i,
      /\b100\s*%/i,
      /\brisk[\s-]*free\b/i,
      /\bthe\s+best\b/i,
      /#\s*1\b/i,
      /\bnumber\s+one\b/i,
      /\bunbeatable\b/i,
      /\bunmatched\b/i,
      /\bunsurpassed\b/i,
      /\bsuperior\s+to\s+all\b/i,
      /\bnothing\s+(else\s+)?comes?\s+close\b/i,
      /\bperfect(ly)?\b/i,
      /\bflawless(ly)?\b/i,
      /\bworld[''']?s?\s+(finest|greatest|best)\b/i,
      /\bthe\s+only\s+coffee\b/i,
    ],
    reason: 'Absolute or guarantee claims are not allowed',
  },
  {
    category: 'hard_sell_urgency',
    patterns: [
      /\bbuy\s+now\b/i,
      /\blimited\s+time\b/i,
      /\bact\s+now\b/i,
      /\buse\s+code\b/i,
      /\border\s+now\b/i,
      /\bdon['']?t\s+miss\s+out\b/i,
      /\bhurry\b/i,
      /\bwhile\s+supplies\s+last\b/i,
      /\bonly\s+\d+\s+\w*\s*left\b/i,
      /\bsale\s+ends\b/i,
      /\bexclusive\s+offer\b/i,
      /\buse\s+discount\b/i,
      /\bpromo\s+code\b/i,
      /\bclaim\s+your\b/i,
      /\bfor\s+a\s+limited\b/i,
      /\blast\s+chance\b/i,
      /\bget\s+yours\s+(before|while|now)\b/i,
      /\bgrab\s+yours\b/i,
      /\bsign\s+up\s+now\b/i,
      /\bsubscribe\s+now\b/i,
    ],
    reason: 'Hard-sell urgency language is not allowed',
  },
  {
    category: 'competitor_names',
    patterns: [
      /\bstarbucks\b/i,
      /\bdunkin['']?\b/i,
      /\bpeet['']?s?\b/i,
      /\bblue\s*bottle\b/i,
      /\bintelligentsia\b/i,
      /\bstumptown\b/i,
      /\bcounter\s*culture\b/i,
      /\blavazza\b/i,
      /\bnespresso\b/i,
      /\bkeurig\b/i,
      /\bfolgers\b/i,
      /\bmaxwell\s+house\b/i,
      /\btim\s+hortons?\b/i,
      /\bcoffee\s+bean\s+(&|and)\s+tea\s+leaf\b/i,
      /\bphilz\b/i,
    ],
    reason: 'Competitor names are never mentioned',
  },
  {
    category: 'hashtags',
    patterns: [/#\w{2,}/],
    reason: 'Hashtags are not allowed',
  },
];

function checkAllCaps(content: string): Violation | null {
  const words = content.match(/\b[A-Z]{3,}\b/g);
  if (!words) return null;

  for (const word of words) {
    if (!CAPS_ALLOWLIST.has(word)) {
      return {
        category: 'all_caps_hype',
        reason: `ALL-CAPS word "${word}" is not allowed`,
        matched: word,
        index: content.indexOf(word),
      };
    }
  }
  return null;
}

export function validate(content: string): ValidatorResult {
  const violations: Violation[] = [];

  for (const rule of BANNED_PATTERNS) {
    for (const pattern of rule.patterns) {
      const match = content.match(pattern);
      if (match) {
        violations.push({
          category: rule.category,
          reason: rule.reason,
          matched: match[0],
          index: match.index ?? -1,
        });
        break;
      }
    }
  }

  const capsViolation = checkAllCaps(content);
  if (capsViolation) {
    violations.push(capsViolation);
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
