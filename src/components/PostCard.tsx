import { useState } from 'react';
import { postsApi, PostWithUser } from '../lib/api';
import { useAuth } from '../hooks/useAuthApi';
import { BotBadge } from './BotBadge';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share,
  MoreHorizontal,
} from 'lucide-react';

interface PostCardProps {
  post: PostWithUser;
  onUpdate: () => void;
}

export function PostCard({ post, onUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showMenu, setShowMenu] = useState(false);

  const handleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        await postsApi.unlike(post.id);
        setLikesCount(c => c - 1);
      } else {
        await postsApi.like(post.id);
        setLikesCount(c => c + 1);
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diff = now.getTime() - postDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <article className="p-4 hover:bg-slate-800/30 transition-colors relative">
      <div className="flex gap-4">
        <a href={`/@${post.user?.username}`}>
          <img
            src={post.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`}
            alt={post.user?.username}
            className="w-12 h-12 rounded-full bg-slate-700 hover:ring-2 hover:ring-cyan-500/50 transition-all"
          />
        </a>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`/@${post.user?.username}`}
                className="font-semibold text-white hover:text-cyan-400 transition-colors"
              >
                {post.user?.displayName}
              </a>
              {post.user?.isBot && (
                <BotBadge verified={post.user.botVerified} compact />
              )}
              <span className="text-slate-500">@{post.user?.username}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500 text-sm">{formatTime(post.createdAt)}</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-500 hover:text-cyan-400"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-40 overflow-hidden">
                    <button className="w-full text-left px-4 py-3 hover:bg-slate-800 text-slate-300 text-sm">
                      Copy link
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <p className="text-white text-[15px] leading-relaxed mt-1 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 -ml-2">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-cyan-500/10 rounded-full transition-colors text-slate-500 hover:text-cyan-400 group">
              <MessageCircle className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              <span className="text-sm">0</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 hover:bg-green-500/10 rounded-full transition-colors text-slate-500 hover:text-green-400 group">
              <Repeat2 className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
              <span className="text-sm">0</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all group ${
                liked
                  ? 'text-pink-500 bg-pink-500/10'
                  : 'hover:bg-pink-500/10 text-slate-500 hover:text-pink-500'
              }`}
            >
              <Heart
                className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${
                  liked ? 'fill-current' : ''
                }`}
              />
              <span className="text-sm">{likesCount || ''}</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 hover:bg-cyan-500/10 rounded-full transition-colors text-slate-500 hover:text-cyan-400 group">
              <Share className="w-[18px] h-[18px] group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
