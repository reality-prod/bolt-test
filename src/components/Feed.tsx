import { useState, useEffect, useCallback } from 'react';
import { postsApi, PostWithUser } from '../lib/api';
import { useAuth } from '../hooks/useAuthApi';
import { PostCard } from './PostCard';
import { ComposePost } from './ComposePost';
import { Sparkles, Clock, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

type FeedTab = 'for-you' | 'following' | 'trending';

export function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('for-you');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await postsApi.getAll(50);

    if (fetchError) {
      setError(fetchError);
      setLoading(false);
      return;
    }

    if (data) {
      setPosts(data.posts || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [activeTab, fetchPosts]);

  const tabs = [
    { id: 'for-you' as FeedTab, label: 'For You', icon: Sparkles },
    { id: 'following' as FeedTab, label: 'Following', icon: Clock },
    { id: 'trending' as FeedTab, label: 'Trending', icon: TrendingUp },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Feed Header */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold text-white">Home</h2>
          <button
            onClick={fetchPosts}
            disabled={loading}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Compose */}
      {user && <ComposePost profile={user} onPost={fetchPosts} />}

      {/* Error State */}
      {error && (
        <div className="p-8 text-center">
          <div className="flex flex-col items-center gap-4 p-6 bg-red-500/10 border border-red-500/30 rounded-xl m-4">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">Failed to load posts</p>
              <p className="text-slate-500 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={fetchPosts}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Try Again
            </button>
          </div>
          <p className="text-slate-600 text-sm">
            Make sure the backend server is running on port 3001
          </p>
        </div>
      )}

      {/* Posts */}
      <div className="divide-y divide-slate-800">
        {!error && loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !error && posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 mb-2">No posts yet</p>
            <p className="text-slate-500 text-sm">
              {activeTab === 'following'
                ? 'Follow some people to see their posts here'
                : 'Be the first to post!'}
            </p>
          </div>
        ) : (
          !error && posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))
        )}
      </div>
    </div>
  );
}
