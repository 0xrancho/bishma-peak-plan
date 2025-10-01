import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AirtableService } from '@/services/AirtableService';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AIPersonality = 'wise-ol-sage' | 'helpful-assistant' | 'inspiring-life-coach';

const UserPreferences = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [preferencesId, setPreferencesId] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('America/New_York');
  const [notificationChannel, setNotificationChannel] = useState('');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [aiPersonality, setAiPersonality] = useState<AIPersonality>('wise-ol-sage');

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Indianapolis',
    'America/Indiana/Indianapolis',
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

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;

      try {
        const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY || localStorage.getItem('airtable_api_key');
        const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('airtable_base_id');

        if (!apiKey || !baseId) {
          setError('Airtable credentials not configured');
          setLoading(false);
          return;
        }

        const airtableService = new AirtableService(apiKey, baseId);
        const preferences = await airtableService.getUserPreferences(user.id);

        if (preferences) {
          setPreferencesId(preferences.id);
          setTimezone(preferences.timezone || 'America/New_York');
          setNotificationChannel(preferences.notification_channel || '');
          setNotificationEnabled(preferences.notification_enabled ?? true);
          setAiPersonality(preferences.ai_personality || 'wise-ol-sage');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  const handleSave = async () => {
    if (!user || !preferencesId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY || localStorage.getItem('airtable_api_key');
      const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('airtable_base_id');

      if (!apiKey || !baseId) {
        throw new Error('Airtable credentials not configured');
      }

      const airtableService = new AirtableService(apiKey, baseId);
      await airtableService.updateUserPreferences(preferencesId, {
        timezone,
        notification_channel: notificationChannel,
        notification_enabled: notificationEnabled,
        ai_personality: aiPersonality
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background terminal-screen flex items-center justify-center">
        <div className="sherpa-text font-mono">LOADING PREFERENCES...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background terminal-screen p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sherpa-green hover:text-sherpa-green/80 mb-6 font-mono text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK TO DASHBOARD
        </button>

        <div className="ascii-art mb-8 sherpa-text">
{`
=========================================
          USER PREFERENCES
=========================================
`}
        </div>

        <div className="border border-terminal-border bg-surface p-8 space-y-6">
          {/* Timezone */}
          <div>
            <label className="text-sm font-mono text-sherpa-green mb-2 block">
              TIMEZONE:
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

          {/* Notification Channel */}
          <div>
            <label className="text-sm font-mono text-sherpa-green mb-2 block">
              NOTIFICATION CHANNEL:
            </label>
            <input
              type="text"
              value={notificationChannel}
              onChange={(e) => setNotificationChannel(e.target.value)}
              placeholder="email@example.com or slack handle"
              className="w-full bg-background border border-terminal-border text-foreground font-mono px-4 py-2 focus:outline-none focus:border-sherpa-green"
            />
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              Leave blank to skip notifications
            </div>
          </div>

          {/* Notification Enabled */}
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

          {/* AI Personality */}
          <div>
            <label className="text-sm font-mono text-sherpa-green mb-3 block">
              AI PERSONALITY:
            </label>
            <div className="space-y-3">
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
                    {aiPersonality === personality && ' [ACTIVE]'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {personalityDescriptions[personality]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 border border-summit-red bg-summit-red/10 text-summit-red font-mono text-sm">
              ERROR: {error}
            </div>
          )}

          {success && (
            <div className="p-3 border border-sherpa-green bg-sherpa-green/10 text-sherpa-green font-mono text-sm">
              ✓ PREFERENCES SAVED SUCCESSFULLY
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || !preferencesId}
            className="w-full px-6 py-3 bg-sherpa-green text-background font-mono hover:bg-sherpa-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'SAVING...' : 'SAVE PREFERENCES'}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground font-mono">
          Changes will take effect immediately
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
