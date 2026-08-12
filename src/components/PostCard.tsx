import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { AttemptTimeline } from '@/components/AttemptTimeline';
import { usePostAttempts } from '@/hooks/usePosts';
import type { Post } from '@/lib/types';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { attempts, loading: attemptsLoading } = usePostAttempts(
    expanded ? post.id : null
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden transition-shadow hover:shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-400 mb-1">
              Topic: <span className="text-stone-600">{post.topic}</span>
            </p>
            {post.content ? (
              <p className="text-stone-800 leading-relaxed font-serif text-base">
                {post.content}
              </p>
            ) : post.status === 'generating' ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-sm text-stone-400">
                  Generating and validating...
                </span>
              </div>
            ) : null}
          </div>
          <StatusBadge status={post.status} />
        </div>

        {post.status === 'held' && post.held_reasons && post.held_reasons.length > 0 && (
          <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Post held for review
              </span>
            </div>
            <ul className="text-xs text-amber-700 space-y-0.5">
              {post.held_reasons.map((r, i) => (
                <li key={i}>- {r}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
          <span className="text-xs text-stone-400">
            {new Date(post.created_at).toLocaleString()}
            {post.attempt_count > 0 && (
              <span className="ml-2">
                {post.attempt_count} attempt{post.attempt_count !== 1 ? 's' : ''}
              </span>
            )}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            Audit trail
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-stone-100 bg-stone-50/50 p-5">
          <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Generation attempts
          </h4>
          <AttemptTimeline attempts={attempts} loading={attemptsLoading} />
        </div>
      )}
    </div>
  );
}
