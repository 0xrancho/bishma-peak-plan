export interface TaskState {
  id: string;
  description: string;
  parameters: {
    reach?: number;
    impact?: number;
    confidence?: number;
    effort?: number;
  };
  completeness: {
    hasReach: boolean;
    hasImpact: boolean;
    hasConfidence: boolean;
    hasEffort: boolean;
    isComplete: boolean;
  };
  metadata: {
    category?: string;
    deadline?: Date;
    project?: string;
    dependencies?: string[];
    shouldSplit?: boolean;
  };
  conversationLog: Message[];
  lastUpdated: Date;
  syncStatus: 'pending' | 'partial' | 'synced';
  status?: TaskStatus;
  rice?: RICEScore;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  functionCall?: {
    name: string;
    arguments: any;
  };
}

export interface ConversationContext {
  tasks: Map<string, TaskState>;
  currentTaskId?: string;
  sessionId: string;
  lastActivity: Date;
}

export interface RICEScore {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number;
}

export type TaskStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'deferred' | 'blocked';

export interface OpenAIFunctionCall {
  name: 'update_task_state' | 'write_to_airtable' | 'split_task';
  arguments: any;
}