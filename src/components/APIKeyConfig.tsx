import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Save, X } from 'lucide-react';

interface APIKeyConfigProps {
  onSave: (keys: { openai: string; airtableKey: string; airtableBase: string }) => void;
  onCancel: () => void;
}

const APIKeyConfig = ({ onSave, onCancel }: APIKeyConfigProps) => {
  const [openaiKey, setOpenaiKey] = useState(
    import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || ''
  );
  const [airtableKey, setAirtableKey] = useState(
    import.meta.env.VITE_AIRTABLE_API_KEY || localStorage.getItem('airtable_api_key') || ''
  );
  const [airtableBase, setAirtableBase] = useState(
    import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('airtable_base_id') || ''
  );
  const [showKeys, setShowKeys] = useState(false);

  const handleSave = () => {
    if (openaiKey && airtableKey && airtableBase) {
      localStorage.setItem('openai_api_key', openaiKey);
      localStorage.setItem('airtable_api_key', airtableKey);
      localStorage.setItem('airtable_base_id', airtableBase);
      onSave({ openai: openaiKey, airtableKey, airtableBase });
    }
  };

  const isValid = openaiKey.length > 0 && airtableKey.length > 0 && airtableBase.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface border border-terminal-border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-lg sherpa-text">API Configuration</h3>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              OpenAI API Key
            </label>
            <div className="relative">
              <Input
                type={showKeys ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono text-sm pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-6 w-6 p-0"
                onClick={() => setShowKeys(!showKeys)}
              >
                {showKeys ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              Airtable API Key
            </label>
            <Input
              type={showKeys ? 'text' : 'password'}
              value={airtableKey}
              onChange={(e) => setAirtableKey(e.target.value)}
              placeholder="pat..."
              className="font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1">
              Airtable Base ID
            </label>
            <Input
              type="text"
              value={airtableBase}
              onChange={(e) => setAirtableBase(e.target.value)}
              placeholder="app..."
              className="font-mono text-sm"
            />
          </div>

          <div className="text-xs font-mono text-muted-foreground">
            <p>These keys are stored locally in your browser and used to:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Process conversations with OpenAI GPT-4</li>
              <li>Save completed RICE tasks to Airtable</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={!isValid}
              className="flex-1 bg-sherpa-green hover:bg-sherpa-green/80 text-background"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIKeyConfig;