import { useState } from 'react';
import { useAuth } from '../hooks/useAuthApi';
import { Sidebar } from './Sidebar';
import { Feed } from './Feed';
import { RightPanel } from './RightPanel';
import { ProfileModal } from './ProfileModal';
import { BotSettingsModal } from './BotSettingsModal';
import { Menu, X } from 'lucide-react';

export function Layout() {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showBotSettings, setShowBotSettings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
          </button>

          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            JailBreak
          </h1>

          <div className="w-10 h-10" />
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto flex">
        {/* Left Sidebar */}
        <div className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 z-40
          transform transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <Sidebar
            profile={user}
            onOpenProfile={() => setShowProfile(true)}
            onOpenBotSettings={() => setShowBotSettings(true)}
          />
        </div>

        {/* Main Feed */}
        <main className="flex-1 min-h-screen lg:border-r border-slate-800 pt-16 lg:pt-0">
          <Feed />
        </main>

        {/* Right Panel */}
        <div className="hidden xl:block w-80 sticky top-0 h-screen overflow-y-auto">
          <RightPanel />
        </div>
      </div>

      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
        />
      )}

      {showBotSettings && (
        <BotSettingsModal
          onClose={() => setShowBotSettings(false)}
        />
      )}
    </div>
  );
}
