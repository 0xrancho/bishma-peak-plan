import { useState } from 'react';
import { AirtableService } from '@/services/AirtableService';

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

type AIPersonality = 'wise-ol-sage' | 'helpful-assistant' | 'inspiring-life-coach';

const OnboardingFlow = ({ userId, onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [notificationChannel, setNotificationChannel] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>('wise-ol-sage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Indianapolis',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  const personalityDescriptions = {
    'wise-ol-sage': 'Patient and strategic. Like a sherpa guiding you through priorities with calm wisdom.',
    'helpful-assistant': 'Direct and efficient. Gets straight to the point with clear recommendations.',
    'inspiring-life-coach': 'Motivating and energetic. Celebrates wins and keeps you focused on your goals.'
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY || localStorage.getItem('airtable_api_key');
      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('airtable_base_id');

      if (!apiKey || !baseId) {
        throw new Error('Airtable credentials not configured');
      }

      const airtableService = new AirtableService(apiKey, baseId);

      await airtableService.createUserPreferences(userId, {
        timezone,
        notification_channel: notificationChannel,
        notification_enabled: notificationEnabled,
        ai_personality: aiPersonality
      });

      console.log('✅ User preferences created successfully');
      onComplete();

    } catch (err) {
      console.error('❌ Failed to save preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background terminal-screen flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="ascii-art mb-8 sherpa-text text-center">
{`
    /\\        BISHMA BASECAMP
   /  \\       Setting up your expedition
  /____\\
 /      \\
/_______\\
`}
        </div>

        {/* Progress indicator */}
        <div className="mb-8 text-center">
          <div className="sherpa-text text-sm mb-2">
            INITIALIZATION PROGRESS: STEP {step}/3
          </div>
          <div className="flex gap-2 justify-center">
            <div className={`w-20 h-1 ${step >= 1 ? 'bg-sherpa-green' : 'bg-terminal-border'}`}></div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-sherpa-green' : 'bg-terminal-border'}`}></div>
            <div className={`w-20 h-1 ${step >= 3 ? 'bg-sherpa-green' : 'bg-terminal-border'}`}></div>
          </div>
        </div>

        {/* Step 1: Timezone */}
        {step === 1 && (
          <div className="border border-terminal-border bg-surface p-8">
            <div className="sherpa-text text-lg mb-4">
              {'>'} CONFIGURE TIMEZONE
            </div>
            <p className="text-muted-foreground mb-6 font-mono text-sm">
              We detected your timezone, but you can change it if needed. This helps us schedule your daily briefings and reminders.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-mono text-muted-foreground mb-2 block">
                  SELECT TIMEZONE:
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-background border border-terminal-border text-foreground font-mono px-4 py-2 focus:outline-none focus:border-sherpa-green"
                >
                  {timezones.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full mt-6 px-6 py-3 bg-sherpa-green text-background font-mono hover:bg-sherpa-green/90 transition-colors"
              >
                CONTINUE {'>>'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Notifications */}
        {step === 2 && (
          <div className="border border-terminal-border bg-surface p-8">
            <div className="sherpa-text text-lg mb-4">
              {'>'} NOTIFICATION PREFERENCES
            </div>
            <p className="text-muted-foreground mb-6 font-mono text-sm">
              How would you like to receive your daily briefings? (Email, Slack, etc. - integration coming soon)
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-mono text-muted-foreground mb-2 block">
                  NOTIFICATION CHANNEL (OPTIONAL):
                </label>
                <input
                  type="text"
                  value={notificationChannel}
                  onChange={(e) => setNotificationChannel(e.target.value)}
                  placeholder="email@example.com or slack handle"
                  className="w-full bg-background border border-terminal-border text-foreground font-mono px-4 py-2 focus:outline-none focus:border-sherpa-green"
                />
                <div className="text-xs text-muted-foreground mt-1 font-mono">
                  Leave blank to skip for now
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notifications-enabled"
                  checked={notificationEnabled}
                  onChange={(e) => setNotificationEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="notifications-enabled" className="font-mono text-sm text-foreground">
                  Enable daily briefing notifications
                </label>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 border border-terminal-border text-foreground font-mono hover:bg-terminal-border/20 transition-colors"
                >
                  {'<<'} BACK
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 px-6 py-3 bg-sherpa-green text-background font-mono hover:bg-sherpa-green/90 transition-colors"
                >
                  CONTINUE {'>>'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: AI Personality */}
        {step === 3 && (
          <div className="border border-terminal-border bg-surface p-8">
            <div className="sherpa-text text-lg mb-4">
              {'>'} CHOOSE YOUR GUIDE
            </div>
            <p className="text-muted-foreground mb-6 font-mono text-sm">
              Select the personality style for Bishma. This affects how the AI communicates with you.
            </p>

            <div className="space-y-3 mb-6">
              {(Object.keys(personalityDescriptions) as AIPersonality[]).map((personality) => (
                <button
                  key={personality}
                  onClick={() => setAiPersonality(personality)}
                  className={`w-full text-left p-4 border font-mono transition-colors ${
                    aiPersonality === personality
                      ? 'border-sherpa-green bg-sherpa-green/10 text-sherpa-green'
                      : 'border-terminal-border text-foreground hover:border-sherpa-green/50'
                  }`}
                >
                  <div className="font-bold mb-1 uppercase">
                    {personality.replace(/-/g, ' ')}
                    {aiPersonality === personality && ' [SELECTED]'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {personalityDescriptions[personality]}
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 border border-summit-red bg-summit-red/10 text-summit-red font-mono text-sm">
                ERROR: {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-terminal-border text-foreground font-mono hover:bg-terminal-border/20 transition-colors disabled:opacity-50"
              >
                {'<<'} BACK
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-sherpa-green text-background font-mono hover:bg-sherpa-green/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'INITIALIZING...' : 'BEGIN EXPEDITION >>'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-muted-foreground font-mono">
          You can change these settings later in your preferences
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
