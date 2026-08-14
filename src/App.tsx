import { TopicInput } from '@/components/TopicInput';
import { PostList } from '@/components/PostList';
import { PipelineDiagram } from '@/components/PipelineDiagram';
import { Stats } from '@/components/Stats';
import { usePosts } from '@/hooks/usePosts';

function App() {
  const { posts, loading, generatePost } = usePosts();

  const handleGenerate = async (topic: string) => {
    await generatePost(topic);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              Driftwood
            </h1>
            <span className="text-xs text-stone-400 font-medium tracking-wide uppercase">
              Content Pipeline
            </span>
          </div>
          <p className="text-sm text-stone-500 mt-1">
            Generate on-brand social media posts with deterministic safety guarantees
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <PipelineDiagram />

        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <TopicInput onGenerate={handleGenerate} />
        </div>

        <Stats posts={posts} />

        <div>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Generated Posts
          </h3>
          <PostList posts={posts} loading={loading} />
        </div>
      </main>
    </div>
  );
}

export default App;
