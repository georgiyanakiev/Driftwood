import { CheckCircle2, XCircle, Shield, MessageSquare } from 'lucide-react';
import type { PostAttempt } from '@/lib/types';

interface AttemptTimelineProps {
  attempts: PostAttempt[];
  loading: boolean;
}

export function AttemptTimeline({ attempts, loading }: AttemptTimelineProps) {
  if (loading) {
    return (
      <div className="py-8 text-center text-stone-400 text-sm">
        Loading audit trail...
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="py-8 text-center text-stone-400 text-sm">
        No attempts recorded yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {attempts.map((attempt) => (
        <div
          key={attempt.id}
          className={`rounded-xl border p-4 transition-colors ${
            attempt.passed
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-red-200 bg-red-50/50'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {attempt.passed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-stone-700">
                Attempt {attempt.attempt_number}
              </span>
            </div>
            <span className="text-xs text-stone-400">
              {new Date(attempt.created_at).toLocaleTimeString()}
            </span>
          </div>

          <p className="text-sm text-stone-700 mb-3 leading-relaxed font-serif italic">
            "{attempt.content}"
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-stone-500 mt-0.5 shrink-0" />
              <div className="text-xs">
                {attempt.validator_result.passed ? (
                  <span className="text-emerald-600 font-medium">Rule check passed</span>
                ) : (
                  <div>
                    <span className="text-red-600 font-medium">Rule violations:</span>
                    <ul className="mt-1 space-y-0.5">
                      {attempt.validator_result.violations.map((v, i) => (
                        <li key={i} className="text-red-600">
                          {v.reason}
                          {v.matched && (
                            <span className="text-red-400 ml-1">
                              (matched: "{v.matched}")
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {attempt.reviewer_result && (
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-stone-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className={`font-medium ${
                    attempt.reviewer_result.score >= 7
                      ? 'text-emerald-600'
                      : attempt.reviewer_result.score >= 4
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}>
                    Voice score: {attempt.reviewer_result.score}/10
                  </span>
                  {attempt.reviewer_result.concerns.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-stone-500">
                      {attempt.reviewer_result.concerns.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {!attempt.passed && attempt.rejection_reasons && attempt.rejection_reasons.length > 0 && (
              <div className="mt-2 px-3 py-2 bg-white/60 rounded-lg">
                <span className="text-xs font-medium text-stone-600">Rejection fed back to model:</span>
                <ul className="mt-1 text-xs text-stone-500 space-y-0.5">
                  {attempt.rejection_reasons.map((r, i) => (
                    <li key={i}>- {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
