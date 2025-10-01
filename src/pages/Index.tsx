import { useState, useEffect } from 'react';
import { Home, MessageSquare, LayoutDashboard } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import BootSequence from '@/components/BootSequence';
import OnboardingFlow from '@/components/OnboardingFlow';
import StatusBar from '@/components/StatusBar';
import TerminalChat from '@/components/TerminalChat';
import DailyBriefing from '@/components/DailyBriefing';
import { AirtableService } from '@/services/AirtableService';

type AppState = 'booting' | 'onboarding' | 'dashboard' | 'terminal';

const Index = () => {
  const { user } = useUser();
  const [appState, setAppState] = useState<AppState>('booting');
  const [isCheckingPreferences, setIsCheckingPreferences] = useState(false);

  const handleBootComplete = () => {
    setAppState('dashboard');
  };

  const handleOnboardingComplete = () => {
    sessionStorage.setItem('bootCompleted', 'true');
    setAppState('dashboard');
  };

  // Check if user has completed onboarding
  useEffect(() => {
    const checkUserPreferences = async () => {
      if (!user) return;

      setIsCheckingPreferences(true);

      try {
        const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY || localStorage.getItem('airtable_api_key');
        const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('airtable_base_id');

        if (apiKey && baseId) {
          const airtableService = new AirtableService(apiKey, baseId);
          const preferences = await airtableService.getUserPreferences(user.id);

          if (preferences) {
            // User has preferences, skip onboarding
            console.log('✅ User preferences found, skipping onboarding');
            sessionStorage.setItem('bootCompleted', 'true');
            setAppState('dashboard');
          } else {
            // New user, show onboarding
            console.log('🆕 New user detected, showing onboarding');
            setAppState('onboarding');
          }
        } else {
          // No API keys, go to dashboard (will show config prompt)
          setAppState('dashboard');
        }
      } catch (error) {
        console.error('❌ Error checking user preferences:', error);
        // On error, skip to dashboard
        setAppState('dashboard');
      } finally {
        setIsCheckingPreferences(false);
      }
    };

    if (user && appState === 'booting' && !isCheckingPreferences) {
      checkUserPreferences();
    }
  }, [user, appState, isCheckingPreferences]);

  return (
    <>
      <SignedOut>
        <BootSequence onComplete={() => {}} showAuth={true} />
      </SignedOut>

      <SignedIn>
        {appState === 'booting' ? (
          <BootSequence onComplete={() => {
            sessionStorage.setItem('bootCompleted', 'true');
            handleBootComplete();
          }} />
        ) : appState === 'onboarding' && user ? (
          <OnboardingFlow userId={user.id} onComplete={handleOnboardingComplete} />
        ) : (
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
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono text-muted-foreground">
                    Bishma OS v1.0
                  </div>
                  <UserButton afterSignOutUrl="/">
                    <UserButton.MenuItems>
                      <UserButton.Link
                        label="Preferences"
                        labelIcon={<LayoutDashboard className="w-4 h-4" />}
                        href="/preferences"
                      />
                    </UserButton.MenuItems>
                  </UserButton>
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
        )}
      </SignedIn>
    </>
  );
};

export default Index;
