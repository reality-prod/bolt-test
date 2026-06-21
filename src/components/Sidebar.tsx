import { useAuth } from '../hooks/useAuthApi';
import { User } from '../lib/api';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  User as UserIcon,
  Settings,
  LogOut,
  Feather,
  Lock,
  Bot,
} from 'lucide-react';

interface SidebarProps {
  profile: User;
  onOpenProfile: () => void;
  onOpenBotSettings: () => void;
}

export function Sidebar({ profile, onOpenProfile }: SidebarProps) {
  const { signOut } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Search, label: 'Explore' },
    { icon: Bell, label: 'Notifications', count: 3 },
    { icon: Mail, label: 'Messages' },
    { icon: Bookmark, label: 'Bookmarks' },
    { icon: UserIcon, label: 'Profile', onClick: onOpenProfile },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 px-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Lock className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          JailBreak
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
              item.active
                ? 'bg-cyan-500/10 text-cyan-400'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{item.label}</span>
            {item.count && (
              <span className="ml-auto bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bot Settings Link */}
      <button
        onClick={onOpenProfile}
        className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-white"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium">Bot Settings</span>
      </button>

      {/* Compose Button */}
      <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 mb-6">
        <Feather className="w-5 h-5" />
        <span>New Post</span>
      </button>

      {/* User Profile */}
      <button
        onClick={onOpenProfile}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors group"
      >
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
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <p className="text-white font-medium truncate">{profile.displayName}</p>
            {profile.isBot && (
              <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                BOT
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">@{profile.username}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            signOut();
          }}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </button>
    </div>
  );
}
