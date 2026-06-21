import { useState, useEffect } from 'react';
import { usersApi, User } from '../lib/api';
import { useAuth } from '../hooks/useAuthApi';
import { BotBadge } from './BotBadge';
import { Search, TrendingUp, Users, Hash, ArrowRight, Bot } from 'lucide-react';

export function RightPanel() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, [user]);

  const fetchSuggestions = async () => {
    const { data } = await usersApi.getAll();
    if (data) {
      // Filter out current user
      const filtered = (data.users || []).filter(u => u.id !== user?.id);
      setSuggestions(filtered);
    }
  };

  const handleFollow = async (targetUsername: string) => {
    const isFollowing = following.has(targetUsername);

    if (isFollowing) {
      await usersApi.unfollow(targetUsername);
      setFollowing(prev => {
        const next = new Set(prev);
        next.delete(targetUsername);
        return next;
      });
    } else {
      await usersApi.follow(targetUsername);
      setFollowing(prev => new Set(prev).add(targetUsername));
    }
  };

  const trending = [
    { tag: 'ActivityPub', count: 1234 },
    { tag: 'Decentralization', count: 987 },
    { tag: 'OpenSource', count: 756 },
    { tag: 'Fediverse', count: 543 },
    { tag: 'DataSovereignty', count: 432 },
  ];

  return (
    <div className="sticky top-0 p-4 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search JailBreak"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
        />
      </div>

      {/* Trending Section */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-white">Trending</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {trending.map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex-1 text-left">
                <p className="text-slate-400 text-xs">Trending in Tech</p>
                <p className="font-medium text-white flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-500" />
                  {item.tag}
                </p>
                <p className="text-slate-500 text-xs">{item.count.toLocaleString()} posts</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
        <button className="w-full px-4 py-3 text-cyan-400 hover:bg-slate-800/50 transition-colors text-sm font-medium">
          Show more
        </button>
      </div>

      {/* Who to Follow */}
      {suggestions.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white">Who to Follow</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {suggestions.slice(0, 5).map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 px-4 py-3">
                <div className="relative">
                  <img
                    src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                    alt={profile.username}
                    className="w-10 h-10 rounded-full bg-slate-700"
                  />
                  {profile.isBot && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                      <Bot className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">{profile.displayName}</p>
                    {profile.isBot && <BotBadge compact />}
                  </div>
                  <p className="text-slate-500 text-sm truncate">@{profile.username}</p>
                </div>
                <button
                  onClick={() => handleFollow(profile.username)}
                  className={`px-4 py-1.5 rounded-full font-semibold text-sm transition-all ${
                    following.has(profile.username)
                      ? 'bg-slate-800 text-white hover:bg-red-500/20 hover:text-red-400'
                      : 'bg-white text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {following.has(profile.username) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
          <button className="w-full px-4 py-3 text-cyan-400 hover:bg-slate-800/50 transition-colors text-sm font-medium">
            Show more
          </button>
        </div>
      )}

      {/* Footer Links */}
      <div className="text-xs text-slate-600 px-2 flex flex-wrap gap-x-3 gap-y-1">
        <span>© 2024 JailBreak</span>
        <a href="http://localhost:3001/users/alice" target="_blank" rel="noopener" className="hover:text-cyan-400 transition-colors">
          ActivityPub Actor
        </a>
      </div>
    </div>
  );
}
