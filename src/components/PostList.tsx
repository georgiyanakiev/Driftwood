import { Inbox } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import type { Post } from '@/lib/types';

interface PostListProps {
  posts: Post[];
  loading: boolean;
}

export function PostList({ posts, loading }: PostListProps) {
  if (loading) {
    return (
      <div className="py-16 text-center text-stone-400 text-sm">
        Loading posts...
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-16 text-center">
        <Inbox className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-stone-400 text-sm">
          No posts yet. Enter a topic above to generate one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
