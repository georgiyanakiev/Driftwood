import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Post, PostAttempt } from '@/lib/types';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      setPosts([]);
      setLoading(false);
      return;
    }

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
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_PROJECT_REF') || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY')) {
      throw new Error('Missing or invalid Supabase configuration. Set the real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values from your Supabase project settings.');
    }

    const apiUrl = `${supabaseUrl}/functions/v1/generate-post`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      const message = err.error || err.message || `Request failed (${response.status})`;
      if (response.status === 401) {
        throw new Error(`Supabase auth failed: ${message}. Check that your project URL and anon key match the live Supabase project.`);
      }
      throw new Error(message);
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
