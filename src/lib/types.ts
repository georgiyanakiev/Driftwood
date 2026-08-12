export interface Post {
  id: string;
  topic: string;
  content: string | null;
  status: 'generating' | 'published' | 'held';
  attempt_count: number;
  held_reasons: string[] | null;
  created_at: string;
  published_at: string | null;
}

export interface PostAttempt {
  id: string;
  post_id: string;
  attempt_number: number;
  content: string;
  validator_result: {
    passed: boolean;
    violations: Array<{
      category: string;
      reason: string;
      matched: string;
      index: number;
    }>;
  };
  reviewer_result: {
    score: number;
    concerns: string[];
  } | null;
  passed: boolean;
  rejection_reasons: string[] | null;
  created_at: string;
}
