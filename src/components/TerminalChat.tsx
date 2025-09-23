import { useState, useEffect, useRef } from 'react';
import { Send, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TaskCard from './TaskCard';

interface Message {
  id: string;
  type: 'sherpa' | 'user' | 'system';
  content: string;
  timestamp: Date;
  typing?: boolean;
}

const TerminalChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'sherpa',
      content: 'System initialized. Ready for input.',
      timestamp: new Date()
    },
    {
      id: '2', 
      type: 'sherpa',
      content: 'I see you have 3 priority peaks ahead. Want to tackle that payment API issue first? It\'s looking pretty critical at 8,611m.',
      timestamp: new Date()
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sampleTasks = [
    {
      title: "API Bug Fix",
      priority: 'SUMMIT' as const,
      progress: 67,
      altitude: "8,611m",
      eta: "2.5h",
      status: 'IN_PROGRESS' as const
    },
    {
      title: "Board Prep",
      priority: 'ALPINE' as const,
      progress: 25,
      altitude: "6,102m", 
      eta: "1.5h",
      status: 'QUEUED' as const
    },
    {
      title: "Email Greg",
      priority: 'BASECAMP' as const,
      progress: 0,
      altitude: "2,100m",
      eta: "15min",
      status: 'QUEUED' as const
    }
  ];

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate Bishma's response
    setTimeout(() => {
      const responses = [
        "Got it. Updating your route plan...",
        "That task is now prioritized. ETA updated to 3.2 hours.",
        "Nice work. Marking that summit as complete.",
        "Weather report: You have a clear window from 2-4 PM.",
        "Heads up: That task is blocking 2 others in your queue.",
        "Route suggestion: Tackle the API fix before the meeting.",
        "System idle. What's next on your mind?"
      ];
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      const sherpaMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'sherpa',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, sherpaMessage]);
      setIsTyping(false);
    }, 1500);
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
        {/* Current Tasks Display */}
        <div className="mb-6">
          <div className="sherpa-text font-mono text-sm mb-4">
            <div className="status-ready">CURRENT PRIORITY PEAKS:</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sampleTasks.map((task, index) => (
              <TaskCard key={index} {...task} />
            ))}
          </div>
        </div>

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
            <span className="terminal-cursor">Calculating route</span>
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
          Pro tip: Try commands like "/today", "/summit task-name", or just describe what you need to do
        </div>
      </div>
    </div>
  );
};

export default TerminalChat;