import { useState } from 'react';
import { usersApi } from '../lib/api';
import { useAuth } from '../hooks/useAuthApi';
import { BotBadge } from './BotBadge';
import { X, Bot, AlertTriangle, Check, Loader } from 'lucide-react';

interface BotSettingsModalProps {
  onClose: () => void;
}

export function BotSettingsModal({ onClose }: BotSettingsModalProps) {
  const { user, refreshUser } = useAuth();
  const [isBot, setIsBot] = useState(user?.isBot || false);
  const [botDescription, setBotDescription] = useState(user?.botDescription || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const { data, error: saveError } = await usersApi.setBotStatus(
      user.username,
      isBot,
      isBot ? botDescription : undefined
    );

    if (saveError) {
      setError(saveError);
    } else if (data) {
      setSuccess(isBot ? 'Bot status enabled' : 'Bot status disabled');
      await refreshUser();
      setTimeout(() => {
        onClose();
      }, 1500);
    }

    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Bot Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="p-4 bg-slate-800/50 rounded-xl">
            <p className="text-slate-300 text-sm">
              Mark your account as a bot if it performs automated actions. Verified bots are displayed with a special badge.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">This is a bot account</p>
              <p className="text-slate-500 text-sm">Automated accounts must be clearly labeled</p>
            </div>
            <button
              onClick={() => setIsBot(!isBot)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isBot ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  isBot ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Bot Description */}
          {isBot && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Bot Description
              </label>
              <textarea
                value={botDescription}
                onChange={(e) => setBotDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
                placeholder="Describe what this bot does (e.g., 'Posts daily news summaries')"
              />
            </div>
          )}

          {/* Preview */}
          {(isBot || user.isBot) && (
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700">
              <p className="text-slate-500 text-xs mb-2 uppercase tracking-wide">Preview</p>
              <div className="flex items-center gap-3">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.username}
                  className="w-10 h-10 rounded-full bg-slate-700"
                />
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{user.displayName}</span>
                  <BotBadge verified isBot={isBot} />
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          {isBot && !user.isBot && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-400 text-sm">
                Misrepresenting your account as a bot when it's operated by a human is a violation of platform guidelines.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
              <Check className="w-5 h-5" />
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full border border-slate-700 text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-5 py-2 rounded-full font-medium transition-all disabled:opacity-50 flex items-center gap-2 ${
              isBot
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-400 hover:to-purple-500'
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : isBot ? 'Mark as Bot' : 'Remove Bot Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
