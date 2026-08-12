import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Post, PostAttempt } from '@/lib/types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch posts:', error);
      return;
    }
    setPosts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 3000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  const generatePost = async (topic: string): Promise<string | null> => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-post`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || `Request failed (${response.status})`);
    }

    const data = await response.json();
    await fetchPosts();
    return data.postId;
  };

  return { posts, loading, generatePost, refreshPosts: fetchPosts };
}

export function usePostAttempts(postId: string | null) {
  const [attempts, setAttempts] = useState<PostAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!postId) {
      setAttempts([]);
      return;
    }

    setLoading(true);
    const fetchAttempts = async () => {
      const { data, error } = await supabase
        .from('post_attempts')
        .select('*')
        .eq('post_id', postId)
        .order('attempt_number', { ascending: true });

      if (error) {
        console.error('Failed to fetch attempts:', error);
        return;
      }
      setAttempts(data ?? []);
      setLoading(false);
    };

    fetchAttempts();
    const interval = setInterval(fetchAttempts, 2000);
    return () => clearInterval(interval);
  }, [postId]);

  return { attempts, loading };
}
