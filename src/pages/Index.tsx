import { useState, useEffect } from 'react';
import { Home, MessageSquare, LayoutDashboard } from 'lucide-react';
import BootSequence from '@/components/BootSequence';
import StatusBar from '@/components/StatusBar';
import TerminalChat from '@/components/TerminalChat';
import DailyBriefing from '@/components/DailyBriefing';

type AppState = 'booting' | 'dashboard' | 'terminal';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('booting');

  const handleBootComplete = () => {
    setAppState('dashboard');
  };

  useEffect(() => {
    // Skip boot sequence if already completed in this session
    const bootCompleted = sessionStorage.getItem('bootCompleted');
    if (bootCompleted) {
      setAppState('dashboard');
    }
  }, []);

  if (appState === 'booting') {
    return <BootSequence onComplete={() => {
      sessionStorage.setItem('bootCompleted', 'true');
      handleBootComplete();
    }} />;
  }

  return (
    <div className="min-h-screen bg-background terminal-screen flex flex-col">
      <StatusBar />

      {/* Navigation Bar */}
      <div className="border-b border-terminal-border bg-surface">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAppState('dashboard')}
              className={`flex items-center gap-2 px-3 py-1 rounded font-mono text-sm transition-colors ${
                appState === 'dashboard'
                  ? 'bg-sherpa-green text-background'
                  : 'text-muted-foreground hover:text-sherpa-green'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setAppState('terminal')}
              className={`flex items-center gap-2 px-3 py-1 rounded font-mono text-sm transition-colors ${
                appState === 'terminal'
                  ? 'bg-sherpa-green text-background'
                  : 'text-muted-foreground hover:text-sherpa-green'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </button>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            Bishma OS v1.0
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {appState === 'dashboard' ? <DailyBriefing /> : <TerminalChat />}
      </div>

      <footer className="text-center py-2 text-xs font-mono text-muted-foreground border-t border-terminal-border">
        Made with love in Indianapolis
      </footer>
    </div>
  );
};

export default Index;
