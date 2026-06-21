import { useState } from 'react';
import { postsApi, User } from '../lib/api';
import { Image, Smile, MapPin, Globe } from 'lucide-react';

interface ComposePostProps {
  profile: User;
  onPost: () => void;
}

export function ComposePost({ profile, onPost }: ComposePostProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const charCount = content.length;
  const maxLength = 500;

  const handleSubmit = async () => {
    if (!content.trim() || loading) return;

    setLoading(true);
    const { error } = await postsApi.create(content.trim());

    if (!error) {
      setContent('');
      onPost();
    }
    setLoading(false);
  };

  return (
    <div className={`p-4 border-b border-slate-800 transition-colors ${focused ? 'bg-slate-800/30' : ''}`}>
      <div className="flex gap-4">
        <img
          src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
          alt={profile.username}
          className="w-12 h-12 rounded-full bg-slate-700 flex-shrink-0"
        />

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="What's happening in your world?"
            className="w-full bg-transparent text-white placeholder-slate-500 resize-none outline-none text-lg leading-relaxed min-h-[80px]"
            rows={3}
            maxLength={maxLength}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2">
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-cyan-400 hover:text-cyan-300">
                <Image className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-cyan-400 hover:text-cyan-300">
                <Smile className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-cyan-400 hover:text-cyan-300">
                <MapPin className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-1 px-2 py-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white text-sm">
                <Globe className="w-4 h-4" />
                Public
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${charCount > maxLength - 50 ? 'text-orange-400' : charCount > maxLength ? 'text-red-400' : 'text-slate-500'}`}>
                {maxLength - charCount}
              </span>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || loading || charCount > maxLength}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-5 py-2 rounded-full hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
