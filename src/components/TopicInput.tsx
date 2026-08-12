import { useState } from 'react';
import { Send, Loader2, Coffee } from 'lucide-react';

interface TopicInputProps {
  onGenerate: (topic: string) => Promise<void>;
}

const SUGGESTED_TOPICS = [
  'New single-origin Ethiopian beans',
  'Morning coffee rituals',
  'Cold brew for summer',
  'Our roasting process',
  'Why we chose small-batch',
  'Coffee and rainy days',
];

export function TopicInput({ onGenerate }: TopicInputProps) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (topicText: string) => {
    const t = topicText.trim();
    if (!t) return;

    setLoading(true);
    setError(null);
    try {
      await onGenerate(t);
      setTopic('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-amber-900/10 flex items-center justify-center">
          <Coffee className="w-5 h-5 text-amber-800" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-stone-800 tracking-wide uppercase">New Post</h2>
          <p className="text-xs text-stone-500">Enter a topic and the pipeline will generate, validate, and review</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(topic);
        }}
        className="flex gap-3"
      >
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. Our new Colombian single-origin..."
          className="flex-1 px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-800/20 focus:border-amber-800/30 transition-all text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="px-5 py-3 bg-amber-900 text-white rounded-xl font-medium text-sm hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Generate
        </button>
      </form>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => handleSubmit(t)}
            disabled={loading}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs rounded-lg transition-colors disabled:opacity-40"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
