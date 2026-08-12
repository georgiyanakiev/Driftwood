import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// --- Brand prompt (single source of truth) ---

const BRAND_SYSTEM_PROMPT = `You are writing social media posts for Driftwood, a small-batch coffee subscription.

Voice: warm, plain-spoken, a little dry. You talk like a person, not a billboard.
Think: a friend who roasts good coffee and doesn't need to shout about it.

Rules (these are hard constraints, not suggestions):
- No exclamation marks. Ever.
- No emoji of any kind.
- No ALL-CAPS words (common acronyms like AM/PM are fine).
- No absolute claims: never say "the best", "guaranteed", "100%", "risk-free", "#1", "perfect", "flawless", "unmatched", "number one".
- Never name another coffee brand or competitor.
- No hard-sell urgency: no "buy now", "limited time", "act now", "use code", "don't miss out", "hurry", "order now", "last chance", "claim your".
- No hashtags.
- No questions directed at the reader that feel like marketing ("Ready to try?", "Want better coffee?").

What good Driftwood posts sound like:
- "We roasted a new blend this week. Tastes like brown sugar and a little bit of trouble."
- "Cold brew season is here, if you're the kind of person who needs an excuse."
- "Our Honduras lot is back. Same farmer, same careful process, still surprises us every time."
- "Some mornings call for a pour-over. Today was one of those mornings."

Write only the post text. Nothing else. No preamble, no explanation, no quotation marks around it.
Keep it to 1-3 sentences. Short is better.`;

// --- Deterministic Validator ---

interface Violation {
  category: string;
  reason: string;
  matched: string;
  index: number;
}

interface ValidatorResult {
  passed: boolean;
  violations: Violation[];
}

interface BannedRule {
  category: string;
  patterns: RegExp[];
  reason: string;
}

const CAPS_ALLOWLIST = new Set([
  "AM", "PM", "EST", "PST", "CST", "MST", "EDT", "PDT", "CDT", "MDT",
  "US", "UK", "EU", "OK", "ID", "FAQ", "URL", "API", "CEO", "COO",
  "DM", "PR", "NYC", "SFO", "LAX", "PDF", "RSS", "SEO", "UPS", "USPS",
  "FYI", "TBD", "ETD", "ETA", "DIY",
]);

const BANNED_PATTERNS: BannedRule[] = [
  {
    category: "exclamation",
    patterns: [/!/],
    reason: "Exclamation marks are not allowed",
  },
  {
    category: "emoji",
    patterns: [
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u,
    ],
    reason: "Emoji are not allowed",
  },
  {
    category: "absolute_claims",
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
    reason: "Absolute or guarantee claims are not allowed",
  },
  {
    category: "hard_sell_urgency",
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
    reason: "Hard-sell urgency language is not allowed",
  },
  {
    category: "competitor_names",
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
      /\bphilz\b/i,
    ],
    reason: "Competitor names are never mentioned",
  },
  {
    category: "hashtags",
    patterns: [/#\w{2,}/],
    reason: "Hashtags are not allowed",
  },
];

function checkAllCaps(content: string): Violation | null {
  const words = content.match(/\b[A-Z]{3,}\b/g);
  if (!words) return null;
  for (const word of words) {
    if (!CAPS_ALLOWLIST.has(word)) {
      return {
        category: "all_caps_hype",
        reason: `ALL-CAPS word "${word}" is not allowed`,
        matched: word,
        index: content.indexOf(word),
      };
    }
  }
  return null;
}

function validate(content: string): ValidatorResult {
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
  if (capsViolation) violations.push(capsViolation);
  return { passed: violations.length === 0, violations };
}

// --- LLM Generator ---

async function generatePost(
  topic: string,
  previousRejections: string[],
  apiKey: string
): Promise<string> {
  let userPrompt = `Write a social media post about: ${topic}\n\nKeep it to 1-3 sentences. No hashtags.`;

  if (previousRejections.length > 0) {
    userPrompt += `\n\nYour previous attempt was rejected for these reasons:\n`;
    userPrompt += previousRejections.map((r) => `- ${r}`).join("\n");
    userPrompt += `\n\nPlease fix these issues in your new attempt.`;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      messages: [
        { role: "user", content: userPrompt },
      ],
      system: BRAND_SYSTEM_PROMPT,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.content[0].text.trim();
}

// --- LLM Reviewer ---

const REVIEW_SYSTEM_PROMPT = `You are a brand voice reviewer for Driftwood, a small-batch coffee subscription.

Their voice is: warm, plain-spoken, a little dry. Talks like a person, not a billboard. No exclamation marks, no emoji, no hype.

Score the following social media post from 1-10 on voice alignment:
- 9-10: Sounds exactly like Driftwood. Warm, dry, human.
- 7-8: Good. Minor tone issues but publishable.
- 4-6: Off-brand. Too corporate, too enthusiastic, too generic, or trying too hard.
- 1-3: Wrong voice entirely. Sounds like ad copy or a different brand.

Respond with ONLY valid JSON, no other text:
{"score": <number>, "concerns": ["<concern 1>", "<concern 2>"]}

If score is 7+, concerns can be an empty array.`;

interface ReviewerResult {
  score: number;
  concerns: string[];
}

async function reviewPost(
  content: string,
  topic: string,
  apiKey: string
): Promise<ReviewerResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Topic: ${topic}\n\nPost: ${content}`,
        },
      ],
      system: REVIEW_SYSTEM_PROMPT,
    }),
  });

  if (!response.ok) {
    throw new Error(`Reviewer API error (${response.status})`);
  }

  const data = await response.json();
  const raw = data.content[0].text.trim();
  const parsed = JSON.parse(raw);
  return {
    score: typeof parsed.score === "number" ? parsed.score : 0,
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
  };
}

// --- Orchestrator ---

const MAX_ATTEMPTS = 3;
const REVIEWER_MIN_SCORE = 4;

async function orchestrate(
  postId: string,
  topic: string,
  supabase: ReturnType<typeof createClient>,
  apiKey: string
): Promise<void> {
  let previousRejections: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let content: string;
    try {
      content = await generatePost(topic, previousRejections, apiKey);
    } catch (err) {
      const reasons = [`Generation failed: ${(err as Error).message}`];
      await logAttempt(supabase, postId, attempt, `[generation failed]`, { passed: false, violations: [] }, null, false, reasons);
      previousRejections = reasons;
      continue;
    }

    const validatorResult = validate(content);

    if (!validatorResult.passed) {
      const reasons = validatorResult.violations.map((v) => v.reason);
      await logAttempt(supabase, postId, attempt, content, validatorResult, null, false, reasons);
      previousRejections = reasons;
      continue;
    }

    let reviewerResult: ReviewerResult | null = null;
    try {
      reviewerResult = await reviewPost(content, topic, apiKey);
    } catch (err) {
      console.error("Reviewer failed, proceeding without review:", err);
    }

    const reviewPassed =
      !reviewerResult || reviewerResult.score >= REVIEWER_MIN_SCORE;

    if (!reviewPassed) {
      const reasons = reviewerResult?.concerns ?? ["Voice review failed"];
      await logAttempt(supabase, postId, attempt, content, validatorResult, reviewerResult, false, reasons);
      previousRejections = reasons;
      continue;
    }

    await logAttempt(supabase, postId, attempt, content, validatorResult, reviewerResult, true, []);
    await supabase
      .from("posts")
      .update({
        content,
        status: "published",
        attempt_count: attempt,
        published_at: new Date().toISOString(),
      })
      .eq("id", postId);
    return;
  }

  await supabase
    .from("posts")
    .update({
      status: "held",
      attempt_count: MAX_ATTEMPTS,
      held_reasons: previousRejections,
    })
    .eq("id", postId);
}

async function logAttempt(
  supabase: ReturnType<typeof createClient>,
  postId: string,
  attemptNumber: number,
  content: string,
  validatorResult: ValidatorResult,
  reviewerResult: ReviewerResult | null,
  passed: boolean,
  rejectionReasons: string[]
): Promise<void> {
  await supabase.from("post_attempts").insert({
    post_id: postId,
    attempt_number: attemptNumber,
    content,
    validator_result: validatorResult,
    reviewer_result: reviewerResult,
    passed,
    rejection_reasons: rejectionReasons,
  });
}

// --- Edge Function Handler ---

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { topic } = await req.json();
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: post, error } = await supabase
      .from("posts")
      .insert({ topic: topic.trim(), status: "generating" })
      .select()
      .single();

    if (error) throw error;

    const orchestrationPromise = orchestrate(
      post.id,
      topic.trim(),
      supabase,
      anthropicKey
    ).catch((err) => {
      console.error("Orchestration failed:", err);
      supabase
        .from("posts")
        .update({
          status: "held",
          held_reasons: [`Pipeline error: ${(err as Error).message}`],
        })
        .eq("id", post.id);
    });

    // @ts-ignore - EdgeRuntime available in Supabase edge functions
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(orchestrationPromise);
      return new Response(
        JSON.stringify({ postId: post.id, status: "generating" }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await orchestrationPromise;

    const { data: updatedPost } = await supabase
      .from("posts")
      .select()
      .eq("id", post.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ postId: post.id, status: updatedPost?.status ?? "generating", post: updatedPost }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-post error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
