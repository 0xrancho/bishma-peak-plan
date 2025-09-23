import { useState, useEffect } from 'react';
import BootSequence from '@/components/BootSequence';
import StatusBar from '@/components/StatusBar';
import TerminalChat from '@/components/TerminalChat';
import DailyBriefing from '@/components/DailyBriefing';

type AppState = 'booting' | 'briefing' | 'terminal';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('booting');

  const handleBootComplete = () => {
    setAppState('briefing');
  };

  const handleBriefingComplete = () => {
    setAppState('terminal');
  };

  useEffect(() => {
    if (appState === 'briefing') {
      const timer = setTimeout(() => {
        handleBriefingComplete();
      }, 5000); // Auto-advance after 5 seconds

      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          clearTimeout(timer);
          handleBriefingComplete();
        }
      };

      document.addEventListener('keypress', handleKeyPress);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keypress', handleKeyPress);
      };
    }
  }, [appState]);

  if (appState === 'booting') {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  if (appState === 'briefing') {
    return <DailyBriefing />;
  }

  return (
    <div className="min-h-screen bg-background terminal-screen">
      <StatusBar />
      <div className="flex-1 h-screen">
        <TerminalChat />
      </div>
    </div>
  );
};

export default Index;
