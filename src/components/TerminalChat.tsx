import { useState, useEffect, useRef } from 'react';
import { Send, Terminal, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RICEProgressIndicator from './RICEProgressIndicator';
import APIKeyConfig from './APIKeyConfig';
import { ConversationManager } from '@/services/ConversationManager';
import { TaskState } from '@/types/TaskState';

interface ChatMessage {
  id: string;
  type: 'sherpa' | 'user' | 'system';
  content: string;
  timestamp: Date;
  typing?: boolean;
}

const TerminalChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'sherpa',
      content: 'System initialized. Ready for task prioritization.',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'sherpa',
      content: 'Tell me about a task you need to prioritize. I\'ll help extract the RICE parameters through our conversation.',
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tasks, setTasks] = useState<TaskState[]>([]);
  const [conversationManager, setConversationManager] = useState<ConversationManager | null>(null);
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation manager when API keys are available
  useEffect(() => {
    // Check environment variables first, then localStorage
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key');
    const airtableKey = import.meta.env.VITE_AIRTABLE_API_KEY || localStorage.getItem('airtable_api_key');
    const airtableBase = import.meta.env.VITE_AIRTABLE_BASE_ID || localStorage.getItem('airtable_base_id');

    if (openaiKey && airtableKey && airtableBase) {
      const manager = new ConversationManager({
        openaiApiKey: openaiKey,
        airtableApiKey: airtableKey,
        airtableBaseId: airtableBase
      });
      setConversationManager(manager);
      setApiKeysConfigured(true);

      // Load existing tasks
      const state = manager.getCurrentState();
      setTasks(state.incompleteTasks);
    }
  }, []);

  const getTaskProgress = (task: TaskState) => {
    return conversationManager?.getTaskProgress(task.id) || null;
  };

  const handleConfigSave = (keys: { openai: string; airtableKey: string; airtableBase: string }) => {
    const manager = new ConversationManager({
      openaiApiKey: keys.openai,
      airtableApiKey: keys.airtableKey,
      airtableBaseId: keys.airtableBase
    });
    setConversationManager(manager);
    setApiKeysConfigured(true);
    setShowApiConfig(false);

    // Load existing tasks
    const state = manager.getCurrentState();
    setTasks(state.incompleteTasks);

    // Add confirmation message
    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: '✅ Configuration saved. Ready for RICE extraction!',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    if (!conversationManager) {
      // Show API key configuration prompt
      const sherpaMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sherpa',
        content: 'I need your OpenAI and Airtable API keys to get started. Please configure them in settings.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, sherpaMessage]);
      setIsTyping(false);
      return;
    }

    try {
      // Check if user is asking about existing tasks
      const isTaskQuery = input.toLowerCase().includes('read this conversation') ||
                         input.toLowerCase().includes('tell me the') ||
                         input.toLowerCase().includes('what tasks') ||
                         input.toLowerCase().includes('my tasks');

      let response;
      if (isTaskQuery) {
        response = await conversationManager.queryTasks(input);
      } else {
        response = await conversationManager.processUserInput(input);
      }

      const sherpaMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sherpa',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, sherpaMessage]);

      // Update tasks state
      if (response.taskUpdates) {
        setTasks(response.taskUpdates);
      }

      // Show completed tasks message
      if (response.completedTasks && response.completedTasks.length > 0) {
        const completionMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'system',
          content: `✅ ${response.completedTasks.length} task(s) synced to Airtable`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
      }

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'sherpa',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* API Configuration Status */}
        {!apiKeysConfigured && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
            <div className="sherpa-text font-mono text-sm mb-2">
              <div className="status-warning">CONFIGURATION REQUIRED:</div>
            </div>
            <div className="text-xs font-mono text-muted-foreground mb-2">
              Please configure your API keys to enable RICE extraction:
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-mono text-yellow-500">
                  OpenAI API Key + Airtable API Key + Base ID needed
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setShowApiConfig(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-background"
              >
                Configure
              </Button>
            </div>
          </div>
        )}

        {/* Current Tasks Display */}
        {tasks.length > 0 && (
          <div className="mb-6">
            <div className="sherpa-text font-mono text-sm mb-4">
              <div className="status-ready">RICE EXTRACTION PROGRESS:</div>
            </div>
            <div className="space-y-3">
              {tasks.map((task) => {
                const progress = getTaskProgress(task);
                return progress ? (
                  <RICEProgressIndicator
                    key={task.id}
                    task={task}
                    missingParameters={progress.missingParameters}
                  />
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Empty state when no tasks */}
        {tasks.length === 0 && apiKeysConfigured && (
          <div className="mb-6 text-center py-8">
            <div className="sherpa-text font-mono text-sm mb-2">
              <div className="status-ready">READY FOR TASK INPUT:</div>
            </div>
            <div className="text-xs font-mono text-muted-foreground">
              Tell me about a task you need to prioritize...
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((message) => (
          <div key={message.id} className="font-mono text-sm">
            {message.type === 'sherpa' ? (
              <div className="sherpa-text terminal-glow">
                <span className="command-prompt"></span>
                {message.content}
              </div>
            ) : message.type === 'user' ? (
              <div className="user-text">
                <span className="user-prompt"></span>
                {message.content}
              </div>
            ) : (
              <div className="text-muted-foreground">
                {message.content}
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="sherpa-text terminal-glow font-mono text-sm">
            <span className="status-thinking"></span>
            <span className="terminal-cursor">Processing RICE parameters</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-terminal-border bg-surface p-4">
        <div className="flex items-center space-x-4 max-w-4xl mx-auto">
          <Terminal className="w-5 h-5 sherpa-text" />
          <div className="flex-1 flex items-center space-x-2">
            <span className="font-mono text-sm user-text">you@local:~$</span>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a command or describe what needs doing..."
              className="flex-1 bg-background border-terminal-border font-mono text-sm focus:ring-sherpa-green focus:border-sherpa-green"
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="bg-sherpa-green hover:bg-sherpa-green/80 text-background"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="text-xs font-mono text-muted-foreground mt-2 text-center">
          Pro tip: Describe your tasks naturally - I'll extract the RICE parameters through conversation
        </div>
      </div>

      {/* API Configuration Modal */}
      {showApiConfig && (
        <APIKeyConfig
          onSave={handleConfigSave}
          onCancel={() => setShowApiConfig(false)}
        />
      )}
    </div>
  );
};

export default TerminalChat;