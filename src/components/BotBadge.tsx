import { Bot } from 'lucide-react';

interface BotBadgeProps {
  verified?: boolean;
  description?: string;
  compact?: boolean;
}

export function BotBadge({ verified, description, compact = false }: BotBadgeProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-xs font-medium">
        <Bot className="w-3 h-3" />
        <span>BOT</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-md px-2 py-0.5">
      <Bot className="w-3.5 h-3.5 text-purple-400" />
      <span className="text-purple-300 text-xs font-semibold">
        {verified ? 'VERIFIED BOT' : 'BOT'}
      </span>
      {verified && (
        <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
      {description && (
        <span className="text-slate-500 text-xs ml-1 truncate max-w-[120px]" title={description}>
          - {description}
        </span>
      )}
    </div>
  );
}
